import SkinCard from "./skinCard/skinCard.js";

export function renderSkins(skins, contentContainer) {
    skins.forEach(skin => {
        const skinElement = new SkinCard(skin);
        contentContainer.appendChild(skinElement.getElement());
    });
}