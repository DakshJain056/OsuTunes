import {beatmapsState} from '../../../modules/beatmaps/state.js';
import {BEATMAP_CONSTANTS} from "../../../modules/beatmaps/constants.js";

export default class SortingBar {
    constructor() {
        this.container = document.getElementById('sorting-bar-container');
    }

    render() {
        this.container.innerHTML = this.createCategoriesBar() + this.createSortingBar();
        document.querySelector(`.category-option[data-category=${beatmapsState.currentCategory}]`).classList.add('active');
    }

    createCategoriesBar() {
        return `
            <div class="categories-bar">
                <div class="categories-label">Categories</div>
                ${BEATMAP_CONSTANTS.CATEGORIES_OPTIONS.map(category => `
                    <div class="category-option" data-category="${category.toLowerCase().replace(' ', '-')}">
                        ${category}
                    </div>
                `).join('')}
            </div>
        `;
    }

    createSortingBar() {
        return `
            <div class="sorting-bar">
                <div class="sort-by">Sort by</div>
                <select class="game-mode-dropdown">
                    ${BEATMAP_CONSTANTS.GAME_MODES.map(mode => {
                        return `
                            <option value=${mode}>${this.capitalizeFirstLetter(mode)}</option>
                        `;
                    }).join('')};
                </select>
                ${BEATMAP_CONSTANTS.SORTING_OPTIONS.map(option => {
                    const sortedClass = option === beatmapsState.currentSortBy ? ` sorted-${beatmapsState.currentSortOrder}` : '';
                    return `
                        <div class="sort-option${sortedClass}" data-sort="${option}">
                            ${this.capitalizeFirstLetter(option)}
                            <span class="arrow"></span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}