// core/search.js - Lógica de búsqueda y filtrado

export function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

export function groupFacebaseVariants(items) {
    const grouped = {};
    const variantRegex = /^(.*?)( S| X)$/i;

    for (const item of items) {
        let baseDisplayName = item.displayName;
        let variant = 'default';

        const match = item.displayName.match(variantRegex);

        if (match) {
            baseDisplayName = match[1].trim();
            variant = match[2].trim().toUpperCase();
        }

        const key = `${item.group}-${baseDisplayName}`;

        if (!grouped[key]) {
            grouped[key] = {
                group: item.group,
                baseDisplayName: baseDisplayName,
                defaultItem: null,
                variants: {}
            };
        }

        grouped[key].variants[variant] = item;
        if (variant === 'default') {
            grouped[key].defaultItem = item;
        }
    }

    return Object.values(grouped).filter(g => g.defaultItem);
}

export function createFilterFunction(store, renderers) {
    return function filterContent() {
        const state = store.getState();
        if (!state.globalDataLoaded) return;

        const activeTab = document.querySelector('.tab-nav-button.active')?.dataset.tab;
        const searchBar = document.getElementById('search-bar');
        const searchTerm = searchBar?.value.toLowerCase().trim() || '';

        const facebaseCategoryFilter = document.getElementById('facebase-category-filter');
        const avatarCategoryFilter = document.getElementById('avatar-category-filter');
        const textureCategoryFilter = document.getElementById('texture-category-filter');
        const musicCategoryFilter = document.getElementById('music-category-filter');

        if (activeTab === 'facebases') {
            const selectedCategory = facebaseCategoryFilter?.value || 'all';
            const filteredItems = state.allFacebaseGroups.filter(group => {
                const matchesCategory = selectedCategory === 'all' || group.group === selectedCategory.toUpperCase();
                const matchesSearch = searchTerm === '' ||
                    group.baseDisplayName.toLowerCase().includes(searchTerm) ||
                    group.group.toLowerCase().includes(searchTerm);
                return matchesCategory && matchesSearch;
            });
            renderers.renderFacebasesGallery(filteredItems, state.facebaseCategories);

        } else if (activeTab === 'avatar') {
            const selectedCategory = avatarCategoryFilter?.value || 'all';
            const filteredItems = state.allAvatarItems.filter(item => {
                const matchesCategory = selectedCategory === 'all' || item.group === selectedCategory;
                const matchesSearch = searchTerm === '' ||
                    item.group.toLowerCase().includes(searchTerm) ||
                    item.displayName.toLowerCase().includes(searchTerm);
                return matchesCategory && matchesSearch;
            });
            renderers.renderAvatarGallery(filteredItems);

        } else if (activeTab === 'textures') {
            const selectedCategory = textureCategoryFilter?.value || 'all';
            const filteredItems = state.allTextureGroups.filter(group => {
                if (!group || !group.variants || group.variants.length === 0) return false;

                // Un grupo coincide con la categoría si alguna de sus variantes pertenece a esa categoría
                const matchesCategory = selectedCategory === 'all' ||
                    group.variants.some(variant => variant.group === selectedCategory);

                // Para la búsqueda, verificar si coincide con alguna variante
                const matchesSearch = searchTerm === '' ||
                    group.baseName.toLowerCase().includes(searchTerm) ||
                    group.variants.some(variant =>
                        variant.group.toLowerCase().includes(searchTerm) ||
                        variant.displayName.toLowerCase().includes(searchTerm)
                    );

                return matchesCategory && matchesSearch;
            });
            renderers.renderTextureGallery(filteredItems);

        } else if (activeTab === 'music') {
            const selectedCategory = musicCategoryFilter?.value || 'all';
            const filteredCodes = state.allMusicCodes.filter(code => {
                const matchesCategory = selectedCategory === 'all' || code.category === selectedCategory;
                const searchCorpus = `${code.title.toLowerCase()} ${code.artist ? code.artist.toLowerCase() : ''} ${(code.markers || []).join(' ')}`;
                return matchesCategory && searchCorpus.includes(searchTerm);
            });
            renderers.renderMusicCodes(filteredCodes);

        } else if (activeTab === 'favorites') {
            const favorites = window.getFavorites();
            const allItems = [
                ...state.allFacebaseItems.map(item => ({ ...item, id: item.id || item.codeId, type: 'facebase' })),
                ...state.allAvatarItems.map(item => ({ ...item, id: item.id || item.codeId, type: 'avatar' })),
                ...state.allTextureItems.map(item => ({ ...item, type: 'texture' })),
                ...state.allMusicCodes.map(item => ({ ...item, type: 'music' })),
            ];

            const favoritedItems = allItems.filter(item => {
                const isFav = item.id ? favorites.has(item.id) : false;
                const matchesSearch = searchTerm === '' ||
                    (item.displayName?.toLowerCase().includes(searchTerm)) ||
                    (item.group?.toLowerCase().includes(searchTerm)) ||
                    (item.title?.toLowerCase().includes(searchTerm)) ||
                    (item.artist?.toLowerCase().includes(searchTerm));
                return isFav && matchesSearch;
            });

            renderers.renderFavoritesGallery(favoritedItems, state.facebaseCategories);
        }
    };
}
