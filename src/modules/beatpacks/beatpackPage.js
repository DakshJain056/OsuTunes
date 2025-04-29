import {popupManager} from "../../components/ui/popup.js";
import {beatpackState} from "./state.js";
import {loadingScreen} from "../../components/ui/loading.js";
import TypeBar from "../../components/beatpacks/typeBar/typeBar.js";
import {renderBeatPacks} from "../../components/beatpacks/beatpackRender.js";
import {
    addEventListener,
    handlePageChange,
    handleScroll,
    removeEventListener
} from "../../components/beatpacks/beatpackEventHandler.js";
import {pagingModule} from "../../components/ui/paging.js";

const {invoke} = window.__TAURI__.core;

export const BeatpackPage = {
    async init() {
        BeatpackPage.render();
        new TypeBar().render();
        const totalPages = await getTotalPages();
        await loadData();
        addEventListener();
        await pagingModule.init('pagination-container', handlePageChange, beatpackState.currentPage);
        pagingModule.setTotalPages(totalPages);

        handleScroll();

        beatpackState.isModuleActive = true;
    },

    cleanup() {
        if(beatpackState.isLoading) {
            popupManager.showBeatpackLoading();
            return 1;
        }
        removeEventListener();
        beatpackState.currentPage = pagingModule.currentPage;
        pagingModule.cleanup();
        beatpackState.isModuleActive = false;

        return 0;
    },

    render() {
        const container = document.querySelector('.content-container');
        container.innerHTML = '';
        container.innerHTML = `
            <div id="type-container"></div>
            <div id="data-container"></div>
            <div id="pagination-container"></div>
        `;
    }
}

export async function loadData() {
    beatpackState.isLoading = true;
    const sort = typeMapping(beatpackState.currentType);
    const page = beatpackState.currentPage;
    loadingScreen.showLoading();
    try {
        const container = document.getElementById('data-container');
        container.innerHTML = '';
        const result = await invoke('fetch_beatmap_packs', {sortType: sort, page});
        renderBeatPacks(result, container);
    } catch (error) {
        console.error(error);
        popupManager.showError(loadData());
    } finally {
        loadingScreen.hideLoading();
        beatpackState.isLoading = false;
    }
}

function typeMapping(type) {
    const typeMapping = {
        'Standard': 'standard',
        'Tournament': 'tournament',
        'Project-Loved': 'loved',
        'Spotlights': 'chart',
        'Theme': 'theme',
        'Artist/Album': 'artist'
    };

    return typeMapping[type];
}

export async function getTotalPages() {
    const sort = typeMapping(beatpackState.currentType);
    try {
        return await invoke('get_total_beatpack_pages', { sortType: sort });
    } catch(error) {
        console.error(error);
        popupManager.showError(getTotalPages());
    }
}

export function displayBeatpackSongs(songList, beatpackElement) {
    beatpackElement.querySelector('.beatmap-pack-content').style.display = 'block';
    beatpackElement.querySelector('.beatmap-list').innerHTML = songList.map((song) => `
        <li class="beatmap-list-item">
            <span>${song}</span>
        </li>
    `).join("");
}
