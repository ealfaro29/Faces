// tabs/music.js

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
    codes.forEach(code => {
        const cardHTML = ` 
        <div class="music-card rounded-lg p-4 flex flex-col justify-between gap-3 relative"> 
            <div class="favorite-container !top-2 !right-2 !bg-transparent !backdrop-filter-none !w-auto !h-auto">
                <button class="favorite-btn" data-id="${code.id}" onclick="window.toggleFavorite('${code.id}', this)">
                    ${window.isFavorite(code.id) ? '❤️' : '🖤'}
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