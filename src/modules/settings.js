// import {popupManager} from '../components/ui/popup.js';
// import {mainState} from "./main/state.js";
//
// const { invoke } = window.__TAURI__.core;
//
// export const SettingsPage = {
//     contentContainer: null,
//     currentEditingElement: null,
//     isModuleActive: false,
//
//     async init() {
//         await this.render();
//         this.addEventListeners();
//         this.isModuleActive = true;
//     },
//
//     cleanup: function() {
//         if(!this.isModuleActive)
//             return 1;
//
//         document.querySelectorAll('.header-bar').forEach(a=>a.style.display = "flex");
//         this.removeEventListeners();
//         this.contentContainer = null;
//         this.isModuleActive = false;
//         return 0;
//     },
//
//     async render() {
//         document.querySelectorAll('.header-bar').forEach(a=>a.style.display = "none");
//         const container = document.querySelector('.content-container');
//         container.innerHTML = `
//             <div id="data-container">
//                 <div class="settings-container"></div>
//             </div>
//         `;
//         this.contentContainer = document.querySelector('.settings-container');
//         await this.createSettingsPage();
//     },
//
//     async getStoredPathOrDefault(key) {
//         return await mainState.store.get(key);
//     },
//
//     async fetchSpotifyPlaylists() {
//         try {
//             return await invoke('get_user_playlists');
//         } catch (error) {
//             console.error('Error fetching playlists:', error);
//             return [];
//         }
//     },
//
//     async createSettingsPage() {
//         const osuSongPath = await this.getStoredPathOrDefault("osuSongPath");
//         const imageDownloadPath = await this.getStoredPathOrDefault("imageDownloadPath");
//         const spotifyPlaylistLink = await this.getStoredPathOrDefault("spotifyPlaylistLink");
//
//         this.contentContainer.innerHTML = `
//             <div class="folder-path">
//                 <span>Osu Songs Folder Path </span>
//                 <div class="input-container">
//                     <input type="text" id="osuSongPath" value="${osuSongPath}" disabled autocomplete="off">
//                 </div>
//                 <div class="edit-path-button" data-path-type="osuSongPath" role="button">Edit</div>
//             </div>
//             <div class="folder-path">
//                 <span>Background Image Folder Path </span>
//                 <div class="input-container">
//                     <input type="text" id="imageDownloadPath" value="${imageDownloadPath}" disabled autocomplete="off">
//                 </div>
//                 <div class="edit-path-button" data-path-type="imageDownloadPath" role="button">Edit</div>
//             </div>
//             <div class="folder-path">
//                 <span>Spotify Playlist </span>
//                 <div class="input-container">
//                     <input type="text" id="spotifyPlaylistLink" value="${spotifyPlaylistLink}" disabled autocomplete="off">
//                     <div class="playlist-dropdown-container" style="display: none;">
//                         <div id="playlistDropdown" class="playlist-dropdown"></div>
//                     </div>
//                 </div>
//                 <div class="edit-path-button" data-path-type="spotifyPlaylistLink" role="button">Edit</div>
//             </div>
//         `;
//     },
//
//     async handleEditButtonClick(event) {
//         event.stopPropagation();
//         const button = event.target.closest('.edit-path-button');
//         if (!button) return;
//
//         const pathType = button.dataset.pathType;
//         const inputElement = document.getElementById(pathType);
//         const isSpotifyPlaylist = pathType === 'spotifyPlaylistLink';
//         const dropdownContainer = isSpotifyPlaylist ?
//             document.querySelector('.playlist-dropdown-container') : null;
//         const dropdownElement = isSpotifyPlaylist ?
//             document.getElementById('playlistDropdown') : null;
//
//         if (this.currentEditingElement && this.currentEditingElement !== inputElement) {
//             this.disableCurrentEditingElement();
//         }
//
//         if (button.textContent === 'Edit') {
//             button.textContent = 'Update';
//
//             if (isSpotifyPlaylist) {
//                 // Show loading state
//                 dropdownElement.innerHTML = '<div class="playlist-option">Loading playlists...</div>';
//                 dropdownContainer.style.display = 'block';
//                 inputElement.style.display = 'none';
//
//                 // Fetch fresh playlists
//                 const playlists = await this.fetchSpotifyPlaylists();
//                 console.log(playlists);
//                 const currentValue = inputElement.value;
//
//                 // Create custom dropdown options
//                 dropdownElement.innerHTML = playlists.map(playlist => `
//                     <div class="playlist-option ${playlist.id === currentValue ? 'selected' : ''}"
//                          data-value="${playlist.id}">
//                         ${playlist.name}
//                     </div>
//                 `).join('');
//
//                 // Add click handlers for custom dropdown options
//                 dropdownElement.querySelectorAll('.playlist-option').forEach(option => {
//                     option.addEventListener('click', () => {
//                         dropdownElement.querySelectorAll('.playlist-option').forEach(opt =>
//                             opt.classList.remove('selected'));
//                         option.classList.add('selected');
//                     });
//                 });
//             } else {
//                 inputElement.style.color = 'black';
//                 inputElement.disabled = false;
//                 inputElement.focus();
//             }
//
//             this.currentEditingElement = inputElement;
//         } else {
//             // Update value
//             if (isSpotifyPlaylist) {
//                 const selectedOption = dropdownElement.querySelector('.playlist-option.selected');
//                 if (selectedOption) {
//                     const selectedPlaylistId = selectedOption.dataset.value;
//                     if (mainState.store.has(pathType)) {
//                         mainState.store.delete(pathType);
//                     }
//                     mainState.store.set(pathType, selectedPlaylistId);
//                     inputElement.value = selectedPlaylistId;
//                     dropdownContainer.style.display = 'none';
//                     inputElement.style.display = 'block';
//                 }
//             } else {
//                 const newPath = inputElement.value.trim();
//                 console.log(newPath);
//                 if (await this.validatePath(newPath)) {
//                     if (mainState.store.has(pathType)) {
//                         mainState.store.delete(pathType);
//                     }
//                     mainState.store.set(pathType, newPath);
//                 } else {
//                     popupManager.showInvalidPath();
//                     return;
//                 }
//             }
//
//             button.textContent = 'Edit';
//             inputElement.disabled = true;
//             inputElement.style.color = 'grey';
//             mainState.store.save();
//             this.currentEditingElement = null;
//         }
//     },
//
//     disableCurrentEditingElement() {
//         if (this.currentEditingElement) {
//             const relatedButton = this.currentEditingElement.parentElement.nextElementSibling;
//             const pathType = relatedButton.dataset.pathType;
//             const isSpotifyPlaylist = pathType === 'spotifyPlaylistLink';
//
//             if (isSpotifyPlaylist) {
//                 const dropdownContainer = document.querySelector('.playlist-dropdown-container');
//                 dropdownContainer.style.display = 'none';
//                 this.currentEditingElement.style.display = 'block';
//             }
//
//             relatedButton.textContent = 'Edit';
//             this.currentEditingElement.disabled = true;
//             this.currentEditingElement.style.color = 'grey';
//             this.currentEditingElement = null;
//         }
//     },
//
//     handleClickOutside(event) {
//         if (this.currentEditingElement && !this.contentContainer.contains(event.target)) {
//             this.disableCurrentEditingElement();
//         }
//     },
//
//     addEventListeners() {
//         this.contentContainer.addEventListener('click', this.handleEditButtonClick.bind(this));
//         document.addEventListener('click', this.handleClickOutside.bind(this));
//     },
//
//     removeEventListeners() {
//         this.contentContainer.removeEventListener('click', this.handleEditButtonClick.bind(this));
//         document.removeEventListener('click', this.handleClickOutside.bind(this));
//     },
//
//     async validatePath(path) {
//         try {
//             return await invoke('validate_path', {path});
//         } catch (error) {
//             console.error('Error validating path:', error);
//             popupManager.showInvalidPath();
//             return false;
//         }
//     },
// };

import {popupManager} from '../components/ui/popup.js';
import {mainState} from "./main/state.js";
import {spotify} from "../components/beatmaps/spotify/spotify.js";

const { invoke } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;

export const SettingsPage = {
    contentContainer: null,
    currentEditingElement: null,
    isModuleActive: false,

    async init() {
        await this.render();
        this.addEventListeners();
        this.isModuleActive = true;
    },

    cleanup: function() {
        if(!this.isModuleActive)
            return 1;

        document.querySelectorAll('.header-bar').forEach(a=>a.style.display = "flex");
        this.removeEventListeners();
        this.contentContainer = null;
        this.isModuleActive = false;
        return 0;
    },

    async render() {
        document.querySelectorAll('.header-bar').forEach(a=>a.style.display = "none");
        const container = document.querySelector('.content-container');
        container.innerHTML = `
            <div id="data-container">
                <div class="settings-container"></div>
            </div>
        `;
        this.contentContainer = document.querySelector('.settings-container');
        await this.createSettingsPage();
    },

    async getStoredPathOrDefault(key) {
        return await mainState.store.get(key);
    },

    async fetchSpotifyPlaylists() {
        try {
            return await invoke('get_user_playlists');
        } catch (error) {
            console.error('Error fetching playlists:', error);
            return [];
        }
    },

    async createSettingsPage() {
        const osuSongPath = await this.getStoredPathOrDefault("osuSongPath");
        const imageDownloadPath = await this.getStoredPathOrDefault("imageDownloadPath");
        const spotifyPlaylistLink = await this.getStoredPathOrDefault("spotifyPlaylistLink");

        this.contentContainer.innerHTML = `
            <div class="folder-path">
                <span>Osu Songs Folder Path </span>
                <div class="input-container">
                    <input type="text" id="osuSongPath" value="${osuSongPath}" disabled autocomplete="off">
                </div>
                <div class="edit-path-button" data-path-type="osuSongPath" role="button">Browse</div>
            </div>
            <div class="folder-path">
                <span>Background Image Folder Path </span>
                <div class="input-container">
                    <input type="text" id="imageDownloadPath" value="${imageDownloadPath}" disabled autocomplete="off">
                </div>
                <div class="edit-path-button" data-path-type="imageDownloadPath" role="button">Browse</div>
            </div>
            <div class="folder-path">
                <span>Spotify Playlist </span>
                <div class="input-container">
                    <input type="text" id="spotifyPlaylistLink" value="${spotifyPlaylistLink}" disabled autocomplete="off">
                    <div class="playlist-dropdown-container" style="display: none;">
                        <div id="playlistDropdown" class="playlist-dropdown"></div>
                    </div>
                </div>
                <div class="edit-path-button" data-path-type="spotifyPlaylistLink" role="button">Edit</div>
            </div>
        `;
    },

    async handleEditButtonClick(event) {
        event.stopPropagation();
        const button = event.target.closest('.edit-path-button');
        if (!button) return;

        const pathType = button.dataset.pathType;
        const inputElement = document.getElementById(pathType);
        const isSpotifyPlaylist = pathType === 'spotifyPlaylistLink';
        const isFolderPath = pathType === 'osuSongPath' || pathType === 'imageDownloadPath';
        const dropdownContainer = isSpotifyPlaylist ?
            document.querySelector('.playlist-dropdown-container') : null;
        const dropdownElement = isSpotifyPlaylist ?
            document.getElementById('playlistDropdown') : null;

        if (this.currentEditingElement && this.currentEditingElement !== inputElement) {
            this.disableCurrentEditingElement();
        }

        // Handle folder selection dialog for osuSongPath and imageDownloadPath
        if (isFolderPath) {
            try {
                // Open folder dialog
                const selectedPath = await open({
                    directory: true,
                    multiple: false,
                    title: `Select ${pathType === 'osuSongPath' ? 'Osu Songs' : 'Background Image'} Folder`
                });

                // If user selected a folder (not cancelled)
                if (selectedPath) {
                    const folderPath = Array.isArray(selectedPath) ? selectedPath[0] : selectedPath;

                    // Validate the selected path
                    if (await this.validatePath(folderPath)) {
                        if (mainState.store.has(pathType)) {
                            mainState.store.delete(pathType);
                        }
                        mainState.store.set(pathType, folderPath);
                        inputElement.value = folderPath;
                        mainState.store.save();
                    } else {
                        popupManager.showInvalidPath();
                    }
                }
                return;
            } catch (error) {
                console.error('Error opening folder dialog:', error);
                popupManager.showInvalidPath();
                return;
            }
        }

        // For Spotify playlists
        if (button.textContent === 'Edit') {
            button.textContent = 'Update';

            if (isSpotifyPlaylist) {
                if(!await spotify.isSpotifyLoggedIn()) {
                    await spotify.spotifyLogin();
                } else {
                    dropdownElement.innerHTML = '<div class="playlist-option">Loading playlists...</div>';
                    dropdownContainer.style.display = 'block';
                    inputElement.style.display = 'none';

                    // Fetch fresh playlists
                    const playlists = await this.fetchSpotifyPlaylists();
                    console.log(playlists);
                    const currentValue = inputElement.value;

                    // Create custom dropdown options
                    dropdownElement.innerHTML = playlists.map(playlist => `
                        <div class="playlist-option ${playlist.id === currentValue ? 'selected' : ''}"
                             data-value="${playlist.id}">
                            ${playlist.name}
                        </div>
                    `).join('');

                        // Add click handlers for custom dropdown options
                        dropdownElement.querySelectorAll('.playlist-option').forEach(option => {
                            option.addEventListener('click', () => {
                                dropdownElement.querySelectorAll('.playlist-option').forEach(opt =>
                                    opt.classList.remove('selected'));
                                option.classList.add('selected');
                            });
                        });
                    }

                    this.currentEditingElement = inputElement;
                }
        } else {
            // Update value
            if (isSpotifyPlaylist) {
                const selectedOption = dropdownElement.querySelector('.playlist-option.selected');
                if (selectedOption) {
                    const selectedPlaylistId = selectedOption.dataset.value;
                    if (mainState.store.has(pathType)) {
                        mainState.store.delete(pathType);
                    }
                    mainState.store.set(pathType, selectedPlaylistId);
                    inputElement.value = selectedPlaylistId;
                    dropdownContainer.style.display = 'none';
                    inputElement.style.display = 'block';
                }
            }

            button.textContent = 'Edit';
            inputElement.disabled = true;
            inputElement.style.color = 'grey';
            mainState.store.save();
            this.currentEditingElement = null;
        }
    },

    disableCurrentEditingElement() {
        if (this.currentEditingElement) {
            const relatedButton = this.currentEditingElement.parentElement.nextElementSibling;
            const pathType = relatedButton.dataset.pathType;
            const isSpotifyPlaylist = pathType === 'spotifyPlaylistLink';

            if (isSpotifyPlaylist) {
                const dropdownContainer = document.querySelector('.playlist-dropdown-container');
                dropdownContainer.style.display = 'none';
                this.currentEditingElement.style.display = 'block';
            }

            relatedButton.textContent = pathType === 'spotifyPlaylistLink' ? 'Edit' : 'Browse';
            this.currentEditingElement.disabled = true;
            this.currentEditingElement.style.color = 'grey';
            this.currentEditingElement = null;
        }
    },

    handleClickOutside(event) {
        if (this.currentEditingElement && !this.contentContainer.contains(event.target)) {
            this.disableCurrentEditingElement();
        }
    },

    addEventListeners() {
        this.contentContainer.addEventListener('click', this.handleEditButtonClick.bind(this));
        document.addEventListener('click', this.handleClickOutside.bind(this));
    },

    removeEventListeners() {
        this.contentContainer.removeEventListener('click', this.handleEditButtonClick.bind(this));
        document.removeEventListener('click', this.handleClickOutside.bind(this));
    },

    async validatePath(path) {
        try {
            return await invoke('validate_path', {path});
        } catch (error) {
            console.error('Error validating path:', error);
            popupManager.showInvalidPath();
            return false;
        }
    },
};