/**
 * Obtiene la URL del thumbnail de un asset de Roblox.
 * Utiliza la API pública de Roblox Thumbnails.
 * 
 * @param {string} assetId - El ID numérico del asset en Roblox.
 * @param {string} size - Tamaño deseado (ej: "420x420", "150x150").
 * @param {string} format - Formato de imagen (ej: "Png", "Jpeg").
 * @returns {string} - La URL donde se puede cargar la imagen.
 */
export const getRobloxThumbnailUrl = (assetId, size = "420x420", format = "Png") => {
    if (!assetId || isNaN(assetId)) return 'photos/app/logo.svg'; // Fallback

    // Opción 1: API directa de Thumbnails (puede tener rate limits o CORS si se llama desde frontend directo, 
    // pero Roblox suele permitir embeddings. Si falla, usaremos un proxy o servicio alternativo).
    // URL Doc: https://thumbnails.roblox.com/docs/index.html

    // NOTA: Para producción real, a veces es mejor usar un proxy propio para evitar bloqueos CORS estrictos del navegador,
    // pero probaremos primero la construcción directa que usan muchas webs de fans.

    // URL batch (más eficiente): https://thumbnails.roblox.com/v1/assets?assetIds=...

    // Sin embargo, como necesitamos una URL síncrona para poner en el <img src="..."> inmediatamente
    // sin hacer fetch async previo, esto es complicado porque las URLs de CDN de Roblox caducan o son dinámicas.

    // SOLUCIÓN MEJORADA: Usar un servicio de proxy de imágenes de Roblox confiable o 
    // asumir que haremos la carga asíncrona en el componente.

    // Por ahora, usaremos una API wrapper simple o rbxcdn si es posible predecirla.
    // Como no podemos predecir la URL final de cdn (hash), tenemos que hacer una llamada a la API.

    // Retornamos una URL especial que nuestro componente sepa manejar, o una promesa?
    // Para simplificar la migración, intentaremos usar una URL de rbxcdn SI tuvieramos el hash.
    // Como no lo tenemos, usaremos la API de thumbnails para obtenerla.

    // ESTRATEGIA: El componente de imagen tendrá un "data-roblox-id" y un pequeño script observer
    // se encargará de rellenar el src.

    return `https://www.roblox.com/asset-thumbnail/image?assetId=${assetId}&width=420&height=420&format=png`;
};

/**
 * Resuelve la URL real de la imagen de forma asíncrona
 * (Útil si queremos precargar o guardar en DB)
 */
export const fetchRobloxThumbnail = async (assetId) => {
    try {
        const response = await fetch(`https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&size=420x420&format=Png&isCircular=false`);
        const data = await response.json();
        if (data.data && data.data.length > 0) {
            return data.data[0].imageUrl;
        }
    } catch (e) {
        console.warn("Error fetching Roblox thumbnail:", e);
    }
    return null;
}
