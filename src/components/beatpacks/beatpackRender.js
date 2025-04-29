import BeatPackCard from "./beatpackCard/beatpackCard.js";

export function renderBeatPacks(packs, container) {
    packs.forEach((pack) => {
        const packElement = new BeatPackCard(pack);
        container.appendChild(packElement.getElement());
    });
}