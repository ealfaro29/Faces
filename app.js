// app.js

import { initializeAllData, parseItemName } from './data-loader.js';
import { renderFacebasesGallery, populateFacebaseFilter } from './tabs/facebases.js';
import { renderAvatarGallery, populateAvatarFilter } from './tabs/avatar.js';
import { renderTextureGallery, getTextureIconPath, populateTextureFilter, groupTextureVariants } from './tabs/textures.js';
import { renderMusicCodes, populateMusicCategoryFilter } from './tabs/music.js';
import { renderFavoritesGallery, getFavorites, isFavorite } from './tabs/favorites.js';
import { setupPhotosModal } from './modals/photos.js';
import { initializeTimeConverter, setupModal } from './modals/time-converter.js';

// --- Constantes Globales ---
const REQUIRE_LOGIN = true; 
const SECRET_B64 = 'bWFuY2hpdGFz';
const AUTH_KEY = 'isAuthenticated';
const LAST_AUTH_KEY = 'lastAuthTime';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const FAVORITES_KEY = 'fashion_muse_favorites';
const TEXTURES_PATH = 'photos/textures';

// --- Contenedor de Datos y Estado de Inicialización ---
let appData = {
    allFacebaseItems: [],
    allFacebaseGroups: [],
    facebaseCategories: null,
    allAvatarItems: [],
    allTextureBasenames: [],
    allTextureItems: [],
    allTextureGroups: [],
    allMusicCodes: [],
    globalDataLoaded: false,
    initializedTabs: {
        facebases: false, music: false, timeConverter: false, avatar: false, textures: false, favorites: false
    }
};

// --- Funciones Globales (Expuestas a Window para HTML y módulos) ---

window.getFavorites = getFavorites;
window.isFavorite = isFavorite;
window.getTextureIconPath = getTextureIconPath;
window.appData = appData;

// Toggling Favorites Logic
window.toggleFavorite = (passedId, buttonElement) => {
    const currentId = buttonElement.dataset.id;
    const favorites = getFavorites();
    let isNowFavorite = false;
    let idsToToggle = [];

    const variantIdsJSON = buttonElement.dataset.variantIds;

    if (variantIdsJSON) {
        idsToToggle = JSON.parse(variantIdsJSON);
    } else {
        idsToToggle = [currentId];
    }

    if (favorites.has(currentId)) {
        isNowFavorite = false;
        idsToToggle.forEach(vid => favorites.delete(vid));
    } else {
        isNowFavorite = true;
        idsToToggle.forEach(vid => favorites.add(vid));
    }

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));

    if (buttonElement) {
        buttonElement.innerHTML = isNowFavorite ? '❤️' : '🖤';
        buttonElement.classList.toggle('is-favorite', isNowFavorite);
    }

    const activeTab = document.querySelector('.tab-nav-button.active')?.dataset.tab;
    if (activeTab === 'favorites') {
        filterContent();
    }
};

// Toast/Tooltip Logic
window.showFlagToast = (message, event) => {
    const toast = document.getElementById('custom-toast');
    if (!toast) return;
    clearTimeout(window.toastTimeout);
    const x = event.clientX;
    const y = event.clientY;
    toast.style.left = `${x + 15}px`;
    toast.style.top = `${y + 15}px`;
    toast.textContent = message;
    toast.classList.add('show');
};

window.hideFlagToast = () => {
    const toast = document.getElementById('custom-toast');
    if (toast) {
        toast.classList.remove('show');
    }
};

// --- Lógica de Búsqueda y Filtro Central (Compartida entre todos los tabs) ---

const debounce = (func, delay) => {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
};

// --- NUEVA FUNCIÓN PARA AGRUPAR VARIANTES DE FACEBASE ---
const groupFacebaseVariants = (items) => {
    const grouped = {};
    const variantRegex = /^(.*?)( S| X)$/i;

    for (const item of items) {
        let baseDisplayName = item.displayName;
        let variant = 'default';

        const match = item.displayName.match(variantRegex);

        if (match) {
            baseDisplayName = match[1].trim();
            variant = match[2].trim().toUpperCase();
        }

        const key = `${item.group}-${baseDisplayName}`;

        if (!grouped[key]) {
            grouped[key] = {
                group: item.group,
                baseDisplayName: baseDisplayName,
                defaultItem: null,
                variants: {}
            };
        }

        grouped[key].variants[variant] = item;
        if (variant === 'default') {
            grouped[key].defaultItem = item;
        }
    }

    return Object.values(grouped).filter(g => g.defaultItem);
};

const filterContent = () => {
    if (!appData.globalDataLoaded) return;

    const activeTab = document.querySelector('.tab-nav-button.active')?.dataset.tab;
    const searchBar = document.getElementById('search-bar');
    const searchTerm = searchBar?.value.toLowerCase().trim() || '';

    const facebaseCategoryFilter = document.getElementById('facebase-category-filter');
    const avatarCategoryFilter = document.getElementById('avatar-category-filter');
    const textureCategoryFilter = document.getElementById('texture-category-filter');
    const musicCategoryFilter = document.getElementById('music-category-filter');

    if (activeTab === 'facebases') {
        const selectedCategory = facebaseCategoryFilter?.value || 'all';

        const filteredItems = appData.allFacebaseGroups.filter(group => {
            const matchesCategory = selectedCategory === 'all' || group.group === selectedCatergory.toUpperCase();
            const matchesSearch = searchTerm === '' ||
                group.baseDisplayName.toLowerCase().includes(searchTerm) ||
                group.group.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });

        renderFacebasesGallery(filteredItems, appData.facebaseCategories);

    } else if (activeTab === 'avatar') {
        const selectedCategory = avatarCategoryFilter?.value || 'all';
        const filteredItems = appData.allAvatarItems.filter(item => {
            const matchesCategory = selectedCategory === 'all' || item.group === selectedCategory;
            const matchesSearch = searchTerm === '' ||
                item.group.toLowerCase().includes(searchTerm) ||
                item.displayName.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });
        renderAvatarGallery(filteredItems);

    } else if (activeTab === 'textures') {
        const selectedCategory = textureCategoryFilter?.value || 'all';

        const filteredItems = appData.allTextureGroups.filter(group => {
            const item = group.mainVariant;
            if (!item) return false;

            const matchesCategory = selectedCategory === 'all' || item.group === selectedCategory;
            const matchesSearch = searchTerm === '' ||
                item.group.toLowerCase().includes(searchTerm) ||
                item.baseName.toLowerCase().includes(searchTerm) ||
                item.displayName.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });
        renderTextureGallery(filteredItems);

    } else if (activeTab === 'music') {
        const selectedCategory = musicCategoryFilter?.value || 'all';
        const filteredCodes = appData.allMusicCodes.filter(code => {
            const matchesCategory = selectedCategory === 'all' || code.category === selectedCategory;
            const searchCorpus = `${code.title.toLowerCase()} ${code.artist ? code.artist.toLowerCase() : ''} ${(code.markers || []).join(' ')}`;
            return matchesCategory && searchCorpus.includes(searchTerm);
        });
        renderMusicCodes(filteredCodes);

    } else if (activeTab === 'favorites') {
        const favorites = getFavorites();

        const allItems = [
            ...appData.allFacebaseItems.map(item => ({...item, id: item.id || item.codeId, type: 'facebase' })),
            ...appData.allAvatarItems.map(item => ({...item, id: item.id || item.codeId, type: 'avatar' })),
            ...appData.allTextureItems.map(item => ({...item, type: 'texture' })),
            ...appData.allMusicCodes.map(item => ({...item, type: 'music'})),
        ];

        const favoritedItems = allItems.filter(item => {
            const isFav = item.id ? favorites.has(item.id) : false;

            const matchesSearch = searchTerm === '' ||
                (item.displayName?.toLowerCase().includes(searchTerm)) ||
                (item.group?.toLowerCase().includes(searchTerm)) ||
                (item.title?.toLowerCase().includes(searchTerm)) ||
                (item.artist?.toLowerCase().includes(searchTerm));
            return isFav && matchesSearch;
        });

        renderFavoritesGallery(favoritedItems, appData.facebaseCategories);
    }
};

// --- Lógica de Inicialización de Tabs (Solo se ejecuta una vez) ---

function initializeTab(tabName, renderFunction, data, optionalData) {
    if (appData.initializedTabs[tabName]) return;
    renderFunction(data, optionalData);
    appData.initializedTabs[tabName] = true;
}

function initializeFacebasesTab() { initializeTab('facebases', renderFacebasesGallery, appData.allFacebaseGroups, appData.facebaseCategories); }
function initializeAvatarTab() { initializeTab('avatar', renderAvatarGallery, appData.allAvatarItems); }
function initializeTexturesTab() { initializeTab('textures', renderTextureGallery, appData.allTextureGroups); }
function initializeMusicTab() { initializeTab('music', renderMusicCodes, appData.allMusicCodes); }
function initializeFavoritesTab() { initializeTab('favorites', renderFavoritesGallery, [], appData.facebaseCategories); }

// --- Lógica de Inicialización Principal ---

const startApp = async () => {
    try {
        const data = await initializeAllData();

        appData.allFacebaseItems = data.allFacebaseItems;
        appData.facebaseCategories = data.facebaseCategories;
        appData.allAvatarItems = data.allAvatarItems;
        appData.allTextureBasenames = data.allTextureBasenames;
        appData.allMusicCodes = data.allMusicCodes;

        appData.allTextureItems = appData.allTextureBasenames.map(basename =>
            parseItemName(basename, TEXTURES_PATH)
        );
        appData.allTextureGroups = groupTextureVariants(appData.allTextureBasenames);
        appData.allFacebaseGroups = groupFacebaseVariants(appData.allFacebaseItems);

        appData.globalDataLoaded = true;

        const appContainer = document.getElementById('app-container');
        if (appContainer) appContainer.classList.add('loaded');

        populateFacebaseFilter(appData.facebaseCategories);
        populateAvatarFilter(appData.allAvatarItems);
        populateTextureFilter(appData.allTextureGroups);
        populateMusicCategoryFilter(appData.allMusicCodes);
        initializeTimeConverter();
        setupPhotosModal();

        initializeFacebasesTab();
        initializeAvatarTab();
        initializeTexturesTab();
        initializeMusicTab();
        initializeFavoritesTab();

        filterContent();
    } catch (error) {
        console.error("APP_FLOW: Error crítico al iniciar la aplicación:", error);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const loginOverlay = document.getElementById('loginOverlay');
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');
    const appContainer = document.getElementById('app-container');
    const searchBar = document.getElementById('search-bar');
    const tabs = document.querySelectorAll('.tab-nav-button');
    const contentAreas = document.querySelectorAll('.tab-content');

    // --- NUEVA FUNCIÓN HELPER para revertir a default ---
    const revertToDefault = (cardElement) => {
        if (!cardElement) return;

        const defaultSrc = cardElement.dataset.defaultSrc;
        const defaultId = cardElement.dataset.defaultId;
        const defaultCodeId = cardElement.dataset.defaultCodeId || '';

        if (!defaultSrc) return;

        const mainImg = cardElement.querySelector('.facebase-main-img');
        const idInput = cardElement.querySelector('input[readonly]');
        const favButton = cardElement.querySelector('.favorite-btn');

        if (mainImg) mainImg.src = defaultSrc;
        if (idInput) idInput.value = defaultCodeId;

        if (favButton) {
            favButton.dataset.id = defaultId;
            favButton.innerHTML = window.isFavorite(defaultId) ? '❤️' : '🖤';
        }

        cardElement.querySelectorAll('.variant-button').forEach(btn => btn.classList.remove('active-variant'));
    };
    // --- FIN FUNCIÓN HELPER ---

    const tabContentWrapper = document.getElementById('tab-content-wrapper');

    if (tabContentWrapper) {
        tabContentWrapper.addEventListener('click', (event) => {
            const copyButton = event.target.closest('.copy-btn');
            const variantButton = event.target.closest('.variant-button');
            const card = event.target.closest('.facebase-card');

            if (copyButton) {
                const inputToCopy = copyButton.previousElementSibling;

                if (inputToCopy && inputToCopy.tagName === 'INPUT') {
                    const textToCopy = inputToCopy.value;

                    if (textToCopy) {
                        navigator.clipboard.writeText(textToCopy).then(() => {
                            copyButton.classList.add('copied');
                            setTimeout(() => {
                                copyButton.classList.remove('copied');
                            }, 1500);
                        }).catch(err => {
                            console.error('Error al copiar el texto: ', err);
                            alert('No se pudo copiar el ID.');
                        });
                    } else {
                        console.warn('Intento de copiar un valor vacío.');
                    }
                }
            } else if (variantButton) {
                // --- LÓGICA DE VARIANTE (CON TOGGLE) ---
                event.stopPropagation();
                if (!card) return;

                if (variantButton.classList.contains('active-variant')) {
                    revertToDefault(card);
                } else {
                    const mainImg = card.querySelector('.facebase-main-img');
                    const idInput = card.querySelector('input[readonly]');
                    const favButton = card.querySelector('.favorite-btn');

                    const newSrc = variantButton.dataset.src;
                    const newId = variantButton.dataset.id;
                    const newCodeId = variantButton.dataset.codeId || '';

                    if (mainImg) mainImg.src = newSrc;
                    if (idInput) idInput.value = newCodeId;

                    if (favButton) {
                        favButton.dataset.id = newId;
                        favButton.innerHTML = window.isFavorite(newId) ? '❤️' : '🖤';
                    }

                    card.querySelectorAll('.variant-button').forEach(btn => btn.classList.remove('active-variant'));
                    variantButton.classList.add('active-variant');
                }

            } else if (card && !event.target.closest('.favorite-btn') && !event.target.closest('.copy-btn')) {
                // --- REVERTIR AL DEFAULT ---
                revertToDefault(card);
            }
        });
    }

    // --- Autenticación y Cierre ---
    const checkAuthentication = () => {

        // --- INICIO DE LA MODIFICACIÓN (Login Switch) ---
        if (!REQUIRE_LOGIN) {
            console.warn("Autenticación desactivada. Saltando login.");
            if (loginOverlay) loginOverlay.classList.remove('show');
            setTimeout(startApp, 500);
            return;
        }
        // --- FIN DE LA MODIFICACIÓN ---

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

    // Configuración de Event Listeners de Autenticación
    if (loginBtn) {
        loginBtn.addEventListener('click', authenticate);
    }
    if (passwordInput) {
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                authenticate();
            }
        });
    }

    // --- Inicialización de UI y Listeners ---
    if (searchBar) searchBar.addEventListener('input', debounce(filterContent, 300));

    // Añadir listeners a TODOS los filtros
    document.getElementById('facebase-category-filter').addEventListener('change', filterContent);
    document.getElementById('avatar-category-filter').addEventListener('change', filterContent);
    document.getElementById('texture-category-filter').addEventListener('change', filterContent);
    document.getElementById('music-category-filter').addEventListener('change', filterContent);

    // Configuración de Modales
    setupModal('openTimeConverterBtn', 'closeTimeConverterBtn', 'timeConverterModal');
    setupModal('openDriveModalBtn', 'closeDriveModalBtn', 'googleDriveModal');
    setupModal('openTicketModalBtn', 'closeTicketModalBtn', 'ticketModal');

    // Lógica de copiado para Ticket Modal
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
                    console.error('Error al copiar el texto: ', err);
                    alert('No se pudo copiar el texto.');
                });
            }
        });
    }

    // Lógica de Tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            contentAreas.forEach(area => area.classList.toggle('hidden', area.id !== `content-${target}`));

            updateSearchUI(target);

            if (appData.globalDataLoaded) filterContent();
        });
    });

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

        } else if (activeTaqb === 'textures') {
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
    }

    checkAuthentication();
});