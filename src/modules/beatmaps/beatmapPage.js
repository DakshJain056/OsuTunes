import {loadingScreen} from "../../components/ui/loading.js";
import {popupManager} from "../../components/ui/popup.js";
import {beatmapsState} from "./state.js";
import {renderBeatmaps} from "../../components/beatmaps/beatmapsRender.js";
import {
    addEventListeners,
    handleScrollHeight,
    removeEventListeners
} from "../../components/beatmaps/beatmapEventHandlers.js";
import SortingBar from "../../components/beatmaps/sortingBar/sortingBar.js";

const { invoke } = window.__TAURI__.core;

export const BeatmapPage = {
     async init() {
        beatmapsState.isModuleActive = true;
        BeatmapPage.render();
        new SortingBar().render();
        const container = document.getElementById('data-container');
        if (beatmapsState.beatmaps.length === 0) {
            await loadData();
        } else {
            renderBeatmaps(beatmapsState.beatmaps, container);
        }
        addEventListeners();
        handleScrollHeight();
    },

    cleanup() {
        if(beatmapsState.isLoading) {
            popupManager.showBeatmapLoading();
            return 1;
        }
        removeEventListeners();
        beatmapsState.isModuleActive = false;

        return 0;
    },

    render() {
        const container = document.querySelector('.content-container');
        container.innerHTML = '';
        container.innerHTML = `
            <div id="sorting-bar-container"></div>
            <div class="main-content">
                <div id="data-container"></div>
                <div class="spotify-container"></div>
            </div>
        `;
        const contentContainer = document.getElementById('data-container');
        const height = document.querySelector('.content-container').clientHeight - document.getElementById('sorting-bar-container').clientHeight - 60;
        contentContainer.style.height = `${height}px`;
        contentContainer.style.width = 'calc(100% - 205px);';
    }
}

export async function loadData(keyword = "") {
    if (beatmapsState.isLoading) return;
    beatmapsState.isLoading = true;

    loadingScreen.showLoading();

    const sortParam = `${beatmapsState.currentSortBy}_${beatmapsState.currentSortOrder}`;
    let modeParam;
    const mode = beatmapsState.currentGameMode;
    switch (mode) {
        case 'osu': modeParam = 0; break;
        case 'taiko': modeParam = 1; break;
        case 'catch': modeParam = 2; break;
        case 'mania': modeParam = 3; break;
        default: modeParam = undefined;
    }

    const category = beatmapsState.currentCategory.toLowerCase().replace(' ', '-');
    const categoryParam = category === 'has-leaderboard' ? undefined : category;
    const container = document.getElementById('data-container');
    try {
        const result = await invoke('fetch_beatmaps', {
            sort: sortParam,
            mode: modeParam,
            category: categoryParam,
            cursor: beatmapsState.cursorString,
            key: keyword
        });

        if(result.cursor_string) {
            beatmapsState.cursorString = result.cursor_string;
        } else {
            beatmapsState.cursorString = '';
        }

        Object.assign(beatmapsState.beatmaps, result.beatmapsets);
        renderBeatmaps(result.beatmapsets, container);
    } catch (error) {
        console.error(error);
        popupManager.showError(loadData(keyword));
    } finally {
        beatmapsState.isLoading = false;
        loadingScreen.hideLoading();
    }
}
