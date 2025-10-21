document.addEventListener('DOMContentLoaded', () => {
    // Configuraciones y Elementos Iniciales
    const SECRET_B64 = 'bWFuY2hpdGFz';
    const AUTH_KEY = 'isAuthenticated';
    const LAST_AUTH_KEY = 'lastAuthTime';
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const SJO_TZ = 'America/Costa_Rica';

    const loginOverlay = document.getElementById('loginOverlay');
    const passwordInput = document.getElementById('passwordInput');
    const appContainer = document.getElementById('app-container');

    let facebasesTabInitialized = false;
    let musicTabInitialized = false;
    let timeConverterInitialized = false;
    let avatarTabInitialized = false;
    let texturesTabInitialized = false;
    let favoritesTabInitialized = false;

    let allFacebaseItems = [];
    let facebaseCategories = null;
    let allAvatarItems = [];
    let allTextureItems = [];
    let allMusicCodes = [];

    // DECLARACIÓN DE LA BARRA DE BÚSQUEDA Y FILTROS
    const searchBar = document.getElementById('search-bar');
    const facebaseCountryFilter = document.getElementById('facebase-country-filter');
    const musicCategoryFilter = document.getElementById('music-category-filter');

    let globalDataLoaded = false;

    passwordInput.value = '';

    // --- LÓGICA DE FAVORITOS (GLOBAL) ---
    const FAVORITES_KEY = 'fashion_muse_favorites';

    const getFavorites = () => {
        try {
            return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'));
        } catch (e) {
            console.error("Error loading favorites from localStorage", e);
            return new Set();
        }
    };

    const isFavorite = (id) => getFavorites().has(id);

    // Expuesta globalmente para el uso de botones inline en el HTML renderizado
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

    // --- LÓGICA TOAST (NOTIFICACIÓN) MODIFICADA ---
    window.showFlagToast = (message, event) => {
        const toast = document.getElementById('custom-toast');
        if (!toast) return;

        clearTimeout(window.toastTimeout); // Asegurar que usa el mismo timeout si existe

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
    // ------------------------------------
    

    // Generic function to parse item names
    const parseItemName = (basename, pathPrefix) => {
        // basename no incluye la extensión .png

        const name = basename; 
        const lastUnderscore = name.lastIndexOf('_');
        let label = name, codeId = '';
        if (lastUnderscore > -1) { 
            const maybeId = name.slice(lastUnderscore + 1); 
            // Mejoramos la detección de ID para asegurar que sea numérico
            if (!isNaN(maybeId) && maybeId.trim() !== '') { 
                label = name.slice(0, lastUnderscore); 
                codeId = maybeId; 
            } 
        }
        
        // --- LÓGICA DE PARSEO DE TEXTURAS (Maneja la nueva ruta y nombres sin prefijo 'Texture-') ---
        if (pathPrefix === 'photos/textures') {
            // La estructura esperada es Group-Name_ID.png
            const parts = label.split('-');
            const group = parts[0]; // El tipo de textura (M, T, S)
            const displayName = parts.slice(1).join('-').replace(/[-_]/g,' '); 
            return { id: name, group: group.toUpperCase(), displayName, codeId, src: `${pathPrefix}/${name}.png` };
        }
        
        // Lógica original para Facebases (Country-Name) y otros items (Type-Name)
        const group = label.split('-')[0] || 'Uncategorized';
        const displayName = label.replace(new RegExp('^' + group + '-'), '').replace(/[-_]/g,' ');
        return { id: name, group, displayName, codeId, src: `${pathPrefix}/${name}.png` };
    };


    // --- Función Central de Carga de Datos ---
    function initializeAllData() {
        if (globalDataLoaded) return Promise.resolve();

        return Promise.all([
            fetch('photos/facebases/facebases.json').then(res => res.json()),
            fetch('photos/facebases/categories.json').then(res => res.json()),
            fetch('photos/items/items.json').then(res => res.json()),
            fetch('photos/textures/textures.json').then(res => res.json()), // Nueva carga de texturas
            fetch('music.json').then(res => res.json())
        ]).then(([facebasesBasenames, categoriesData, itemBasenames, textureBasenames, musicData]) => {
            // 1. Facebases
            facebaseCategories = categoriesData;
            allFacebaseItems = facebasesBasenames.map(basename => parseItemName(basename, 'photos/facebases'));

            // 2. Items (Avatar)
            const itemBasePrefix = 'photos/items';
            allAvatarItems = itemBasenames.map(basename => parseItemName(basename, itemBasePrefix));

            // 3. Textures
            const textureBasePrefix = 'photos/textures';
            allTextureItems = textureBasenames.map(basename => parseItemName(basename, textureBasePrefix));

            // 4. Music
            allMusicCodes = musicData;

            // 5. Inicializar filtros dependientes de datos cargados
            populateCountryFilter(facebaseCategories);
            populateMusicCategoryFilter(allMusicCodes);

            globalDataLoaded = true;
        }).catch(error => {
            console.error("Failed to load critical app data:", error);
        });
    }

    const startApp = () => {
        initializeAllData().then(() => {
            // Inicializar las pestañas (asegura el renderizado inicial)
            if (!facebasesTabInitialized) initializeFacebasesTab();
            if (!musicTabInitialized) initializeMusicTab();
            if (!timeConverterInitialized) initializeTimeConverter();
            if (!avatarTabInitialized) initializeAvatarTab();
            if (!texturesTabInitialized) initializeTexturesTab();
            if (!favoritesTabInitialized) initializeFavoritesTab();

            filterContent();
        });
    };
    
    // --- Autenticación ---
    const checkAuthentication = () => {
        const isAuthenticated = localStorage.getItem(AUTH_KEY) === 'true';
        const lastAuthTime = localStorage.getItem(LAST_AUTH_KEY);
        const now = Date.now();

        if (isAuthenticated && lastAuthTime && (now - lastAuthTime < THIRTY_DAYS_MS)) {
            loginOverlay.classList.remove('show');
            appContainer.classList.add('loaded');
            setTimeout(startApp, 500);
        } else {
            localStorage.removeItem(AUTH_KEY);
            localStorage.removeItem(LAST_AUTH_KEY);
            loginOverlay.classList.add('show');
        }
    };

    const authenticate = () => {
        if (passwordInput.value === atob(SECRET_B64)) {
            localStorage.setItem(AUTH_KEY, 'true');
            localStorage.setItem(LAST_AUTH_KEY, Date.now());

            document.getElementById('errorMessage').textContent = '';
            loginOverlay.classList.remove('show');
            appContainer.classList.add('loaded');
            setTimeout(startApp, 500);
        } else {
            document.getElementById('errorMessage').textContent = 'Incorrect password.';
        }
    };
    
    checkAuthentication();

    document.getElementById('loginBtn').addEventListener('click', authenticate);
    passwordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') authenticate(); });

    // --- Universal Copy Button Logic ---
    appContainer.addEventListener('click', (event) => {
        const copyBtn = event.target.closest('.copy-btn');
        if (!copyBtn) return;
        
        const input = copyBtn.previousElementSibling;
        const valueToCopy = input && !input.classList.contains('favorite-btn') ? input.value : copyBtn.dataset.id;

        if (valueToCopy) {
            navigator.clipboard.writeText(valueToCopy).then(() => {
                copyBtn.innerHTML = `<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/></svg>`;
                copyBtn.classList.add('copied');
                setTimeout(() => {
                    copyBtn.innerHTML = `<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>`;
                    copyBtn.classList.remove('copied');
                }, 1200);
            });
        }
    });

    // --- Lógica de Navegación por Pestañas ---
    const tabs = document.querySelectorAll('.tab-nav-button');
    const contentAreas = document.querySelectorAll('.tab-content');
    
    const updateSearchUI = (activeTab) => {
        searchBar.value = '';
        facebaseCountryFilter.style.display = 'none';
        musicCategoryFilter.style.display = 'none';

        if (activeTab === 'facebases') {
            searchBar.placeholder = 'Search by name...';
            facebaseCountryFilter.style.display = 'block';
        } else if (activeTab === 'music') {
            searchBar.placeholder = 'Search by artist, title, or marker...';
            musicCategoryFilter.style.display = 'block';
        } else if (activeTab === 'avatar' || activeTab === 'textures' || activeTab === 'favorites') {
            searchBar.placeholder = 'Search by name or category...';
        } else {
            searchBar.placeholder = 'Search...';
        }
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            contentAreas.forEach(area => area.classList.toggle('hidden', area.id !== `content-${target}`));
            updateSearchUI(target);
            searchBar.dispatchEvent(new Event('input')); // Forzar re-filtrado/renderizado
        });
    });

    // --- Facebases Tab Logic and Rendering ---
    function renderFacebasesGallery(itemsToRender, categoriesData) {
        const galleryContainer = document.getElementById('gallery-container');
        galleryContainer.innerHTML = '';
        
        const flagLookup = [...categoriesData.countries, ...categoriesData.others].reduce((acc, cat) => {
            if (cat.iso) {
                acc[cat.name] = { src: `https://flagcdn.com/h20/${cat.iso.toLowerCase()}.png`, name: cat.name };
            } else if (cat.flag) {
                acc[cat.name] = { src: cat.flag, name: cat.name };
            }
            return acc;
        }, {});
        
        if (itemsToRender.length === 0) {
            galleryContainer.innerHTML = `<p class="text-zinc-500 text-center col-span-full pt-4">No results found.</p>`;
            return;
        }

        const gridItemsHTML = itemsToRender.map(it => {
            const lookupResult = flagLookup[it.group];
            
            let flagTag = `<span class="text-xs text-zinc-500">${it.group}</span>`;
            let flagName = it.group;

            if (lookupResult) {
                flagName = lookupResult.name;
                const toastEvents = `onmouseover="window.showFlagToast('${flagName}', event)" onmouseout="window.hideFlagToast()"`;
                
                flagTag = `<img src="${lookupResult.src}" alt="${flagName} flag" title="${flagName}" ${toastEvents} class="flag-aesthetic !h-5 !w-auto rounded shadow cursor-pointer">`;
            }

            return `
                <div class="music-card facebase-card bg-[#151722] rounded-xl shadow-xl ring-1 ring-[var(--border)] overflow-hidden flex flex-col p-1.5 space-y-1.5 !w-full relative">
                    <div class="favorite-container">
                        <button class="favorite-btn" data-id="${it.id}" onclick="toggleFavorite('${it.id}', this)">
                            ${isFavorite(it.id) ? '❤️' : '🖤'}
                        </button>
                    </div>
                    <div class="text-xs text-zinc-200 font-medium px-1 h-8 flex items-center justify-start gap-1">
                        ${flagTag}
                        <span class="truncate">${it.displayName}</span>
                    </div>
                    <img src="${it.src}" alt="${it.displayName}" loading="lazy" class="w-full h-auto object-cover aspect-square rounded-md">
                    <div class="flex items-center gap-1.5 p-1">
                        <input readonly type="text" value="${it.codeId || ''}" placeholder="…" class="flex-grow w-0 h-8 px-2 text-xs dark-input rounded-md">
                        <button class="copy-btn flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#1b1d24] text-zinc-200 rounded-md border border-[var(--border)] hover:bg-[#222533] transition">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        galleryContainer.innerHTML = gridItemsHTML;
    }

    function initializeFacebasesTab() {
        if (facebasesTabInitialized) return;
        facebasesTabInitialized = true;
        renderFacebasesGallery(allFacebaseItems, facebaseCategories);
    }
    
    const populateCountryFilter = (categoriesData) => {
        const filter = document.getElementById('facebase-country-filter');
        filter.innerHTML = '<option value="all">All Countries</option>';
        
        categoriesData.countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.name;
            option.textContent = country.name;
            filter.appendChild(option);
        });
        
        filter.addEventListener('change', filterContent);
    };
    
    // --- Avatar Tab Logic and Rendering ---
    function renderAvatarGallery(itemsToRender) {
        const galleryContainer = document.getElementById('avatar-gallery-container');
        
        if (itemsToRender.length === 0) {
            galleryContainer.innerHTML = `<p class="text-zinc-500 text-center col-span-full">No results found.</p>`;
            return;
        }

        const gridItemsHTML = itemsToRender.map(it => `
                <div class="music-card facebase-card bg-[#151722] rounded-xl shadow-xl ring-1 ring-[var(--border)] overflow-hidden flex flex-col p-1.5 space-y-1.5 !w-full relative">
                    <div class="favorite-container">
                        <button class="favorite-btn" data-id="${it.id}" onclick="toggleFavorite('${it.id}', this)">
                            ${isFavorite(it.id) ? '❤️' : '🖤'}
                        </button>
                    </div>
                    <div class="text-xs text-zinc-200 font-medium px-1 text-center h-8 flex items-center justify-start gap-1">${it.displayName} (${it.group})</div>
                    <img src="${it.src}" alt="${it.displayName}" loading="lazy" class="w-full h-auto object-cover aspect-square rounded-md">
                    <div class="flex items-center gap-1.5 p-1">
                        <input readonly type="text" value="${it.codeId || ''}" placeholder="…" class="flex-grow w-0 h-8 px-2 text-xs dark-input rounded-md">
                        <button class="copy-btn flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#1b1d24] text-zinc-200 rounded-md border border-[var(--border)] hover:bg-[#222533] transition">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>
                        </button>
                    </div>
                </div>
            `).join('');

        galleryContainer.innerHTML = gridItemsHTML;
    }

    function initializeAvatarTab() {
        if (avatarTabInitialized) return;
        avatarTabInitialized = true;
        renderAvatarGallery(allAvatarItems);
    }

    // --- Textures Tab Logic and Rendering ---
    
    // Función auxiliar para obtener la ruta del icono de textura
    const getTextureIconPath = (typeCode) => {
        const typeMap = {
            'M': { src: 'photos/app/mesh.png', name: 'Mesh' },
            'T': { src: 'photos/app/trlcd.png', name: 'Translucid' },
            'S': { src: 'photos/app/solid.png', name: 'Solid' },
        };
        const data = typeMap[typeCode.toUpperCase()] || null;
        
        if (data) {
            const title = `${data.name} (${typeCode})`;
            const alt = `Icono de textura ${data.name}`;
            const img = document.createElement('img');
            img.src = data.src;
            img.alt = alt;
            img.title = title;
            img.className = 'texture-type-icon';
            img.onerror = function() {
               const span = document.createElement('span');
               span.className = 'text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300';
               span.textContent = typeCode;
               if (img.parentNode) img.parentNode.replaceChild(span, img);
               else img.replaceWith(span);
            };
            return img.outerHTML;
        }
        return `<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-700 text-white">?</span>`;
    }
    
    function renderTextureGallery(itemsToRender) {
        const galleryContainer = document.getElementById('textures-gallery-container');
        
        if (itemsToRender.length === 0) {
            galleryContainer.innerHTML = `<p class="text-zinc-500 text-center col-span-full">No results found.</p>`;
            return;
        }

        const gridItemsHTML = itemsToRender.map(it => { 
            const iconTag = getTextureIconPath(it.group);

            return `
                <div class="music-card facebase-card bg-[#151722] rounded-xl shadow-xl ring-1 ring-[var(--border)] overflow-hidden flex flex-col p-1.5 space-y-1.5 !w-full relative">
                    <div class="texture-icon-group">
                        ${iconTag}
                        <div class="favorite-container !relative !top-0 !right-0 !bg-transparent !backdrop-filter-none !w-auto !h-auto">
                            <button class="favorite-btn" data-id="${it.id}" onclick="toggleFavorite('${it.id}', this)">
                                ${isFavorite(it.id) ? '❤️' : '🖤'}
                            </button>
                        </div>
                    </div>
                    <div class="text-xs text-zinc-200 font-medium px-1 h-8 flex items-center justify-start gap-1">
                        <span class="truncate">${it.displayName}</span>
                    </div>
                    <img src="${it.src}" alt="${it.displayName}" loading="lazy" class="w-full h-auto object-cover aspect-square rounded-md">
                    <div class="flex items-center gap-1.5 p-1">
                        <input readonly type="text" value="${it.codeId || ''}" placeholder="…" class="flex-grow w-0 h-8 px-2 text-xs dark-input rounded-md">
                        <button class="copy-btn flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#1b1d24] text-zinc-200 rounded-md border border-[var(--border)] hover:bg-[#222533] transition">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>
                        </button>
                    </div>
                </div>
            `}).join('');

        galleryContainer.innerHTML = gridItemsHTML;
    }

    function initializeTexturesTab() {
        if (texturesTabInitialized) return;
        texturesTabInitialized = true;
        renderTextureGallery(allTextureItems);
    }
    
    // --- Music Tab Logic and Rendering ---
    const populateMusicCategoryFilter = (codes) => {
        const categories = [...new Set(codes.map(code => code.category))].filter(Boolean);
        categories.sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            musicCategoryFilter.appendChild(option);
        });
        musicCategoryFilter.addEventListener('change', filterContent);
    };

    const renderMusicCodes = (codes) => {
        const resultsContainer = document.getElementById('music-results-container');
        resultsContainer.innerHTML = '';
        if (codes.length === 0) {
            resultsContainer.innerHTML = `<p class="text-zinc-500 text-center col-span-full">No results found.</p>`;
            return;
        }
        codes.forEach(code => {
            const isFav = isFavorite(code.id);
            const cardHTML = ` 
            <div class="music-card rounded-lg p-4 flex flex-col justify-between gap-3 relative"> 
                <div class="favorite-container !top-2 !right-2 !bg-transparent !backdrop-filter-none !w-auto !h-auto">
                    <button class="favorite-btn" data-id="${code.id}" onclick="toggleFavorite('${code.id}', this)">
                        ${isFavorite(code.id) ? '❤️' : '🖤'}
                    </button>
                </div>
                <div class="flex-grow"> 
                    <h3 class="font-semibold text-zinc-100 truncate" title="${code.title}">${code.title} ${ (code.pitch && code.pitch !== 0) ? `<span class="ml-2 text-xs font-semibold text-cyan-400" title="Pitch: ${code.pitch}">[PITCH]</span>` : ''}</h3> 
                    <p class="text-sm text-zinc-400 truncate" title="${code.artist}">${code.artist || 'Unknown Artist'}</p> 
                    <p class="text-xs text-[var(--gold2)] opacity-80 mt-2">${code.category || 'Uncategorized'}</p> 
                    ${ (code.markers && code.markers.length > 0) ? `<div class="flex flex-wrap gap-1.5 mt-2">${code.markers.map(marker => `<span class="text-xs font-medium bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full">${marker}</span>`).join('')}</div>` : ''} 
                </div> 
                <div class="flex items-center gap-2 mt-2"> 
                    <input readonly type="text" value="${code.id}" class="flex-grow w-0 h-9 px-2 text-xs dark-input rounded-md font-mono"> 
                    <button class="copy-btn flex-shrink-0 w-9 h-9 flex items-center justify-center bg-[#1b1d24] text-zinc-200 rounded-md border border-[var(--border)] hover:bg-[#222533] transition" data-id="${code.id}" title="Copy ID"> 
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg> 
                    </button> 
                </div> 
            </div>`;
            resultsContainer.innerHTML += cardHTML;
        });
    };

    function initializeMusicTab() {
        if (musicTabInitialized) return;
        musicTabInitialized = true;
        renderMusicCodes(allMusicCodes);
    }
    
    // --- Favorites Tab Logic and Rendering ---
    function renderFavoritesGallery(itemsToRender) {
        const galleryContainer = document.getElementById('favorites-gallery-container');
        galleryContainer.innerHTML = '';
        
        if (itemsToRender.length === 0) {
            galleryContainer.innerHTML = `<p class="text-zinc-500 text-center col-span-full pt-4">No has marcado ningún ítem como favorito todavía. Busca en las otras pestañas y usa el corazón (❤️).</p>`;
            return;
        }

        itemsToRender.forEach(item => {
            if (item.category) { // Music Card
                   const cardHTML = ` 
                    <div class="music-card rounded-lg p-4 flex flex-col justify-between gap-3 relative"> 
                        <div class="favorite-container !top-2 !right-2 !bg-transparent !backdrop-filter-none !w-auto !h-auto">
                            <button class="favorite-btn" data-id="${item.id}" onclick="toggleFavorite('${item.id}', this)">
                                ${isFavorite(item.id) ? '❤️' : '🖤'}
                            </button>
                        </div>
                        <div class="flex-grow"> 
                            <h3 class="font-semibold text-zinc-100 truncate" title="${item.title}">${item.title} ${ (item.pitch && item.pitch !== 0) ? `<span class="ml-2 text-xs font-semibold text-cyan-400" title="Pitch: ${item.pitch}">[PITCH]</span>` : ''}</h3> 
                            <p class="text-sm text-zinc-400 truncate" title="${item.artist}">${item.artist || 'Unknown Artist'}</p> 
                            <p class="text-xs text-[var(--gold2)] opacity-80 mt-2">${item.category || 'Uncategorized'}</p> 
                            ${ (item.markers && item.markers.length > 0) ? `<div class="flex flex-wrap gap-1.5 mt-2">${item.markers.map(marker => `<span class="text-xs font-medium bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full">${marker}</span>`).join('')}</div>` : ''} 
                        </div> 
                        <div class="flex items-center gap-2 mt-2"> 
                            <input readonly type="text" value="${item.id}" class="flex-grow w-0 h-9 px-2 text-xs dark-input rounded-md font-mono"> 
                            <button class="copy-btn flex-shrink-0 w-9 h-9 flex items-center justify-center bg-[#1b1d24] text-zinc-200 rounded-md border border-[var(--border)] hover:bg-[#222533] transition" data-id="${item.id}" title="Copy ID"> 
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg> 
                            </button> 
                        </div> 
                    </div>`;
                    galleryContainer.innerHTML += cardHTML;
            } else { 
                    // Facebase/Avatar/Texture Card
                    
                    const isTexture = item.type === 'texture';
                    
                    let iconGroupHTML;
                    let headerContentHTML;

                    if (isTexture) {
                        const iconTag = getTextureIconPath(item.group);
                        
                        iconGroupHTML = `
                            <div class="texture-icon-group">
                                ${iconTag}
                                <div class="favorite-container !relative !top-0 !right-0 !bg-transparent !backdrop-filter-none !w-auto !h-auto">
                                    <button class="favorite-btn" data-id="${item.id}" onclick="toggleFavorite('${item.id}', this)">
                                        ${isFavorite(item.id) ? '❤️' : '🖤'}
                                    </button>
                                </div>
                            </div>`;
                        headerContentHTML = `<span class="truncate">${item.displayName}</span>`;

                    } else { // Facebase or Avatar
                        const iso = facebaseCategories?.countries.find(c => c.name === item.group)?.iso || '';
                        let flagSrc;
                        let flagName = item.group;
                        const customFlag = facebaseCategories?.others.find(o => o.name === item.group)?.flag;
                        
                        if (iso) {
                            flagSrc = `https://flagcdn.com/h20/${iso.toLowerCase()}.png`;
                        } else if (customFlag) {
                            flagSrc = customFlag;
                        }

                        const flagTag = flagSrc 
                            ? `<img src="${flagSrc}" alt="${flagName} flag" title="${flagName}" onmouseover="window.showFlagToast('${flagName}', event)" onmouseout="window.hideFlagToast()" class="flag-aesthetic !h-5 !w-auto rounded shadow cursor-pointer">`
                            : `<span class="text-xs text-zinc-500">${item.group}</span>`;

                        iconGroupHTML = `
                            <div class="favorite-container">
                                <button class="favorite-btn" data-id="${item.id}" onclick="toggleFavorite('${item.id}', this)">
                                    ${isFavorite(item.id) ? '❤️' : '🖤'}
                                </button>
                            </div>`;
                        headerContentHTML = `
                            ${flagTag}
                            <span class="truncate">${item.displayName}</span>
                        `;
                    }
                        
                    const cardHTML = `
                        <div class="music-card facebase-card bg-[#151722] rounded-xl shadow-xl ring-1 ring-[var(--border)] overflow-hidden flex flex-col p-1.5 space-y-1.5 !w-full relative">
                            ${iconGroupHTML}
                            <div class="text-xs text-zinc-200 font-medium px-1 h-8 flex items-center justify-start gap-1">
                                ${headerContentHTML}
                            </div>
                            <img src="${item.src}" alt="${item.displayName}" loading="lazy" class="w-full h-auto object-cover aspect-square rounded-md">
                            <div class="flex items-center gap-1.5 p-1">
                                <input readonly type="text" value="${item.codeId || ''}" placeholder="…" class="flex-grow w-0 h-8 px-2 text-xs dark-input rounded-md">
                                <button class="copy-btn flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#1b1d24] text-zinc-200 rounded-md border border-[var(--border)] hover:bg-[#222533] transition">
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>
                                </button>
                            </div>
                        </div>
                    `;
                    galleryContainer.innerHTML += cardHTML;
            }
        });
    }

    function initializeFavoritesTab() {
        if (favoritesTabInitialized) return;
        favoritesTabInitialized = true;
    }
    
    // --- Search and Filter Logic ---
    const debounce = (func, delay) => {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };
    
    const filterContent = () => {
        if (!globalDataLoaded) return;
        
        const activeTab = document.querySelector('.tab-nav-button.active')?.dataset.tab;
        const searchTerm = searchBar.value.toLowerCase().trim();
        
        if (activeTab === 'facebases') {
            const selectedCountry = facebaseCountryFilter.value;
            
            const filteredItems = allFacebaseItems.filter(item => {
                const matchesCountry = selectedCountry === 'all' || item.group === selectedCountry;
                const matchesSearch = searchTerm === '' || 
                    item.displayName.toLowerCase().includes(searchTerm) ||
                    item.group.toLowerCase().includes(searchTerm);
                
                return matchesCountry && matchesSearch;
            });

            if (facebaseCategories) {
                renderFacebasesGallery(filteredItems, facebaseCategories);
            }
        } else if (activeTab === 'avatar') {
            const filteredItems = (searchTerm === '') ? allAvatarItems : allAvatarItems.filter(item =>
                item.group.toLowerCase().includes(searchTerm) ||
                item.displayName.toLowerCase().includes(searchTerm)
            );
            renderAvatarGallery(filteredItems);
        } else if (activeTab === 'textures') { 
            const filteredItems = (searchTerm === '') ? allTextureItems : allTextureItems.filter(item =>
                item.group.toLowerCase().includes(searchTerm) ||
                item.displayName.toLowerCase().includes(searchTerm)
            );
            renderTextureGallery(filteredItems);
        } else if (activeTab === 'music') {
            const selectedCategory = musicCategoryFilter.value;
            const filteredCodes = allMusicCodes.filter(code => {
                const matchesCategory = selectedCategory === 'all' || code.category === selectedCategory;
                const searchCorpus = `${code.title.toLowerCase()} ${code.artist ? code.artist.toLowerCase() : ''} ${(code.markers || []).join(' ')}`;
                return matchesCategory && searchCorpus.includes(searchTerm);
            });
            renderMusicCodes(filteredCodes);
        } else if (activeTab === 'favorites') { 
            const favorites = getFavorites();
            const allItems = [
                ...allFacebaseItems.map(item => ({...item, type: 'facebase', path: 'photos/facebases'})),
                ...allAvatarItems.map(item => ({...item, type: 'avatar', path: 'photos/items'})),
                ...allTextureItems.map(item => ({...item, type: 'texture', path: 'photos/textures'})),
                ...allMusicCodes.map(item => ({...item, type: 'music'})),
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

            renderFavoritesGallery(favoritedItems);
        }
    };

    searchBar.addEventListener('input', debounce(filterContent, 300));

    // --- Modal Setup Function ---
    const setupModal = (openBtnId, closeBtnId, modalId) => { 
        const openBtn = document.getElementById(openBtnId);
        const closeBtn = document.getElementById(closeBtnId);
        const modal = document.getElementById(modalId);
        if (openBtn) openBtn.addEventListener('click', () => modal.classList.add('show'));
        if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('show'));
        if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });
    };

    // --- Photos Modal Logic ---
    const openPhotosBtn = document.getElementById('openPhotosBtn');
    const closePhotosBtn = document.getElementById('closePhotosBtn');
    const photosModal = document.getElementById('photosModal');
    const photoContainer = document.getElementById('photo-container');
    const prevPhotoBtn = document.getElementById('prevPhotoBtn');
    const nextPhotoBtn = document.getElementById('nextPhotoBtn');
    let currentPhotoIndex = 0;
    const downloadablePhotos = [
        { src: 'photos/modal/UK.png', filename: 'UK.png', title: 'UK Collection' },
        { src: 'photos/modal/Brazil.png', filename: 'Brazil.png', title: 'Brazil Collection' }
    ];

    function renderSimpleGallery() {
        if (!photoContainer) return;
        const slidesHTML = downloadablePhotos.map((photo, index) => `
            <div id="slide-${index}" class="photo-slide">
                <h3 class="text-xl font-semibold text-zinc-100 mb-4">${photo.title}</h3>
                <img src="${photo.src}" alt="${photo.title}">
                <a href="${photo.src}" download="${photo.filename}" class="mt-6 px-4 py-2 bg-[var(--gold2)] text-black font-semibold rounded-md hover:brightness-110 transition-all">
                    Descargar ${photo.filename}
                </a>
            </div>
        `).join('');
        
        Array.from(photoContainer.children).forEach(child => { if (child.id && child.id.startsWith('slide-')) child.remove(); });
        photoContainer.insertAdjacentHTML('afterbegin', slidesHTML);
        currentPhotoIndex = 0;
        updateGalleryDisplay(currentPhotoIndex, false);
    }

    function updateGalleryDisplay(newIndex, isNavigation = true) {
        const slides = photoContainer.querySelectorAll('.photo-slide');
        if (slides.length === 0) return;
        if (isNavigation) {
            if (newIndex >= slides.length) newIndex = 0;
            else if (newIndex < 0) newIndex = slides.length - 1;
        }
        slides.forEach((slide, index) => slide.classList.toggle('active', index === newIndex));
        currentPhotoIndex = newIndex;
        const showNav = slides.length > 1;
        prevPhotoBtn.classList.toggle('hidden', !showNav);
        nextPhotoBtn.classList.toggle('hidden', !showNav);
    }

    nextPhotoBtn.addEventListener('click', () => updateGalleryDisplay(currentPhotoIndex + 1));
    prevPhotoBtn.addEventListener('click', () => updateGalleryDisplay(currentPhotoIndex - 1));
    openPhotosBtn.addEventListener('click', () => { renderSimpleGallery(); photosModal.classList.add('show'); });
    closePhotosBtn.addEventListener('click', () => photosModal.classList.remove('show'));
    photosModal.addEventListener('click', (e) => { if (e.target === photosModal) photosModal.classList.remove('show'); });
    
    // --- Time Converter Logic ---
    setupModal('openTimeConverterBtn', 'closeTimeConverterBtn', 'timeConverterModal');
    function initializeTimeConverter() {
        if (timeConverterInitialized) return;
        timeConverterInitialized = true;
        const tzSelect = document.getElementById('eventTimeZone');
        const dateSelect = document.getElementById('eventDate');
        const hourScroller = document.getElementById('hour-scroller-input');
        const sjoDateEl = document.getElementById('sjoDate');
        const sjoTimeEl = document.getElementById('sjoTime');
        
        const timezones = { 'Etc/GMT+12':'IDLW (-12)','Pacific/Honolulu':'HST (-10)','America/Anchorage':'AKST (-9)','America/Los_Angeles':'PST (-8)','America/Denver':'MST (-7)','America/Chicago':'CST (-6)','America/Mexico_City':'CST-MX (-6)','America/New_York':'EST (-5)','America/Bogota':'COT (-5)','America/Lima':'PET (-5)','America/Caracas':'VET (-4)','America/Santiago':'CLT (-3)','America/Sao_Paulo':'BRT (-3)','Atlantic/Azores':'AZOT (-1)','Europe/London':'GMT (+0)','Europe/Paris':'CET (+1)','Europe/Berlin':'CET-DE (+1)','Europe/Athens':'EET (+2)','Africa/Johannesburg':'SAST (+2)','Asia/Dubai':'GST (+4)','Asia/Karachi':'PKT (+5)','Asia/Kolkata':'IST (+5:30)','Asia/Bangkok':'ICT (+7)','Asia/Hong_Kong':'HKT (+8)','Asia/Singapore':'SGT (+8)','Asia/Manila':'PHT (+8)','Asia/Tokyo':'JST (+9)','Asia/Seoul':'KST (+9)','Australia/Sydney':'AEST (+10)','Pacific/Auckland':'NZST (+12)' };
        tzSelect.innerHTML = Object.entries(timezones).map(([val, text]) => `<option value="${val}">${text}</option>`).join('');
        tzSelect.value = 'America/New_York';

        const today = new Date();
        for (let i = -7; i <= 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const option = document.createElement('option');
            option.value = date.toISOString().split('T')[0];
            option.textContent = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            if (i === 0) option.selected = true;
            dateSelect.appendChild(option);
        }

        let scrollerHTML = '<div class="h-[80px]"></div>';
        for (let i = 0; i < 48; i++) {
            const hour = Math.floor(i / 2);
            const minute = (i % 2) * 30;
            scrollerHTML += `<div class="hour-scroller-item" data-index="${i}">${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}</div>`;
        }
        hourScroller.innerHTML = scrollerHTML + '<div class="h-[80px]"></div>';

        const hourItems = hourScroller.querySelectorAll('.hour-scroller-item');
        const now = new Date();
        hourScroller.scrollTop = (now.getHours() * 2 + Math.floor(now.getMinutes() / 30)) * 40;

        function updateConversion() {
            const tz = tzSelect.value;
            const [y,m,d] = dateSelect.value.split('-').map(Number);
            const selectedIndex = Math.round(hourScroller.scrollTop / 40);
            const hour = Math.floor(selectedIndex / 2);
            const minute = (selectedIndex % 2) * 30;

            hourItems.forEach((item, index) => item.classList.toggle('active', index === selectedIndex));
            
            let t = Date.UTC(y, m-1, d, hour, minute);
            // Corregir el offset usando Intl.DateTimeFormat para el cálculo preciso del UTC
            const p = new Intl.DateTimeFormat('en-CA', {timeZone: tz, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date(t)).reduce((a,p)=>(a[p.type]=p.value,a),{}); 
            t -= (Date.UTC(+p.year, +p.month-1, +p.day, +p.hour, +p.minute) - t);
            
            const sjoDate = new Date(t).toLocaleDateString('en-US', {timeZone: SJO_TZ, weekday: 'long', month: 'short', day: 'numeric'});
            const sjoTime = new Date(t).toLocaleTimeString('en-US', {timeZone: SJO_TZ, hour: '2-digit', minute: '2-digit', hour12: false });
            sjoDateEl.textContent = sjoDate; 
            sjoTimeEl.textContent = sjoTime;
        }

        let scrollTimeout;
        hourScroller.addEventListener('scroll', () => { clearTimeout(scrollTimeout); scrollTimeout = setTimeout(updateConversion, 150); });
        hourScroller.addEventListener('wheel', (event) => {
            event.preventDefault();
            const itemHeight = 40;
            const currentIndex = Math.round(hourScroller.scrollTop / itemHeight);
            hourScroller.scrollTo({ top: (Math.max(0, Math.min(currentIndex + Math.sign(event.deltaY), 47)) * itemHeight), behavior: 'smooth' });
        });
        tzSelect.addEventListener('change', updateConversion);
        dateSelect.addEventListener('change', updateConversion);
        updateConversion();
    }
});