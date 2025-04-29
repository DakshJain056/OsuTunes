import {beatmapCardEventHandler} from "./beatmapCard/beatmapCardEventHandler.js";
import {sortingBarEventHandler} from "./sortingBar/sortingBarEventHandler.js";
import {loadData} from "../../modules/beatmaps/beatmapPage.js";
import {beatmapsState} from "../../modules/beatmaps/state.js";
import {spotifyEventHandler} from "./spotify/spotifyEventHandler.js";

export function addEventListeners() {
    const contentContainer = document.getElementById('data-container');
    contentContainer.addEventListener('scroll', handleScroll);

    const categoriesBar = document.querySelector('.categories-bar');
    const sortingBar = document.querySelector('.sorting-bar');
    const categoryDropdown = document.querySelector('.game-mode-dropdown');

    categoriesBar.addEventListener('click', sortingBarEventHandler.handleCategoryClick);
    sortingBar.addEventListener('click', sortingBarEventHandler.handleSortingClick);
    categoryDropdown.addEventListener('change', sortingBarEventHandler.handleGameModeDropdownChange);
    contentContainer.addEventListener('click', beatmapCardEventHandler.handleActionButtonClick);

    window.addEventListener("resize", handleScrollHeight);
}

export function removeEventListeners() {
    const contentContainer = document.getElementById('data-container');
    contentContainer.removeEventListener('scroll', handleScroll);
    contentContainer.removeEventListener('click', beatmapCardEventHandler.handleActionButtonClick);

    const categoriesBar = document.querySelector('.categories-bar');
    const sortingBar = document.querySelector('.sorting-bar');
    const categoryDropdown = document.querySelector('.game-mode-dropdown');

    categoriesBar.removeEventListener('click', sortingBarEventHandler.handleCategoryClick);
    sortingBar.removeEventListener('click', sortingBarEventHandler.handleSortingClick);
    categoryDropdown.removeEventListener('change', sortingBarEventHandler.handleGameModeDropdownChange);
    window.removeEventListener("resize", handleScrollHeight);

    spotifyEventHandler.removeSpotifyEventListeners();
}

export function handleScrollHeight() {
    const contentContainer = document.getElementById('data-container');
    const height = document.querySelector('.content-container').clientHeight - document.getElementById('sorting-bar-container').clientHeight - 60;
    contentContainer.style.height = `${height}px`;
}

async function handleScroll() {
    const { scrollTop, scrollHeight, clientHeight} = document.getElementById('data-container');

    if (scrollHeight - (scrollTop + clientHeight) < 500 && !beatmapsState.isLoading) {
        await loadData(beatmapsState.currentSortBy, beatmapsState.currentSortOrder, beatmapsState.currentCategory, beatmapsState.currentGameMode);
    }
}
