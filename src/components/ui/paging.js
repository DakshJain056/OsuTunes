// paging.js
export const pagingModule = {
    currentPage: 1,
    totalPages: 1,
    paginationContainer: null,
    onPageChange: null,
    isInitialized: false,

    async init(containerId, onPageChange, currentPage) {
        this.paginationContainer = document.getElementById(containerId);
        this.onPageChange = onPageChange;
        this.currentPage = currentPage;
        await this.render();
        this.addEventListeners();
        this.isInitialized = true;
    },

    cleanup() {
        this.currentPage = 1;
        this.removeEventListeners();
        this.paginationContainer = null;
        this.onPageChange = null;
        this.isInitialized = false;
    },

    setInitalpage() {
        this.currentPage = 1;
    },

    setTotalPages(total) {
        this.totalPages = Math.max(1, total);
        if (this.isInitialized) {
            this.updatePagination();
        }
    },

    async render() {
        if (!this.paginationContainer) return;

        this.paginationContainer.innerHTML = `
            <nav class="pagination-v2">
                <div class="pagination-v2__col prev">
                    <div class="pagination-v2__link pagination-v2__link--quick">&laquo; PREV</div>
                </div>
                <ul class="pagination-v2__col pagination-v2__col--pages pages"></ul>
                <div class="pagination-v2__col next">
                    <div class="pagination-v2__link pagination-v2__link--quick">NEXT &raquo;</div>
                </div>
            </nav>
        `;
        await this.updatePagination();
    },

    addEventListeners() {
        if (!this.paginationContainer) return;

        const prevButton = this.paginationContainer.querySelector('.prev div');
        const nextButton = this.paginationContainer.querySelector('.next div');

        prevButton.addEventListener('click', this.handlePrevClick.bind(this));
        nextButton.addEventListener('click', this.handleNextClick.bind(this));
    },

    removeEventListeners() {
        if (!this.paginationContainer) return;

        const prevButton = this.paginationContainer.querySelector('.prev div');
        const nextButton = this.paginationContainer.querySelector('.next div');

        prevButton.removeEventListener('click', this.handlePrevClick.bind(this));
        nextButton.removeEventListener('click', this.handleNextClick.bind(this));
    },

    handlePrevClick(e) {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePagination();
            if (this.onPageChange) this.onPageChange(this.currentPage);
        }
    },

    handleNextClick(e) {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePagination();
            if (this.onPageChange) this.onPageChange(this.currentPage);
        }
    },

    async updatePagination() {
        if (!this.paginationContainer) return;

        const paginationNav = this.paginationContainer.querySelector('.pagination-v2');
        if (!paginationNav) {
            await this.render();
            return;
        }

        if (this.totalPages <= 1) {
            paginationNav.style.display = 'none';
            return;
        }

        paginationNav.style.display = 'flex';

        const pagesContainer = this.paginationContainer.querySelector('.pages');
        if (pagesContainer) {
            pagesContainer.innerHTML = '';
            this.renderPageNumbers(pagesContainer);
        }

        const prevButton = this.paginationContainer.querySelector('.prev div');
        const nextButton = this.paginationContainer.querySelector('.next div');
        prevButton.parentElement.classList.toggle('disabled', this.currentPage === 1);
        nextButton.parentElement.classList.toggle('disabled', this.currentPage === this.totalPages);
    },

    renderPageNumbers(pagesContainer) {
        const createPageItem = (page, isActive = false) => {
            const li = document.createElement('li');
            li.className = 'pagination-v2__item';
            if (isActive) {
                li.innerHTML = `<span class="pagination-v2__link pagination-v2__link--active">${page}</span>`;
            } else {
                li.innerHTML = `<div class="pagination-v2__link">${page}</div>`;
                li.querySelector('div').addEventListener('click', (e) => {
                    e.preventDefault();
                    this.currentPage = page;
                    this.updatePagination();
                    console.log(this.currentPage);
                    this.onPageChange(this.currentPage);
                });
            }
            return li;
        };

        const createEllipsisItem = () => {
            const li = document.createElement('li');
            li.className = 'pagination-v2__item';
            li.innerHTML = `<span class="pagination-v2__link">...</span>`;
            return li;
        };

        if (this.currentPage <= 3) {
            for (let i = 1; i <= Math.min(3, this.totalPages); i++) {
                pagesContainer.appendChild(createPageItem(i, i === this.currentPage));
            }
            if (this.totalPages > 3) {
                pagesContainer.appendChild(createEllipsisItem());
                pagesContainer.appendChild(createPageItem(this.totalPages));
            }
        } else if (this.currentPage >= this.totalPages - 2) {
            pagesContainer.appendChild(createPageItem(1));
            pagesContainer.appendChild(createEllipsisItem());
            for (let i = this.totalPages - 2; i <= this.totalPages; i++) {
                pagesContainer.appendChild(createPageItem(i, i === this.currentPage));
            }
        } else {
            pagesContainer.appendChild(createPageItem(1));
            pagesContainer.appendChild(createEllipsisItem());
            for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
                pagesContainer.appendChild(createPageItem(i, i === this.currentPage));
            }
            pagesContainer.appendChild(createEllipsisItem());
            pagesContainer.appendChild(createPageItem(this.totalPages));
        }
    },
    getCurrentPage() {
        return this.currentPage;
    }
};
