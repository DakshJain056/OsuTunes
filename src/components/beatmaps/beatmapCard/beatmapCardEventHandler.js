import {downloadModule} from "../../../modules/downloads.js";
import {popupManager} from "../../ui/popup.js";
import {BEATMAP_CONSTANTS} from "../../../modules/beatmaps/constants.js";
import {mainState} from "../../../modules/main/state.js";
import {spotify} from "../spotify/spotify.js";
import {beatmapsState} from "../../../modules/beatmaps/state.js";
import {bookmarkModule} from "../../../modules/bookmarks/bookmarks.js";

export const beatmapCardEventHandler = {
    async handleActionButtonClick(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const beatmapElement = button.closest('.beatmap-item');
        if (!beatmapElement) return;

        const beatmapId = beatmapElement.dataset.beatmapId;
        const handlers = {
            downloadBackground: () => beatmapCardEventHandler.downloadBackground(beatmapId, beatmapElement),
            downloadBeatmap: () => beatmapCardEventHandler.downloadBeatmap(beatmapId, beatmapElement),
            addToBookmarks: () => beatmapCardEventHandler.handleAddToBookmarks(beatmapId),
            searchSpotify: () => beatmapCardEventHandler.handleSpotifySearch(beatmapId, beatmapElement),
            playAudioPreview: () => this.handleAudioPreview(beatmapId, button.dataset.audioUrl)
        };

        if (handlers[action]) {
            await handlers[action]();
        }
    },

    async downloadBackground(beatmapId, beatmapElement) {
        const beatmapTitle = beatmapElement.querySelector("#beatmap-title").textContent;
        const beatmapArtist = beatmapElement.querySelector("#beatmap-artist > span").textContent;

        const imagePath = await mainState.store.get('imageDownloadPath');
        const fileName = `${beatmapId} ${beatmapArtist} - ${beatmapTitle}.jpeg`;

        const filePath = `${imagePath}\\${fileName}`;
        const sourceUrl = `${BEATMAP_CONSTANTS.BG_IMAGE_URL}${beatmapId}`;

        try {
            downloadModule.downloadAnimation();
            await downloadModule.addToQueue("background", beatmapId, sourceUrl, filePath);
        } catch(error) {
            console.error(error);
            popupManager.showError(() => beatmapCardEventHandler.downloadBackground());
        }
    },

    async downloadBeatmap(beatmapId, beatmapElement) {
        const beatmapTitle = beatmapElement.querySelector("#beatmap-title").textContent;
        const beatmapArtist = beatmapElement.querySelector("#beatmap-artist > span").textContent;

        const songPath = await mainState.store.get('osuSongPath');
        const fileName = `${beatmapId} ${beatmapArtist} - ${beatmapTitle}.osz`;

        const filePath = `${songPath}\\${fileName}`;
        const sourceUrl = `${BEATMAP_CONSTANTS.BEATMAP_URL}${beatmapId}/download`;
        try {
            downloadModule.downloadAnimation();
            await downloadModule.addToQueue("beatmapsets", beatmapId, sourceUrl, filePath);
        } catch(error) {
            console.error(error);
            popupManager.showError(() => beatmapCardEventHandler.downloadBeatmap());
        }
    },

    async handleAddToBookmarks(beatmapId) {
        try {
            const beatmap = beatmapsState.beatmaps.find(b => b.id === parseInt(beatmapId));
            if (!beatmap) return;

            bookmarkModule.saveAnimation();
            await bookmarkModule.addToBookmark("beatmapsets", beatmap, beatmapId);
        } catch (error) {
            console.error('Failed to add beatmap to saves:', error);
            popupManager.showError(() => this.handleAddToBookmarks(beatmapId));
        }
    },

    async handleSpotifySearch(beatmapId, beatmapElement) {
        if(!await spotify.isSpotifyLoggedIn()) {
            await spotify.spotifyLogin();
            await spotify.searchSpotify(beatmapId, beatmapElement);
        } else {
            await spotify.searchSpotify(beatmapId, beatmapElement);
        }
    }
}