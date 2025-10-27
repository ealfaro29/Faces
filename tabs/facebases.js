// tabs/facebases.js

import { getFlagEmoji } from '../utils/flag.js';

export const populateFacebaseFilter = (categoriesData) => {
    const filter = document.getElementById('facebase-category-filter');
    if (!filter) return;
    
    // Limpiar opciones existentes y añadir "All"
    filter.innerHTML = '<option value="all">All Categories</option>';
    
    // Añadir Países
    categoriesData.countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.name;
        option.textContent = country.name;
        filter.appendChild(option);
    });

    // Añadir Otras categorías (como Drag)
    categoriesData.others.forEach(other => {
        const option = document.createElement('option');
        option.value = other.name;
        option.textContent = other.name;
        filter.appendChild(option);
    });
};

export function renderFacebasesGallery(groupsToRender, categoriesData) {
    const galleryContainer = document.getElementById('gallery-container');
    if (!galleryContainer) return;
    galleryContainer.innerHTML = '';
    
    // CREACIÓN DEL OBJETO DE BÚSQUEDA DE BANDERAS (tu código original)
    const flagLookup = [...categoriesData.countries, ...categoriesData.others].reduce((acc, cat) => {
        const key = cat.name.toUpperCase(); 
        if (cat.iso) {
            acc[key] = { src: getFlagEmoji(cat.iso), name: cat.name, isEmoji: true };
        } else if (cat.flag) {
            acc[key] = { src: cat.flag, name: cat.name, isEmoji: false };
        }
        return acc;
    }, {});
    
    if (groupsToRender.length === 0) {
        galleryContainer.innerHTML = `<p class="text-zinc-500 text-center col-span-full pt-4">No results found.</p>`;
        return;
    }

    // --- INICIO DE LA MODIFICACIÓN ---
    // 'groupsToRender' es ahora una lista de GRUPOS
    const gridItemsHTML = groupsToRender.map(group => {
        
        // Usamos el 'defaultItem' (que filtramos en app.js) como base
        const it = group.defaultItem; 
        if (!it) return ''; // Seguridad, aunque ya no debería pasar

        // --- Lógica de Banderas (tu código original) ---
        const lookupResult = flagLookup[it.group];
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
        
        // --- NUEVO: Generar HTML de botones de variantes ---
        let variantButtonsHTML = '';
        const variantX = group.variants.X;
        const variantS = group.variants.S;

        if (variantX || variantS) {
            variantButtonsHTML = '<div class="variant-buttons">';
            if (variantX) {
                variantButtonsHTML += `<img src="photos/app/x.png" class="variant-button" title="Ojos Cerrados" 
                    data-src="${variantX.src}" data-id="${variantX.id}" data-code-id="${variantX.codeId || ''}">`;
            }
            if (variantS) {
                variantButtonsHTML += `<img src="photos/app/s.png" class="variant-button" title="Ojos de Lado" 
                    data-src="${variantS.src}" data-id="${variantS.id}" data-code-id="${variantS.codeId || ''}">`;
            }
            variantButtonsHTML += '</div>';
        }

        // --- NUEVO: Recolectar todos los IDs de variantes para el botón de '❤️' ---
        // Usamos .filter(Boolean) para eliminar 'undefined' si 'X' o 'S' no existen
        const allVariantIds = Object.values(group.variants).map(v => v.id).filter(Boolean);
        // Usamos comillas simples para el atributo HTML
        const variantIdsJSON = JSON.stringify(allVariantIds);
        // --- FIN MODIFICACIÓN ---


        // --- HTML de la Card (Modificado) ---
        return `
            <div class="music-card facebase-card bg-[#151722] rounded-xl shadow-xl ring-1 ring-[var(--border)] overflow-hidden flex flex-col p-1.5 space-y-1.5 !w-full relative"
                 data-default-src="${it.src}" 
                 data-default-id="${it.id}" 
                 data-default-code-id="${it.codeId || ''}">
                
                <div class="favorite-container">
                    <button class="favorite-btn" 
                            data-id="${it.id}" 
                            data-variant-ids='${variantIdsJSON}'
                            onclick="window.toggleFavorite('${it.id}', this)">
                        ${window.isFavorite(it.id) ? '❤️' : '🖤'}
                    </button>
                    </div>
                
                <div class="text-xs text-zinc-200 font-medium px-1 h-8 flex items-center justify-start gap-1">
                    ${flagTag}
                    <span class="truncate">${group.baseDisplayName}</span> </div>
                
                <div class="relative">
                    <img src="${it.src}" alt="${group.baseDisplayName}" loading="lazy" class="w-full h-auto object-cover aspect-square rounded-md facebase-main-img"> ${variantButtonsHTML} </div>

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