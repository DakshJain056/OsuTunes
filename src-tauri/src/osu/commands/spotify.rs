use crate::models::AppConfig;
use rspotify::clients::BaseClient;
use rspotify::model::{SearchResult, SimplifiedPlaylist};
use tauri::{AppHandle, State};
use url::Url;

#[tauri::command]
pub fn get_tracks(state: State<'_, AppConfig>, query: String) -> Result<SearchResult, String> {
    tauri::async_runtime::block_on(async {
        state
            .spotify
            .get_tracks(query)
            .await
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn get_user_playlists(state: State<'_, AppConfig>) -> Vec<SimplifiedPlaylist> {
    tauri::async_runtime::block_on(async { state.spotify.get_user_playlists().await })
}

#[tauri::command]
pub fn add_to_playlist(
    state: State<'_, AppConfig>,
    track_id: String,
    playlist_id: String,
) -> Result<(), String> {
    tauri::async_runtime::block_on(async {
        state
            .spotify
            .add_to_playlist(track_id, playlist_id)
            .await
            .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub async fn spotify_login(state: State<'_, AppConfig>, app: AppHandle) -> Result<(), ()> {
    let mut spotify = state.spotify.client.lock().unwrap();

    let auth_url = spotify.get_authorize_url(None).unwrap();
    tauri::WebviewWindowBuilder::new(
        &app,
        "Spotify", /* the unique window label */
        tauri::WebviewUrl::External(
            Url::parse(&auth_url).expect("Error while getting the authentication url"),
        ),
    )
    .build()
    .unwrap();

    Ok(())
}

#[tauri::command]
pub fn spotify_logged_in(state: State<'_, AppConfig>) -> bool {
    let cache_path = state
        .spotify
        .client
        .lock()
        .unwrap()
        .config
        .cache_path
        .clone();

    std::fs::metadata(cache_path)
        .map(|metadata| metadata.len() > 0)
        .expect("Could not get cache metadata")
}
