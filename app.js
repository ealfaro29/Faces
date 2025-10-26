// app.js

import { initializeAllData, parseItemName } from './data-loader.js';
import { renderFacebasesGallery, populateFacebaseFilter } from './tabs/facebases.js';
import { renderAvatarGallery, populateAvatarFilter } from './tabs/avatar.js';
import { renderTextureGallery, getTextureIconPath, populateTextureFilter, groupTextureVariants } from './tabs/textures.js';
import { renderMusicCodes, populateMusicCategoryFilter } from './tabs/music.js';
import { renderFavoritesGallery, getFavorites, isFavorite } from './tabs/favorites.js'; // <-- CORREGIDO
import { setupPhotosModal } from './modals/photos.js';
import { initializeTimeConverter, setupModal } from './modals/time-converter.js'; // <-- setupModal importado

// --- Constantes Globales ---
const SECRET_B64 = 'bWFuY2hpdGFz';
const AUTH_KEY = 'isAuthenticated';
const LAST_AUTH_KEY = 'lastAuthTime';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const FAVORITES_KEY = 'fashion_muse_favorites';
const TEXTURES_PATH = 'photos/textures'; // <-- NUEVO: Constante para el path de texturas

// --- Contenedor de Datos y Estado de Inicialización ---
let appData = {
    allFacebaseItems: [],
    facebaseCategories: null,
    allAvatarItems: [],
    allTextureBasenames: [], // NUEVO: Lista de nombres base (strings) de texturas
    allTextureItems: [], // Lista plana de texturas (objetos, para 'favorites')
    allTextureGroups: [], // Lista de grupos de texturas (para 'textures' tab)
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
    // FIX: Solo se llama a filterContent() si la pestaña es 'favorites' para que se actualice la lista.
    // En 'textures', el botón ya se actualizó localmente y no queremos perder la variante seleccionada.
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
        
        // MODIFICACIÓN: Filtrar la lista de GRUPOS (allTextureGroups)
        const filteredItems = appData.allTextureGroups.filter(group => {
            // Se usa el mainVariant del grupo para realizar la búsqueda
            const item = group.mainVariant;
            if (!item) return false;

            const matchesCategory = selectedCategory === 'all' || item.group === selectedCategory;
            // La búsqueda debe coincidir con el baseName (Geneve) o el nombre completo (Geneve Red)
            const matchesSearch = searchTerm === '' ||
                item.group.toLowerCase().includes(searchTerm) ||
                item.baseName.toLowerCase().includes(searchTerm) ||
                item.displayName.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });
        // renderTextureGallery ahora espera una lista de GRUPOS
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
            ...appData.allTextureItems, // Se usa la lista plana de texturas aquí (objetos con ID=codeId)
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
// MODIFICACIÓN CRÍTICA: Usar la lista de GRUPOS (allTextureGroups)
function initializeTexturesTab() { initializeTab('textures', renderTextureGallery, appData.allTextureGroups); }
function initializeMusicTab() { initializeTab('music', renderMusicCodes, appData.allMusicCodes); }
function initializeFavoritesTab() { initializeTab('favorites', renderFavoritesGallery, [], appData.facebaseCategories); }

// --- Lógica de Inicialización Principal ---

const startApp = async () => {
    try {
        // 1. Cargar datos
        const data = await initializeAllData();
        
        // Asignar datos iniciales
        appData.allFacebaseItems = data.allFacebaseItems;
        appData.facebaseCategories = data.facebaseCategories;
        appData.allAvatarItems = data.allAvatarItems;
        appData.allTextureBasenames = data.allTextureBasenames; // <-- RAW STRINGS
        appData.allMusicCodes = data.allMusicCodes;
        
        // 2. Procesar datos de texturas
        // Crear la lista de objetos planos para la pestaña de Favoritos (que usa el formato plano)
        // parseItemName ahora garantiza que el ID de la textura sea el codeId
        appData.allTextureItems = appData.allTextureBasenames.map(basename => 
            parseItemName(basename, TEXTURES_PATH)
        );
        // Agrupar la lista de strings (Basenames) para la pestaña de Texturas
        appData.allTextureGroups = groupTextureVariants(appData.allTextureBasenames); // <-- PASAMOS STRINGS
        
        appData.globalDataLoaded = true;

        const appContainer = document.getElementById('app-container');
        if (appContainer) appContainer.classList.add('loaded');

        // 3. Inicialización de filtros y módulos
        populateFacebaseFilter(appData.facebaseCategories);
        populateAvatarFilter(appData.allAvatarItems);
        // Pasar la lista de grupos para poblar el filtro
        populateTextureFilter(appData.allTextureGroups); 
        populateMusicCategoryFilter(appData.allMusicCodes);
        initializeTimeConverter(); // Solo inicializa la lógica interna de conversión
        setupPhotosModal(); 

        // 4. Inicialización de pestañas (el primer renderizado)
        initializeFacebasesTab();
        initializeAvatarTab();
        initializeTexturesTab(); // Usa la lista agrupada
        initializeMusicTab();
        initializeFavoritesTab();

        // 5. Establecer el estado de búsqueda y filtro inicial (por defecto, Favorites)
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
    
    // CORRECCIÓN CRÍTICA: Usar los IDs correctos que terminan en 'Btn'
    setupModal('openTimeConverterBtn', 'closeTimeConverterBtn', 'timeConverterModal'); 

    // --- NUEVO MODAL ---
    // Conectar el nuevo botón de carga de Drive
    setupModal('openDriveModalBtn', 'closeDriveModalBtn', 'googleDriveModal');
    // --- FIN NUEVO MODAL ---

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

        } else if (activeFqab === 'textures') {
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