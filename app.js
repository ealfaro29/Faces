// app.js - Principal Application Logic (Secured)

import { initializeAllData } from './data-loader.js';
import { renderFacebasesGallery, populateFacebaseFilter } from './tabs/facebases.js';
import { renderAvatarGallery, populateAvatarFilter } from './tabs/avatar.js';
import { renderTextureGallery, populateTextureFilter, groupTextureVariants } from './tabs/textures.js';
import { renderMusicCodes, populateMusicCategoryFilter } from './tabs/music.js';
import { renderFavoritesGallery } from './tabs/favorites.js';
import { setupPhotosModal } from './modals/photos.js';
import { initializeTimeConverter, setupModal } from './modals/time-converter.js';
import { setupAccessibleModal, enhanceKeyboardNavigation, updateTabStates } from './utils/accessibility.js';
import { initSkeletonLoaders } from './utils/skeleton-loader.js';
import store from './core/store.js';
import './core/favorites.js';
import { debounce, groupFacebaseVariants, createFilterFunction } from './core/search.js';
import './ui/toast.js';
import { registerHandler, setupEventDelegation, handleCopyButton, handleVariantButton, handleCardClick } from './ui/event-handlers.js';
import { auth, googleProvider } from './core/firebase.js';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { runAutoHealer } from './core/auto-healer.js';
import { initAdminPanel } from './admin/admin-modal.js';
import { initDeleteHandler } from './admin/admin-delete.js';

const renderers = {
    renderFacebasesGallery,
    renderAvatarGallery,
    renderTextureGallery,
    renderMusicCodes,
    renderFavoritesGallery
};

const filterContent = createFilterFunction(store, renderers);

registerHandler('.copy-btn', handleCopyButton);
registerHandler('.variant-button', handleVariantButton);
registerHandler('.facebase-card', handleCardClick);

function initializeTab(tabName, renderFunction, data, optionalData) {
    const state = store.getState();
    if (state.initializedTabs[tabName]) return;
    renderFunction(data, optionalData);
    store.setState({
        initializedTabs: { ...state.initializedTabs, [tabName]: true }
    });
}

function initializeFacebasesTab() {
    const state = store.getState();
    initializeTab('facebases', renderFacebasesGallery, state.allFacebaseGroups, state.facebaseCategories);
}

function initializeAvatarTab() {
    const state = store.getState();
    initializeTab('avatar', renderAvatarGallery, state.allAvatarItems);
}

function initializeTexturesTab() {
    const state = store.getState();
    initializeTab('textures', renderTextureGallery, state.allTextureGroups);
}

function initializeMusicTab() {
    const state = store.getState();
    initializeTab('music', renderMusicCodes, state.allMusicCodes);
}

function initializeFavoritesTab() {
    const state = store.getState();
    initializeTab('favorites', renderFavoritesGallery, [], state.facebaseCategories);
}

// Main App Initialization (Triggered ONLY after Auth)
const startApp = async () => {
    try {
        const data = await initializeAllData();

        const allTextureGroups = groupTextureVariants(data.allTextureItems);
        const allFacebaseGroups = groupFacebaseVariants(data.allFacebaseItems);

        store.setState({
            allFacebaseItems: data.allFacebaseItems,
            facebaseCategories: data.facebaseCategories,
            allAvatarItems: data.allAvatarItems,
            allTextureBasenames: data.allTextureBasenames,
            allMusicCodes: data.allMusicCodes,
            allTextureItems: data.allTextureItems,
            allTextureGroups,
            allFacebaseGroups,
            globalDataLoaded: true
        });

        const appContainer = document.getElementById('app-container');
        if (appContainer) appContainer.classList.add('loaded');

        populateFacebaseFilter(data.facebaseCategories);
        populateAvatarFilter(data.allAvatarItems);
        populateTextureFilter(allTextureGroups);
        populateMusicCategoryFilter(data.allMusicCodes);
        initializeTimeConverter();
        setupPhotosModal();

        initializeFacebasesTab();
        initializeAvatarTab();
        initializeTexturesTab();
        initializeMusicTab();
        initializeFavoritesTab();

        filterContent();
        initSkeletonLoaders();

    } catch (error) {
        console.error("APP_FLOW: Critical Error:", error);
    }
};

// --- MAIN ENTRY POINT (SECURE) ---
document.addEventListener('DOMContentLoaded', () => {
    const loginOverlay = document.getElementById('loginOverlay');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const searchBar = document.getElementById('search-bar');
    const tabs = document.querySelectorAll('.tab-nav-button[data-tab]');
    const contentAreas = document.querySelectorAll('.tab-content');
    const loginErrorMsg = document.getElementById('login-error-msg');

    let isAppInitialized = false;

    // 1. GOOGLE AUTH GUARD
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            if (loginErrorMsg) loginErrorMsg.textContent = "Connecting to Google...";
            try {
                await signInWithPopup(auth, googleProvider);
            } catch (error) {
                console.error("Login failed:", error);
                if (loginErrorMsg) loginErrorMsg.textContent = "Login failed: " + error.message;
            }
        });
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("✅ ACCESS GRANTED:", user.email);

            // Hide Overlay
            if (loginOverlay) {
                loginOverlay.classList.remove('show');
                setTimeout(() => loginOverlay.classList.add('hidden'), 500);
            }

            // Init App
            if (!isAppInitialized) {
                startApp();
                initAdminPanel();
                initDeleteHandler(); // Enable right-click delete
                isAppInitialized = true;
            }

            // Auto-Healer (Admin Maintenance)
            console.log("🚑 Starting Auto-Healer scan...");
            const healerInterval = setInterval(() => {
                const state = store.getState();
                if (state.globalDataLoaded) {
                    clearInterval(healerInterval);
                    const healingList = [
                        ...state.textures.map(i => ({ ...i, collectionRef: 'textures' })),
                        ...state.facebases.map(i => ({ ...i, collectionRef: 'facebases' })),
                        ...state.avatar.map(i => ({ ...i, collectionRef: 'avatar' }))
                    ];
                    runAutoHealer(healingList);
                }
            }, 2000);

        } else {
            console.log("🔒 LOCKED. Waiting for login...");
            if (loginOverlay) {
                loginOverlay.classList.remove('hidden');
                void loginOverlay.offsetWidth; // force reflow
                loginOverlay.classList.add('show');
            }
            if (loginErrorMsg) loginErrorMsg.textContent = "";
        }
    });

    // 2. STANDARD SETUP
    setupEventDelegation('#tab-content-wrapper');

    if (searchBar) searchBar.addEventListener('input', debounce(filterContent, 300));
    document.getElementById('facebase-category-filter')?.addEventListener('change', filterContent);
    document.getElementById('avatar-category-filter')?.addEventListener('change', filterContent);
    document.getElementById('texture-category-filter')?.addEventListener('change', filterContent);
    document.getElementById('music-category-filter')?.addEventListener('change', filterContent);

    setupAccessibleModal('openTimeConverterBtn', 'closeTimeConverterBtn', 'timeConverterModal');
    setupAccessibleModal('openDriveModalBtn', 'closeDriveModalBtn', 'googleDriveModal');
    setupAccessibleModal('openTicketModalBtn', 'closeTicketModalBtn', 'ticketModal');

    const ticketContainer = document.getElementById('ticket-buttons-container');
    if (ticketContainer) {
        ticketContainer.addEventListener('click', (event) => {
            const copyButton = event.target.closest('.copy-ticket-btn');
            if (!copyButton) return;

            const textToCopy = copyButton.dataset.copyText;
            const originalText = copyButton.innerHTML;
            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    copyButton.innerHTML = '¡Copiado!';
                    copyButton.classList.add('copied');
                    setTimeout(() => {
                        copyButton.innerHTML = originalText;
                        copyButton.classList.remove('copied');
                    }, 1500);
                });
            }
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            contentAreas.forEach(area => area.classList.toggle('hidden', area.id !== `content-${target}`));

            updateSearchUI(target);
            updateTabStates(target);

            const state = store.getState();
            if (state.globalDataLoaded) filterContent();
        });
    });

    enhanceKeyboardNavigation();

    const updateSearchUI = (activeTab) => {
        const facebaseCategoryFilter = document.getElementById('facebase-category-filter');
        const avatarCategoryFilter = document.getElementById('avatar-category-filter');
        const textureCategoryFilter = document.getElementById('texture-category-filter');
        const musicCategoryFilter = document.getElementById('music-category-filter');

        if (searchBar) searchBar.value = '';
        if (facebaseCategoryFilter) facebaseCategoryFilter.style.display = 'none';
        if (avatarCategoryFilter) avatarCategoryFilter.style.display = 'none';
        if (textureCategoryFilter) textureCategoryFilter.style.display = 'none';
        if (musicCategoryFilter) musicCategoryFilter.style.display = 'none';

        if (activeTab === 'facebases') {
            if (searchBar) searchBar.placeholder = 'Search by name...';
            if (facebaseCategoryFilter) facebaseCategoryFilter.style.display = 'block';
        } else if (activeTab === 'avatar') {
            if (searchBar) searchBar.placeholder = 'Search by name or category...';
            if (avatarCategoryFilter) avatarCategoryFilter.style.display = 'block';
        } else if (activeTab === 'textures') {
            if (searchBar) searchBar.placeholder = 'Search by name or category...';
            if (textureCategoryFilter) textureCategoryFilter.style.display = 'block';
        } else if (activeTab === 'music') {
            if (searchBar) searchBar.placeholder = 'Search by artist, title, or marker...';
            if (musicCategoryFilter) musicCategoryFilter.style.display = 'block';
        } else if (activeTab === 'favorites') {
            if (searchBar) searchBar.placeholder = 'Search favorites...';
        } else {
            if (searchBar) searchBar.placeholder = 'Search...';
        }
    };
});