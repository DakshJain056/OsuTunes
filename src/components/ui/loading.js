export const loadingScreen = {
    loadingOverlay: document.querySelector('.loading-overlay'),
    contentContainer: document.querySelector('.content-container'),

    showLoading() {
        this.loadingOverlay.classList.add('active');
        this.contentContainer.classList.add('loading');
    },
    
    hideLoading() {
        this.loadingOverlay.classList.remove('active');
        this.contentContainer.classList.remove('loading');
    }
};