// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rspotify::clients::OAuthClient;
use std::path::Path;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_deep_link::{DeepLinkExt, OpenUrlEvent};
use tauri_plugin_sql::{Migration, MigrationKind};
mod config;
mod models;
mod osu;

use crate::osu::commands::{beatmap::*, beatpack::*, login::*, skin::*, spotify::*};
use models::AppConfig;

fn main() {
    let migration = vec![Migration {
        version: 1,
        description: "create_initial_tables",
        sql: "CREATE TABLE IF NOT EXISTS downloads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                source_url TEXT NOT NULL,
                destination TEXT NOT NULL,
                status TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS bookmarks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                data TEXT NOT NULL UNIQUE,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (item_id, type)
            );",
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:history.db", migration)
                .build(),
        )
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            let app_handle = app.handle();
            app.manage(AppConfig::new(&app_handle));

            let handle = app_handle.clone();
            app.deep_link().on_open_url(move |event: OpenUrlEvent| {
                let auth_code = event
                    .urls()
                    .first()
                    .unwrap()
                    .query_pairs()
                    .find_map(|(key, value)| (key == "code").then(|| value.to_string()))
                    .expect("no code");

                handle
                    .state::<AppConfig>()
                    .spotify
                    .request_token(&auth_code);

                if let Some(spotify_window) = handle.get_webview_window("Spotify") {
                    spotify_window.destroy().unwrap();
                }

                handle.emit("spotify-auth-successful", ()).unwrap();
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            validate_path,
            close_splashscreen,
            logged_in,
            login,
            spotify_login,
            spotify_logged_in,
            get_user_playlists,
            add_to_playlist,
            fetch_beatmaps,
            download_beatmap,
            download_background_image,
            fetch_beatmap_packs,
            get_total_beatpack_pages,
            download_beatmappack,
            get_beatpack_download_url,
            get_beatpack_song_list,
            fetch_all_skins,
            fetch_contests,
            fetch_contest_skins,
            open_forum_post,
            get_tracks,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let window_label = window.label();
                let app_handle = window.app_handle();

                // Check if it's the main window
                if window_label == "main" {
                    let state = app_handle.state::<AppConfig>();
                    state.osu.save_cookies(app_handle);
                    window.close().unwrap();
                } else if window_label == "Spotify" {
                    // For the auth window, just close it without affecting the rest of the app
                    window.destroy().unwrap();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn close_splashscreen(app_handle: AppHandle) {
    app_handle.get_webview_window("splashscreen").expect("error while getting splashscreen").destroy().expect("error while closing window");
    app_handle.get_webview_window("main").expect("error while getting window").show().expect("error while showing window");
}

#[tauri::command]
fn validate_path(path: String) -> bool {
    let path = Path::new(&path);
    path.exists() && path.is_dir()
}
