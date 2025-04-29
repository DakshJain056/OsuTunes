import {BEATPACK_CONSTANTS} from "../../../modules/beatpacks/constants.js";
import {beatpackState} from "../../../modules/beatpacks/state.js";

export default class TypeBar {
    constructor() {
        this.container = document.getElementById('type-container');
    }

    render() {
        this.container.innerHTML = this.createTypeBar();
        document.querySelector(`.type-option[data-type=${beatpackState.currentType}]`).classList.add('active');
    }

    createTypeBar() {
        return `
            <div class="type-bar">
                <div class="type-label">List By</div>
                ${BEATPACK_CONSTANTS.TYPE.map(category => {
                    return `
                        <div class="type-option" data-type="${category.replace(' ', '-')}">
                            ${category}
                        </div>
                    `
                }).join('')}
            </div>
        `;
    }
}