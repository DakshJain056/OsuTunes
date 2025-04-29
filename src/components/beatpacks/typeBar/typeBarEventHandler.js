import {beatpackState} from "../../../modules/beatpacks/state.js";
import {pagingModule} from "../../ui/paging.js";
import {getTotalPages, loadData} from "../../../modules/beatpacks/beatpackPage.js";

export const typeBarEventHandler = {
    handleTypeClick(event) {
        const element = event.target.closest('.type-option');
        if (!element) return;

        document.querySelectorAll('.type-option').forEach(el => el.classList.remove('active'));
        element.classList.add('active');

        beatpackState.currentType = element.dataset.type;
        updateData().then(() => {console.log("done updating the beatpack data")});
    }
}

async function updateData() {
    document.getElementById('data-container').innerHTML = '';
    beatpackState.currentPage = 1;
    pagingModule.setInitalpage();
    const totalPages = await getTotalPages();
    pagingModule.setTotalPages(totalPages);
    loadData().then(() => {console.log("beatpack list loaded")});
}

