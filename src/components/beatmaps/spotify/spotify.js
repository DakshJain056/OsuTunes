import {popupManager} from "../../ui/popup.js";
import {spotifyEventHandler} from "./spotifyEventHandler.js";
import {loadingScreen} from "../../ui/loading.js";

const { invoke } = window.__TAURI__.core;

export const spotify = {
    async searchSpotify(beatmapId, beatmapElement) {
        const beatmapTitle = beatmapElement.querySelector("#beatmap-title").textContent;
        const beatmapArtist = beatmapElement.querySelector("#beatmap-artist > span").textContent;

        try {
            loadingScreen.showLoading();
            let query = `${beatmapTitle} ${beatmapArtist}`;
            const spotifyTracks = await invoke('get_tracks', { query });
            spotify.displaySpotifyResults(spotifyTracks);
        } catch (error) {
            console.error(error);
            popupManager.showError(() => spotify.searchSpotify(beatmapId, beatmapElement));
        } finally {
            loadingScreen.hideLoading();
        }
    },

    displaySpotifyResults(spotifyTracks) {
        const spotifyContainer = document.querySelector('.spotify-container');
        if (!spotifyContainer) {
            console.error('Spotify container not found');
            return;
        }

        if (!spotifyTracks.tracks || !spotifyTracks.tracks.items || spotifyTracks.tracks.items.length === 0) {
            spotifyContainer.innerHTML = `
                <div class="spotify-results">
                    <h3>Spotify Results</h3>
                    <button class="close-spotify">Close</button>
                    <div class="no-results">
                        <img src="assets/icon_images/nothing_found.jpeg" alt="No results found" class="no-results-image">
                        <p>No matching tracks found on Spotify</p>
                    </div>
                </div>
            `;
            spotifyContainer.style.display = 'block';
            spotifyEventHandler.addSpotifyEventListeners();
            return;
        }

        spotifyContainer.innerHTML = `
            <div class="spotify-results">
                <button class="close-spotify">Close</button>
                <ul>
                    ${spotifyTracks.tracks.items.map(track => `
                        <li>
                            <img src="${track.album.images[0].url}">
                            <div>
                                <strong>${track.name}</strong>
                                <p>${track.artists.map(artist => artist.name).join(', ')}</p>
                            </div>
                            <button class="add-to-playlist-button" data-id="${track.id}">
                                <img src="assets/icon_images/beatmap_page/add-to-queue.png">
                                <span class="tooltip">Add to Playlist</span>
                            </button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;

        spotifyContainer.style.display = 'block';
        spotifyEventHandler.addSpotifyEventListeners();
    },

    async isSpotifyLoggedIn() {
        try {
            const isLoggedIn = await invoke('spotify_logged_in');
            console.log(isLoggedIn);

            if (!isLoggedIn) {
                return 0; // Wait for login to complete
            } else {
                return 1;
            }
        } catch (error) {
            console.error(error);
            popupManager.showError(spotify.isSpotifyLoggedIn());
        }
    },

    async spotifyLogin() {
        try {
            const isLoggedIn = await invoke('spotify_logged_in');
            console.log(isLoggedIn);

            if (!isLoggedIn) {
                await popupManager.showSpotifyLogin(); // Wait for login to complete
            }
        } catch (error) {
            console.error(error);
            popupManager.showError(spotify.spotifyLogin());
        }
    }
}