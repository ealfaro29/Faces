// data-loader.js

const FACEBASES_PATH = 'photos/facebases';
const ITEMS_PATH = 'photos/items';
const TEXTURES_PATH = 'photos/textures';

/**
 * Función genérica para parsear nombres de archivo a objetos de datos.
 */
export const parseItemName = (basename, pathPrefix) => {
    const name = basename; 
    const lastUnderscore = name.lastIndexOf('_');
    let label = name, codeId = '';

    if (lastUnderscore > -1) { 
        const maybeId = name.slice(lastUnderscore + 1); 
        if (!isNaN(maybeId) && maybeId.trim() !== '') { 
            label = name.slice(0, lastUnderscore); 
            codeId = maybeId; 
        } 
    }

    let group;
    let displayName;
    
    if (pathPrefix === TEXTURES_PATH) {
        const parts = label.split('-');
        group = parts[0];
        displayName = parts.slice(1).join('-').replace(/[-_]/g,' ');
    } else {
        group = label.split('-')[0] || 'Uncategorized';
        displayName = label.replace(new RegExp('^' + group + '-'), '').replace(/[-_]/g,' ');
    }
    
    return { 
        id: name, 
        group: group.toUpperCase(), 
        displayName, 
        codeId, 
        src: `${pathPrefix}/${name}.png`,
        type: pathPrefix.includes('facebases') ? 'facebase' : (pathPrefix.includes('textures') ? 'texture' : 'avatar'),
        path: pathPrefix
    };
};

/**
 * Carga todos los datos JSON de la aplicación.
 * @returns {Promise<object>} Objeto con todos los datos.
 */
export async function initializeAllData() {
    console.log("DATA_LOADER: Iniciando la carga de archivos JSON.");
    const [facebasesBasenames, categoriesData, itemBasenames, textureBasenames, musicData] = await Promise.all([
        fetch(`${FACEBASES_PATH}/facebases.json`).then(res => res.json()),
        fetch(`${FACEBASES_PATH}/categories.json`).then(res => res.json()),
        fetch(`${ITEMS_PATH}/items.json`).then(res => res.json()),
        fetch(`${TEXTURES_PATH}/textures.json`).then(res => res.json()), // textureBasenames es ahora la lista cruda de strings
        fetch('music.json').then(res => res.json())
    ]);

    const allFacebaseItems = facebasesBasenames.map(basename => parseItemName(basename, FACEBASES_PATH));
    const allAvatarItems = itemBasenames.map(basename => parseItemName(basename, ITEMS_PATH));
    
    // MODIFICACION: allTextureBasenames es la lista de strings (filenames) que groupTextureVariants espera.
    const allTextureBasenames = textureBasenames; 

    console.log(`DATA_LOADER: Éxito en la carga. Facebases: ${allFacebaseItems.length}, Avatars: ${allAvatarItems.length}, Textures: ${allTextureBasenames.length}`);

    return {
        allFacebaseItems,
        facebaseCategories: categoriesData,
        allAvatarItems,
        allTextureBasenames, // <-- Devolvemos la lista de strings
        allMusicCodes: musicData
    };
}