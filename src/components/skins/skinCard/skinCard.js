import {SKIN_CONSTANTS} from "../../../modules/skins/constants.js";

export default class SkinCard {
    constructor(skin) {
        this.skin = skin;
        this.container = document.createElement('div');
        this.container.classList.add('skin-item');
        this.container.dataset.skinId = skin.forum_thread_id;
        this.render();
    }

    render() {
        const gameModesHtml = this.skin.game_modes ? this.skin.game_modes.map(game_mode => {
            return `<img src="assets/icon_images/game_modes/${game_mode}.png">`;
        }).join('') : '';

        this.container.innerHTML = `
            <div class="skin-item-cover">
                <img src="${SKIN_CONSTANTS.SKIN_COMPENDIUM_URL}/${this.skin.forum_thread_id}.webp" alt="${this.skin.skin_name}"/>
                <button class="skin-add-to-save">
                  <img src="assets/icon_images/beatmap_page/icons8-bookmark-512.png">
                </button>
              </div>
              <div class="skin-item-info">
                <div class="skin-info-row">
                  <h3 class="skin-name">${this.skin.skin_name}</h3>
                  <div class="skin-game-modes">
                    ${gameModesHtml}
                  </div>
                </div>
              </div>
        `;
    }

    getElement() {
        return this.container;
    }
}