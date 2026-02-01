use std::process;
use std::thread;
use std::time::Duration;
use std::fs;
use winapi::um::processthreadsapi::OpenProcess;
use winapi::um::winnt::{PROCESS_QUERY_INFORMATION, PROCESS_VM_READ};
use winapi::um::psapi::{EnumProcesses, GetProcessImageFileNameA};
use winapi::um::handleapi::CloseHandle;
use winapi::shared::minwindef::{DWORD, MAX_PATH};

pub struct AntiDebug {
    is_running: bool,
}

impl AntiDebug {
    pub fn new() -> Self {
        Self { is_running: false }
    }

    pub fn start_protection(&mut self) {
        if self.is_running {
            return;
        }
        
        self.is_running = true;
        
        thread::spawn(|| {
            loop {
                if Self::detect_debugger() || Self::detect_analysis_tools() {
                    Self::emergency_cleanup();
                    process::exit(1);
                }
                
                thread::sleep(Duration::from_secs(1));
            }
        });
    }

    fn detect_debugger() -> bool {
        unsafe {
            if winapi::um::debugapi::IsDebuggerPresent() != 0 {
                return true;
            }

            let peb = Self::get_peb();
            if !peb.is_null() {
                let being_debugged = *(peb.add(2) as *const u8);
                if being_debugged != 0 {
                    return true;
                }
            }
        }
        
        false
    }

    fn detect_analysis_tools() -> bool {
        let dangerous_processes = [
            "ollydbg.exe", "x64dbg.exe", "x32dbg.exe", "windbg.exe", "ida.exe", "ida64.exe",
            "idaq.exe", "idaq64.exe", "radare2.exe", "ghidra.exe", "processhacker.exe",
            "procmon.exe", "procexp.exe", "apimonitor.exe", "cheatengine.exe", "dnspy.exe",
            "reflexil.exe", "de4dot.exe", "ilspy.exe", "dotpeek.exe", "reshacker.exe",
            "pe-bear.exe", "pestudio.exe", "hxd.exe", "wireshark.exe", "fiddler.exe",
            "burpsuite.exe", "httpanalyzer.exe", "charles.exe", "mitmproxy.exe",
        ];

        let running_processes = Self::get_running_processes();
        
        for process in &running_processes {
            let process_lower = process.to_lowercase();
            for dangerous in &dangerous_processes {
                if process_lower.contains(dangerous) {
                    return true;
                }
            }
        }
        
        false
    }

    fn get_running_processes() -> Vec<String> {
        let mut processes = Vec::new();
        let mut process_ids = [0u32; 1024];
        let mut bytes_returned = 0u32;

        unsafe {
            if EnumProcesses(
                process_ids.as_mut_ptr(),
                (process_ids.len() * std::mem::size_of::<DWORD>()) as DWORD,
                &mut bytes_returned,
            ) != 0 {
                let count = bytes_returned as usize / std::mem::size_of::<DWORD>();
                
                for i in 0..count {
                    let process_id = process_ids[i];
                    if process_id == 0 {
                        continue;
                    }

                    let handle = OpenProcess(
                        PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
                        0,
                        process_id,
                    );

                    if !handle.is_null() {
                        let mut filename = [0i8; MAX_PATH];
                        if GetProcessImageFileNameA(
                            handle,
                            filename.as_mut_ptr(),
                            MAX_PATH as DWORD,
                        ) > 0 {
                            let name = std::ffi::CStr::from_ptr(filename.as_ptr())
                                .to_string_lossy()
                                .to_string();
                            
                            if let Some(file_name) = name.split('\\').last() {
                                processes.push(file_name.to_string());
                            }
                        }
                        CloseHandle(handle);
                    }
                }
            }
        }

        processes
    }

    unsafe fn get_peb() -> *mut u8 {
        let mut peb: *mut u8 = std::ptr::null_mut();
        
        #[cfg(target_arch = "x86_64")]
        {
            std::arch::asm!(
                "mov {}, gs:[0x60]",
                out(reg) peb,
            );
        }
        
        #[cfg(target_arch = "x86")]
        {
            std::arch::asm!(
                "mov {}, fs:[0x30]",
                out(reg) peb,
            );
        }
        
        peb
    }

    fn emergency_cleanup() {
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(app_dir) = exe_path.parent() {
                let _ = Self::delete_directory_recursive(app_dir);
            }
        }
        
        if let Some(appdata) = dirs::data_local_dir() {
            let app_data_dir = appdata.join("com.xivu.axom");
            let _ = Self::delete_directory_recursive(&app_data_dir);
        }
    }

    fn delete_directory_recursive(dir: &std::path::Path) -> std::io::Result<()> {
        if dir.is_dir() {
            for entry in fs::read_dir(dir)? {
                let entry = entry?;
                let path = entry.path();
                if path.is_dir() {
                    Self::delete_directory_recursive(&path)?;
                } else {
                    let _ = fs::remove_file(&path);
                }
            }
            let _ = fs::remove_dir(dir);
        }
        Ok(())
    }

    pub fn verify_integrity() -> bool {
        true
    }
}