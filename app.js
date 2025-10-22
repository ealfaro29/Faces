// app.js

import { initializeAllData } from './data-loader.js';
import { renderFacebasesGallery, populateCountryFilter } from './tabs/facebases.js';
import { renderAvatarGallery } from './tabs/avatar.js';
import { renderTextureGallery, getTextureIconPath } from './tabs/textures.js';
import { renderMusicCodes, populateMusicCategoryFilter } from './tabs/music.js';
import { renderFavoritesGallery, getFavorites, isFavorite } from './tabs/favorites.js'; // <-- CORREGIDO
import { setupPhotosModal } from './modals/photos.js';
import { initializeTimeConverter, setupModal } from './modals/time-converter.js';

// --- Constantes Globales ---
const SECRET_B64 = 'bWFuY2hpdGFz';
const AUTH_KEY = 'isAuthenticated';
const LAST_AUTH_KEY = 'lastAuthTime';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const FAVORITES_KEY = 'fashion_muse_favorites';

// --- Contenedor de Datos y Estado de Inicialización ---
let appData = {
    allFacebaseItems: [],
    facebaseCategories: null,
    allAvatarItems: [],
    allTextureItems: [],
    allMusicCodes: [],
    globalDataLoaded: false,
    initializedTabs: {
        facebases: false, music: false, timeConverter: false, avatar: false, textures: false, favorites: false
    }
};

// --- Funciones Globales (Expuestas a Window para HTML y módulos) ---

// Exponemos las funciones necesarias al ámbito global (window)
window.getFavorites = getFavorites;
window.isFavorite = isFavorite;
window.getTextureIconPath = getTextureIconPath; 
window.appData = appData;

// Toggling Favorites Logic
window.toggleFavorite = (id, buttonElement) => {
    const favorites = getFavorites();
    let isNowFavorite = false;

    if (favorites.has(id)) {
        favorites.delete(id);
    } else {
        favorites.add(id);
        isNowFavorite = true;
    }

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));

    if (buttonElement) {
        buttonElement.innerHTML = isNowFavorite ? '❤️' : '🖤';
        buttonElement.classList.toggle('is-favorite', isNowFavorite);
    }

    const activeTab = document.querySelector('.tab-nav-button.active')?.dataset.tab;
    if (activeTab === 'favorites' || activeTab === 'textures') {
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

const filterContent = () => {
    if (!appData.globalDataLoaded) return;
    
    const activeTab = document.querySelector('.tab-nav-button.active')?.dataset.tab;
    const searchBar = document.getElementById('search-bar');
    const searchTerm = searchBar?.value.toLowerCase().trim() || '';
    const facebaseCountryFilter = document.getElementById('facebase-country-filter');
    const musicCategoryFilter = document.getElementById('music-category-filter');

    if (activeTab === 'facebases') {
        const selectedCountry = facebaseCountryFilter?.value || 'all';
        const filteredItems = appData.allFacebaseItems.filter(item => {
            const matchesCountry = selectedCountry === 'all' || item.group === selectedCountry;
            const matchesSearch = searchTerm === '' || item.displayName.toLowerCase().includes(searchTerm) || item.group.toLowerCase().includes(searchTerm);
            return matchesCountry && matchesSearch;
        });
        renderFacebasesGallery(filteredItems, appData.facebaseCategories);
    } else if (activeTab === 'avatar') {
        const filteredItems = appData.allAvatarItems.filter(item =>
            item.group.toLowerCase().includes(searchTerm) ||
            item.displayName.toLowerCase().includes(searchTerm)
        );
        renderAvatarGallery(filteredItems);
    } else if (activeTab === 'textures') {
        const filteredItems = appData.allTextureItems.filter(item =>
            item.group.toLowerCase().includes(searchTerm) ||
            item.displayName.toLowerCase().includes(searchTerm)
        );
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
            ...appData.allFacebaseItems,
            ...appData.allAvatarItems,
            ...appData.allTextureItems,
            ...appData.allMusicCodes.map(item => ({...item, type: 'music'})),
        ];

        const favoritedItems = allItems.filter(item => {
            const isFav = favorites.has(item.id);
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

function initializeFacebasesTab() { initializeTab('facebases', renderFacebasesGallery, appData.allFacebaseItems, appData.facebaseCategories); }
function initializeAvatarTab() { initializeTab('avatar', renderAvatarGallery, appData.allAvatarItems); }
function initializeTexturesTab() { initializeTab('textures', renderTextureGallery, appData.allTextureItems); }
function initializeMusicTab() { initializeTab('music', renderMusicCodes, appData.allMusicCodes); }
function initializeFavoritesTab() { initializeTab('favorites', renderFavoritesGallery, [], appData.facebaseCategories); }

// --- Lógica de Inicialización Principal ---

const startApp = async () => {
    try {
        // 1. Cargar datos
        const data = await initializeAllData();
        Object.assign(appData, data);
        appData.globalDataLoaded = true;

        const appContainer = document.getElementById('app-container');
        if (appContainer) appContainer.classList.add('loaded');

        // 2. Inicialización de filtros y módulos
        populateCountryFilter(appData.facebaseCategories);
        populateMusicCategoryFilter(appData.allMusicCodes);
        initializeTimeConverter();
        setupPhotosModal(); 

        // 3. Inicialización de pestañas (el primer renderizado)
        initializeFacebasesTab();
        initializeAvatarTab();
        initializeTexturesTab();
        initializeMusicTab();
        initializeFavoritesTab();

        // 4. Establecer el estado de búsqueda y filtro inicial (por defecto, Favorites)
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

    // --- Autenticación y Cierre ---
    const checkAuthentication = () => {
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
        const facebaseCountryFilter = document.getElementById('facebase-country-filter');
        const musicCategoryFilter = document.getElementById('music-category-filter');
        
        if (searchBar) searchBar.value = '';
        if (facebaseCountryFilter) facebaseCountryFilter.style.display = 'none';
        if (musicCategoryFilter) musicCategoryFilter.style.display = 'none';

        if (activeTab === 'facebases') {
            if (searchBar) searchBar.placeholder = 'Search by name...';
            if (facebaseCountryFilter) facebaseCountryFilter.style.display = 'block';
        } else if (activeTab === 'music') {
            if (searchBar) searchBar.placeholder = 'Search by artist, title, or marker...';
            if (musicCategoryFilter) musicCategoryFilter.style.display = 'block';
        } else if (activeTab === 'avatar' || activeTab === 'textures' || activeTab === 'favorites') {
            if (searchBar) searchBar.placeholder = 'Search by name or category...';
        } else {
            if (searchBar) searchBar.placeholder = 'Search...';
        }
    }
    
    checkAuthentication();
});