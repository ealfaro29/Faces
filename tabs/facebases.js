// tabs/facebases.js

import { getFlagEmoji } from '../utils/flag.js';

export const populateCountryFilter = (categoriesData) => {
    const filter = document.getElementById('facebase-country-filter');
    if (!filter) return;
    filter.innerHTML = '<option value="all">All Countries</option>';
    
    categoriesData.countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.name;
        option.textContent = country.name;
        filter.appendChild(option);
    });
};

export function renderFacebasesGallery(itemsToRender, categoriesData) {
    const galleryContainer = document.getElementById('gallery-container');
    if (!galleryContainer) return;
    galleryContainer.innerHTML = '';
    
    // CREACIÓN DEL OBJETO DE BÚSQUEDA DE BANDERAS
    const flagLookup = [...categoriesData.countries, ...categoriesData.others].reduce((acc, cat) => {
        const key = cat.name.toUpperCase(); // <-- CORRECCIÓN APLICADA
        if (cat.iso) {
            // USANDO EMOJI
            acc[key] = { src: getFlagEmoji(cat.iso), name: cat.name, isEmoji: true };
        } else if (cat.flag) {
            // Ruta local (para categorías como 'Drag')
            acc[key] = { src: cat.flag, name: cat.name, isEmoji: false };
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
            
            if (lookupResult.isEmoji) {
                // Renderizar como EMOJI con CLASE CSS CRUCIAL
                flagTag = `<span ${toastEvents} class="text-xl cursor-pointer flag-emoji">${lookupResult.src}</span>`;
            } else {
                // Renderizar como IMAGEN (para categorías 'others')
                flagTag = `<img src="${lookupResult.src}" alt="${flagName} flag" title="${flagName}" ${toastEvents} class="flag-aesthetic !h-5 !w-auto rounded shadow cursor-pointer">`;
            }
        }

        return `
            <div class="music-card facebase-card bg-[#151722] rounded-xl shadow-xl ring-1 ring-[var(--border)] overflow-hidden flex flex-col p-1.5 space-y-1.5 !w-full relative">
                <div class="favorite-container">
                    <button class="favorite-btn" data-id="${it.id}" onclick="window.toggleFavorite('${it.id}', this)">
                        ${window.isFavorite(it.id) ? '❤️' : '🖤'}
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