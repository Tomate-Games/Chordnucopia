#![cfg_attr(not(debug_assertions),windows_subsystem="windows")]

fn main(){
    tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![chordnucopia_lib::func::build_chord])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
