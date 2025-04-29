import {loadingScreen} from "./loading.js";
import {switchSection} from "../../modules/main/mainPage.js";

const { listen } = window.__TAURI__.event;
const { invoke } = window.__TAURI__.core;

class PopupManager {
    constructor() {
        this.overlay = document.querySelector('.popup-dialog');
        this.popup = document.querySelector('.popup');
        this.content = this.popup.querySelector('.popup-content');
        this.button = document.getElementById('popup-button');
        this.dismissTimeout = null;
    }

    show(message, buttonText, callback, persistent = false) {
        this.content.querySelector('p').textContent = message;
        this.button.textContent = buttonText;

        // Clear any existing timeout
        if (this.dismissTimeout) {
            clearTimeout(this.dismissTimeout);
        }

        this.button.onclick = () => {
            this.hide();
            if (typeof callback === 'function') {
                callback();
            } else {
                console.warn("Callback is not a function:", callback);
            }
        };

        this.overlay.style.display = 'block';

        // Set auto-dismiss timeout
        if (!persistent) {
            this.dismissTimeout = setTimeout(() => {
                this.hide();
            }, 3000);
        }
    }

    hide() {
        if (this.dismissTimeout) {
            clearTimeout(this.dismissTimeout);
        }
        this.overlay.style.display = 'none';
    }

    showInvalidPath() {
        this.show('Invalid path! Enter a valid path', 'Ok', () => {});
    }

    showError(callback) {
        this.show('Oops! Something went wrong!', 'Retry', callback);
    }

    async showLogin() {
        const loginProcess = async () => {
            try {
                await invoke('login');
                this.showVerify();
            } catch (error) {
                this.showError(() => this.showLogin());
            }
        };

        this.show('Looks like you are not logged in!', 'Login', loginProcess, true);
    }

    showSpotifyLogin() {
        return new Promise((resolve, reject) => {
            const loginProcess = async () => {
                try {
                    console.log('inside spotify login');
                    await invoke('spotify_login');

                    const unlisten = await listen('spotify-auth-successful', (event) => {
                        unlisten();
                        resolve(); // Resolve the promise when login is successful
                    });

                    console.log('login');
                } catch (error) {
                    reject(error);
                    this.showError(() => this.showSpotifyLogin());
                }
            };

            this.show('Looks like you are not logged in!', 'Spotify Login', loginProcess);
        });
    }

    async showVerify() {
        const verifyProcess = async () => {
            loadingScreen.showLoading();
            try {
                const isLoggedIn = await invoke('logged_in');
                if (!isLoggedIn) {
                    this.showError(() => this.showLogin());
                } else {
                    await switchSection();
                    this.hide();
                }
            } catch (error) {
                this.showError(() => this.showLogin());
            } finally {
                loadingScreen.hideLoading();
            }
        };

        this.show('Please verify your login', 'Verify', verifyProcess, true);
    }

    showServerError() {
        this.show('Server Error! Please try again later', 'Ok', ()=>{})
    }

    showSuccessfullSpotifyAdd() {
        this.show('Successfully added to playlist', 'Ok', ()=>{});
    }

    showBeatmapLoading() {
        this.show("Loading Beatmaps...", "Ok", ()=>{});
    }

    showBeatpackLoading() {
        this.show("Loading Beatmap Packs...", "Ok", ()=>{});
    }

    showSkinLoading() {
        this.show("Loading Skins...", "Ok", ()=>{});
    }

    showBookmarkedAdded() {
        this.show('Already Bookmarked', 'Ok', ()=>{});
    }
}

// import {loadingScreen} from "./loading.js";
// import {switchSection} from "../../modules/main/mainPage.js";
//
// const { listen } = window.__TAURI__.event;
// const { invoke } = window.__TAURI__.core;
//
// class PopupManager {
//     constructor() {
//         this.overlay = document.querySelector('.popup-dialog');
//         this.popup = document.querySelector('.popup');
//         this.content = this.popup.querySelector('.popup-content');
//         this.button = document.getElementById('popup-button');
//     }
//
//     show(message, buttonText, callback) {
//         this.content.querySelector('p').textContent = message;
//         this.button.textContent = buttonText;
//         this.button.onclick = () => {
//             this.hide();
//             if (typeof callback === 'function') {
//                 callback();
//             } else {
//                 console.warn("Callback is not a function:", callback);
//             }
//         };
//         this.overlay.style.display = 'block';
//     }
//
//     hide() {
//         this.overlay.style.display = 'none';
//     }
//
//     showInvalidPath() {
//         this.show('Invalid path! Enter a valid path', 'Ok', () => {});
//     }
//
//     showError(callback) {
//         this.show('Oops! Something went wrong!', 'Retry', callback);
//     }
//
//     async showLogin() {
//         const loginProcess = async () => {
//             try {
//                 invoke('login');
//                 this.showVerify();
//             } catch (error) {
//                 this.showError(() => this.showLogin());
//             }
//         };
//
//         this.show('Looks like you are not logged in!', 'Login', loginProcess);
//     }
//
//     showSpotifyLogin() {
//         return new Promise((resolve, reject) => {
//             const loginProcess = async () => {
//                 try {
//                     console.log('inside spotify login');
//                     await invoke('spotify_login');
//
//                     const unlisten = await listen('spotify-auth-successful', (event) => {
//                         unlisten();
//                         resolve(); // Resolve the promise when login is successful
//                     });
//
//                     console.log('login');
//                 } catch (error) {
//                     reject(error);
//                     this.showError(() => this.showSpotifyLogin());
//                 }
//             };
//
//             this.show('Looks like you are not logged in!', 'Spotify Login', loginProcess);
//         });
//     }
//
//     async showVerify() {
//         const verifyProcess = async () => {
//             loadingScreen.showLoading();
//             try {
//                 const isLoggedIn = await invoke('logged_in');
//                 if (!isLoggedIn) {
//                     this.showError(() => this.showLogin());
//                 } else {
//                     await switchSection('beatmap');
//                     this.hide();
//                 }
//             } catch (error) {
//                 this.showError(() => this.showLogin());
//             } finally {
//                 loadingScreen.hideLoading();
//             }
//         };
//
//         this.show('Please verify your login', 'Verify', verifyProcess);
//     }
// }
// Create and export a singleton instance
export const popupManager = new PopupManager();