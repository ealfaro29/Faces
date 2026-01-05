// core/favorites.js - Lógica centralizada de favoritos

const FAVORITES_KEY = 'fashion_muse_favorites';

export function getFavorites() {
    try {
        const stored = localStorage.getItem(FAVORITES_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (error) {
        console.error('Error loading favorites:', error);
        return new Set();
    }
}

export function isFavorite(id) {
    return getFavorites().has(id);
}

export function toggleFavorite(passedId, buttonElement) {
    const currentId = buttonElement.dataset.id;
    const favorites = getFavorites();
    let isNowFavorite = false;
    let idsToToggle = [];

    const variantIdsJSON = buttonElement.dataset.variantIds;

    if (variantIdsJSON) {
        try {
            idsToToggle = JSON.parse(variantIdsJSON);
        } catch (e) {
            console.error('Error parsing variant IDs:', e);
            idsToToggle = [currentId];
        }
    } else {
        idsToToggle = [currentId];
    }

    if (favorites.has(currentId)) {
        isNowFavorite = false;
        idsToToggle.forEach(vid => favorites.delete(vid));
    } else {
        isNowFavorite = true;
        idsToToggle.forEach(vid => favorites.add(vid));
    }

    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
    } catch (error) {
        console.error('Error saving favorites:', error);
    }

    if (buttonElement) {
        buttonElement.innerHTML = isNowFavorite ? '❤️' : '🖤';
        buttonElement.classList.toggle('is-favorite', isNowFavorite);
    }

    return isNowFavorite;
}

// Exportar para uso global
window.getFavorites = getFavorites;
window.isFavorite = isFavorite;
window.toggleFavorite = toggleFavorite;
