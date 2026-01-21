// data-loader.js
import { getRobloxThumbnailUrl } from './utils/roblox.js';

// Rutas de archivos JSON generados
const DB_PATH = 'database.json'; // O public/database.json dependiendo del deploy, pero en Vite 'public' es raíz.

/**
 * Carga todos los datos JSON de la aplicación.
 * Ahora centralizado en database.json
 */
export async function initializeAllData() {
    console.log("DATA_LOADER: Iniciando carga optimizada desde database.json");

    try {
        const dbResponse = await fetch(DB_PATH);
        if (!dbResponse.ok) throw new Error(`Failed to load database.json: ${dbResponse.statusText}`);

        const db = await dbResponse.json();

        // Mapear los datos al formato que espera la app
        // TEXTURAS
        const allTextureItems = db.textures.map(item => ({
            id: item.id,
            group: item.type, // 'ST', 'M', etc.
            displayName: item.fullName, // "Peacock Blue"
            codeId: item.robloxId,
            src: getRobloxThumbnailUrl(item.robloxId), // URL dinámica de Roblox
            // src: item.originalFilename ? `photos/textures/${item.originalFilename}` : null, // Fallback a local si quisiéramos
            type: 'texture',
            baseName: item.name // "Peacock"
        }));

        // FACEBASES
        const allFacebaseItems = db.facebases.map(item => ({
            id: item.id,
            group: item.category.toUpperCase(), // "BRAZIL"
            displayName: item.variant, // "Natural"
            codeId: item.robloxId,
            src: getRobloxThumbnailUrl(item.robloxId),
            type: 'facebase'
        }));

        // AVATAR ITEMS
        const allAvatarItems = db.avatar.map(item => ({
            id: item.id,
            group: item.category.toUpperCase(), // "HAIR"
            displayName: item.name,
            codeId: item.robloxId,
            src: getRobloxThumbnailUrl(item.robloxId),
            type: 'avatar'
        }));

        // MUSIC
        // Music ya viene limpio en el JSON, solo lo pasamos
        const allMusicCodes = db.music || [];

        // CATEGORIAS (Podríamos generarlas dinámicamente o leerlas si las guardáramos en DB)
        // Por ahora, regeneramos la estructura de categorías de Facebases basada en los datos cargados
        const facebaseCategories = generateFacebaseCategories(allFacebaseItems);

        // Texture Basenames (para compatibilidad con lógica antigua si queda alguna)
        const allTextureBasenames = db.textures.map(t => t.originalFilename?.replace('.webp', '').replace('.png', ''));

        console.log(`DATA_LOADER: Carga exitosa. ${allTextureItems.length} texturas, ${allFacebaseItems.length} facebases.`);

        return {
            allFacebaseItems,
            facebaseCategories,
            allAvatarItems,
            allTextureBasenames, // Mantenemos por si acaso, aunque sea redundante
            allTextureItems,    // EXPORTAMOS LA LISTA IMPORTANTE
            allMusicCodes,
            rawDb: db
        };

    } catch (error) {
        console.error('DATA_LOADER: Error crítico cargando base de datos:', error);
        // Fallback or alert
        throw error;
    }
}

// Helper para regenerar categorías de facebases al vuelo
function generateFacebaseCategories(items) {
    const countries = new Set();
    const others = new Set();

    // Lista básica de ISOs conocidos (podríamos mover esto a un config compartido)
    const knownCountries = ['BRAZIL', 'UK', 'USA', 'ZAMBIA', 'IRELAND', 'ITALY', 'INDIA', 'BELGIUM', 'EGYPT', 'SPAIN', 'FRANCE'];

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
            flag: `photos/app/${name.charAt(0) + name.slice(1).toLowerCase()}.webp` // Asumimos que existen los iconos de categoría
        }))
    };
}

function getIsoCode(name) {
    const map = { 'BRAZIL': 'BR', 'UK': 'GB', 'USA': 'US', 'ZAMBIA': 'ZM', 'IRELAND': 'IE', 'ITALY': 'IT', 'INDIA': 'IN', 'BELGIUM': 'BE', 'EGYPT': 'EG' };
    return map[name.toUpperCase()] || 'XX';
}

// Exportamos parseItemName aunque ya no se use activamente, para no romper imports antiguos si los hay
export const parseItemName = () => { }; 