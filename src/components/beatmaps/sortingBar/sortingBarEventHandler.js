import {beatmapsState} from "../../../modules/beatmaps/state.js";
import {loadData} from "../../../modules/beatmaps/beatmapPage.js";

export const sortingBarEventHandler = {
    async handleCategoryClick(event) {
        const element = event.target.closest('.category-option');
        if (!element) return;

        document.querySelectorAll('.category-option').forEach(el => el.classList.remove('active'));
        element.classList.add('active');

        beatmapsState.currentCategory = element.dataset.category;
        await sortingBarEventHandler.updateData();
    },

    async handleSortingClick(event) {
        const element = event.target.closest('.sort-option');
        if (!element) return;

        beatmapsState.currentSortBy = element.dataset.sort;
        beatmapsState.currentSortOrder = element.classList.contains('sorted-desc') ? 'asc' : 'desc';

        sortingBarEventHandler.updateSortingDisplay(element);
        await sortingBarEventHandler.updateData();
    },

    async handleGameModeDropdownChange(event) {
        beatmapsState.currentGameMode = event.target.value;
        await sortingBarEventHandler.updateData();
    },

    updateSortingDisplay(element) {
        document.querySelectorAll('.sort-option').forEach(el => {
            el.classList.remove('sorted-asc', 'sorted-desc');
        });
        element.classList.add(beatmapsState.currentSortOrder === 'asc' ? 'sorted-asc' : 'sorted-desc');
    },

    async updateData() {
        beatmapsState.cursorString = '';
        document.getElementById("data-container").innerHTML = '';
        beatmapsState.beatmaps = [];
        await loadData();
    }
}