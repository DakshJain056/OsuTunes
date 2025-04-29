use rspotify::AuthCodePkceSpotify;
use serde;
use serde::Serialize;
use std::sync::Mutex;
// use rodio::{OutputStream, OutputStreamHandle, Sink};
// use chrono::{DateTime, Utc};

#[derive(Serialize)]
pub struct BeatmapPack {
    pub name: String,
    pub date: String,
    pub author: String,
    pub id: String,
}

#[derive(Clone, Serialize)]
pub struct Progress {
    pub id: u64,
    pub progress: u64,
    pub total: u64,
}

#[derive(Serialize, Debug)]
pub struct Skin {
    pub skin_name: String,
    pub formatted_author: String,
    pub game_modes: Vec<String>,
    pub forum_thread_id: String,
}

// #[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
// pub enum Status {
//     Stopped,
//     Running,
//     Paused,
// }
//
// /// The type of media file
// #[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
// pub enum MediaType {
//     Ogg,
//     Mp3,
// }
//
// #[derive(Debug, Clone, Serialize, Deserialize)]
// pub struct Track {
//     /// Path of the track
//     pub location: PathBuf,
//     /// File extension
//     pub media_type: MediaType,
//     /// Artist of the song
//     pub artist: String,
//     /// Title of the song
//     pub title: String,
//     /// Duration of the song
//     pub duration: Duration,
//     /// Path of the track image
//     pub picture: Option<PathBuf>
// }
//
// #[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
// pub enum LoopMode {
//     /// Loop one track
//     Single = 0,
//     /// Loop the entire Queue (after last index comes the first)
//     Queue = 1,
//     /// Select a random track on each next track
//     Random = 2,
// }
//
// #[derive(Debug, Clone, Serialize, Deserialize)]
// pub struct Queue {
//     /// All tracks in the queue
//     pub tracks: Vec<Track>,
//     /// Index into `tracks` of the current playing track
//     pub current_track_index: usize,
//     /// Whether the queue is in shuffle mode
//     pub shuffle: bool,
//     /// The loop-/play-mode for the queue
//     pub loop_mode: LoopMode,
//     /// A shuffled order of track indices (used when shuffle is true)
//     pub shuffled_indices: Option<Vec<usize>>,
// }
//
// #[derive(Serialize, Deserialize)]
// pub struct Playlist {
//     pub tracks: Vec<Track>,
//     pub id: u16,
//     pub name: String,
//     pub created_at: DateTime<Utc>,
//     pub updated_at: DateTime<Utc>,
// }
//
// #[derive(Serialize, Deserialize)]
// pub struct PlayerState {
//     pub queue: Option<Queue>,
//     pub track: Option<Track>,
//     pub progress: Duration,
// }
//
// pub struct RodioPlayer {
//     // Rodio components
//     pub _stream: OutputStream,      // Underscore prefix because we just need to keep it alive
//     pub stream_handle: OutputStreamHandle,
//     pub sink: Mutex<Sink>,
//     pub current_track: Option<Track>,
//     pub status: Status,
//     pub progress: Duration,
// }
//
// pub struct MusicPlayer {
//     pub player: RodioPlayer,
//     pub queue: Option<Queue>,
//     pub all_tracks: Vec<Track>,
//     pub progress_update_interval: Duration,
// }

pub struct AppConfig {
    pub osu: OsuConfig,
    pub spotify: SpotifyConfig,
    // pub music_player: MusicPlayer,
}

pub struct OsuConfig {
    pub cookie: Mutex<String>,
    pub beatmapsets_url: String,
    pub beatpacks_url: String,
    pub skins_url: String,
    pub nerinyan_api: String,
}

pub struct SpotifyConfig {
    pub client: Mutex<AuthCodePkceSpotify>,
}
