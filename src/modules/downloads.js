//download.js
import {pagingModule} from "../components/ui/paging.js";
import {popupManager} from "../components/ui/popup.js";
import {mainState} from "./main/state.js";

const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

export const downloadModule = {
    downloadIcon: document.querySelector('.download-icon'),
    contentContainer: null,
    downloadQueue: [],
    itemsPerPage: 50,
    activeDownloads: new Map(),
    downloadProgress: new Map(),
    maxConcurrentDownloads: 3,

    async initDownloadTab() {
        this.renderDownloadTab();
        await this.loadDownloads(1);
        this.addEventListeners();
        this.setupProgressListener();
        await pagingModule.init('pagination-container', this.handlePageChange.bind(this), 1);
    },

    cleanup() {
        this.downloadQueue = [];
        this.activeDownloads.clear();
        this.downloadProgress.clear();
        this.contentContainer = null;
        this.removeEventListener();
        pagingModule.cleanup();

        return 0;
    },

    handlePageChange(page) {
        this.loadDownloads(page);
    },

    async addToQueue(itemType, itemID, sourceUrl, destination) {
        try {
            await mainState.db.execute(
                "INSERT INTO downloads (type, source_url, destination, status) VALUES ($1, $2, $3, 'queued')",
                [itemType, sourceUrl, destination],
            );

            const id = (await mainState.db.select("SELECT MAX(id) FROM downloads"))[0]['MAX(id)'];
            const queueItem = { itemType, itemID, id, sourceUrl, destination };
            this.downloadQueue.push(queueItem);

            this.downloadProgress.set(id, { progress: 0, total: 100 });

            // Update UI immediately if download page is open
            if (document.getElementById('download-container')) {
                await this.loadDownloads(pagingModule.getCurrentPage());
                // Update individual item if it's visible
                this.updateQueuedItemUI(id);
            }

            await this.processQueue();
        } catch(error) {
            console.error(error);
            popupManager.showError(() => downloadModule.addToQueue(itemType, itemID, sourceUrl, destination));
        }
    },

    updateQueuedItemUI(id) {
        const downloadItem = document.querySelector(`.download-item[data-id="${id}"]`);
        if (downloadItem) {
            const downloadProgress = downloadItem.querySelector('.download-progress');
            downloadProgress.innerHTML = `
                <div class="download-status status-queued">
                    <img src="assets/icon_images/download_page/queued.png">
                </div>
            `;
        }
    },

    updateDownloadStartUI(id) {
        const downloadItem = document.querySelector(`.download-item[data-id="${id}"]`);
        if (downloadItem) {
            const downloadProgress = downloadItem.querySelector('.download-progress');
            downloadProgress.innerHTML = `
                <div class="progressContainer">
                    <div class="progressWrapper">
                        <svg class="progressSvg" width="30" height="30">
                            <circle class="progressCircle" cx="15" cy="15" r="12"></circle>
                        </svg>
                        <div class="percentageText">0%</div>
                    </div>
                </div>
            `;
        }
    },

    async processQueue() {
        while (this.downloadQueue.length > 0 && this.activeDownloads.size < this.maxConcurrentDownloads) {
            const downloadItem = this.downloadQueue.shift();
            this.activeDownloads.set(downloadItem.id, downloadItem);

            // Update UI to show item is no longer queued
            if (document.getElementById('download-container')) {
                await this.loadDownloads(pagingModule.getCurrentPage());
                this.updateDownloadStartUI(downloadItem.id);
            }

            // Start the download and handle completion/errors
            this.startDownload(downloadItem)
                .then(() => {
                    // Ensure the queue continues processing after a download completes
                    this.processQueue();
                })
                .catch((error) => {
                    console.error('Download failed:', error);
                    // Ensure the queue continues processing even if a download fails
                    this.processQueue();
                });
        }
    },

    async startDownload(downloadItem) {
        const { itemType, itemID, id, sourceUrl, destination } = downloadItem;
        console.log(`Starting download for item ${id}:`, itemType, itemID, sourceUrl, destination);

        try {
            await this.updateHistory(id, 'downloading');

            try {
                switch(itemType) {
                    case 'beatmapsets':
                        await invoke('download_beatmap', {
                            beatmapId: itemID,
                            downloadPath: destination,
                            downloadId: id
                        });
                        break;
                    case 'background':
                        await invoke('download_background_image', {
                            beatmapId: itemID,
                            downloadPath: destination,
                            downloadId: id
                        });
                        break;
                    case 'beatmappacks':
                        await invoke('download_beatmappack', {
                            link: sourceUrl,
                            downloadPath: destination,
                            downloadId: id
                        });
                        break;
                }

                await this.updateHistory(id, 'successful');
                if (document.getElementById('download-container')) {
                    await this.loadDownloads(pagingModule.getCurrentPage());
                    this.updateDownloadStatus(id, 'successful');
                }
            } catch (error) {
                console.error('Download error:', error);
                await this.updateHistory(id, 'failed');
                if (document.getElementById('download-container')) {
                    await this.loadDownloads(pagingModule.getCurrentPage());
                    this.updateDownloadStatus(id, 'failed');
                }

                if(error === '500') {
                    popupManager.showServerError();
                } else {
                    popupManager.showError();
                }
                throw error; // Re-throw the error to ensure it's caught by the caller
            } finally {
                this.activeDownloads.delete(id);
                this.downloadProgress.delete(id);
            }
        } catch (error) {
            console.error('Download failed:', error);
            this.activeDownloads.delete(id);
            this.downloadProgress.delete(id);

            await this.updateHistory(id, 'failed');
            if (document.getElementById('download-container')) {
                await this.loadDownloads(pagingModule.getCurrentPage());
                this.updateDownloadStatus(id, 'failed');
            }
            throw error; // Re-throw the error to ensure it's caught by the caller
        }
    },

    updateDownloadStatus(id, status) {
        if(document.getElementById('download-container')) {
            const downloadItem = document.querySelector(`.download-item[data-id="${id}"]`);
            if (downloadItem) {
                const downloadProgress = downloadItem.querySelector('.download-progress');
                downloadProgress.innerHTML = `
                    <div class="download-status status-${status}">
                        <img src="assets/icon_images/download_page/${status}.png">
                    </div>
                `;
            }
        }
    },

    setupProgressListener() {
        listen('download-progress', (event) => {
            const { id, progress, total } = event.payload;

            // Store progress in our tracking Map
            this.downloadProgress.set(id, { progress, total });

            // Update UI for this specific download
            this.updateDownloadProgress(id, progress, total);
        });
    },

    updateDownloadProgress(id, progress, total) {
        const downloadItem = document.querySelector(`.download-item[data-id="${id}"]`);
        if (downloadItem) {
            const progressCircle = downloadItem.querySelector(".progressCircle");
            const percentageText = downloadItem.querySelector(".percentageText");

            if (progressCircle && percentageText) {
                const percentage = (progress / total) * 100;
                const radius = progressCircle.r.baseVal.value;
                const circumference = 2 * Math.PI * radius;

                // Update the circle progress
                progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
                progressCircle.style.strokeDashoffset = circumference - (percentage / 100) * circumference;

                // Update the percentage text
                percentageText.textContent = `${Math.round(percentage)}%`;
            }
        }
    },

    downloadAnimation() {
        this.downloadIcon.style.visibility = 'visible';
        this.downloadIcon.style.opacity = '1';
        this.downloadIcon.classList.add('animate');

        // After the animation ends, hide the icon
        this.downloadIcon.addEventListener('transitionend', () => {
            this.downloadIcon.style.opacity = '0';
            this.downloadIcon.style.visibility = 'hidden';
            this.downloadIcon.classList.remove('animate');
        }, { once: true });
    },

    async updateHistory(id, status) {
        try {
            await mainState.db.execute(
                "UPDATE downloads SET status = $2 WHERE id = $1",
                [id, status],
            );
        } catch(error) {
            console.error(error);
            popupManager.showError(() => downloadModule.updateHistory(id, status));
        }
    },

    async addToHistory(itemType, sourceUrl, destination, status) {
        try {
            await mainState.db.execute(
                "INSERT INTO downloads (type, source_url, destination, status) VALUES ($1, $2, $3, $4)",
                [itemType, sourceUrl, destination, status],
            );
        } catch(error) {
            console.error(error);
            popupManager.showError(() => downloadModule.addToHistory(itemType, sourceUrl, destination, status));
        }
    },

    renderDownloadTab() {
        const container = document.querySelector('.content-container');
        container.innerHTML = ''; //Clear existing content
        container.innerHTML = `
            <div id="download-container"></div>
            <div id="pagination-container"></div>
        `;

        this.contentContainer = document.getElementById('download-container');
        const height = document.querySelector('.content-container').clientHeight - 60;
        this.contentContainer.style.height = `${height}px`;
        this.contentContainer.innerHTML = `
            <div class="download-tab">
                <div class="download-filters">
                    <select id="type-filter">
                        <option value="all">All Types</option>
                        <option value="background">Background</option>
                        <option value="beatmapsets">Beatmap</option>
                        <option value="beatmappacks">Beatpack</option>
                    </select>
                    <select id="status-filter">
                        <option value="all">All Status</option>
                        <option value="successful">Successful</option>
                        <option value="failed">Failed</option>
                    </select>
                    <select id="sort-order">
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                </div>
                <div class="download-list" id="download-list"></div>
            </div>
        `;
    },

    addEventListeners() {
        window.addEventListener("resize", () => {
            const height = document.querySelector('.content-container').clientHeight - 60;
            this.contentContainer.style.height = `${height}px`;
        });
        document.getElementById('type-filter').addEventListener('change', () => this.resetAndLoadDownloads());
        document.getElementById('status-filter').addEventListener('change', () => this.resetAndLoadDownloads());
        document.getElementById('sort-order').addEventListener('change', () => this.resetAndLoadDownloads());
    },

    removeEventListener() {
        window.removeEventListener("resize", () => {
            const height = document.querySelector('.content-container').clientHeight - 60;
            this.contentContainer.style.height = `${height}px`;
        });
        document.getElementById('type-filter').removeEventListener('change', () => this.resetAndLoadDownloads());
        document.getElementById('status-filter').removeEventListener('change', () => this.resetAndLoadDownloads());
        document.getElementById('sort-order').removeEventListener('change', () => this.resetAndLoadDownloads());
    },

    resetAndLoadDownloads() {
        pagingModule.setInitalpage();
        this.loadDownloads(1);
    },

    async loadDownloads(page) {
        try {
            const options = {
                item_type: document.getElementById('type-filter').value,
                status: document.getElementById('status-filter').value,
                sort_order: document.getElementById('sort-order').value,
                page: page,
                items_per_page: this.itemsPerPage
            };
            const response = await this.getFilteredItems(options);
            console.log(response);
            this.renderDownloads(response.items);
            pagingModule.setTotalPages(Math.ceil(response.total_items / this.itemsPerPage));
        } catch (error) {
            console.error('Failed to load downloads:', error);
            popupManager.showError(() => downloadModule.loadDownloads(page));
        }
    },

    renderDownloads(downloads) {
        const downloadList = document.getElementById('download-list');
        downloadList.innerHTML = '';
        downloads.forEach(item => {
            const isQueued = this.downloadQueue.some(queueItem => queueItem.id === item.id);
            const isDownloading = this.activeDownloads.has(item.id);
            const progress = this.downloadProgress.get(item.id);

            const downloadItem = document.createElement('div');
            downloadItem.className = 'download-item';
            downloadItem.dataset.id = item.id;

            let progressHTML;
            if (isQueued) {
                progressHTML = `
                    <div class="download-status status-queued">
                        <img src="assets/icon_images/download_page/queued.png">
                    </div>
                `;
            } else if (isDownloading && progress) {
                const percentage = (progress.progress / progress.total) * 100;
                const radius = 12;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference - (percentage / 100) * circumference;

                progressHTML = `
                    <div class="progressContainer">
                        <div class="progressWrapper">
                            <svg class="progressSvg" width="30" height="30">
                                <circle class="progressCircle" cx="15" cy="15" r="12" 
                                    style="stroke-dasharray: ${circumference} ${circumference}; 
                                           stroke-dashoffset: ${offset};">
                                </circle>
                            </svg>
                            <div class="percentageText">${Math.round(percentage)}%</div>
                        </div>
                    </div>
                `;
            } else {
                progressHTML = `
                    <div class="download-status status-${item.status}">
                        <img src="assets/icon_images/download_page/${item.status}.png">
                    </div>
                `;
            }

            downloadItem.innerHTML = `
                <div class="download-info">
                    <div class="download-title">${this.getTitle(item)}</div>
                    <div class="download-details">${new Date(item.timestamp).toLocaleString()}</div>
                </div>
                <div class="download-progress">
                    ${progressHTML}
                </div>
                <div class="download-type download-type-${item.item_type}">
                    <img src="assets/icon_images/navbar/${item.item_type}.png">
                </div>
            `;
            downloadList.appendChild(downloadItem);
        });
    },

    getTitle(item) {
        // Extract the file name from the destination path
        const fileName = item.destination.split('\\').pop();
        return fileName || 'Unknown';
    },

    async getFilteredItems(options) {
        const {
            item_type = null,
            status = null,
            sort_order = 'DESC',
            page = 1,
            items_per_page = 10
        } = options;

        // Build the base query
        let query = `
            SELECT id, type, source_url, destination, status, timestamp 
            FROM downloads 
            WHERE 1=1
        `;

        // Initialize parameters array
        const params = [];

        // Add type filter
        if (item_type && item_type !== 'all') {
            query += ' AND type = ?';
            params.push(item_type);
        }

        // Add status filter
        if (status && status !== 'all') {
            query += ' AND status = ?';
            params.push(status);
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

        // Format the timestamps
        const formattedItems = items.map(item => ({
            ...item,
            item_type: item.type, // Rename 'type' to 'item_type' to match Rust struct
            timestamp: new Date(item.timestamp)
        }));

        return {
            items: formattedItems,
            total_items: totalItems
        };
    }
};