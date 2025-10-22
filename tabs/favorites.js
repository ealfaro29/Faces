// tabs/favorites.js

import { getTextureIconPath } from './textures.js'; 
import { getFlagEmoji } from '../utils/flag.js';

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
        if (cat.iso) {
            // USANDO EMOJI
            acc[cat.name] = { src: getFlagEmoji(cat.iso), name: cat.name, isEmoji: true };
        } else if (cat.flag) {
            // Ruta local
            acc[cat.name] = { src: cat.flag, name: cat.name, isEmoji: false };
        }
        return acc;
    }, {}) : {};

    itemsToRender.forEach(item => {
        let cardHTML;
        
        if (item.type === 'music') { 
            // Renderizado de Música
            cardHTML = ` 
                <div class="music-card rounded-lg p-4 flex flex-col justify-between gap-3 relative"> 
                    <div class="favorite-container !top-2 !right-2 !bg-transparent !backdrop-filter-none !w-auto !h-auto">
                        <button class="favorite-btn" data-id="${item.id}" onclick="window.toggleFavorite('${item.id}', this)">
                            ❤️
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
        } else {
            // Renderizado de Facebase/Avatar/Texture
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

            } else { // Facebase or Avatar
                let flagTag;
                let flagName = item.group;
                
                if (lookupResult) {
                    flagName = lookupResult.name;
                    const toastEvents = `onmouseover="window.showFlagToast('${flagName}', event)" onmouseout="window.hideFlagToast()"`;
                    
                    if (lookupResult.isEmoji) {
                        // Renderizar como EMOJI con CLASE CSS CRUCIAL
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
                
                headerContentHTML = (item.type === 'facebase') 
                    ? `${flagTag} <span class="truncate">${item.displayName}</span>`
                    : `<span class="truncate">${item.displayName} (${item.group})</span>`;
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
                        <button class="copy-btn flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#1b1d24] text-zinc-200 rounded-md border border-[var(--border)] hover:bg-[#222533] transition" data-id="${item.id}" title="Copy ID"> 
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg> 
                        </button> 
                    </div> 
                </div>
            `;
        }
        galleryContainer.innerHTML += cardHTML;
    });
}