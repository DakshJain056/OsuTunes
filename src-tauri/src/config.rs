use crate::models::{AppConfig, OsuConfig, SpotifyConfig};
use reqwest::header::HeaderMap;
use rspotify::clients::{BaseClient, OAuthClient};
use rspotify::model::{
    PlayableId, PlaylistId, SearchResult, SearchType, SimplifiedPlaylist, TrackId,
};
use rspotify::{scopes, AuthCodePkceSpotify, Config, Credentials, OAuth, Token};
use std::fs;
use std::fs::File;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

impl SpotifyConfig {
    fn new(app_handle: &AppHandle) -> Self {
        Self::create_spotify_client(app_handle)
    }

    fn get_token_cache_path(app_handle: &AppHandle) -> PathBuf {
        let app_cache_dir = app_handle.path().app_cache_dir().unwrap();
        app_cache_dir.join("spotify_token_cache.json")
    }

    fn create_spotify_client(app_handle: &AppHandle) -> SpotifyConfig {
        let token_cache_path = Self::get_token_cache_path(app_handle);
        if !token_cache_path
            .try_exists()
            .expect("Error checking the path")
        {
            File::create(token_cache_path.clone()).expect("Error creating token cache file");
        }

        let id = "39df84c4c8fa46e390bbe5bbda9af166";
        let uri = "osutunes://callback";

        let creds = Credentials::new_pkce(id);

        let oauth = OAuth {
            redirect_uri: uri.to_string(),
            scopes: scopes!(
                "playlist-modify-private",
                "playlist-modify-public",
                "user-read-private"
            ),
            ..Default::default()
        };

        // let creds = Credentials::from_env()
        //     .ok_or_else(|| "Failed to get credentials".to_string())
        //     .unwrap();
        // let oauth = OAuth::from_env(scopes!(
        //     "playlist-modify-private",
        //     "playlist-modify-public",
        //     "user-read-private"
        // ))
        // .ok_or_else(|| "Failed to set OAuth".to_string())
        // .unwrap();

        let config = Config {
            token_cached: true,
            cache_path: token_cache_path.clone(),
            ..Default::default()
        };

        let client = if let Ok(metadata) = fs::metadata(&token_cache_path) {
            if metadata.len() > 0 {
                let token = Token::from_cache(token_cache_path).unwrap();
                AuthCodePkceSpotify::from_token_with_config(token, creds, oauth, config)
            } else {
                AuthCodePkceSpotify::with_config(creds, oauth, config)
            }
        } else {
            AuthCodePkceSpotify::with_config(creds, oauth, config)
        };

        SpotifyConfig {
            client: Mutex::new(client),
        }
    }

    pub fn request_token(&self, code: &str) {
        let spotify = self.client.lock().unwrap();
        tauri::async_runtime::block_on(async {
            spotify
                .request_token(code)
                .await
                .expect("Could not get access token");
        });
    }

    pub async fn get_tracks(&self, query: String) -> Result<SearchResult, String> {
        let spotify = self.client.lock().unwrap();

        match spotify
            .search(&query, SearchType::Track, None, None, Some(10), None)
            .await
        {
            Ok(track_list) => Ok(track_list),
            Err(e) => Err(format!("Spotify search error: {}", e.to_string())),
        }
    }

    pub async fn get_user_playlists(&self) -> Vec<SimplifiedPlaylist> {
        let spotify = self.client.lock().unwrap();
        let playlist_page = spotify
            .current_user_playlists_manual(Some(10), None)
            .await
            .unwrap();
        playlist_page.items
    }

    pub async fn add_to_playlist(
        &self,
        track_id: String,
        playlist_id: String,
    ) -> Result<(), String> {
        let spotify = self.client.lock().unwrap();
        let playlist = PlaylistId::from_uri(playlist_id.as_str())
            .map_err(|e| format!("Incorrect playlist id: {}", e.to_string()))?;
        let track = PlayableId::from(
            TrackId::from_uri(track_id.as_str())
                .map_err(|e| format!("Incorrect track id: {}", e.to_string()))?,
        );

        match spotify
            .playlist_add_items(playlist, vec![track], None)
            .await
        {
            Ok(_result) => Ok(()),
            Err(err) => Err(format!("Error adding track: {:?}", err)),
        }
    }
}

impl OsuConfig {
    fn new(app_handle: &AppHandle) -> Self {
        OsuConfig {
            cookie: Self::get_cookies_from_file(app_handle),
            beatpacks_url: "https://osu.ppy.sh/beatmaps/packs".to_string(),
            beatmapsets_url: "https://osu.ppy.sh/beatmapsets".to_string(),
            skins_url: "https://compendium.skinship.xyz".to_string(),
            nerinyan_api: "https://subapi.nerinyan.moe/bg/".to_string(),
        }
    }

    fn get_cookie_file_path(app_handle: &AppHandle) -> PathBuf {
        let app_cache_dir = app_handle.path().app_cache_dir().unwrap();
        app_cache_dir.join("osu_cookie.txt")
    }

    fn get_cookies_from_file(app_handle: &AppHandle) -> Mutex<String> {
        let cookie_path = Self::get_cookie_file_path(app_handle);
        let cookie = if cookie_path.exists() {
            fs::read_to_string(cookie_path).unwrap_or_default()
        } else {
            String::new()
        };
        Mutex::new(cookie)
    }

    pub fn save_cookies(&self, app_handle: &AppHandle) {
        let cookie_path = Self::get_cookie_file_path(app_handle);
        let cookies = self.cookie.lock().unwrap().clone();
        fs::write(cookie_path, cookies).expect("Failed to write cookie file");
    }

    pub fn update_cookies(&self, headers: &HeaderMap) {
        let cookie_headers = headers.get_all(reqwest::header::SET_COOKIE);
        let cookie = cookie_headers
            .iter()
            .filter_map(|cookie| {
                cookie
                    .to_str()
                    .ok()
                    .and_then(|c| c.split(';').next().map(String::from))
            })
            .collect::<Vec<String>>()
            .join(";");

        *self.cookie.lock().unwrap() = cookie;
    }
}

impl AppConfig {
    pub fn new(app_handle: &AppHandle) -> Self {
        AppConfig {
            osu: OsuConfig::new(app_handle),
            spotify: SpotifyConfig::new(app_handle),
            // music_player: MusicPlayer::new(app_handle).unwrap()
        }
    }
}
