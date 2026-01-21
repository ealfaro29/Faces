// data-loader.js
import { getRobloxThumbnailUrl } from './utils/roblox.js';
import { db } from './core/firebase.js'; // Import Firestore instance
import { collection, getDocs } from "firebase/firestore";

// Rutas de archivos JSON generados (FALLBACK)
const DB_PATH = 'database.json';

/**
 * Carga todos los datos JSON de la aplicación.
 * AHORA: Conecta a Firebase, fallback a JSON si falla.
 */
export async function initializeAllData() {
    console.log("DATA_LOADER: ☁️ Starting Cloud Data Load (Firebase ONLY)...");

    let sourceData = { textures: [], facebases: [], avatar: [], music: [] };
    let source = "FIREBASE";

    try {
        console.log("DATA_LOADER: Fetching from Firestore...");

        const [texSnap, faceSnap, avSnap, musicSnap] = await Promise.all([
            getDocs(collection(db, 'textures')),
            getDocs(collection(db, 'facebases')),
            getDocs(collection(db, 'avatar')),
            getDocs(collection(db, 'music'))
        ]);

        if (texSnap.empty && faceSnap.empty && avSnap.empty) {
            console.warn("DATA_LOADER: Firestore is empty!");
        }

        texSnap.forEach(doc => sourceData.textures.push({ ...doc.data(), id: doc.id }));
        faceSnap.forEach(doc => sourceData.facebases.push(doc.data()));
        avSnap.forEach(doc => sourceData.avatar.push(doc.data()));
        musicSnap.forEach(doc => sourceData.music.push(doc.data()));

    } catch (error) {
        console.error("DATA_LOADER: CRITICAL ERROR - Could not load from Firebase.", error);
        throw error;
    }

    console.log(`DATA_LOADER: Cloud load complete. Items: T:${sourceData.textures.length} F:${sourceData.facebases.length} A:${sourceData.avatar.length}`);

    // 2. Mapear y Normalizar datos (sourceData ya tiene la estructura correcta)
    // TEXTURAS
    const allTextureItems = (sourceData.textures || []).map(item => ({
        id: item.id || item.robloxId, // Fallback ID
        group: item.type || item.category, // 'ST', 'M', etc. -> Check consistency
        displayName: item.fullName || item.name,
        codeId: item.robloxId,
        src: item.remoteUrl || getRobloxThumbnailUrl(item.robloxId),
        type: 'texture',
        baseName: item.baseName || item.name // "Peacock"
    }));

    // FACEBASES
    const allFacebaseItems = (sourceData.facebases || []).map(item => ({
        id: item.id || item.robloxId,
        group: (item.category || item.group || 'General').toUpperCase(), // "BRAZIL"
        displayName: item.variant || item.name, // "Natural"
        codeId: item.robloxId,
        src: item.remoteUrl || getRobloxThumbnailUrl(item.robloxId),
        type: 'facebase'
    }));

    // AVATAR ITEMS
    const allAvatarItems = (sourceData.avatar || []).map(item => ({
        id: item.id || item.robloxId,
        group: (item.category || 'General').toUpperCase(), // "HAIR"
        displayName: item.name,
        codeId: item.robloxId,
        src: item.remoteUrl || getRobloxThumbnailUrl(item.robloxId),
        type: 'avatar'
    }));

    // MUSIC
    // MUSIC
    const allMusicCodes = sourceData.music || [];

    // CATEGORIAS (Regeneradas dinámicamente)
    const facebaseCategories = generateFacebaseCategories(allFacebaseItems);

    // Texture Basenames (Compatibility)
    const allTextureBasenames = allTextureItems.map(t => t.baseName);

    console.log(`DATA_LOADER: Procesamiento completo. ${allTextureItems.length} texturas, ${allFacebaseItems.length} facebases.`);

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

// Helper para regenerar categorías de facebases al vuelo (Sin cambios)
function generateFacebaseCategories(items) {
    const countries = new Set();
    const others = new Set();

    // Lista básica de ISOs conocidos
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
            name: name.charAt(0) + name.slice(1).toLowerCase(), // Capitalize "Brazil"
            iso: getIsoCode(name)
        })),
        others: Array.from(others).map(name => ({
            name: name.charAt(0) + name.slice(1).toLowerCase(),
            flag: `photos/app/${name.charAt(0) + name.slice(1).toLowerCase()}.webp`
        }))
    };
}

function getIsoCode(name) {
    const map = {
        'BRAZIL': 'BR', 'UK': 'GB', 'USA': 'US', 'ZAMBIA': 'ZM', 'IRELAND': 'IE',
        'ITALY': 'IT', 'INDIA': 'IN', 'BELGIUM': 'BE', 'EGYPT': 'EG', 'SPAIN': 'ES',
        'FRANCE': 'FR', 'COSTA RICA': 'CR', 'THAILAND': 'TH', 'JAPAN': 'JP', 'KOREA': 'KR'
    };
    return map[name.toUpperCase()] || 'XX';
}

export const parseItemName = () => { };
