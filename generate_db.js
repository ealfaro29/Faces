const fs = require('fs');
const path = require('path');

// RUTAS (Asumimos ejecución desde la raíz del proyecto)
const PHOTOS_DIR = path.join(__dirname, 'photos');
const TEXTURES_DIR = path.join(PHOTOS_DIR, 'textures');
const FACEBASES_DIR = path.join(PHOTOS_DIR, 'facebases'); // Incluido
const ITEMS_DIR = path.join(PHOTOS_DIR, 'items'); // Avatar (ítems)
const MUSIC_JSON_PATH = path.join(__dirname, 'music.json');

const OUTPUT_DB_PATH = path.join(__dirname, 'public', 'database.json');

// Base de datos maestra
const database = {
    textures: [],
    facebases: [],
    avatar: [],
    music: [] // Placeholder, o podemos leer music.json
};


function parseTextureFilename(filename) {
    // filename: "ST-Peacock Blue_12345.webp" (o png)
    // 1. Quitar extensión
    const nameWithoutExt = path.parse(filename).name; // "ST-Peacock Blue_12345"

    // 2. Separar por el último '_' para sacar el ID
    const lastUnderscore = nameWithoutExt.lastIndexOf('_');
    if (lastUnderscore === -1) return null; // Formato inválido

    const codeId = nameWithoutExt.substring(lastUnderscore + 1);
    const label = nameWithoutExt.substring(0, lastUnderscore); // "ST-Peacock Blue"

    if (isNaN(codeId) || !codeId) return null; // No tiene ID válido

    // 3. Analizar el label para sacar tipo y nombre
    // Label: "ST-Peacock Blue" -> Type: ST, Name: Peacock Blue
    // Label: "M-Milan Blue" -> Type: M, Name: Milan Blue

    const parts = label.split('-');
    const typeCode = parts[0]; // "ST", "M", "S", "T"
    const displayName = parts.slice(1).join('-').replace(/[-_]/g, ' '); // "Peacock Blue"

    // La variante es usualmente la última palabra del displayName
    const nameParts = displayName.split(' ');
    const variant = nameParts.pop(); // "Blue"
    const baseName = nameParts.join(' '); // "Peacock"

    return {
        id: codeId, // Usamos el Roblox ID como ID único
        robloxId: codeId,
        type: typeCode, // "M", "S", "T", "ST"
        name: baseName || displayName, // Si displayName es solo una palabra, baseName sería vacío, usamos displayName entero
        variant: variant || 'Original',
        fullName: displayName,
        originalFilename: filename
    };
}

function parseFacebaseFilename(filename) {
    // filename: "Brazil-Natural_12345.webp"
    const nameWithoutExt = path.parse(filename).name;
    const lastUnderscore = nameWithoutExt.lastIndexOf('_');
    if (lastUnderscore === -1) return null;

    const codeId = nameWithoutExt.substring(lastUnderscore + 1);
    const label = nameWithoutExt.substring(0, lastUnderscore); // "Brazil-Natural"

    if (isNaN(codeId)) return null;

    // Brazil-Natural -> Country: Brazil, Variant: Natural
    const parts = label.split('-');
    const category = parts[0]; // "Brazil"
    const variant = parts.slice(1).join(' ').replace(/[-_]/g, ' '); // "Natural"

    return {
        id: codeId,
        robloxId: codeId,
        category: category,
        name: label.replace(/[-_]/g, ' '),
        variant: variant,
        originalFilename: filename
    };
}

function parseAvatarItemFilename(filename) {
    // filename: "Hair-Nicki SL Black_14507337010.webp"
    const nameWithoutExt = path.parse(filename).name;
    const lastUnderscore = nameWithoutExt.lastIndexOf('_');
    if (lastUnderscore === -1) return null;

    const codeId = nameWithoutExt.substring(lastUnderscore + 1);
    const label = nameWithoutExt.substring(0, lastUnderscore); // "Hair-Nicki SL Black"

    if (isNaN(codeId)) return null;

    const parts = label.split('-');
    const category = parts[0]; // "Hair"
    const name = parts.slice(1).join('-').replace(/[-_]/g, ' '); // "Nicki SL Black"

    return {
        id: codeId,
        robloxId: codeId,
        category: category,
        name: name,
        originalFilename: filename
    };
}


const https = require('https');

// Helper para hacer requests (Node.js nativo sin dependencias)
function postRequest(url, data) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve(json);
                } catch (e) {
                    resolve({ error: 'Invalid JSON', body });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

// Resuelve una lista de IDs usando el batch endpoint de Roblox
async function resolveRobloxThumbnails(idList) {
    if (idList.length === 0) return {};

    // Chunk in groups of 90 (limit is 100)
    const chunkSize = 90;
    const url = "https://thumbnails.roblox.com/v1/batch";
    const resolvedMap = {};

    for (let i = 0; i < idList.length; i += chunkSize) {
        const chunk = idList.slice(i, i + chunkSize);
        const payload = chunk.map(id => ({
            requestId: `${id}`,
            targetId: parseInt(id),
            type: "Asset", // Probado que funciona para IDs de 14 dígitos
            size: "420x420",
            format: "Png"
        }));

        try {
            console.log(`⏳ Fetching batch ${Math.floor(i / chunkSize) + 1}...`);
            const response = await postRequest(url, JSON.stringify(payload));

            if (response.data) {
                response.data.forEach(item => {
                    if (item.state === 'Completed' && item.imageUrl) {
                        resolvedMap[item.targetId] = item.imageUrl;
                    } else if (item.state === 'Blocked' && item.imageUrl) {
                        // A veces devuelve Blocked pero con URL (como vimos en el ejemplo de Avatar)
                        resolvedMap[item.targetId] = item.imageUrl;
                    }
                });
            } else {
                console.warn("⚠️ Batch response invalid:", response);
            }
        } catch (e) {
            console.error("❌ Error fetching batch:", e);
        }
    }
    return resolvedMap;
}

async function generateDatabase() {
    console.log("🛠️ Starting database generation...");

    // 1. Textures
    if (fs.existsSync(TEXTURES_DIR)) {
        const files = fs.readdirSync(TEXTURES_DIR);
        files.forEach(file => {
            if (file.endsWith('.webp') || file.endsWith('.png')) {
                const data = parseTextureFilename(file);
                if (data) database.textures.push(data);
            }
        });
        console.log(`✅ Processed ${database.textures.length} textures.`);
    }

    // 2. Facebases
    if (fs.existsSync(FACEBASES_DIR)) {
        const files = fs.readdirSync(FACEBASES_DIR);
        files.forEach(file => {
            if (file.endsWith('.webp') || file.endsWith('.png')) {
                const data = parseFacebaseFilename(file);
                if (data) database.facebases.push(data);
            }
        });
        console.log(`✅ Processed ${database.facebases.length} facebases.`);
    }

    // 3. Avatar Items
    if (fs.existsSync(ITEMS_DIR)) {
        const files = fs.readdirSync(ITEMS_DIR);
        files.forEach(file => {
            if (file.endsWith('.webp') || file.endsWith('.png')) {
                const data = parseAvatarItemFilename(file);
                if (data) database.avatar.push(data);
            }
        });
        console.log(`✅ Processed ${database.avatar.length} avatar items.`);
    }

    // 4. Music
    if (fs.existsSync(MUSIC_JSON_PATH)) {
        try {
            const musicData = JSON.parse(fs.readFileSync(MUSIC_JSON_PATH, 'utf-8'));
            database.music = musicData;
            console.log(`✅ Processed ${database.music.length} music tracks.`);
        } catch (e) {
            console.error("Error reading music.json:", e);
        }
    }

    // 5. RESOLVER URLS DE ROBLOX ASYNC
    console.log("🌍 Resolving Roblox Thumbnails...");

    // Recolectar todos los IDs únicos
    const allIds = new Set();
    database.textures.forEach(i => allIds.add(i.robloxId));
    database.facebases.forEach(i => allIds.add(i.robloxId));
    database.avatar.forEach(i => allIds.add(i.robloxId));

    const idList = Array.from(allIds).filter(id => id); // Filter nulls
    console.log(`🔍 Found ${idList.length} unique IDs to resolve.`);

    const urlMap = await resolveRobloxThumbnails(idList);

    // Asignar URLs
    let resolvedCount = 0;

    const attachUrl = (item) => {
        if (item.robloxId && urlMap[item.robloxId]) {
            item.remoteUrl = urlMap[item.robloxId];
            resolvedCount++;
        }
    };

    database.textures.forEach(attachUrl);
    database.facebases.forEach(attachUrl);
    database.avatar.forEach(attachUrl);

    console.log(`✨ Resolved ${resolvedCount} / ${idList.length} thumbnails.`);

    // Ensure public dir exists
    const publicDir = path.dirname(OUTPUT_DB_PATH);
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_DB_PATH, JSON.stringify(database, null, 2));
    console.log(`🎉 Database generated successfully at ${OUTPUT_DB_PATH}`);
}

generateDatabase();
