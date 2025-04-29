import SkinCard from "../skinCard/skinCard.js";

export default class SkinContest {
    constructor(winnerSkins, submissionSkins, contestName) {
        this.winnerSkins = winnerSkins;
        this.submissionSkins = submissionSkins;
        this.contestName = contestName;
        this.contentContainer = document.getElementById('contest-container');
    }

    render() {
        this.contentContainer.innerHTML = `
            <h1>${this.contestName}</h1>
            <div class="skin-grid podium">
                ${this.createWinnerSkins(this.winnerSkins)}
            </div>
            <h2>All Submissions (${this.submissionSkins.length})</h2>
            <div class="skin-grid">
                ${this.submissionSkins.map(skin => new SkinCard(skin).getElement().outerHTML).join('')}
            </div>
        `;
    }

    createWinnerSkins(winnerSkins) {
        const places = ['Winner', '2nd Place', '3rd Place'];
        return winnerSkins.map((skin, index) => `
            <div class="winner-section">
                <h3>${places[index]}</h3>
                ${new SkinCard(skin).getElement().outerHTML}
            </div>
        `).join('');
    }
}