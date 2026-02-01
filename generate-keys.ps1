Write-Host "Генерация ключей для автообновлений Tauri..."

# Устанавливаем tauri-cli если не установлен
if (!(Get-Command "cargo-tauri" -ErrorAction SilentlyContinue)) {
    Write-Host "Устанавливаем tauri-cli..."
    cargo install tauri-cli
}

# Генерируем ключи
Write-Host "Генерируем ключи подписи..."
cargo tauri signer generate -w ~/.tauri/axom.key

Write-Host ""
Write-Host "Ключи сгенерированы!"
Write-Host "Приватный ключ сохранен в: ~/.tauri/axom.key"
Write-Host ""
Write-Host "ВАЖНО: Добавьте следующие секреты в GitHub:"
Write-Host "1. TAURI_PRIVATE_KEY - содержимое файла ~/.tauri/axom.key"
Write-Host "2. TAURI_KEY_PASSWORD - пароль для ключа (если задавали)"
Write-Host ""
Write-Host "Публичный ключ нужно добавить в tauri.conf.json в секцию updater.pubkey"