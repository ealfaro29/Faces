import { useState, useCallback } from 'react';

const GROUPS_KEY = 'pageants_custom_groups';

/**
 * Custom hook for managing user-defined item groups.
 * Groups are stored in localStorage.
 * 
 * Each group: { id, name, itemIds: string[], coverItemId: string }
 */
export function useGroups() {
    const [groups, setGroups] = useState(() => {
        try {
            const stored = localStorage.getItem(GROUPS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const saveGroups = (newGroups) => {
        setGroups(newGroups);
        try {
            localStorage.setItem(GROUPS_KEY, JSON.stringify(newGroups));
        } catch (error) {
            console.error('Error saving groups:', error);
        }
    };

    const createGroup = useCallback((name, itemIds, coverItemId) => {
        const newGroup = {
            id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name,
            itemIds,
            coverItemId: coverItemId || itemIds[0],
            createdAt: Date.now()
        };
        const updated = [...groups, newGroup];
        saveGroups(updated);
        return newGroup;
    }, [groups]);

    const deleteGroup = useCallback((groupId) => {
        const updated = groups.filter(g => g.id !== groupId);
        saveGroups(updated);
    }, [groups]);

    const updateGroup = useCallback((groupId, updates) => {
        const updated = groups.map(g =>
            g.id === groupId ? { ...g, ...updates } : g
        );
        saveGroups(updated);
    }, [groups]);

    const isItemGrouped = useCallback((itemId) => {
        return groups.some(g => g.itemIds.includes(itemId));
    }, [groups]);

    const getGroupForItem = useCallback((itemId) => {
        return groups.find(g => g.itemIds.includes(itemId));
    }, [groups]);

    return { groups, createGroup, deleteGroup, updateGroup, isItemGrouped, getGroupForItem };
}
