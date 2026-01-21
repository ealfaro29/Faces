// tabs/textures.js

// Helper function removed (unused)


// Nueva función para agrupar las texturas por nombre base
// Nueva función para agrupar las texturas (adaptada para objetos de datos)
export function groupTextureVariants(textureItems) {
    const grouped = {};

    textureItems.forEach(item => {
        if (typeof item === 'string') return;

        // 1. Determinar el Nombre Base (Grouping Key)
        let groupingKey = item.baseName;

        if (!groupingKey) {
            // Estrategia: "Todo menos la última palabra es el grupo"
            // Ej: "Elegant Red" -> "Elegant"
            // Ej: "Geneve Long Blue" -> "Geneve Long"
            // Ej: "Simple" -> "Simple" (se queda solo)
            const parts = item.displayName.split(' ');

            if (parts.length > 1) {
                // Quitamos la última palabra (asumimos que es la variante/color)
                parts.pop();
                groupingKey = parts.join(' ');
            } else {
                // Si es una sola palabra, esa es la clave.
                // Pero ojo: si hay "Simple" y "Simple Red", queremos que "Simple" sea parte del grupo también?
                // Por ahora, asumimos correspondencia exacta de prefijo.
                groupingKey = item.displayName;
            }
        }

        // Normalizar clave para evitar duplicados por mayúsculas/espacios
        const normalizedKey = groupingKey.toLowerCase().trim();

        // 2. Agrupar
        // NOTA: Ignoramos el 'item.group' (Tipo) para la clave. 
        // Así "Mesh-Elegant" y "Translucid-Elegant" se agruparán juntos si comparten nombre base.

        if (!grouped[normalizedKey]) {
            grouped[normalizedKey] = {
                // Usamos el tipo del primero como tipo del grupo (para el icono)
                group: item.group,
                baseName: groupingKey, // Nombre visual bonito (con Mayúsculas originales)
                mainVariant: item,
                variants: [item]
            };
        } else {
            grouped[normalizedKey].variants.push(item);

            // Opcional: Si encontramos una variante que parece "más principal" (ej: nombre más corto), la promovemos?
            // Por simplicidad, el primero que llega es el rey.
        }
    });

    return Object.values(grouped);
}


export function populateTextureFilter(items) {
    const filter = document.getElementById('texture-category-filter');
    if (!filter) return;

    // Recopilar todas las categorías únicas de las variantes dentro de los grupos
    const categoriesSet = new Set();
    items.forEach(group => {
        if (group && group.variants) {
            group.variants.forEach(variant => {
                if (variant && variant.group) {
                    categoriesSet.add(variant.group);
                }
            });
        }
    });

    const categories = [...categoriesSet].filter(Boolean);

    filter.innerHTML = '<option value="all">All Categories</option>';

    // Mapeo para nombres amigables
    const typeMap = {
        'M': 'Mesh',
        'T': 'Translucid',
        'S': 'Solid',
    };

    categories.sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = typeMap[category] || category; // Usar nombre amigable
        filter.appendChild(option);
    });
}


// Icon helper functions removed as requested


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
        // Icon removed
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
                
                <div class="absolute top-1.5 right-1.5 z-10 favorite-container !bg-transparent !backdrop-filter-none !w-auto !h-auto">
                    <button class="favorite-btn" data-id="${main.id}" onclick="window.toggleFavorite('${main.id}', this)">
                        ${window.isFavorite(main.id) ? '❤️' : '🖤'}
                    </button>
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

    // Update main ID for robust deletion logic
    card.dataset.mainId = newId;

    // 5. Cerrar la galería de variantes
    card.classList.remove('show-variants');
};