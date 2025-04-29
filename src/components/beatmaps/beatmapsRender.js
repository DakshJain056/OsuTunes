import BeatmapCard from './beatmapCard/beatmapCard.js';

export function renderBeatmaps(beatmapsets, container) {
    beatmapsets.forEach(beatmap => {
        const card = new BeatmapCard(beatmap);
        container.appendChild(card.getElement());
    });
}
