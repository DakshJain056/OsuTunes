export function addEventListeners() {
    window.addEventListener("resize", handleMusicPlayerScrollHeight);
}

export function handleMusicPlayerScrollHeight() {
    const contentContainer = document.getElementById('data-container');
    const height = document.querySelector('.content-container').clientHeight - 60;
    contentContainer.style.height = `${height}px`;
}
