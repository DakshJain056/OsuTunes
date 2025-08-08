//mainPage.js
import { popupManager } from '../../components/ui/popup.js';
import { loadingScreen } from '../../components/ui/loading.js';
import { SettingsPage } from '../settings.js';
import { downloadModule } from '../downloads.js';
import {mainState} from "./state.js";
import {BeatmapPage, loadData as beatmaploadData} from "../beatmaps/beatmapPage.js";
import {BeatpackPage} from "../beatpacks/beatpackPage.js";
import {SkinPage} from "../skins/skinPage.js";
import {Store} from "@tauri-apps/plugin-store";
import {bookmarkModule} from "../bookmarks/bookmarks.js";
import {handleScrollHeight} from "../../components/beatmaps/beatmapEventHandlers.js";
import {handleScroll} from "../../components/beatpacks/beatpackEventHandler.js";
import {handleSkinScroll} from "../../components/skins/skinEventHandler.js";
import {beatmapsState} from "../beatmaps/state.js";
import { loadData as skinLoadData } from "../skins/skinPage.js";

const Database = window.__TAURI__.sql;
const { invoke } = window.__TAURI__.core;

const sidebar = document.querySelector(".sidebar");
const closeBtn = document.getElementById("btn");
const navListItems = document.querySelectorAll(".nav-list-item");
const contentContainer = document.querySelector('.content-container');
const downloadBtn = document.getElementById('download-queue-button');
const searchBtn = document.getElementById('search-button');
const searchBar = document.getElementById('search-bar-input');
const bookmarkBtn = document.getElementById('saved-queue-button');
let sectionName = 'beatmap';

async function initializeApplication() {
    mainState.store = await Store.load('settings.dat', { autoSave: false });
    mainState.db = await Database.load('sqlite:history.db');
    await markIncompleteDownloadsFailed();

    await check_login();
}

async function markIncompleteDownloadsFailed() {
    try {
        await mainState.db.execute(
            "UPDATE downloads SET status = 'failed' WHERE status IN ('queued', 'downloading')"
        );
        console.log("Marked incomplete downloads as failed.");
    } catch (error) {
        console.error("Failed to mark incomplete downloads as failed:", error);
    }
}


initializeApplication();

async function switchSection() {
    if (mainState.selectedModule) {
        if (mainState.selectedModule.cleanup()) {
            return;
        }
    }

    const modules = {
        'beatmap': BeatmapPage,
        'beatpack': BeatpackPage,
        'skin': SkinPage,
        'settings': SettingsPage,
        // Uncomment when ready to use
        //'music_player': MusicPlayerModule
    };

    mainState.selectedModule = modules[sectionName];
    if (!mainState.selectedModule) {
        console.warn(`No module found for section: ${sectionName}`);
        return;
    }

    loadingScreen.showLoading();
    await mainState.selectedModule.init();

    searchBar.disabled = modules === 'beatpack' || modules === 'settings';

    updateActiveNavItem(sectionName);
    loadingScreen.hideLoading();
}

function updateActiveNavItem() {
    const navItems = document.querySelectorAll('.nav-list-item');
    navItems.forEach(item => {
        if (item.querySelector('div').id === sectionName) {
            item.classList.add('nav-list-item-active');
        } else {
            item.classList.remove('nav-list-item-active');
        }
    });
}

async function check_login() {
    try {
        const isLoggedIn = await invoke('logged_in');
        if (!isLoggedIn) {
            try {
                await popupManager.showLogin();
            } catch (error) {
                popupManager.showError();
            }
        } else {
            switchSection();
        }
    } catch (error) {
        console.error("Error in check_login:", error);
        popupManager.showError(() => check_login());
    } finally {
        invoke('close_splashscreen');
    }
}

// Event Listeners

    navListItems.forEach((item) => {
        item.addEventListener("click", async function() {
            navListItems.forEach((link) => link.classList.remove("nav-list-item-active"));
            this.classList.add("nav-list-item-active");
            
            sectionName = this.querySelector('div').id;
            switchSection();
        });
    });

    closeBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        setTimeout(() => {
            switch (sectionName) {
                case 'beatmap':
                    handleScrollHeight();
                    break;
                case 'beatpack':
                    handleScroll();
                    break;
                case 'skin':
                    handleSkinScroll();
                    break;
            }
        }, 300);
        menuBtnChange();
    });

    downloadBtn.addEventListener("click", async () => {
        if (mainState.selectedModule) {
            if(await mainState.selectedModule.cleanup()) {
                return;
            }
        }
        contentContainer.innerHTML = '';
        mainState.selectedModule = downloadModule;
        updateActiveNavItem();
        await downloadModule.initDownloadTab();
    });

bookmarkBtn.addEventListener("click", async () => {
    if (mainState.selectedModule) {
        if(await mainState.selectedModule.cleanup()) {
            return;
        }
    }
    contentContainer.innerHTML = '';
    mainState.selectedModule = bookmarkModule;
    updateActiveNavItem();
    await bookmarkModule.initSavedTab();
});

searchBtn.addEventListener("click", async () => {
   if(sectionName === 'beatmap') {
       document.getElementById("data-container").innerHTML = '';
       beatmapsState.beatmaps = [];
       beatmapsState.cursorString = '';
       await beatmaploadData(searchBar.value.replace(/ /g, "%20"));
       console.log("searchBar.value after search:", searchBar.value);
   } else if(sectionName === 'skin') {
       await skinLoadData(1, searchBar.value);
       console.log("searchBar.value after search:", searchBar.value);
   }
});

function menuBtnChange() {
    const sidebar = document.querySelector(".sidebar");
    const closeBtn = document.querySelector("#btn");
    if(sidebar.classList.contains("open")) {
        closeBtn.classList.replace("bx-menu", "bx-menu-alt-right");
    } else {
        closeBtn.classList.replace("bx-menu-alt-right","bx-menu");
    }
}

// Export switchSection for use in other modules
export { switchSection };