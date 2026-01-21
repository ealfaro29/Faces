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
        displayName = parts.slice(1).join('-').replace(/[-_]/g, ' ');
    } else {
        group = label.split('-')[0] || 'Uncategorized';
        displayName = label.replace(new RegExp('^' + group + '-'), '').replace(/[-_]/g, ' ');
    }

    // MODIFICACIÓN: Usar codeId como 'id' principal si es una textura para que coincida con Favorites.
    const itemId = (pathPrefix === TEXTURES_PATH && codeId) ? codeId : name;

    return {
        id: itemId, // <-- Cambiado: usa codeId para texturas, nombre completo para otros
        group: group.toUpperCase(),
        displayName,
        codeId,
        src: `${pathPrefix}/${name}.webp`,
        type: pathPrefix.includes('facebases') ? 'facebase' : (pathPrefix.includes('textures') ? 'texture' : 'avatar'),
        path: pathPrefix
    };
};

/**
 * Carga todos los datos JSON de la aplicación con manejo robusto de errores.
 * @returns {Promise<object>} Objeto con todos los datos.
 */
export async function initializeAllData() {
    console.log("DATA_LOADER: Iniciando la carga de archivos JSON.");

    try {
        const [facebasesBasenames, categoriesData, itemBasenames, textureBasenames, musicData] = await Promise.all([
            fetchWithErrorHandling(`${FACEBASES_PATH}/facebases.json`, 'Facebases'),
            fetchWithErrorHandling(`${FACEBASES_PATH}/categories.json`, 'Categories'),
            fetchWithErrorHandling(`${ITEMS_PATH}/items.json`, 'Items'),
            fetchWithErrorHandling(`${TEXTURES_PATH}/textures.json`, 'Textures'),
            fetchWithErrorHandling('music.json', 'Music')
        ]);

        const allFacebaseItems = facebasesBasenames.map(basename => parseItemName(basename, FACEBASES_PATH));
        const allAvatarItems = itemBasenames.map(basename => parseItemName(basename, ITEMS_PATH));
        const allTextureBasenames = textureBasenames;

        console.log(`DATA_LOADER: Éxito en la carga. Facebases: ${allFacebaseItems.length}, Avatars: ${allAvatarItems.length}, Textures: ${allTextureBasenames.length}`);

        return {
            allFacebaseItems,
            facebaseCategories: categoriesData,
            allAvatarItems,
            allTextureBasenames,
            allMusicCodes: musicData
        };
    } catch (error) {
        console.error('DATA_LOADER: Error crítico durante la carga de datos:', error);
        showLoadingError('Failed to load application data. Please refresh the page.');
        throw error;
    }
}

/**
 * Función auxiliar para fetch con manejo de errores
 */
async function fetchWithErrorHandling(url, resourceName) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✓ ${resourceName} loaded successfully`);
        return data;

    } catch (error) {
        console.error(`✗ Error loading ${resourceName} from ${url}:`, error.message);

        // Si es un error de red
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error(`Network error loading ${resourceName}. Check your connection.`);
        }

        // Si es un error de JSON parsing
        if (error instanceof SyntaxError) {
            throw new Error(`Invalid JSON format in ${resourceName}.`);
        }

        throw error;
    }
}

/**
 * Muestra un error de carga al usuario
 */
function showLoadingError(message) {
    const errorBanner = document.createElement('div');
    errorBanner.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] bg-red-600 text-white px-6 py-4 rounded-lg shadow-xl max-w-md text-center';
    errorBanner.innerHTML = `
        <div class="flex items-center gap-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <div class="flex-1">
                <p class="font-semibold">${message}</p>
                <button onclick="location.reload()" class="mt-2 px-4 py-1 bg-white text-red-600 rounded hover:bg-gray-100 transition">
                    Retry
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(errorBanner);
}