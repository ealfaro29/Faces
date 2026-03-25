// src/utils/data-hooks.js
// Extracted from legacy data-loader.js

import { getRobloxThumbnailUrl } from './roblox-legacy.js';
import { db } from '../core/firebase-config.js'; 
import { collection, getDocs, updateDoc, doc, writeBatch } from "firebase/firestore";
import { getIsoCode, ISO_MAP } from './iso-utils.js';

/**
 * Updates a Facebase group (multiple variants) in Firestore.
 * @param {Array} variantItems - Array of variant objects { id, displayName }
 * @param {string} newBaseName - New name for the face (e.g. "Natural")
 * @param {string} newCountry - New country code (e.g. "BRAZIL")
 */
export async function updateFacebaseGroup(variantItems, newBaseName, newCountry) {
    if (!variantItems || !newBaseName || !newCountry) return;

    const batch = writeBatch(db);
    
    variantItems.forEach(item => {
        const itemRef = doc(db, 'facebases', item.id);
        
        // Determine the new display name: "BaseName", "BaseName S", or "BaseName X"
        let finalDisplayName = newBaseName;
        if (item.displayName.toUpperCase().endsWith(' S')) finalDisplayName += ' S';
        else if (item.displayName.toUpperCase().endsWith(' X')) finalDisplayName += ' X';

        batch.update(itemRef, {
            displayName: finalDisplayName,
            name: finalDisplayName,
            variant: finalDisplayName,
            group: newCountry.toUpperCase(),
            category: newCountry.toUpperCase(),
            lastEdited: new Date().toISOString()
        });
    });

    try {
        console.log(`DB_BATCH: Committing batch for ${variantItems.length} items...`);
        await batch.commit();
        console.log(`DB_BATCH: ✅ Successfully updated ${variantItems.length} facebase variants.`);
    } catch (error) {
        console.error("DB_BATCH: ❌ Error updating facebase group. ID mismatch?", error);
        throw error;
    }
}
/**
 * Used for "healing" broken image links.
 * @param {string} type - 'textures', 'facebases', 'avatar'
 * @param {string} docId - The Firestore document ID
 * @param {string} newUrl - The verified Roblox thumbnail URL
 */
export async function updateItemImageUrl(type, docId, newUrl) {
    if (!type || !docId || !newUrl) return;
    
    // Convert friendly type to collection name if needed
    const collectionMap = {
        'texture': 'textures',
        'facebase': 'facebases',
        'avatar': 'avatar'
    };
    const collectionName = collectionMap[type] || type;

    try {
        const itemRef = doc(db, collectionName, docId);
        console.log(`DB_UPDATE: Updating ${collectionName}/${docId}...`);
        await updateDoc(itemRef, {
            remoteUrl: newUrl,
            lastHealed: new Date().toISOString()
        });
        console.log(`DB_UPDATE: ✅ Successfully updated ${collectionName}/${docId}.`);
    } catch (error) {
        console.error(`DB_UPDATE: ❌ Error updating ${collectionName}/${docId}:`, error);
        throw error;
    }
}

export const parseItemName = () => { };

export async function initializeAllData() {
    console.log("DATA_LOADER: ☁️ Starting Cloud Data Load (Firebase ONLY)...");

    let sourceData = { textures: [], facebases: [], avatar: [], music: [] };

    try {
        const queries = [
            getDocs(collection(db, 'textures')).catch(e => { console.warn("Failed textures", e); return { empty: true, forEach: () => {} }; }),
            getDocs(collection(db, 'facebases')).catch(e => { console.warn("Failed facebases", e); return { empty: true, forEach: () => {} }; }),
            getDocs(collection(db, 'avatar')).catch(e => { console.warn("Failed avatar", e); return { empty: true, forEach: () => {} }; }),
            getDocs(collection(db, 'music')).catch(e => { console.warn("Failed music", e); return { empty: true, forEach: () => {} }; })
        ];

        const [texSnap, faceSnap, avSnap, musicSnap] = await Promise.all(queries);

        texSnap.forEach(doc => sourceData.textures.push({ ...doc.data(), docId: doc.id }));
        faceSnap.forEach(doc => sourceData.facebases.push({ ...doc.data(), docId: doc.id }));
        avSnap.forEach(doc => sourceData.avatar.push({ ...doc.data(), docId: doc.id }));
        musicSnap.forEach(doc => sourceData.music.push({ ...doc.data(), docId: doc.id }));

    } catch (error) {
        console.error("DATA_LOADER: CRITICAL ERROR - Could not load from Firebase.", error);
    }

    // Normalizar texturas
    const allTextureItems = (sourceData.textures || []).map(item => ({
        id: item.docId,
        group: item.category || item.group || item.type,
        displayName: item.displayName || item.fullName || item.name,
        codeId: item.robloxId,
        src: item.remoteUrl || getRobloxThumbnailUrl(item.robloxId),
        type: 'texture',
        baseName: item.baseName || item.name,
        hidden: !!item.hidden
    }));

    // Normalizar facebases
    const allFacebaseItems = (sourceData.facebases || []).map(item => ({
        id: item.docId, // Use the real Firestore Document ID
        group: (item.group || item.category || 'General').toUpperCase(),
        displayName: item.displayName || item.name || item.variant,
        codeId: item.robloxId,
        src: item.remoteUrl || getRobloxThumbnailUrl(item.robloxId),
        type: 'facebase',
        hidden: !!item.hidden
    }));

    // Normalizar avatar items
    const allAvatarItems = (sourceData.avatar || []).map(item => ({
        id: item.docId,
        group: (item.category || item.group || 'General').toUpperCase(),
        displayName: item.displayName || item.name,
        codeId: item.robloxId,
        src: item.remoteUrl || getRobloxThumbnailUrl(item.robloxId),
        type: 'avatar',
        hidden: !!item.hidden
    }));

    const allMusicCodes = (sourceData.music || []).map(item => ({
        ...item,
        id: item.docId, // Consistency
        hidden: !!item.hidden
    }));
    const facebaseCategories = generateFacebaseCategories(allFacebaseItems);
    const allTextureBasenames = allTextureItems.map(t => t.baseName);

    return {
        allFacebaseItems,
        facebaseCategories,
        allAvatarItems,
        allTextureBasenames,
        allTextureItems,
        allMusicCodes,
        rawDb: sourceData
    };
}

function generateFacebaseCategories(items) {
    const countries = new Set();
    const others = new Set();
    const knownCountries = ['BRAZIL', 'UK', 'USA', 'ZAMBIA', 'IRELAND', 'ITALY', 'INDIA', 'BELGIUM', 'EGYPT', 'SPAIN', 'FRANCE', 'COSTA RICA', 'THAILAND', 'KOREA', 'JAPAN'];

    items.forEach(item => {
        const group = item.group;
        if (knownCountries.includes(group)) {
            countries.add(group);
        } else {
            others.add(group);
        }
    });

    return {
        countries: Array.from(countries).map(name => ({
            name: name.charAt(0) + name.slice(1).toLowerCase(),
            iso: getIsoCode(name)
        })),
        others: Array.from(others).map(name => ({
            name: name.charAt(0) + name.slice(1).toLowerCase(),
            flag: `photos/app/${name.charAt(0) + name.slice(1).toLowerCase()}.webp`
        }))
    };
}

/**
 * Migration Script: Normalizes all existing Facebases to the standard country list.
 */
export async function migrateFacebaseCountries() {
    console.log("MIGRATION: 🌏 Starting Facebase country normalization...");
    try {
        const snap = await getDocs(collection(db, 'facebases'));
        const batch = writeBatch(db);
        let count = 0;

        snap.forEach(d => {
            const data = d.data();
            const currentGroup = (data.category || data.group || '').toUpperCase().trim();
            
            // Look for a match in ISO_MAP keys
            let standardMatch = Object.keys(ISO_MAP).find(std => 
                std === currentGroup || 
                std.replace(/\s+/g, '') === currentGroup.replace(/\s+/g, '')
            );

            // Extra heuristics: If it's already an ISO code, it might need to be converted to the full name
            if (!standardMatch) {
                const results = Object.entries(ISO_MAP).find(([name, iso]) => iso === currentGroup);
                if (results) standardMatch = results[0];
            }

            if (standardMatch && currentGroup !== standardMatch) {
                batch.update(doc(db, 'facebases', d.id), {
                    group: standardMatch,
                    category: standardMatch,
                    lastMigrated: new Date().toISOString()
                });
                count++;
            }
        });

        if (count > 0) {
            await batch.commit();
            console.log(`MIGRATION: ✅ Standardized ${count} records.`);
            return count;
        } else {
            console.log("MIGRATION: ⏭️ No records needed standardizing.");
            return 0;
        }
    } catch (error) {
        console.error("MIGRATION: ❌ Error during normalization:", error);
        throw error;
    }
}

/**
 * Toggles an item's visibility (hidden state) in Firestore.
 * @param {string} type - 'textures', 'facebases', 'avatar'
 * @param {string} docId - The Firestore document ID
 * @param {boolean} hidden - The new hidden state
 */
export async function toggleItemVisibility(type, docId, hidden) {
    if (!type || !docId) return;

    const collectionMap = {
        'texture': 'textures',
        'facebase': 'facebases',
        'avatar': 'avatar'
    };
    const collectionName = collectionMap[type] || type;

    try {
        const itemRef = doc(db, collectionName, docId);
        console.log(`DB_UPDATE: Setting visibility for ${collectionName}/${docId} to ${hidden}...`);
        await updateDoc(itemRef, {
            hidden: hidden,
            lastHiddenUpdate: new Date().toISOString()
        });
        console.log(`DB_UPDATE: ✅ Set ${collectionName}/${docId} hidden to ${hidden}.`);
    } catch (error) {
        console.error(`DB_UPDATE: ❌ Error toggling visibility for ${collectionName}/${docId}:`, error);
        throw error;
    }
}
/**
 * Decouples Facebases by ensuring every document has a unique name+country combination.
 * If duplicates are found, they are suffixed with (1), (2), etc.
 * This effectively "breaks" unintended groups.
 */
export async function decoupleFacebaseNames() {
    console.log("DECAPPING: 💥 Starting Facebase decoupling...");
    try {
        const snap = await getDocs(collection(db, 'facebases'));
        const allItems = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        const batch = writeBatch(db);
        let updateCount = 0;

        // Group by EXACT Country + DisplayName
        const collisionMap = {};
        allItems.forEach(item => {
            const name = (item.displayName || item.name || '').trim();
            const group = (item.group || item.category || 'General').toUpperCase().trim();
            const key = `${group}|${name}`;
            if (!collisionMap[key]) collisionMap[key] = [];
            collisionMap[key].push(item);
        });

        // Resolve collisions
        Object.entries(collisionMap).forEach(([key, items]) => {
            if (items.length > 1) {
                // We have multiple items with the exact same name and country
                items.forEach((item, index) => {
                    const originalName = (item.displayName || item.name || '').trim();
                    const newName = `${originalName} (${index + 1})`;
                    
                    batch.update(doc(db, 'facebases', item.id), {
                        displayName: newName,
                        name: newName, // Sync both fields just in case
                        lastDecoupled: new Date().toISOString()
                    });
                    updateCount++;
                });
            }
        });

        if (updateCount > 0) {
            await batch.commit();
            console.log(`DECAPPING: ✅ Decoupled ${updateCount} records with unique names.`);
            return updateCount;
        } else {
            console.log("DECAPPING: ⏭️ No naming collisions found.");
            return 0;
        }
    } catch (error) {
        console.error("DECAPPING: ❌ Error during decoupling:", error);
        throw error;
    }
}
