import {pagingModule} from "../../ui/paging.js";
import {skinState} from "../../../modules/skins/state.js";
import {getTotalPages, SkinPage, updateData} from "../../../modules/skins/skinPage.js";

export const filterBarEventHandler = {
    handleFilterClick(event) {
        const filterDiv = event.target.closest('.category-btn, .option-btn');
        if (!filterDiv) return;

        const filterType = getFilterTypeFromClass(filterDiv.className, event);
        const filterValue = filterDiv.getAttribute('data-value');

        if (filterType && filterValue) {
            toggleFilter(filterType, filterValue);
            updateFilterStyle(filterDiv);
        }
    },

    async handleSearch() {
        pagingModule.setInitalpage();
        pagingModule.setTotalPages(getTotalPages());
        await updateData();
    },

    async handleContestChange(event) {
        const selectedContestLink = event.target.value;
        if (selectedContestLink) {
            const selectedContest = skinState.contests.find(([_, link]) => link === selectedContestLink);
            if (selectedContest) {
                await navigateToContest(selectedContest[0], selectedContest[1]);
            }
        }
    }
}

function toggleFilter(filterType, value) {
    if (filterType === 'categories') {
        if (skinState.currentFilter.includedCategories.includes(value)) {
            skinState.currentFilter.includedCategories = skinState.currentFilter.includedCategories.filter(v => v !== value);
            skinState.currentFilter.excludedCategories.push(value);
        } else if (skinState.currentFilter.excludedCategories.includes(value)) {
            skinState.currentFilter.excludedCategories = skinState.currentFilter.excludedCategories.filter(v => v !== value);
        } else {
            skinState.currentFilter.includedCategories.push(value);
        }
    } else {
        const index = skinState.currentFilter[filterType].indexOf(value);
        if (index === -1) {
            skinState.currentFilter[filterType].push(value);
        } else {
            skinState.currentFilter[filterType].splice(index, 1);
        }
    }
}

function updateFilterStyle(filterDiv) {
    const filterType = getFilterTypeFromClass(filterDiv.className, { target: filterDiv });
    const filterValue = filterDiv.getAttribute('data-value');

    if (filterType === 'categories') {
        if (skinState.currentFilter.includedCategories.includes(filterValue)) {
            filterDiv.classList.add('included');
            filterDiv.classList.remove('excluded');
        } else if (skinState.currentFilter.excludedCategories.includes(filterValue)) {
            filterDiv.classList.add('excluded');
            filterDiv.classList.remove('included');
        } else {
            filterDiv.classList.remove('included', 'excluded');
        }
    } else {
        if (skinState.currentFilter[filterType].includes(filterValue)) {
            filterDiv.classList.add('included');
            filterDiv.classList.remove('excluded');
        } else {
            filterDiv.classList.remove('included', 'excluded');
        }
    }
}

function getFilterTypeFromClass(className, event) {
    if (className.includes('category-btn')) return 'categories';
    if (className.includes('option-btn')) {
        const filterSection = event.target.closest('.filter-section');
        if (filterSection) {
            const filterType = filterSection.getAttribute('data-filter-type');
            switch (filterType) {
                case 'resolution':
                    return 'resolution';
                case 'aspect ratio':
                    return 'aspectRatio';
                case 'game modes':
                    return 'gameModes';
            }
        }
    }
    return null;
}

async function navigateToContest(contestName, contestLink) {
    skinState.currentView = 'contest';
    skinState.currentPage = pagingModule.currentPage;
    skinState.currentContest = [contestName, contestLink];
    await SkinPage.render();
}
