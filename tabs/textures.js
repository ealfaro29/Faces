// tabs/textures.js

// Función auxiliar para obtener la clave de agrupación (ej: "T-Geneve", "S-Indian Stones")
const getGroupingKey = (filename) => {
    // 1. Quitar el _[ID code]
    const baseNameWithGroup = filename.substring(0, filename.lastIndexOf('_'));

    // CASO MÁS SENCILLO: La clave de agrupación es la parte antes del ÚLTIMO espacio.
    // Esto funciona para "M-Milan Blue" -> "M-Milan" y "S-Indian Stones" -> "S-Indian Stones".
    const lastSpaceIndex = baseNameWithGroup.lastIndexOf(' ');
    if (lastSpaceIndex !== -1) {
        return baseNameWithGroup.substring(0, lastSpaceIndex);
    }
    
    // Si no hay espacio, se usa el nombre completo sin el ID.
    return baseNameWithGroup;
};

// Nueva función para agrupar las texturas por nombre base
export function groupTextureVariants(rawTextureList) {
    const grouped = {};
    const textureDir = 'photos/textures/';

    rawTextureList.forEach(filename => {
        const fullPath = textureDir + filename + '.png';
        
        // El nombre visible es la parte entre el primer '-' y el último '_'
        const displayName = filename.substring(filename.indexOf('-') + 1, filename.lastIndexOf('_')).trim();
        
        // Extraer el código de grupo (M, T, S)
        const groupCode = filename.split('-')[0].trim();
        
        // Extraer el ID
        const codeId = filename.substring(filename.lastIndexOf('_') + 1);

        const item = {
            id: codeId,
            group: groupCode,
            displayName: displayName, // e.g., "Geneve Red"
            src: fullPath,
            codeId: codeId,
            filename: filename
        };
        
        const groupingKey = getGroupingKey(filename); // e.g., "T-Geneve"
        
        if (!grouped[groupingKey]) {
            // El nombre base de la textura (e.g., Geneve) para mostrar en la tarjeta
            const baseName = groupingKey.substring(groupingKey.indexOf('-') + 1); 
            
            grouped[groupingKey] = {
                group: groupCode,
                baseName: baseName, 
                mainVariant: item, // El primer elemento encontrado es la variante principal
                variants: [item]
            };
            // Guardar el nombre completo de la variante para la visualización inicial de la variante
            item.baseName = baseName;
        } else {
            grouped[groupingKey].variants.push(item);
            // Guardar el nombre completo de la variante para la visualización inicial de la variante
            item.baseName = grouped[groupingKey].baseName;
        }
    });

    // Convertir el objeto de grupos a un array para la renderización
    return Object.values(grouped);
}


export function populateTextureFilter(items) {
    const filter = document.getElementById('texture-category-filter');
    if (!filter) return;

    // Se agrega un filtro defensivo para evitar el error 'Cannot read properties of undefined (reading 'group')'
    // si la lista 'items' contiene elementos nulos o undefined.
    const categories = [...new Set(items.filter(group => group && group.group).map(group => group.group))].filter(Boolean);
    
    filter.innerHTML = '<option value="all">All Categories</option>';
    
    // Mapeo para nombres amigables
    const typeMap = {
        'M': 'Mesh (M)',
        'T': 'Translucid (T)',
        'S': 'Solid (S)',
    };

    categories.sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = typeMap[category] || category; // Usar nombre amigable
        filter.appendChild(option);
    });
}


export const getTextureIconPath = (typeCode) => {
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

// Nueva función para generar el HTML de una variante (miniatura)
const renderVariantThumbnail = (variant, isMain) => {
    // El nombre de la variante es la última palabra del displayName (ej. "Red" de "Geneve Red")
    const variantName = variant.displayName.split(' ').pop();
    const className = isMain ? 'variant-thumbnail active' : 'variant-thumbnail';
    
    return `
        <div class="${className}" 
             data-id="${variant.id}" 
             data-src="${variant.src}" 
             data-display-name="${variant.displayName}" 
             data-code-id="${variant.codeId}" 
             onclick="window.selectTextureVariant(this)">
            <img src="${variant.src}" alt="${variant.displayName}" loading="lazy" class="w-full h-auto object-cover aspect-square rounded-md">
            <span class="variant-name">${variantName}</span>
        </div>
    `;
};


export function renderTextureGallery(itemsToRender) {
    const galleryContainer = document.getElementById('textures-gallery-container');
    if (!galleryContainer) return;
    galleryContainer.innerHTML = '';

    // Se agrega un filtro defensivo para asegurar que solo procesamos grupos válidos.
    const validGroups = itemsToRender.filter(group => group && group.mainVariant);

    if (validGroups.length === 0) {
        galleryContainer.innerHTML = `<p class="text-zinc-500 text-center col-span-full">No results found.</p>`;
        return;
    }

    // itemsToRender es ahora una lista de GRUPOS de texturas.
    const gridItemsHTML = validGroups.map(group => { 
        const main = group.mainVariant;
        const iconTag = getTextureIconPath(main.group);
        const hasVariants = group.variants.length > 1;
        const variantName = main.displayName.split(' ').pop(); // e.g. "Red"
        
        // MODIFICACIÓN: Calcular la cantidad de variantes adicionales (N-1)
        const otherVariantsCount = group.variants.length - 1; 

        // Renderizar las miniaturas de las variantes
        const variantsThumbnailsHTML = hasVariants ? group.variants.map(variant => {
            const isMain = variant.id === main.id;
            return renderVariantThumbnail(variant, isMain);
        }).join('') : '';

        // Card principal
        return `
            <div class="music-card facebase-card bg-[#151722] rounded-xl shadow-xl ring-1 ring-[var(--border)] overflow-hidden flex flex-col p-1.5 space-y-1.5 !w-full relative texture-group-card" 
                 data-group-key="${group.baseName}" data-main-id="${main.id}">
                
                <div class="texture-icon-group">
                    ${iconTag}
                    <div class="favorite-container !relative !top-0 !right-0 !bg-transparent !backdrop-filter-none !w-auto !h-auto">
                        <button class="favorite-btn" data-id="${main.id}" onclick="window.toggleFavorite('${main.id}', this)">
                            ${window.isFavorite(main.id) ? '❤️' : '🖤'}
                        </button>
                    </div>
                </div>

                <div class="variant-display-container">
                    <div class="text-xs text-zinc-200 font-medium px-1 h-8 flex items-center justify-start gap-1">
                        <span class="truncate main-display-name">${group.baseName}</span>
                        ${hasVariants ? `<span class="text-xs font-medium text-zinc-400 main-variant-name">(${variantName})</span>` : ''}
                    </div>
                    <img src="${main.src}" alt="${main.displayName}" loading="lazy" class="w-full h-auto object-cover aspect-square rounded-md main-image">
                    
                    ${hasVariants ? `
                        <button class="variant-indicator-btn" title="Ver ${group.variants.length} variantes" onclick="this.closest('.texture-group-card').classList.toggle('show-variants')">
                            ${otherVariantsCount}+ </button>
                    ` : ''}
                </div>

                ${hasVariants ? `
                    <div class="variants-gallery-overlay" onclick="this.closest('.texture-group-card').classList.remove('show-variants')">
                        <div class="variants-gallery-container" onclick="event.stopPropagation()">
                            <h4 class="text-sm font-semibold text-zinc-100 mb-2">${group.baseName} Variants</h4>
                            <div class="variants-grid">
                                ${variantsThumbnailsHTML}
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div class="flex items-center gap-1.5 p-1 card-footer">
                    <input readonly type="text" value="${main.codeId || ''}" placeholder="…" class="flex-grow w-0 h-8 px-2 text-xs dark-input rounded-md main-code-id-input">
                    <button class="copy-btn flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#1b1d24] text-zinc-200 rounded-md border border-[var(--border)] hover:bg-[#222533] transition" data-id="${main.id}">
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>
                    </button>
                </div>
            </div>
        `}).join('');

    galleryContainer.innerHTML = gridItemsHTML;
    
    if (typeof window.setupCopyButtons === 'function') {
        window.setupCopyButtons(); 
    }
}

// Nueva función JS global para manejar el cambio de variante
window.selectTextureVariant = (element) => {
    const card = element.closest('.texture-group-card');
    const newId = element.dataset.id;
    const newSrc = element.dataset.src;
    const newDisplayName = element.dataset.displayName;
    const newCodeId = element.dataset.codeId;
    
    // 1. Elementos a actualizar
    const mainImage = card.querySelector('.main-image');
    const mainVariantNameSpan = card.querySelector('.main-variant-name');
    const mainCodeInput = card.querySelector('.main-code-id-input');
    const favoriteBtn = card.querySelector('.favorite-btn');
    
    // 2. Quitar 'active' de todas las miniaturas y añadirlo a la seleccionada
    card.querySelectorAll('.variant-thumbnail').forEach(thumb => thumb.classList.remove('active'));
    element.classList.add('active');
    
    // 3. Actualizar la imagen principal y el texto
    const variantName = newDisplayName.split(' ').pop();
    
    if (mainImage) {
        mainImage.src = newSrc;
        mainImage.alt = newDisplayName;
    }
    if (mainVariantNameSpan) mainVariantNameSpan.textContent = `(${variantName})`;
    if (mainCodeInput) mainCodeInput.value = newCodeId;
    
    // 4. Actualizar IDs en los botones
    if (favoriteBtn) {
        favoriteBtn.dataset.id = newId;
        favoriteBtn.setAttribute('onclick', `window.toggleFavorite('${newId}', this)`);
        favoriteBtn.innerHTML = window.isFavorite(newId) ? '❤️' : '🖤';
    }
    const copyBtn = card.querySelector('.copy-btn');
    if (copyBtn) {
        copyBtn.dataset.id = newId;
    }

    // 5. Cerrar la galería de variantes
    card.classList.remove('show-variants');
};