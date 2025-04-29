import {skinState} from "../../../modules/skins/state.js";
import {SKIN_CONSTANTS} from "../../../modules/skins/constants.js";
import {fetchContests} from "../../../modules/skins/skinPage.js";

export default class FilterBar {
    constructor() {
        this.container = document.getElementById('skin-filters');
    }

    async render() {
        await fetchContests();
        this.container.innerHTML = `
            <div class="filter-bar">
                ${this.createSortSection('Categories', SKIN_CONSTANTS.CATEGORIES, 'category-btn')}
                ${this.createSortSection('Resolution', SKIN_CONSTANTS.RESOLUTIONS, 'option-btn')}
                ${this.createSortSection('Aspect Ratio', SKIN_CONSTANTS.ASPECT_RATIOS, 'option-btn')}
                ${this.createSortSection('Game modes', SKIN_CONSTANTS.GAME_MODES, 'option-btn')}
                <div class="filter-section">
                    <span class="filter-label">Contest</span>
                    <select id="contest-dropdown">
                        <option value="">Select Contest</option>
                        ${skinState.contests.map(([contestName, contestLink]) => {
                            return `
                                <option value="${contestLink}">${contestName}</option>
                            `;
                        }).join('')}
                    </select>
                </div>
                <div class="filter-section">
                    <button id="filter-button">Filter</button>
                </div>
            </div>
        `;
    }

    createSortSection(label, options, divClass) {
        const optionsHtml = options.map(option => `
            <div class="${divClass}" data-value="${option}">${this.capitalizeFirstLetter(option)}</div>
        `).join('');

        return `
            <div class="filter-section" data-filter-type="${label.toLowerCase()}">
                <span class="filter-label">${label}</span>
                <div class="filter-options">
                    ${optionsHtml}
                </div>
            </div>
        `;
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}