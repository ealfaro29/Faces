// tabs/music.js

/**
 * Devuelve la ruta del icono de la categoría de música.
 * @param {string} category - El nombre de la categoría (ej: "Pop Hits")
 * @returns {string} - La ruta a la imagen PNG.
 */
export const getMusicIconPath = (category) => {
    const defaultIcon = 'photos/app/music.jpg'; // Imagen genérica por si falla
    if (!category) return defaultIcon;

    const categoryMap = {
        'Chill & LoFi': 'photos/app/music/chill.png',
        'Electronic & Remixes': 'photos/app/music/electro.png',
        'Thematic & Mood': 'photos/app/music/mood.png',
        'Pop Hits': 'photos/app/music/pop.png',
        'Runway & Pageant': 'photos/app/music/runway.png',
        'Upbeat & Energetic': 'photos/app/music/upbeat.png',
        'World & Cultural': 'photos/app/music/world.png',
    };

    return categoryMap[category] || defaultIcon;
};

export const populateMusicCategoryFilter = (codes) => {
    const filter = document.getElementById('music-category-filter');
    if (!filter) return;
    
    const categories = [...new Set(codes.map(code => code.category))].filter(Boolean);
    categories.sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        filter.appendChild(option);
    });
};

export const renderMusicCodes = (codes) => {
    const resultsContainer = document.getElementById('music-results-container');
    if (!resultsContainer) return;
    resultsContainer.innerHTML = '';

    if (codes.length === 0) {
        resultsContainer.innerHTML = `<p class="text-zinc-500 text-center col-span-full">No results found.</p>`;
        return;
    }
    
    // Bucle para crear las nuevas tarjetas
    codes.forEach(code => {
        const iconSrc = getMusicIconPath(code.category);
        const pitchTag = (code.pitch && code.pitch !== 0) 
            ? `<span class="ml-2 text-xs font-semibold text-cyan-400" title="Pitch: ${code.pitch}">[PITCH]</span>` 
            : '';

        const cardHTML = ` 
        <div class="music-card facebase-card bg-[#151722] rounded-xl shadow-xl ring-1 ring-[var(--border)] overflow-hidden flex flex-col p-1.5 space-y-1.5 !w-full relative">
            
            <div class="favorite-container">
                <button class="favorite-btn" data-id="${code.id}" onclick="window.toggleFavorite('${code.id}', this)">
                    ${window.isFavorite(code.id) ? '❤️' : '🖤'}
                </button>
            </div>
            
            <div class="text-xs text-zinc-200 font-medium px-1 h-8 flex items-center justify-start gap-1">
                <span class="truncate" title="${code.title}">${code.title}</span>
                ${pitchTag}
            </div>
            
            <img src="${iconSrc}" alt="${code.category}" loading="lazy" class="w-full h-auto object-cover aspect-square rounded-md">
            
            <div class="flex items-center gap-1.5 p-1">
                <input readonly type="text" value="${code.id}" placeholder="${code.artist || 'Unknown Artist'}" class="flex-grow w-0 h-8 px-2 text-xs dark-input rounded-md" title="Artist: ${code.artist || 'Unknown Artist'}">
                <button class="copy-btn flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#1b1d24] text-zinc-200 rounded-md border border-[var(--border)] hover:bg-[#222533] transition" title="Copy ID"> 
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg> 
                </button> 
            </div> 
        </div>`;
        resultsContainer.innerHTML += cardHTML;
    });
};