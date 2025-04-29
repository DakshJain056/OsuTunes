import * as d3 from "d3";
export default class BeatmapCard {
    constructor(beatmap) {
        this.beatmap = beatmap;
        this.container = document.createElement("div");
        this.container.classList.add("beatmap-item");
        this.container.dataset.beatmapId = beatmap.id;
        this.render();
    }

    render() {
        this.container.innerHTML = `
      <div class="beatmap">
        ${this.getPanelHtml()}
        <div class="beatmap-main">
          ${this.getStatsHtml()}
          ${this.getRatingHtml()}
          ${this.getActionButtonsHtml()}
        </div>
      </div>
    `;
    }

    getElement() {
        return this.container;
    }

    getPanelHtml() {
        return `
      <div class="beatmap-panel" style="--cover: url(${this.beatmap.covers.cover});">
        <div class="beatmap-badges">
          ${this.getBadgesHtml()}
        </div>
        <div class="beatmap-info">
          <span id="beatmap-title">${this.beatmap.title}</span>
          <span id="beatmap-artist">by <span>${this.beatmap.artist}</span></span>
          <span id="beatmap-mapper">mapped by <span>${this.beatmap.creator}</span></span>
        </div>
      </div>
    `;
    }

    getBadgesHtml() {
        const statusBadge = this.getStatusBadge(this.beatmap.status);
        const additionalBadges = [
            this.beatmap.storyboard &&
            `<div id="storyboard-badge"><img src="assets/icon_images/beatmap_page/film-regular-24.png"> Storyboard</div>`,
            this.beatmap.video &&
            `<div id="video-badge"><img src="assets/icon_images/beatmap_page/video-regular-24.png"> Video</div>`,
        ]
            .filter(Boolean)
            .join("");

        return statusBadge + additionalBadges;
    }

    getStatusBadge(status) {
        const badges = {
            ranked: '<div id="ranked-badge">RANKED</div>',
            approved: '<div id="ranked-badge">RANKED</div>',
            loved: '<div id="loved-badge">LOVED</div>',
            qualified: '<div id="qualified-badge">QUALIFIED</div>',
            pending: '<div id="pending-badge">PENDING</div>',
            wip: '<div id="wip-badge">WIP</div>',
            graveyard: '<div id="graveyard-badge">GRAVEYARD</div>'
        };
        return badges[status] || "";
    }

    getStatsHtml() {
        const stats = [
            {
                id: "favourite",
                icon: "heart.png",
                value: this.beatmap.favourite_count,
                tooltip: "Favourites",
            },
            {
                id: "play-count",
                icon: 'gameplay-c.png',
                value: this.beatmap.play_count,
                tooltip: "Plays",
            },
            {
                id: "bpm",
                icon: 'bpm_adjust.png',
                value: this.beatmap.bpm,
                tooltip: "BPM",
            },
        ];

        const statsHtml = stats
            .map(
                (stat) => `
          <span id="${stat.id}">
            <img src="assets/icon_images/beatmap_page/${stat.icon}" alt="${stat.tooltip}">
            <span>${stat.value}</span>
            <span class="tooltip">${stat.tooltip}</span>
          </span>
        `
            )
            .join("");

        return `
      <div class="beatmap-stats">
        <div class="stats-container">${statsHtml}</div>
      </div>
    `;
    }

    getRatingHtml() {
        const beatmapsByMode = this.groupBeatmapsByMode();
        const modeContainersHtml = Object.entries(beatmapsByMode)
            .map(([mode, beatmaps]) => this.createModeContainer(mode, beatmaps))
            .join("");

        return `
      <div class="rating-container">
        <div class="mode-container">${modeContainersHtml}</div>
      </div>
    `;
    }

    groupBeatmapsByMode() {
        return this.beatmap.beatmaps.reduce((acc, beatmap) => {
            if (!acc[beatmap.mode]) acc[beatmap.mode] = [];
            acc[beatmap.mode].push(beatmap);
            acc[beatmap.mode].sort((a, b) => a.difficulty_rating - b.difficulty_rating);
            return acc;
        }, {});
    }

    createModeContainer(mode, beatmaps) {
        return `
          <div class="mode">
            <img src="assets/icon_images/game_modes/${mode}.png" alt="${mode}">
            <div>${this.createDifficultyDots(beatmaps)}</div>
          </div>
        `;
    }

    createDifficultyDots(beatmaps) {
        if (beatmaps.length > 12) {
            return `
        <div class="rating-color-dot" style="--bg-color: #FFFFFF;">
          <span class="tooltip">${beatmaps.length} diffs</span>
        </div>
      `;
        }

        return beatmaps
            .map(
                (beatmap) => `
          <div class="rating-color-dot" style="--bg-color: ${this.getDifficultyColor(
                    beatmap.difficulty_rating
                )};">
            <span class="tooltip">${beatmap.difficulty_rating.toFixed(2)}</span>
          </div>
        `
            )
            .join("");
    }

    getDifficultyColor(rating) {
        if (rating < 0.1) return "#AAAAAA";
        if (rating >= 9) return "#000000";

        return d3
            .scaleLinear()
            .domain([0.1, 1.25, 2, 2.5, 3.3, 4.2, 4.9, 5.8, 6.7, 7.7, 9])
            .clamp(true)
            .range([
                "#4290FB",
                "#4FC0FF",
                "#4FFFD5",
                "#7CFF4F",
                "#F6F05C",
                "#FF8068",
                "#FF4E6F",
                "#C645B8",
                "#6563DE",
                "#18158E",
                "#000000",
            ])
            .interpolate(d3.interpolateRgb.gamma(2.2))(rating);
    }

    getActionButtonsHtml() {
        const buttons = [
            {
                action: "downloadBackground",
                src: 'download_img.png',
                tooltip: "Download background",
            },
            {
                action: "downloadBeatmap",
                src: 'download.png',
                tooltip: "Download beatmapset",
            },
            {
                action: "addToBookmarks",
                src: 'icons8-bookmark-512.png',
                tooltip: "Save",
            },
            {
                action: "searchSpotify",
                src: 'spotify-logo-24.png',
                tooltip: "Search Spotify",
            },
            // {
            //     action: "playAudioPreview",
            //     icon: "play-circle-regular-24.png",
            //     tooltip: "Song preview",
            //     dataAttr: `data-audio-url="${this.beatmap.preview_url}"`,
            // },
        ];

        const buttonsHtml = buttons
            .map(
                (btn) => `
                  <button data-action="${btn.action}" ${btn.dataAttr || ""}>
                    <img src="assets/icon_images/beatmap_page/${btn.src}" alt="${btn.tooltip}">
                    <span class="tooltip">${btn.tooltip}</span>
                  </button>
                `
            )
            .join("");

        return `
          <div class="action-buttons">
            <div class="buttons-container">${buttonsHtml}</div>
          </div>
        `;
    }
}