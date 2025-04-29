import {downloadModule} from "../../../modules/downloads.js";
import {popupManager} from "../../ui/popup.js";
import {mainState} from "../../../modules/main/state.js";
import {loadingScreen} from "../../ui/loading.js";
import {bookmarkModule} from "../../../modules/bookmarks/bookmarks.js";
import {displayBeatpackSongs} from "../../../modules/beatpacks/beatpackPage.js";

const { invoke } = window.__TAURI__.core;

export const beatpackCardEventHandler = {
    async handleActionButtonClick(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const beatpackElement = button.closest('.beatmap-pack');
        if (!beatpackElement) return;


        const beatpackId = beatpackElement.querySelector('.beatmap-pack-header').dataset.beatpackid;

        const handlers = {
            downloadBeatpack: () => beatpackCardEventHandler.handlePackDownload(beatpackId),
            addToBookmarks: () => beatpackCardEventHandler.handleAddToBookmarks(beatpackId, beatpackElement),
            listBeatmaps: () => beatpackCardEventHandler.handleListBeatmaps(beatpackId, beatpackElement)
        };

        if (handlers[action]) {
            await handlers[action]();
        }
    },

    async handlePackDownload(beatpackId) {
        const sourceUrl = await invoke('get_beatpack_download_url', {id: beatpackId});

        const urlObj = new URL(sourceUrl);
        const path = urlObj.pathname;
        const extension = path.split('.').pop();
        const fileName = `${beatpackId}.${extension}`;

        const songPath = await mainState.store.get('osuSongPath');
        const filePath = `${songPath}\\${fileName}`;

        try {
            downloadModule.downloadAnimation();
            await downloadModule.addToQueue("beatmappacks", beatpackId, sourceUrl, filePath);
        } catch (error) {
            popupManager.showError(() => this.handlePackDownload());
        }
    },


    async handleListBeatmaps(beatpackId, beatpackElement) {
        beatpackElement.querySelector('.beatpack-dropdown-btn').classList.toggle('active');
        if (!beatpackElement.querySelector('.beatpack-dropdown-btn').classList.contains('active')) {
            console.log('not active');
            beatpackElement.querySelector('.beatmap-pack-content').style.display = 'none';
            return;
        }

        loadingScreen.showLoading();
        try {
            const result = await invoke('get_beatpack_song_list', { id: beatpackId });
            displayBeatpackSongs(result, beatpackElement);
        } catch (error) {
            console.error(error);
            popupManager.showError(beatpackCardEventHandler.handleListBeatmaps(beatpackId));
        } finally {
            loadingScreen.hideLoading();
        }
    },

    async handleAddToBookmarks(beatpackId, beatpackElement) {
        try {
            const beatpackName = beatpackElement.querySelector('.beatmap-pack-name').textContent;
            const beatpackDate = beatpackElement.querySelector('#beatpack-date').textContent;
            const beatpackAuthor = beatpackElement.querySelector('#beatpack-author').textContent;

            const beatpack = {
                name: beatpackName,
                date: beatpackDate,
                author: beatpackAuthor,
                id: beatpackId,
            };

            bookmarkModule.saveAnimation();
            await bookmarkModule.addToBookmark('beatmappacks', beatpack, beatpackId);
        } catch (error) {
            console.error('Failed to add beatpack to saves:', error);
            popupManager.showError(() => this.handleAddToBookmarks(beatpackId, beatpackElement));
        }
    },
}