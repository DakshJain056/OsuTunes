import {bookmarkModule} from "../../../modules/bookmarks/bookmarks.js";
import {popupManager} from "../../ui/popup.js";
import {skinState} from "../../../modules/skins/state.js";
import {displaySkin} from "../../../modules/skins/skinPage.js";

export const skinCardEventHandler = {
    async handleAddToBookmarks(event) {
        const element = event.target.closest('.skin-add-to-save');
        if (!element) return;

        const skinElement = event.target.closest('.skin-item');
        if (!skinElement) return;

        const skin_id = skinElement.dataset.skinId;

        try {
            const skin = skinState.skins.find(b => b.forum_thread_id === parseInt(skin_id));
            if (!skin) return;

            bookmarkModule.saveAnimation();
            await bookmarkModule.addToBookmark('skins', skin, skin_id);
        } catch (error) {
            console.error('Failed to add skin to saves:', error);
            popupManager.showError(() => this.handleAddToBookmarks(event));
        }
    },

    async handleSkinClick(event) {
        const element = event.target.closest('.skin-add-to-save');
        if (element) return;

        const skinElement = event.target.closest('.skin-item');
        if (!skinElement) return;

        event.stopPropagation();

        const skin_id = skinElement.dataset.skinId;
        const currentView = skinState.currentView;
        const previousView = skinState.previousView;
        try {
            await displaySkin(skin_id);
        } catch (e) {
            console.error('Failed to open skin:', e);
            skinState.currentView = currentView;
            skinState.previousView = previousView;
            popupManager.showError(() => this.handleSkinClick(event));
        }
    },

    async handleLightboxClick(event) {
        const element = event.target.closest('.gallery-item');
        if (!element) return;

        const imageSrc = element.dataset.screenshot;

        const lightboxHTML = `
            <div class="lightbox-content">
                <img src="${imageSrc}">
                <button class="lightbox-close" onclick="this.closest('.lightbox').remove()">
                    <img src="assets/icon_images/download_page/cross.png">
                </button>
            </div>
        `;

        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = lightboxHTML;

        lightbox.onclick = (e) => {
            if (e.target === lightbox) lightbox.remove();
        };

        document.body.appendChild(lightbox);
    }
}