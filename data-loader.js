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
// export async function initializeAllData() {
//     console.log("DATA_LOADER: Iniciando carga optimizada...");
//     // ... (FIREBASE LOGIC COMMENTED OUT FOR STABILITY) ...
// }

export async function initializeAllData() {
    console.log("DATA_LOADER: 🛡️ SAFE MODE - Loading purely from database.json");

    let sourceData = { textures: [], facebases: [], avatar: [], music: [] };
    let source = "LOCAL_JSON";

    try {
        const dbResponse = await fetch(DB_PATH);
        if (!dbResponse.ok) throw new Error(`Failed to load database.json: ${dbResponse.statusText}`);
        sourceData = await dbResponse.json();

    } catch (error) {
        console.error("DATA_LOADER: CRITICAL ERROR loading local database.", error);
        throw error;
    }

    console.log(`DATA_LOADER: Data loaded from [${source}]`);

    // 2. Mapear y Normalizar datos (Igual que antes)
    const dbData = sourceData; // Mantener compatibilidad de nombres
    // const sourceData = dbData; // Ya lo tenemos definido arriba

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
