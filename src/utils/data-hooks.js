// src/utils/data-hooks.js
// Extracted from legacy data-loader.js

import { getRobloxThumbnailUrl } from './roblox-legacy.js';
import { db } from '../core/firebase-config.js'; 
import { collection, getDocs } from "firebase/firestore";
import { getIsoCode } from './iso-utils.js';

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

        texSnap.forEach(doc => sourceData.textures.push({ ...doc.data(), id: doc.id }));
        faceSnap.forEach(doc => sourceData.facebases.push(doc.data()));
        avSnap.forEach(doc => sourceData.avatar.push(doc.data()));
        musicSnap.forEach(doc => sourceData.music.push(doc.data()));

    } catch (error) {
        console.error("DATA_LOADER: CRITICAL ERROR - Could not load from Firebase.", error);
    }

    // Normalizar texturas
    const allTextureItems = (sourceData.textures || []).map(item => ({
        id: item.id || item.robloxId,
        group: item.type || item.category,
        displayName: item.fullName || item.name,
        codeId: item.robloxId,
        src: item.remoteUrl || getRobloxThumbnailUrl(item.robloxId),
        type: 'texture',
        baseName: item.baseName || item.name
    }));

    // Normalizar facebases
    const allFacebaseItems = (sourceData.facebases || []).map(item => ({
        id: item.id || item.robloxId,
        group: (item.category || item.group || 'General').toUpperCase(),
        displayName: item.variant || item.name,
        codeId: item.robloxId,
        src: item.remoteUrl || getRobloxThumbnailUrl(item.robloxId),
        type: 'facebase'
    }));

    // Normalizar avatar items
    const allAvatarItems = (sourceData.avatar || []).map(item => ({
        id: item.id || item.robloxId,
        group: (item.category || 'General').toUpperCase(),
        displayName: item.name,
        codeId: item.robloxId,
        src: item.remoteUrl || getRobloxThumbnailUrl(item.robloxId),
        type: 'avatar'
    }));

    const allMusicCodes = sourceData.music || [];
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
