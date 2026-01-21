
const fs = require('fs');
const path = require('path');

// Usar fetch nativo (Node 18+) o dynamic import de node-fetch si fuera necesario
// Asumimos Node 18+ por el entorno del usuario

const DB_PATH = path.join(__dirname, 'database.json');
const BATCH_SIZE = 100; // Roblox permite hasta 50 o 100 ids por request

async function updateMissingUrls() {
    console.log("🔍 Scanning database.json for missing remoteUrls...");

    const dbRaw = fs.readFileSync(DB_PATH, 'utf8');
    const db = JSON.parse(dbRaw);
    let updatedCount = 0;

    // Arrays para procesar
    const collections = ['textures', 'facebases', 'avatar'];
    const missingItems = [];

    // 1. Identificar items sin remoteUrl
    for (const col of collections) {
        if (!db[col]) continue;
        db[col].forEach(item => {
            if (!item.remoteUrl && item.robloxId) {
                missingItems.push({
                    collection: col,
                    id: item.id, // ID interno para buscar luego
                    robloxId: item.robloxId
                });
            }
        });
    }

    if (missingItems.length === 0) {
        console.log("✅ No missing URLs found! All good.");
        return;
    }

    console.log(`⚠️ Found ${missingItems.length} items missing remoteUrl. Fetching from Roblox API...`);

    // 2. Procesar en lotes
    for (let i = 0; i < missingItems.length; i += BATCH_SIZE) {
        const batch = missingItems.slice(i, i + BATCH_SIZE);
        const ids = batch.map(item => item.robloxId).join(',');

        try {
            console.log(`   Fetching batch ${i + 1}-${Math.min(i + BATCH_SIZE, missingItems.length)}...`);
            const url = `https://thumbnails.roblox.com/v1/assets?assetIds=${ids}&size=420x420&format=Png&isCircular=false`;

            const res = await fetch(url);
            if (!res.ok) {
                console.error(`Error fetching batch: ${res.status} ${res.statusText}`);
                continue;
            }

            const data = await res.json();

            // Map results: targetId -> imageUrl
            const urlMap = {};
            if (data.data) {
                data.data.forEach(img => {
                    if (img.imageUrl && img.state === 'Completed') {
                        urlMap[img.targetId] = img.imageUrl;
                    }
                });
            }

            // 3. Actualizar la DB en memoria
            batch.forEach(localItem => {
                const newUrl = urlMap[localItem.robloxId];
                if (newUrl) {
                    // Buscar el item real en la db structure
                    const collectionArr = db[localItem.collection];
                    const realItem = collectionArr.find(x => x.id === localItem.id);
                    if (realItem) {
                        realItem.remoteUrl = newUrl;
                        updatedCount++;
                        process.stdout.write('.');
                    }
                } else {
                    console.warn(`\n   Warning: No URL found for item ${localItem.robloxId}`);
                }
            });

        } catch (error) {
            console.error("\nError processing batch:", error);
        }

        // Esperar un poco para no saturar la API
        await new Promise(r => setTimeout(r, 500));
    }

    // 4. Guardar cambios
    console.log(`\n\n💾 Saving ${updatedCount} updates to database.json...`);
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    console.log("🎉 Done!");
}

updateMissingUrls();
