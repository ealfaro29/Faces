import { useState, useCallback } from 'react';

const FAVORITES_KEY = 'fashion_muse_favorites';

export function useFavorites() {
    const [favorites, setFavorites] = useState(() => {
        try {
            const stored = localStorage.getItem(FAVORITES_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch (error) {
            console.error('Error loading favorites:', error);
            return new Set();
        }
    });

    const toggleFavorite = useCallback((id, variantIds = null) => {
        setFavorites(prevFavorites => {
            const newFavorites = new Set(prevFavorites);
            let idsToToggle = variantIds || [id];

            const isCurrentlyFavorite = newFavorites.has(id);

            if (isCurrentlyFavorite) {
                idsToToggle.forEach(vid => newFavorites.delete(vid));
            } else {
                idsToToggle.forEach(vid => newFavorites.add(vid));
            }

            try {
                localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(newFavorites)));
            } catch (error) {
                console.error('Error saving favorites:', error);
            }

            return newFavorites;
        });
    }, []);

    const isFavorite = useCallback((id) => favorites.has(id), [favorites]);

    return { favorites, toggleFavorite, isFavorite };
}
