use tauri::{Window, Emitter};
use std::process::Command;
use std::path::PathBuf;

mod protection;

#[cfg(not(debug_assertions))]
use protection::AntiDebug;

#[tauri::command]
async fn check_for_updates(app: tauri::AppHandle) -> Result<String, String> {
    check_for_updates_internal(app).await
}

async fn check_for_updates_internal(app: tauri::AppHandle) -> Result<String, String> {
    use tauri_plugin_updater::UpdaterExt;
    
    match app.updater() {
        Ok(updater) => {
            match updater.check().await {
                Ok(Some(update)) => {
                    match update.download_and_install(|_chunk_length, _content_length| {}, || {}).await {
                        Ok(_) => {
                            std::process::exit(0);
                        }
                        Err(e) => Err(format!("Failed to install update: {}", e)),
                    }
                }
                Ok(None) => Ok("No updates available".to_string()),
                Err(e) => Err(format!("Failed to check for updates: {}", e)),
            }
        }
        Err(e) => Err(format!("Updater not available: {}", e)),
    }
}

#[tauri::command]
fn minimize_window(window: Window) {
    window.minimize().unwrap();
}

#[tauri::command]
fn maximize_window(window: Window) {
    if window.is_maximized().unwrap() {
        window.unmaximize().unwrap();
    } else {
        window.maximize().unwrap();
    }
}

#[tauri::command]
fn close_window(window: Window) {
    window.close().unwrap();
}

#[tauri::command]
async fn download_track(url: String, title: String, artist: String) -> Result<String, String> {
    // Получаем путь к ресурсам приложения
    let resource_dir = std::env::current_exe()
        .map_err(|e| format!("Failed to get app directory: {}", e))?
        .parent()
        .ok_or("Failed to get parent directory")?
        .to_path_buf();
    
    let yt_dlp_path = resource_dir.join("yt-dlp.exe");
    
    // Проверяем существование yt-dlp.exe
    if !yt_dlp_path.exists() {
        return Err("yt-dlp.exe не найден в папке приложения".to_string());
    }
    
    let downloads_dir = dirs::download_dir()
        .unwrap_or_else(|| PathBuf::from("./downloads"));
    
    // Создаем папку Downloads если её нет
    std::fs::create_dir_all(&downloads_dir)
        .map_err(|e| format!("Failed to create downloads directory: {}", e))?;
    
    // Безопасное имя файла
    let safe_filename = format!("{} - {}", artist, title)
        .chars()
        .map(|c| match c {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '_',
            _ => c,
        })
        .collect::<String>();
    
    let output_path = downloads_dir.join(format!("{}.%(ext)s", safe_filename));
    
    let output = Command::new(&yt_dlp_path)
        .args([
            "--no-playlist",
            "--ignore-errors",
            "--no-warnings",
            "-f", "best[ext=mp3]/best",
            "-o", &output_path.to_string_lossy(),
            &url
        ])
        .output()
        .map_err(|e| format!("Failed to execute yt-dlp: {}", e))?;
    
    if output.status.success() {
        Ok(format!("Трек скачан в папку Downloads: {}", safe_filename))
    } else {
        let error = String::from_utf8_lossy(&output.stderr);
        Err(format!("Ошибка скачивания: {}", error))
    }
}

#[tauri::command]
async fn download_playlist(
    window: Window,
    playlist_name: String,
    tracks: Vec<serde_json::Value>
) -> Result<String, String> {
    use std::sync::Arc;
    use std::sync::atomic::{AtomicUsize, Ordering};
    
    // Получаем путь к ресурсам приложения
    let resource_dir = std::env::current_exe()
        .map_err(|e| format!("Failed to get app directory: {}", e))?
        .parent()
        .ok_or("Failed to get parent directory")?
        .to_path_buf();
    
    let yt_dlp_path = resource_dir.join("yt-dlp.exe");
    
    // Проверяем существование yt-dlp.exe
    if !yt_dlp_path.exists() {
        return Err("yt-dlp.exe не найден в папке приложения".to_string());
    }
    
    let downloads_dir = dirs::download_dir()
        .unwrap_or_else(|| PathBuf::from("./downloads"));
    
    // Безопасное имя папки плейлиста
    let safe_playlist_name = playlist_name
        .chars()
        .map(|c| match c {
            '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '_',
            _ => c,
        })
        .collect::<String>();
    
    let playlist_dir = downloads_dir.join(&safe_playlist_name);
    
    // Создаем папку плейлиста
    std::fs::create_dir_all(&playlist_dir)
        .map_err(|e| format!("Failed to create playlist directory: {}", e))?;
    
    let total_tracks = tracks.len();
    let completed = Arc::new(AtomicUsize::new(0));
    
    // Отправляем начальный прогресс
    let _ = window.emit("download_progress", serde_json::json!({
        "current": 0,
        "total": total_tracks,
        "status": "starting"
    }));
    
    for (index, track) in tracks.iter().enumerate() {
        let title = track["title"].as_str().unwrap_or("Unknown");
        let artist = track["user"]["username"].as_str().unwrap_or("Unknown");
        let url = track["permalink_url"].as_str().unwrap_or("");
        
        if url.is_empty() {
            continue;
        }
        
        // Безопасное имя файла
        let safe_filename = format!("{:02} - {} - {}", index + 1, artist, title)
            .chars()
            .map(|c| match c {
                '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*' => '_',
                _ => c,
            })
            .collect::<String>();
        
        let output_path = playlist_dir.join(format!("{}.%(ext)s", safe_filename));
        
        // Отправляем прогресс текущего трека
        let _ = window.emit("download_progress", serde_json::json!({
            "current": index,
            "total": total_tracks,
            "status": "downloading",
            "current_track": format!("{} - {}", artist, title)
        }));
        
        let output = Command::new(&yt_dlp_path)
            .args([
                "--no-playlist",
                "--ignore-errors",
                "--no-warnings",
                "-f", "best[ext=mp3]/best",
                "-o", &output_path.to_string_lossy(),
                url
            ])
            .output();
        
        match output {
            Ok(result) => {
                if result.status.success() {
                    completed.fetch_add(1, Ordering::SeqCst);
                } else {
                    eprintln!("Failed to download {}: {}", title, String::from_utf8_lossy(&result.stderr));
                }
            }
            Err(e) => {
                eprintln!("Failed to execute yt-dlp for {}: {}", title, e);
            }
        }
    }
    
    // Отправляем финальный прогресс
    let _ = window.emit("download_progress", serde_json::json!({
        "current": total_tracks,
        "total": total_tracks,
        "status": "completed"
    }));
    
    let completed_count = completed.load(Ordering::SeqCst);
    Ok(format!("Скачано {} из {} треков в папку: {}", completed_count, total_tracks, safe_playlist_name))
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(not(debug_assertions))]
    {
        let mut protection = AntiDebug::new();
        protection.start_protection();
        
        if !AntiDebug::verify_integrity() {
            std::process::exit(1);
        }
    }
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![greet, minimize_window, maximize_window, close_window, download_track, download_playlist, check_for_updates])
        .setup(|app| {
            #[cfg(not(debug_assertions))]
            {
                let handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
                    let _ = check_for_updates_internal(handle).await;
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
