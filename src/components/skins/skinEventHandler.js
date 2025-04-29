import {skinState} from "../../modules/skins/state.js";
import {filterBarEventHandler} from "./filterBar/filterBarEventHandler.js";
import {loadData} from "../../modules/skins/skinPage.js";
import {skinCardEventHandler} from "./skinCard/skinCardEventHandler.js";

const { invoke } = window.__TAURI__.core;

export function addEventListener() {
    window.addEventListener('resize', handleSkinScroll);

    const contentContainer = document.querySelector('.content-container');
    contentContainer.addEventListener('click', skinCardEventHandler.handleAddToBookmarks);
    contentContainer.addEventListener('click', skinCardEventHandler.handleSkinClick);
    contentContainer.addEventListener('click', skinCardEventHandler.handleLightboxClick);

    if (skinState.currentView === 'home') {
        const filterBar = document.querySelector('.filter-bar');
        filterBar.addEventListener('click', filterBarEventHandler.handleFilterClick);

        const contestDropdown = document.getElementById('contest-dropdown');
        contestDropdown.addEventListener('change', filterBarEventHandler.handleContestChange);

        const filterButton = document.getElementById('filter-button');
        filterButton.addEventListener('click', filterBarEventHandler.handleSearch);
    }
}

export function removeEventListener() {
    window.removeEventListener('resize', handleSkinScroll);

    const contentContainer = document.querySelector('.content-container');
    contentContainer.removeEventListener('click', skinCardEventHandler.handleAddToBookmarks);
    contentContainer.removeEventListener('click', skinCardEventHandler.handleSkinClick);
    contentContainer.removeEventListener('click', skinCardEventHandler.handleLightboxClick);

    if (skinState.currentView === 'home') {
        const filterBar = document.querySelector('.filter-bar');
        filterBar.removeEventListener('click', filterBarEventHandler.handleFilterClick);

        const contestDropdown = document.getElementById('contest-dropdown');
        contestDropdown.removeEventListener('change', filterBarEventHandler.handleContestChange);

        const filterButton = document.getElementById('filter-button');
        filterButton.removeEventListener('click', filterBarEventHandler.handleSearch);
    }
}

export async function handlePageChange(page) {
    await loadData(page);
}

export function handleSkinScroll() {
    if (skinState.currentView === 'home') {
        const contentContainer = document.getElementById('data-container');
        const height = document.querySelector('.content-container').clientHeight - document.getElementById('skin-filters').clientHeight - 60;
        contentContainer.style.height = `${height}px`;
    } else {
        const contentContainer = document.querySelector('.contest-container');
        contentContainer.style.height = `92.75vh`;
    }
}

export async function handleViewPostClick(event) {
    const element = event.target.closest('.view-post-btn');
    if (!element) return;

    console.log('view btn clicked');

    const id = element.dataset.id;
    try {
        invoke('open_forum_post', { id });
    } catch (error) {
        console.error('Error creating window or webview:', error);
    }
}