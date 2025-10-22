// app.js

import { initializeAllData } from './data-loader.js';
import { renderFacebasesGallery, populateFacebaseFilter } from './tabs/facebases.js';
import { renderAvatarGallery, populateAvatarFilter } from './tabs/avatar.js';
import { renderTextureGallery, getTextureIconPath, populateTextureFilter } from './tabs/textures.js';
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
    
    // Obtener todos los filtros
    const facebaseCategoryFilter = document.getElementById('facebase-category-filter');
    const avatarCategoryFilter = document.getElementById('avatar-category-filter');
    const textureCategoryFilter = document.getElementById('texture-category-filter');
    const musicCategoryFilter = document.getElementById('music-category-filter');

    if (activeTab === 'facebases') {
        const selectedCategory = facebaseCategoryFilter?.value || 'all';
        const filteredItems = appData.allFacebaseItems.filter(item => {
            // Comparamos el .group ("BRAZIL") con el .value ("Brazil") convirtiéndolo
            const matchesCategory = selectedCategory === 'all' || item.group === selectedCategory.toUpperCase();
            const matchesSearch = searchTerm === '' || item.displayName.toLowerCase().includes(searchTerm) || item.group.toLowerCase().includes(searchTerm);
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
        const filteredItems = appData.allTextureItems.filter(item => {
            const matchesCategory = selectedCategory === 'all' || item.group === selectedCategory;
            const matchesSearch = searchTerm === '' ||
                item.group.toLowerCase().includes(searchTerm) ||
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
        populateFacebaseFilter(appData.facebaseCategories);
        populateAvatarFilter(appData.allAvatarItems);
        populateTextureFilter(appData.allTextureItems);
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
    
    // *** INICIO DE LA CORRECCIÓN: Lógica para copiar ID ***
    const tabContentWrapper = document.getElementById('tab-content-wrapper');

    if (tabContentWrapper) {
        tabContentWrapper.addEventListener('click', (event) => {
            // Usamos .closest() para encontrar el botón de copia, incluso si se hizo clic en el SVG
            const copyButton = event.target.closest('.copy-btn');

            if (copyButton) {
                // El input está justo antes que el botón en el HTML
                const inputToCopy = copyButton.previousElementSibling;

                if (inputToCopy && inputToCopy.tagName === 'INPUT') {
                    const textToCopy = inputToCopy.value;

                    if (textToCopy) {
                        navigator.clipboard.writeText(textToCopy).then(() => {
                            // Éxito: añade la clase 'copied' (definida en style.css)
                            copyButton.classList.add('copied');
                            // Quita la clase después de 1.5 segundos
                            setTimeout(() => {
                                copyButton.classList.remove('copied');
                            }, 1500);
                        }).catch(err => {
                            console.error('Error al copiar el texto: ', err);
                            alert('No se pudo copiar el ID.');
                        });
                    } else {
                        // El input está vacío (probablemente un placeholder '…')
                        console.warn('Intento de copiar un valor vacío.');
                    }
                }
            }
        });
    }
    // *** FIN DE LA CORRECCIÓN ***


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

    // Añadir listeners a TODOS los filtros
    document.getElementById('facebase-category-filter').addEventListener('change', filterContent);
    document.getElementById('avatar-category-filter').addEventListener('change', filterContent);
    document.getElementById('texture-category-filter').addEventListener('change', filterContent);
    document.getElementById('music-category-filter').addEventListener('change', filterContent);


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
        // Obtener todos los filtros
        const facebaseCategoryFilter = document.getElementById('facebase-category-filter');
        const avatarCategoryFilter = document.getElementById('avatar-category-filter');
        const textureCategoryFilter = document.getElementById('texture-category-filter');
        const musicCategoryFilter = document.getElementById('music-category-filter');
        
        if (searchBar) searchBar.value = '';

        // Ocultar todos los filtros
        if (facebaseCategoryFilter) facebaseCategoryFilter.style.display = 'none';
        if (avatarCategoryFilter) avatarCategoryFilter.style.display = 'none';
        if (textureCategoryFilter) textureCategoryFilter.style.display = 'none';
        if (musicCategoryFilter) musicCategoryFilter.style.display = 'none';


        // Mostrar el filtro correcto
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
    }
    
    checkAuthentication();
});