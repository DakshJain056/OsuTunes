import {pagingModule} from "../../components/ui/paging.js";
import {popupManager} from "../../components/ui/popup.js";
import {beatmapCardEventHandler} from "../../components/beatmaps/beatmapCard/beatmapCardEventHandler.js";
import {beatpackCardEventHandler} from "../../components/beatpacks/beatpackCard/beatpackCardEventHandler.js";
import {mainState} from "../main/state.js";
import BeatmapCard from "../../components/beatmaps/beatmapCard/beatmapCard.js";
import BeatPackCard from "../../components/beatpacks/beatpackCard/beatpackCard.js";
import SkinCard from "../../components/skins/skinCard/skinCard.js";
import {skinCardEventHandler} from "../../components/skins/skinCard/skinCardEventHandler.js";
import {bookmarkState} from "./state.js";
import {skinState} from "../skins/state.js";

export const bookmarkModule = {
    saveIcon: document.querySelector('.saved-icon'),
    contentContainer: null,
    currentSection: null,
    itemsPerPage: 50,

    async initSavedTab() {
        skinState.currentView = 'bookmark';
        this.currentSection = "beatmapsets";
        this.renderSavedTab();
        this.addEventListeners();
        await pagingModule.init('pagination-container', this.handlePageChange.bind(this), 1);
        await this.loadState();
        await this.loadBookmarks(bookmarkState.currentPage);
    },

    cleanup() {
        this.removeEventListeners();
        bookmarkState.currentPage = 1;
        pagingModule.cleanup();
        this.contentContainer = null;
        return 0;
    },

    handlePageChange(page) {
        this.loadBookmarks(page);
    },

    async addToBookmark(itemType, data, item_id) {
        try {
            console.log(itemType, data);
            await mainState.db.execute(
                "INSERT INTO bookmarks (type, data, item_id) VALUES ($1, $2, $3)",
                [itemType, data, item_id],
            );
        } catch (e) {
            this.handleBookmarkError(e, () => bookmarkModule.addToBookmark(itemType, data));
        }
    },

    handleBookmarkError(error, retryAction) {
        const errorMessage = error.toString();
        if (errorMessage.includes("UNIQUE constraint failed")) {
            popupManager.showBookmarkedAdded();
        } else {
            console.error('Failed to add toBookmark', error);
            popupManager.showError(retryAction);
        }
    },

    saveAnimation() {
        this.saveIcon.style.visibility = 'visible';
        this.saveIcon.style.opacity = '1';
        this.saveIcon.classList.add('animate');

        this.saveIcon.addEventListener('transitionend', () => {
            this.saveIcon.style.opacity = '0';
            this.saveIcon.style.visibility = 'hidden';
            this.saveIcon.classList.remove('animate');
        }, { once: true });
    },

    addEventListeners() {
        window.addEventListener('resize', () => {
            const savedList = document.getElementById('saved-list');
            const height = document.querySelector('.content-container').clientHeight - document.querySelector('.saved-filter-bar').clientHeight - 60;
            savedList.style.height = `${height}px`;
        });
        if (document.getElementById('type-filter') && document.getElementById('sort-order')) {
            document.getElementById('type-filter').addEventListener('change', () => this.resetAndLoadDownloads());
            document.getElementById('sort-order').addEventListener('change', () => this.resetAndLoadDownloads());
        }
        this.contentContainer.addEventListener('click', beatmapCardEventHandler.handleActionButtonClick);
        this.contentContainer.addEventListener('click', beatpackCardEventHandler.handleActionButtonClick);
        this.contentContainer.addEventListener('click', skinCardEventHandler.handleSkinClick);
        this.contentContainer.addEventListener('click', skinCardEventHandler.handleLightboxClick);
        this.contentContainer.addEventListener('click', bookmarkModule.handleDeleteBtn);
    },

    removeEventListeners() {
        window.removeEventListener('resize', () => {
            const savedList = document.getElementById('saved-list');
            const height = document.querySelector('.content-container').clientHeight - document.querySelector('.saved-filter-bar').clientHeight - 60;
            savedList.style.height = `${height}px`;
        });
        if (document.getElementById('type-filter') && document.getElementById('sort-order')) {
            document.getElementById('type-filter').removeEventListener('change', () => this.resetAndLoadDownloads());
            document.getElementById('sort-order').removeEventListener('change', () => this.resetAndLoadDownloads());
        }
        this.contentContainer.removeEventListener('click', beatmapCardEventHandler.handleActionButtonClick);
        this.contentContainer.removeEventListener('click', beatpackCardEventHandler.handleActionButtonClick);
        this.contentContainer.removeEventListener('click', skinCardEventHandler.handleSkinClick);
        this.contentContainer.removeEventListener('click', skinCardEventHandler.handleLightboxClick);
        this.contentContainer.removeEventListener('click', bookmarkModule.handleDeleteBtn);
    },

    async loadBookmarks(page) {
        try {
            const options = {
                item_type: document.getElementById('type-filter').value,
                sort_order: document.getElementById('sort-order').value,
                page: page,
                items_per_page: this.itemsPerPage
            };
            const response = await this.getFilteredItems(options);
            this.renderSaved(response.items);
            pagingModule.setTotalPages(Math.ceil(response.total_items / this.itemsPerPage));
        } catch (error) {
            this.handleBookmarkError(error, () => bookmarkModule.loadBookmarks(page));
        }
    },

    async loadState() {
        try {
            bookmarkState.skins = await mainState.db.select("SELECT id, data FROM bookmarks WHERE type=$1", ['skins']);
        } catch (e) {
            console.error('Failed to load bookmark state:', e);
        }
    },

    renderSavedTab() {
        const container = document.querySelector('.content-container');
        container.innerHTML = `
            <div id="saved-container"></div>
            <div id="pagination-container"></div>
        `;
        this.contentContainer = document.getElementById('saved-container');
        this.contentContainer.innerHTML = `
            <div class="saved-tab">
                <div class="saved-filter-bar">
                    <select id="type-filter">
                        <option value="beatmapsets">Beatmap</option>
                        <option value="skins">Skins</option>
                        <option value="beatmappacks">Beatpack</option>
                    </select>
                    <select id="sort-order">
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                </div>
                <div class="main-content">
                    <div id="saved-list"></div>
                    <div class="spotify-container bookmark-section"></div>
                </div>
            </div>
        `;

        const savedList = document.getElementById('saved-list');
        const height = document.querySelector('.content-container').clientHeight - document.querySelector('.saved-filter-bar').clientHeight - 60;
        savedList.style.height = `${height}px`;
    },

    resetAndLoadDownloads() {
        this.currentSection = document.getElementById('type-filter').value;
        pagingModule.setInitalpage();
        this.loadBookmarks(1);
    },

    renderSaved(savedContent) {
        const savedList = document.getElementById('saved-list');
        savedList.innerHTML = '';
        savedList.className = `saved-list-${this.currentSection}`;

        if (savedContent.length === 0) {
            savedList.innerHTML = this.renderNoResults();
            return;
        }

        savedContent.forEach(item => {
            const card = this.createCardForCurrentSection(item);
            const container = this.createBookmarkContainer(item.id, card);
            savedList.appendChild(container);
        });

        this.addDeleteButtons(savedList);
    },

    renderNoResults() {
        return `
            <div class="no-results">
                <img src="assets/icon_images/nothing_found.jpeg" alt="No results found" class="no-results-image">
                <p>Nothing saved yet!</p>
            </div>
        `;
    },

    createCardForCurrentSection(item) {
        const parsedData = JSON.parse(item.data);
        switch(this.currentSection) {
            case 'beatmapsets': return new BeatmapCard(parsedData).getElement();
            case 'beatmappacks': return new BeatPackCard(parsedData).getElement();
            case 'skins': return new SkinCard(parsedData).getElement();
        }
    },

    createBookmarkContainer(id, cardElement) {
        const container = document.createElement('div');
        container.classList.add('bookmark-item');
        container.dataset.id = id;
        container.appendChild(cardElement);
        return container;
    },

    addDeleteButtons(savedList) {
        const cards = savedList.querySelectorAll('.bookmark-item');
        cards.forEach(card => {
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-button';
            deleteButton.innerHTML = '<img src="assets/icon_images/delete.png" alt="Delete">';
            card.appendChild(deleteButton);
        });
    },

    async handleDeleteBtn(event) {
        const deleteBtn = event.target.closest('.delete-button');
        if (!deleteBtn) return;

        const item = deleteBtn.closest('.bookmark-item');
        if (!item) return;

        const id = item.dataset.id;
        await bookmarkModule.deleteBookmark(id);
    },

    async deleteBookmark(id) {
        try {
            await mainState.db.execute("DELETE FROM bookmarks WHERE id = $1", [id]);

            if (this.currentSection === 'skins') {
                bookmarkState.skins = bookmarkState.skins.filter(item => item.id !== id);
            }

            await this.loadBookmarks(pagingModule.getCurrentPage());
        } catch (error) {
            console.error('Failed to remove item:', error);
            popupManager.showError();
        }
    },

    async getFilteredItems(options) {
        const {
            item_type = null,
            sort_order = 'DESC',
            page = 1,
            items_per_page = 10
        } = options;

        // Build the base query
        let query = `
            SELECT id, data
            FROM bookmarks
            WHERE 1=1
        `;

        // Initialize parameters array
        const params = [];

        if (item_type) {
            query += ' AND type = ?';
            params.push(item_type);
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) as count FROM (${query}) as filtered_items`;
        const countResult = await mainState.db.select(countQuery, params);
        const totalItems = countResult[0].count;

        // Add sorting and pagination
        const sortDirection = sort_order === 'oldest' ? 'ASC' : 'DESC';
        const offset = (page - 1) * items_per_page;

        query += ` ORDER BY timestamp ${sortDirection} LIMIT ? OFFSET ?`;
        params.push(items_per_page, offset);

        // Execute the final query
        const items = await mainState.db.select(query, params);

        return {
            items,
            total_items: totalItems
        };
    }
};