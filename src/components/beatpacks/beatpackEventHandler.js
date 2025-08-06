import {typeBarEventHandler} from "./typeBar/typeBarEventHandler.js";
import {loadData} from "../../modules/beatpacks/beatpackPage.js";
import {beatpackCardEventHandler} from "./beatpackCard/beatpackCardEventHandler.js";

export function addEventListener() {
    const contentContainer = document.getElementById('data-container');
    window.addEventListener("resize",handleScroll);

    const typeBar = document.querySelector('.type-bar');
    typeBar.addEventListener('click', typeBarEventHandler.handleTypeClick);
    contentContainer.addEventListener('click', beatpackCardEventHandler.handleActionButtonClick);
}

export function removeEventListener() {
    const typeBar = document.querySelector('.type-bar');
    const contentContainer = document.getElementById('data-container');
    window.removeEventListener("resize",handleScroll);

    typeBar.removeEventListener('click', typeBarEventHandler.handleTypeClick);
    contentContainer.removeEventListener('click', beatpackCardEventHandler.handleActionButtonClick);
}

export async function handlePageChange(newPage) {
    beatpackState.currentPage = newPage;
    await loadData();
}

export function handleScroll() {
    const contentContainer = document.getElementById('data-container');
    const height = document.querySelector('.content-container').clientHeight - document.getElementById('type-container').clientHeight - 60;
    contentContainer.style.height = `${height}px`;
}
