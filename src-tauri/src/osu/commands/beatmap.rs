use crate::models::{AppConfig, Progress};
use futures_util::StreamExt;
use reqwest::header::{HeaderMap, COOKIE, REFERER, USER_AGENT};
use reqwest::Client;
use serde_json::Value;
use std::fs::File;
use std::io::Write;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub async fn fetch_beatmaps(
    state: State<'_, AppConfig>,
    sort: String,
    mode: Option<u8>,
    category: Option<String>,
    cursor: String,
    key: String,
) -> Result<Value, String> {
    let mode_str = mode
        .map(|m| m.to_string())
        .unwrap_or_else(|| "".to_string());
    let category_str = category.unwrap_or_else(|| "Error".to_string());

    let url = format!(
        "{}/search?m={}&nsfw=true&sort={}&s={}&cursor_string={}&q={}",
        state.osu.beatmapsets_url.clone(),
        mode_str,
        sort,
        category_str,
        cursor,
        key
    );

    let cookie = state.osu.cookie.lock().unwrap().clone();
    let mut headers = HeaderMap::new();
    headers.insert(
        COOKIE,
        cookie
            .parse()
            .map_err(|e: reqwest::header::InvalidHeaderValue| e.to_string())?,
    );
    headers.insert(
        REFERER,
        "https://osu.ppy.sh/beatmapsets"
            .parse()
            .map_err(|e: reqwest::header::InvalidHeaderValue| e.to_string())?,
    );

    let client = Client::new();
    let response = client
        .get(url)
        .headers(headers)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    state.osu.update_cookies(response.headers());

    if !response.status().is_success() {
        return Err(format!("Request failed with status: {}", response.status()));
    }

    let json = response.json().await.map_err(|e| e.to_string())?;

    Ok(json)
}

#[tauri::command]
pub async fn download_beatmap(
    state: State<'_, AppConfig>,
    app_handle: AppHandle,
    beatmap_id: String,
    download_path: String,
    download_id: i64, // Add download_id parameter
) -> Result<(), String> {
    let url = format!(
        "{}/{}/download",
        state.osu.beatmapsets_url.clone(),
        beatmap_id
    );

    let cookie = state.osu.cookie.lock().unwrap().clone();
    let mut headers = HeaderMap::new();
    headers.insert(
        COOKIE,
        cookie
            .parse()
            .map_err(|e: reqwest::header::InvalidHeaderValue| e.to_string())?,
    );
    headers.insert(
        REFERER,
        "https://osu.ppy.sh/beatmapsets"
            .parse()
            .map_err(|e: reqwest::header::InvalidHeaderValue| e.to_string())?,
    );

    let client = Client::new();
    let response = client
        .get(url)
        .headers(headers)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if response.status().is_success() {
        let mut file = File::create(&download_path).map_err(|e| e.to_string())?;
        let total = response.content_length().unwrap_or(0);
        let mut stream = response.bytes_stream();
        let mut downloaded = 0;

        while let Some(chunk_result) = stream.next().await {
            let part = chunk_result.map_err(|e| e.to_string())?;
            file.write_all(&part)
                .or(Err("Error while writing to file".to_string()))?;
            downloaded += part.len() as u64;

            // Emit progress with download ID
            app_handle
                .emit(
                    "download-progress",
                    Progress {
                        id: download_id as u64,
                        progress: downloaded,
                        total,
                    },
                )
                .map_err(|e| e.to_string())?;
        }
    } else {
        return if response.status().is_client_error() {
            Err(500.to_string())
        } else {
            Err("Failed to download the beatmap".to_string())
        };
    }

    Ok(())
}

#[tauri::command]
pub async fn download_background_image(
    state: State<'_, AppConfig>,
    app_handle: AppHandle,
    beatmap_id: String,
    download_path: String,
    download_id: i64, // Add download_id parameter
) -> Result<(), String> {
    let url = format!("{}-{}", state.osu.nerinyan_api.clone(), beatmap_id);
    let client = Client::new();
    let response = client.get(url)
        .header(USER_AGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if response.status().is_success() {
        let mut file = File::create(&download_path).map_err(|e| e.to_string())?;
        let total = response.content_length().unwrap_or(0);
        let mut stream = response.bytes_stream();
        let mut downloaded = 0;

        while let Some(chunk_result) = stream.next().await {
            let part = chunk_result.map_err(|e| e.to_string())?;
            file.write_all(&part).map_err(|e| e.to_string())?;
            downloaded += part.len() as u64;

            // Emit progress with download ID
            app_handle
                .emit(
                    "download-progress",
                    Progress {
                        id: download_id as u64,
                        progress: downloaded,
                        total,
                    },
                )
                .map_err(|e| e.to_string())?;
        }
    } else {
        return if response.status().is_client_error() || response.status().is_server_error() {
            Err(500.to_string())
        } else {
            Err("Failed to download the image".to_string())
        };
    }

    Ok(())
}
