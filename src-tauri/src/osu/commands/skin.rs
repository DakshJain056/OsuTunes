use crate::models::{AppConfig, Skin};
use crate::osu::extractors::{extract_skins, extracts_skin_contests};
use reqwest;
use serde_json::Value;
use tauri::State;

#[tauri::command]
pub async fn fetch_all_skins(state: State<'_, AppConfig>) -> Result<Value, String> {
    let url = format!("{}/search.json", state.osu.skins_url.clone());

    let response = reqwest::get(url).await.map_err(|e| e.to_string())?;

    let json = response.json().await.map_err(|e| e.to_string())?;

    Ok(json)
}

#[tauri::command]
pub async fn fetch_contests(state: State<'_, AppConfig>) -> Result<Vec<(String, String)>, String> {
    // Fetch the webpage content
    let response = reqwest::get(state.osu.skins_url.clone())
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())?;

    let contests: Vec<(String, String)> = extracts_skin_contests(response)?;

    Ok(contests)
}

#[tauri::command]
pub async fn fetch_contest_skins(
    state: State<'_, AppConfig>,
    contest: &str,
) -> Result<(Vec<Skin>, Vec<Skin>), String> {
    let url = format!("{}/{}", state.osu.skins_url.clone(), contest);

    let response = reqwest::get(url)
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())?;

    let (winner_skins, submission_skins) = extract_skins(&response)?;

    Ok((winner_skins, submission_skins))
}

#[tauri::command]
pub async fn open_forum_post(id: &str) -> Result<(), String> {
    let url = format!("https://osu.ppy.sh/community/forums/topics/{}?n=1", id);
    open::that(url).map_err(|e| e.to_string())?;

    Ok(())
}
