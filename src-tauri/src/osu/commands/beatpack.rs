use crate::models::{AppConfig, BeatmapPack, Progress};
use crate::osu::extractors::{
    extract_beatmap_from_beatpack, extract_beatpack_download_url, extract_beatpack_pages,
    extract_beatpacks,
};
use futures_util::StreamExt;
use reqwest::header::{HeaderMap, COOKIE};
use reqwest::Client;
use sevenz_rust::decompress;
use std::fs::{remove_file, File};
use std::io::{BufReader, Write};
use std::path::Path;
use tauri::{AppHandle, Emitter, State};
use url::Url;
use zip::ZipArchive;

#[tauri::command]
pub async fn fetch_beatmap_packs(
    state: State<'_, AppConfig>,
    sort_type: String,
    page: i16,
) -> Result<Vec<BeatmapPack>, String> {
    let url = format!(
        "{}?type={}&page={}",
        state.osu.beatpacks_url.clone(),
        sort_type,
        page
    );

    let cookie = state.osu.cookie.lock().unwrap().clone();
    let mut headers = HeaderMap::new();
    headers.insert(
        COOKIE,
        cookie
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

    let html = response.text().await.map_err(|e| e.to_string())?;
    let beatpacks = extract_beatpacks(&html)?;

    Ok(beatpacks)
}

#[tauri::command]
pub async fn get_total_beatpack_pages(
    state: State<'_, AppConfig>,
    sort_type: String,
) -> Result<i8, String> {
    let url = format!("{}?type={}", state.osu.beatpacks_url.clone(), sort_type);

    let response = reqwest::get(url)
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())?;

    let total_pages = extract_beatpack_pages(response.as_str())?;

    Ok(total_pages)
}

#[tauri::command]
pub async fn download_beatmappack(
    app_handle: AppHandle,
    link: String,
    download_path: String,
    download_id: i64,
) -> Result<(), String> {
    let response = reqwest::get(link.clone())
        .await
        .map_err(|e| e.to_string())?;

    let url = Url::parse(&link).map_err(|e| e.to_string())?;
    let mut extension = "";
    // Extract the path segment from the URL
    if let Some(path) = url.path_segments().and_then(|segments| segments.last()) {
        // Extract the extension
        if let Some(ext) = Path::new(path).extension() {
            extension = ext.to_str().expect("error getting extension");
        } else {
            println!("No extension found.");
        }
    }

    if response.status().is_success() {
        let mut file = File::create(&download_path).map_err(|e| e.to_string())?;
        // Write the image data to the file
        let total = response.content_length().unwrap_or(0);
        let mut stream = response.bytes_stream();
        let mut downloaded = 0;

        while let Some(chunk_result) = stream.next().await {
            let part = chunk_result.map_err(|e| e.to_string())?;
            file.write_all(&part).map_err(|e| e.to_string())?;
            downloaded += part.len() as u64;
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

        match extension {
            "7z" => {
                let file = File::open(&download_path).map_err(|e| e.to_string())?;
                decompress(file, Path::new(&download_path).parent().unwrap())
                    .map_err(|e| e.to_string())?;
            }
            "zip" => {
                let file = File::open(&download_path).map_err(|e| e.to_string())?;
                let mut archive =
                    ZipArchive::new(BufReader::new(file)).map_err(|e| e.to_string())?;

                for i in 0..archive.len() {
                    let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
                    let outpath = Path::new(&download_path)
                        .parent()
                        .unwrap()
                        .join(file.name());

                    if file.name().ends_with('/') {
                        std::fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
                    } else {
                        if let Some(p) = outpath.parent() {
                            if !p.exists() {
                                std::fs::create_dir_all(p).map_err(|e| e.to_string())?;
                            }
                        }
                        let mut outfile = File::create(&outpath).map_err(|e| e.to_string())?;
                        std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
                    }
                }
            }
            _ => {
                return Err("no .7 or .zip extension".to_string());
            }
        }

        remove_file(&download_path).map_err(|e| e.to_string())?;
    } else {
        return if response.status().is_client_error() {
            Err(500.to_string())
        } else {
            Err("Failed to download the beatpack".to_string())
        };
    }

    Ok(())
}

#[tauri::command]
pub async fn get_beatpack_download_url(
    state: State<'_, AppConfig>,
    id: String,
) -> Result<String, String> {
    let url = format!("{}/{}", state.osu.beatpacks_url.clone(), id);

    let cookie = state.osu.cookie.lock().unwrap().clone();
    let mut headers = HeaderMap::new();
    headers.insert(
        COOKIE,
        cookie
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

    let html = response.text().await.map_err(|e| e.to_string())?;
    let download_link = extract_beatpack_download_url(&html)?;

    Ok(download_link)
}

#[tauri::command]
pub async fn get_beatpack_song_list(
    state: State<'_, AppConfig>,
    id: String,
) -> Result<Vec<String>, String> {
    let url = format!("{}/{}?format=raw", state.osu.beatpacks_url.clone(), id);
    let cookie = state.osu.cookie.lock().unwrap().clone();
    let mut headers = HeaderMap::new();
    headers.insert(
        COOKIE,
        cookie
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

    let html = response.text().await.map_err(|e| e.to_string())?;
    let beatmaps = extract_beatmap_from_beatpack(&html)?;

    Ok(beatmaps)
}
