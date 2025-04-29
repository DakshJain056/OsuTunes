import {mainState} from "../../../modules/main/state.js";
import {popupManager} from "../../ui/popup.js";

const { invoke } = window.__TAURI__.core;
export const spotifyEventHandler = {
    addSpotifyEventListeners() {
        const spotifyContainer = document.querySelector('.spotify-container');
        const closeButton = spotifyContainer.querySelector('.close-spotify');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                spotifyContainer.style.display = 'none';
            });
        }

        const addToPlaylistButtons = document.querySelectorAll('.add-to-playlist-button');
        // Add event listener to each button
        addToPlaylistButtons.forEach(button => {
            button.addEventListener('click', spotifyEventHandler.handleAddToPlaylist);
        });
    },

    removeSpotifyEventListeners() {
        const spotifyContainer = document.querySelector('.spotify-container');
        const closeButton = spotifyContainer.querySelector('.close-spotify');
        if (closeButton) {
            closeButton.removeEventListener('click', () => {
                spotifyContainer.style.display = 'none';
            });
        }

        const addToPlaylistButtons = document.querySelectorAll('.add-to-playlist-button');
        if(addToPlaylistButtons) {
            addToPlaylistButtons.forEach(button => {
                button.removeEventListener('click', spotifyEventHandler.handleAddToPlaylist);
            });
        }
    },

    async handleAddToPlaylist(event) {
        const button = event.target.closest('button[data-id]');
        if (!button) return;

        const trackUri = button.dataset.id;
        const playlistUri = await mainState.store.get('spotifyPlaylistLink');

        const trackId = `spotify:track:${trackUri}`;
        const playlistId = `spotify:playlist:${playlistUri}`;

        try {
            console.log(trackId);
            await invoke('add_to_playlist', {
                trackId,
                playlistId,
            });

            popupManager.showSuccessfullSpotifyAdd();
        } catch (error) {
            console.error(error);
            popupManager.showError(async () => await this.handleAddToPlaylist(event));
        }
    }
}