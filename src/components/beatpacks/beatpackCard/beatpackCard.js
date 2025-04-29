export default class BeatPackCard {
    constructor(beatpack) {
        this.beatpack = beatpack;
        this.container = document.createElement('div');
        this.container.classList.add('beatmap-pack');
        this.render();
    }

    render() {
        this.container.innerHTML = `
              <div class="beatmap-pack-header" data-beatpackId="${this.beatpack.id}">
                <div class="beatmap-pack-name">${this.beatpack.name}</div>
                <div class="beatmap-pack-details">
                  <span id="beatpack-date">${this.beatpack.date}</span>
                  <span> by </span>
                  <span id="beatpack-author">${this.beatpack.author}</span>
                </div>
                <button class="beatpack-dropdown-btn" data-action="listBeatmaps">
                  <span class="arrow"></span>
                </button>
                <button class="beatpack-add-to-save" data-action="addToBookmarks">
                  <img src="assets/icon_images/beatmap_page/icons8-bookmark-512.png">
                </button>
                <button class="download-beatpack" data-action="downloadBeatpack">Download</button>
              </div>
              <div class="beatmap-pack-content">
                <ul class="beatmap-list">
                  <!-- Beatmap list items will be dynamically added here -->
                </ul>
              </div>
        `;
    }

    getElement() {
        return this.container;
    }
}