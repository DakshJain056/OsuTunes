import {skinState} from "./state.js";
import SkinContest from "../../components/skins/skinContest/skinContest.js";
import {loadingScreen} from "../../components/ui/loading.js";
import {popupManager} from "../../components/ui/popup.js";
import {pagingModule} from "../../components/ui/paging.js";
import {SKIN_CONSTANTS} from "./constants.js";
import {renderSkins} from "../../components/skins/skinRender.js";
import {
    handlePageChange,
    handleSkinScroll, handleViewPostClick,
    removeEventListener
} from "../../components/skins/skinEventHandler.js";
import FilterBar from "../../components/skins/filterBar/filterBar.js";
import {addEventListener} from "../../components/skins/skinEventHandler.js";
import {bookmarkModule} from "../bookmarks/bookmarks.js";
import {bookmarkState} from "../bookmarks/state.js";

const { invoke } = window.__TAURI__.core;

export const SkinPage = {
     async init() {
         skinState.currentView = 'home';
        loadingScreen.showLoading();
        skinState.isModuleActive = true;
        await fetchAllSkins();
        await SkinPage.render();
        handleSkinScroll();
        loadingScreen.hideLoading();
    },

    cleanup() {
        if (skinState.isLoading) {
            popupManager.showSkinLoading();
            return 1;
        }
        skinState.skins = [];
        skinState.contests = [];
        removeEventListener();
        skinState.currentPage = pagingModule.currentPage;
        pagingModule.cleanup();
        skinState.currentView = 'home';
        skinState.isModuleActive = false;

        return 0;
    },

    async render() {
        const container = document.querySelector('.content-container');
        container.innerHTML = ''; // Clear existing content
        if (skinState.currentView === 'home') {
            container.innerHTML = `
                <div id="skin-filters"></div>
                <div id="data-container"></div>
                <div id="pagination-container"></div>
            `;
            const filterBar = new FilterBar();
            await filterBar.render();
            await pagingModule.init('pagination-container', handlePageChange, skinState.currentPage);
            pagingModule.setTotalPages(getTotalPages());
            await loadData(skinState.currentPage);
            const contentContainer = document.getElementById('data-container');
            const height = document.querySelector('.content-container').clientHeight - document.getElementById('skin-filters').clientHeight - 60;
            contentContainer.style.height = `${height}px`;
        } else if (skinState.currentView === 'contest') {
            container.innerHTML = `
                <button id="backToSkins">Back to Skins</button>
                <div id="contest-container"></div>
            `;
            const contentContainer = document.getElementById('contest-container');
            contentContainer.style.height = '92.75vh';
            document.getElementById('backToSkins').addEventListener('click', () => this.navigateBack());
            await loadContestSkins();
        } else if (skinState.currentView === 'skin') {
            container.innerHTML = `
                <button id="backToSkins">Back to Skins</button>
                <div id="skin-container"></div>
            `;
            const contentContainer = document.getElementById('skin-container');
            contentContainer.style.height = '92.75vh';
            document.getElementById('backToSkins').addEventListener('click', () => this.navigateBack());
        }
        addEventListener();
    },

    async navigateBack() {
        loadingScreen.showLoading();

        if (skinState.currentView === 'skin') {
            document.querySelector('.view-post-btn').removeEventListener('click', handleViewPostClick);
        }
        // Check if we came from a contest view
        if (skinState.previousView === 'contest') {
            skinState.currentView = 'contest';
            skinState.previousView = 'home';
            await SkinPage.render();
            await loadContestSkins();
        }
        // Check if we came from bookmarks
        else if (skinState.previousView === 'bookmark') {
            // Switch back to bookmark module
            await bookmarkModule.initSavedTab();
            // Set the filter to skins
            document.getElementById('type-filter').value = 'skins';
            bookmarkModule.currentSection = 'skins';
            await bookmarkModule.loadBookmarks(bookmarkState.currentPage);
        }
        // Default case - go back to home view
        else {
            skinState.currentView = 'home';
            await SkinPage.render();
            await loadData(skinState.currentPage);
        }

        loadingScreen.hideLoading();
    }
}

async function fetchAllSkins() {
    try {
        skinState.skins = await invoke('fetch_all_skins');
    } catch (error) {
        console.error(error);
        popupManager.showError(fetchAllSkins());
    }
}

export async function updateData() {
    skinState.isLoading = true;
    skinState.currentPage = 1;
    loadingScreen.showLoading();

    const contentContainer = getContentContainer();
    contentContainer.innerHTML = '';
    console.log(skinState.currentView);
    if (skinState.currentView === 'home') {
        await loadData(skinState.currentPage);
    } else if (skinState.currentView === 'contest') {
        await loadContestSkins();
    }

    skinState.isLoading = false;
    loadingScreen.hideLoading();
}

export async function loadContestSkins() {
    skinState.isLoading = true;
    loadingScreen.showLoading();
    const contestName = skinState.currentContest[0];
    const contestLink = skinState.currentContest[1];
    try {
        const [winnerSkins, submissionSkins] = await invoke('fetch_contest_skins', { contest: contestLink });
        new SkinContest(winnerSkins, submissionSkins, contestName).render();
        console.log(submissionSkins);
    } catch (error) {
        console.error(error);
        popupManager.showError(() => this.loadContestSkins());
    } finally {
        skinState.isLoading = false;
        loadingScreen.hideLoading();
    }
}

function getContentContainer() {
    if (skinState.currentView === 'home') {
        return document.getElementById('data-container');
    } else if(skinState.currentView === 'contest') {
        return document.getElementById('contest-container');
    }
}

export function getTotalPages() {
    const filteredSkins = filterSkins();
    return Math.ceil(filteredSkins.length / SKIN_CONSTANTS.ITEMS_PER_PAGE);
}

export async function loadData(page) {
    const contentContainer = getContentContainer();
    contentContainer.innerHTML = '';

    loadingScreen.showLoading();

    const filteredSkins = filterSkins();
    const start = (page - 1) * SKIN_CONSTANTS.ITEMS_PER_PAGE;
    const end = start + SKIN_CONSTANTS.ITEMS_PER_PAGE;
    const skins = filteredSkins.slice(start, end);

    if (skins.length === 0) {
        this.contentContainer.innerHTML = '<img src="assets/icon_images/nothing_found.jpeg">';
        return;
    }
    await renderSkins(skins, contentContainer);

    loadingScreen.hideLoading();
}

function filterSkins() {
    return skinState.skins.filter(skin => {
        // Category filter (seems to be working fine, so we'll keep it as is)
        const categoryMatch =
            (skinState.currentFilter.includedCategories.length === 0 ||
                skinState.currentFilter.includedCategories.every(cat => skin.categories && skin.categories.includes(cat))) &&
            !skinState.currentFilter.excludedCategories.some(cat => skin.categories && skin.categories.includes(cat));

        const gameModeMatch =
            skinState.currentFilter.gameModes.length === 0 ||
            skinState.currentFilter.gameModes.every(mode => skin.game_modes && skin.game_modes.includes(mode));

        const resolutionMatch =
            skinState.currentFilter.resolution.length === 0 ||
            skinState.currentFilter.resolution.every(res => skin.resolutions && skin.resolutions.includes(res));

        const aspectRatioMatch =
            skinState.currentFilter.aspectRatio.length === 0 ||
            skin.ratios && skin.ratios.includes("all") ? true : skinState.currentFilter.aspectRatio.every(ratio => skin.ratios && skin.ratios.includes(ratio));

        return categoryMatch && resolutionMatch && aspectRatioMatch && gameModeMatch;
    });
}

export async function fetchContests() {
    try {
        skinState.contests = await invoke('fetch_contests');
        console.log(skinState.contests);
    } catch (error) {
        console.error(error);
        popupManager.showError(fetchContests());
    }
}

export async function displaySkin(skin_id) {
    skinState.previousView = skinState.currentView;
    skinState.currentView = 'skin';

    let skinData;
    if (skinState.previousView === 'bookmark') {
        skinData = bookmarkState.skins.find(b => {
            const parsedData = JSON.parse(b.data);
            return parsedData.forum_thread_id === parseInt(skin_id);
        });

        skinData = JSON.parse(skinData.data);
        bookmarkState.currentPage = pagingModule.currentPage;
    } else {
        skinData = skinState.skins.find(b => b.forum_thread_id === parseInt(skin_id));
    }
    console.log(skinData, skinState.previousView, skinState.currentView);

    await SkinPage.render();
    const container = document.getElementById('skin-container');

    // Create meta items HTML
    const metaItems = [
        { label: 'Author:', value: skinData.formatted_author },
        { label: 'Released:', value: new Date(skinData.date_released).toLocaleDateString() },
        { label: 'Modes:', value: skinData.game_modes.map(mode => `
            <img src="src/assets/icon_images/game_modes/${mode}.png" alt="${mode}" class="skin-info-panel-game-modes">
        `).join(' ') },
        { label: 'Resolution & Ratio:', value: `${skinData.resolutions.join(', ')} | ${skinData.ratios.join(', ')}` },
        { label: 'Categories:', value: skinData.categories.join(', ') }
    ].map(item => `
        <div class="meta-item">
            <span class="meta-label">${item.label}</span>
            <span class="meta-value">${item.value}</span>
        </div>
    `).join('');

    // Create gallery items HTML
    const galleryItems = skinData.skin_collection[0].screenshots
        .slice(1) // Skip first image as it's in hero
        .map((screenshot, index) => `
            <div class="gallery-item" data-screenshot="${screenshot}">
                <img src="${screenshot}" 
                     alt="${skinData.skin_name} Screenshot ${index + 2}"
                >
            </div>
        `).join('');

    // Main layout HTML
    container.innerHTML = `
        <div class="skin-layout">
            <div class="skin-hero">
                <div class="skin-featured-image">
                    <img src="${skinData.skin_collection[0].screenshots[0]}" 
                         alt="${skinData.skin_name}"
                    >
                </div>
                
                <div class="skin-info-panel">
                    <h1 class="skin-hero-name">${skinData.skin_name}</h1>
                    
                    <div class="skin-meta-info">
                        ${metaItems}
                    </div>
                    
                    <div class="skin-button-group">
                        <button class="view-post-btn" data-id="${skinData.forum_thread_id}">
                            <span class="btn-text">View Post</span>
                        </button>
                    </div>
                </div>
            </div>

            <section class="skin-gallery-section">
                <h2 class="gallery-title">Screenshots</h2>
                <div class="skin-gallery">
                    ${galleryItems}
                </div>
            </section>
        </div>
    `;

    document.querySelector('.view-post-btn').addEventListener('click', handleViewPostClick);
}