// app.js - Aplicación principal refactorizada

import { initializeAllData } from './data-loader.js';
import { renderFacebasesGallery, populateFacebaseFilter } from './tabs/facebases.js';
import { renderAvatarGallery, populateAvatarFilter } from './tabs/avatar.js';
import { renderTextureGallery, getTextureIconPath, populateTextureFilter, groupTextureVariants } from './tabs/textures.js';
import { renderMusicCodes, populateMusicCategoryFilter } from './tabs/music.js';
import { renderFavoritesGallery } from './tabs/favorites.js';
import { setupPhotosModal } from './modals/photos.js';
import { initializeTimeConverter, setupModal } from './modals/time-converter.js';
import { setupAccessibleModal, enhanceKeyboardNavigation, updateTabStates } from './utils/accessibility.js';
import { initSkeletonLoaders } from './utils/skeleton-loader.js';
import store from './core/store.js';
import './core/favorites.js'; // Auto-exports to window
import { debounce, groupFacebaseVariants, createFilterFunction } from './core/search.js';
import './ui/toast.js'; // Auto-exports to window
import { registerHandler, setupEventDelegation, handleCopyButton, handleVariantButton, handleCardClick } from './ui/event-handlers.js';
import { auth, onAuthStateChanged } from './core/firebase.js';
import { runAutoHealer } from './core/auto-healer.js';

// Constantes Globales
const REQUIRE_LOGIN = false;
const SECRET_B64 = 'bWFuY2hpdGFz';
const AUTH_KEY = 'isAuthenticated';
const LAST_AUTH_KEY = 'lastAuthTime';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const TEXTURES_PATH = 'photos/textures';

// Exponemos funciones necesarias a window
window.getTextureIconPath = getTextureIconPath;

// Crear función de filtrado con renderers
const renderers = {
    renderFacebasesGallery,
    renderAvatarGallery,
    renderTextureGallery,
    renderMusicCodes,
    renderFavoritesGallery
};

const filterContent = createFilterFunction(store, renderers);

// Registrar event handlers
registerHandler('.copy-btn', handleCopyButton);
registerHandler('.variant-button', handleVariantButton);
registerHandler('.facebase-card', handleCardClick);

// Funciones de tab
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

// Lógica de inicialización principal
// ... imports
import { initAdminPanel } from './admin/admin-modal.js';

// ... existing code

const startApp = async () => {
    try {
        const data = await initializeAllData();

        // Initialize Admin Panel


        // ... rest of logic

        // const allTextureItems = ... (YA NO ES NECESARIO SI DATA-LOADER LO DEVUELVE)
        // Pero data-loader todavía no lo devuelve explícitamente en el return.
        // Voy a modificar data-loader.js para que devuelva `allTextureItems` en el objeto final.

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

        // Inicializar skeleton loaders para lazy loading
        initSkeletonLoaders();
    } catch (error) {
        console.error("APP_FLOW: Error crítico al iniciar la aplicación:", error);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const loginOverlay = document.getElementById('loginOverlay');
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');
    const searchBar = document.getElementById('search-bar');
    const tabs = document.querySelectorAll('.tab-nav-button[data-tab]');
    const contentAreas = document.querySelectorAll('.tab-content');

    // Setup event delegation
    setupEventDelegation('#tab-content-wrapper');

    // Autenticación
    const checkAuthentication = () => {
        if (!REQUIRE_LOGIN) {
            console.warn("Autenticación desactivada. Saltando login.");
            if (loginOverlay) loginOverlay.classList.remove('show');
            setTimeout(startApp, 500);
            return;
        }

        const isAuthenticated = localStorage.getItem(AUTH_KEY) === 'true';
        const lastAuthTime = localStorage.getItem(LAST_AUTH_KEY);
        const now = Date.now();

        if (isAuthenticated && lastAuthTime && (now - lastAuthTime < THIRTY_DAYS_MS)) {
            if (loginOverlay) loginOverlay.classList.remove('show');
            setTimeout(startApp, 500);
        } else {
            localStorage.removeItem(AUTH_KEY);
            localStorage.removeItem(LAST_AUTH_KEY);
            if (loginOverlay) loginOverlay.classList.add('show');
        }
    };

    const authenticate = () => {
        try {
            if (passwordInput && passwordInput.value === atob(SECRET_B64)) {
                localStorage.setItem(AUTH_KEY, 'true');
                localStorage.setItem(LAST_AUTH_KEY, Date.now());

                if (errorMessage) errorMessage.textContent = '';
                if (loginOverlay) loginOverlay.classList.remove('show');

                startApp();
            } else {
                if (errorMessage) errorMessage.textContent = 'Incorrect password.';
            }
        } catch (e) {
            console.error("Error durante la autenticación:", e);
            if (errorMessage) errorMessage.textContent = 'Authentication error.';
        }
    };

    // Event listeners de autenticación
    if (loginBtn) loginBtn.addEventListener('click', authenticate);
    if (passwordInput) {
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                authenticate();
            }
        });
    }

    // Búsqueda y filtros
    if (searchBar) searchBar.addEventListener('input', debounce(filterContent, 300));
    document.getElementById('facebase-category-filter')?.addEventListener('change', filterContent);
    document.getElementById('avatar-category-filter')?.addEventListener('change', filterContent);
    document.getElementById('texture-category-filter')?.addEventListener('change', filterContent);
    document.getElementById('music-category-filter')?.addEventListener('change', filterContent);

    // Modales con accesibilidad
    setupAccessibleModal('openTimeConverterBtn', 'closeTimeConverterBtn', 'timeConverterModal');
    setupAccessibleModal('openDriveModalBtn', 'closeDriveModalBtn', 'googleDriveModal');
    setupAccessibleModal('openTicketModalBtn', 'closeTicketModalBtn', 'ticketModal');

    // Ticket modal copy logic
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
                }).catch(err => {
                    console.error('Error al copiar el texto:', err);
                    alert('No se pudo copiar el texto.');
                });
            }
        });
    }

    // Tabs navigation
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

    // Keyboard navigation
    enhanceKeyboardNavigation();

    // Update search UI
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

    initAdminPanel();
    checkAuthentication();

    // --- AUTO-HEAL AUTOMATION ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("👤 Admin logged in. Checking for broken links...");
            // Esperar un poco a que los datos carguen si es login inmediato
            const interval = setInterval(() => {
                const state = store.getState();
                if (state.globalDataLoaded) {
                    clearInterval(interval);

                    const healingList = [
                        ...state.textures.map(i => ({ ...i, collectionRef: 'textures' })),
                        ...state.facebases.map(i => ({ ...i, collectionRef: 'facebases' })),
                        ...state.avatar.map(i => ({ ...i, collectionRef: 'avatar' }))
                    ];

                    runAutoHealer(healingList);
                }
            }, 1000);
        }
    });
});