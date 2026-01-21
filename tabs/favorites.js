// tabs/favorites.js

import { getTextureIconPath } from './textures.js';
import { getFlagEmoji } from '../utils/flag.js';
import { getMusicIconPath } from './music.js';

// --- Funciones de Lógica de Favoritos (Exportadas desde aquí) ---

const FAVORITES_KEY = 'fashion_muse_favorites';

export const getFavorites = () => {
    try {
        return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'));
    } catch (e) {
        console.error("Error loading favorites from localStorage", e);
        return new Set();
    }
};

export const isFavorite = (id) => getFavorites().has(id);


// --- Renderizado de Favoritos (Modificado para usar Emoji) ---

export function renderFavoritesGallery(itemsToRender, categoriesData) {
    const galleryContainer = document.getElementById('favorites-gallery-container');
    if (!galleryContainer) return;
    galleryContainer.innerHTML = '';

    if (itemsToRender.length === 0) {
        galleryContainer.innerHTML = `<p class="text-zinc-500 text-center col-span-full pt-4">No has marcado ningún ítem como favorito todavía. Busca en las otras pestañas y usa el corazón (❤️).</p>`;
        return;
    }

    // Crear lookup de banderas (Emojis + Locales)
    const flagLookup = categoriesData ? [...categoriesData.countries, ...categoriesData.others].reduce((acc, cat) => {
        const key = cat.name.toUpperCase();
        if (cat.iso) {
            acc[key] = { src: getFlagEmoji(cat.iso), name: cat.name, isEmoji: true };
        } else if (cat.flag) {
            acc[key] = { src: cat.flag, name: cat.name, isEmoji: false };
        }
        return acc;
    }, {}) : {};

    // --- INICIO DE LA MODIFICACIÓN ---
    // Accedemos a los grupos de facebases desde el objeto global window.appData
    const allFacebaseGroups = window.appData.allFacebaseGroups || [];
    // Usamos un Set para asegurarnos de renderizar cada GRUPO de facebase solo una vez
    const renderedFacebaseGroups = new Set();
    // --- FIN DE LA MODIFICACIÓN ---


    itemsToRender.forEach(item => {
        let cardHTML = '';

        if (item.type === 'music') {
            // Renderizado de Música
            const iconSrc = getMusicIconPath(item.category);
            const pitchTag = (item.pitch && item.pitch !== 0)
                ? `<span class="ml-2 text-xs font-semibold text-cyan-400" title="Pitch: ${item.pitch}">[PITCH]</span>`
                : '';

            cardHTML = ` 
                <div class="music-card facebase-card bg-[#151722] rounded-xl shadow-xl ring-1 ring-[var(--border)] overflow-hidden flex flex-col p-1.5 space-y-1.5 !w-full relative">
                    <div class="favorite-container">
                        <button class="favorite-btn" data-id="${item.id}" onclick="window.toggleFavorite('${item.id}', this)">
                            ❤️
                        </button>
                    </div>
                    <div class="text-xs text-zinc-200 font-medium px-1 h-8 flex items-center justify-start gap-1">
                        <span class="truncate" title="${item.title}">${item.title}</span>
                        ${pitchTag}
                    </div>
                    <img src="${iconSrc}" alt="${item.category}" loading="lazy" class="w-full h-auto object-cover aspect-square rounded-md">
                    <div class="flex items-center gap-1.5 p-1">
                        <input readonly type="text" value="${item.id}" placeholder="${item.artist || 'Unknown Artist'}" class="flex-grow w-0 h-8 px-2 text-xs dark-input rounded-md" title="Artist: ${item.artist || 'Unknown Artist'}">
                        <button class="copy-btn flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#1b1d24] text-zinc-200 rounded-md border border-[var(--border)] hover:bg-[#222533] transition" title="Copy ID"> 
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg> 
                        </button> 
                    </div> 
                </div>`;
        }

        // --- INICIO DE LA MODIFICACIÓN: Lógica para renderizar Facebase completa ---
        else if (item.type === 'facebase') {

            // 1. Encontrar el grupo al que pertenece este item
            const group = allFacebaseGroups.find(g =>
                g.variants.default?.id === item.id ||
                g.variants.X?.id === item.id ||
                g.variants.S?.id === item.id
            );

            if (!group) {
                console.warn('Orphaned facebase favorite found:', item);
                return; // Omitir si no se encuentra el grupo
            }

            // 2. Usar una clave única para no renderizar la misma card varias veces
            const groupKey = `${group.group}-${group.baseDisplayName}`;
            if (renderedFacebaseGroups.has(groupKey)) {
                return; // Este grupo ya fue renderizado, omitir
            }
            renderedFacebaseGroups.add(groupKey); // Marcar como renderizado

            // 3. Renderizar la card completa (lógica copiada de tabs/facebases.js)
            const it = group.defaultItem; // La card se basa en el item default
            const lookupResult = flagLookup[it.group];

            // Lógica de Bandera
            let flagTag = `<span class="text-xs text-zinc-500">${it.group}</span>`;
            let flagName = it.group;
            if (lookupResult) {
                flagName = lookupResult.name;
                const toastEvents = `onmouseover="window.showFlagToast('${flagName}', event)" onmouseout="window.hideFlagToast()"`;
                if (lookupResult.isEmoji) {
                    flagTag = `<span ${toastEvents} class="text-xl cursor-pointer flag-emoji">${lookupResult.src}</span>`;
                } else {
                    flagTag = `<img src="${lookupResult.src}" alt="${flagName} flag" title="${flagName}" ${toastEvents} class="flag-aesthetic !h-5 !w-auto rounded shadow cursor-pointer">`;
                }
            }

            // Lógica de Botones de Variante
            let variantButtonsHTML = '';
            const variantX = group.variants.X;
            const variantS = group.variants.S;
            if (variantX || variantS) {
                variantButtonsHTML = '<div class="variant-buttons">';
                if (variantX) {
                    variantButtonsHTML += `<img src="photos/app/x.webp" class="variant-button" title="Ojos Cerrados" 
                        data-src="${variantX.src}" data-id="${variantX.id}" data-code-id="${variantX.codeId || ''}"`;
                }
                if (variantS) {
                    variantButtonsHTML += `<img src="photos/app/s.webp" class="variant-button" title="Ojos de Lado" 
                        data-src="${variantS.src}" data-id="${variantS.id}" data-code-id="${variantS.codeId || ''}">`;
                }
                variantButtonsHTML += '</div>';
            }

            // Lógica de IDs para el botón de '❤️'
            const allVariantIds = Object.values(group.variants).map(v => v.id).filter(Boolean);
            const variantIdsJSON = JSON.stringify(allVariantIds);

            // 4. Construir el HTML de la card
            cardHTML = `
                <div class="music-card facebase-card bg-[#151722] rounded-xl shadow-xl ring-1 ring-[var(--border)] overflow-hidden flex flex-col p-1.5 space-y-1.5 !w-full relative"
                     data-default-src="${it.src}" 
                     data-default-id="${it.id}" 
                     data-default-code-id="${it.codeId || ''}">
                    
                    <div class="favorite-container">
                        <button class="favorite-btn" 
                                data-id="${it.id}" 
                                data-variant-ids='${variantIdsJSON}'
                                onclick="window.toggleFavorite('${it.id}', this)">
                            ❤️
                        </button>
                    </div>
                    
                    <div class="text-xs text-zinc-200 font-medium px-1 h-8 flex items-center justify-start gap-1">
                        ${flagTag}
                        <span class="truncate">${group.baseDisplayName}</span>
                    </div>
                    
                    <div class="relative">
                        <img src="${it.src}" alt="${group.baseDisplayName}" loading="lazy" class="w-full h-auto object-cover aspect-square rounded-md facebase-main-img">
                        ${variantButtonsHTML}
                    </div>

                    <div class="flex items-center gap-1.5 p-1">
                        <input readonly type="text" value="${it.codeId || ''}" placeholder="…" class="flex-grow w-0 h-8 px-2 text-xs dark-input rounded-md">
                        <button class="copy-btn flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#1b1d24] text-zinc-200 rounded-md border border-[var(--border)] hover:bg-[#222533] transition">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>
                        </button>
                    </div>
                </div>
            `;
        }
        // --- FIN DE LA MODIFICACIÓN ---

        else {
            // Renderizado de Avatar y Texture (lógica anterior)
            const isTexture = item.type === 'texture';

            let iconGroupHTML;
            let headerContentHTML;
            const lookupResult = flagLookup[item.group];

            if (isTexture) {
                const iconTag = window.getTextureIconPath(item.group);

                iconGroupHTML = `
                    <div class="texture-icon-group">
                        ${iconTag}
                        <div class="favorite-container !relative !top-0 !right-0 !bg-transparent !backdrop-filter-none !w-auto !h-auto">
                            <button class="favorite-btn" data-id="${item.id}" onclick="window.toggleFavorite('${item.id}', this)">
                                ❤️
                            </button>
                        </div>
                    </div>`;
                headerContentHTML = `<span class="truncate">${item.displayName}</span>`;

            } else { // Avatar
                let flagTag;
                let flagName = item.group;

                if (lookupResult) {
                    flagName = lookupResult.name;
                    const toastEvents = `onmouseover="window.showFlagToast('${flagName}', event)" onmouseout="window.hideFlagToast()"`;

                    if (lookupResult.isEmoji) {
                        flagTag = `<span ${toastEvents} class="text-xl cursor-pointer flag-emoji">${lookupResult.src}</span>`;
                    } else {
                        flagTag = `<img src="${lookupResult.src}" alt="${flagName} flag" title="${flagName}" ${toastEvents} class="flag-aesthetic !h-5 !w-auto rounded shadow cursor-pointer">`;
                    }

                } else {
                    flagTag = `<span class="text-xs text-zinc-500">${item.group}</span>`;
                }

                iconGroupHTML = `
                    <div class="favorite-container">
                        <button class="favorite-btn" data-id="${item.id}" onclick="window.toggleFavorite('${item.id}', this)">
                            ❤️
                        </button>
                    </div>`;

                headerContentHTML = `<span class="truncate">${item.displayName} (${item.group})</span>`;
            }

            cardHTML = `
                <div class="music-card facebase-card bg-[#151722] rounded-xl shadow-xl ring-1 ring-[var(--border)] overflow-hidden flex flex-col p-1.5 space-y-1.5 !w-full relative">
                    ${iconGroupHTML}
                    <div class="text-xs text-zinc-200 font-medium px-1 h-8 flex items-center justify-start gap-1">
                        ${headerContentHTML}
                    </div>
                    <img src="${item.src}" alt="${item.displayName}" loading="lazy" class="w-full h-auto object-cover aspect-square rounded-md">
                    <div class="flex items-center gap-1.5 p-1">
                        <input readonly type="text" value="${item.codeId || ''}" placeholder="…" class="flex-grow w-0 h-8 px-2 text-xs dark-input rounded-md">
                        <button class="copy-btn flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#1b1d24] text-zinc-200 rounded-md border border-[var(--border)] hover:bg-[#222533] transition" title="Copy ID"> 
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg> 
                        </button> 
                    </div> 
                </div>
            `;
        }
        galleryContainer.innerHTML += cardHTML;
    });
}