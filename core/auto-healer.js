
import { db } from './firebase.js';
import { doc, updateDoc } from "firebase/firestore";

// Proxy público gratuito para evitar CORS (allorigins.win)
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

/**
 * Checks a list of items and repairs broken Roblox URLs automatically.
 * Only runs if a user (Admin) is authenticated to write to Firestore.
 */
export async function runAutoHealer(allItems, collectionsMap) {
    if (!allItems || allItems.length === 0) return;

    console.log("🚑 AUTO-HEAL: Starting background check for broken images...");
    let fixedCount = 0;

    // Process in chunks to avoid freezing the browser
    const CHUNK_SIZE = 5;

    for (let i = 0; i < allItems.length; i += CHUNK_SIZE) {
        const chunk = allItems.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(async (item) => {
            if (!item.remoteUrl || !item.id || !item.collectionRef) return;

            // 1. Check if image is valid
            const isWorking = await checkImageExists(item.remoteUrl);

            if (!isWorking) {
                console.warn(`🚑 Broken link found: ${item.name} (${item.id}). Attempting repair...`);

                // 2. Fetch new URL via Proxy
                try {
                    const newUrl = await getNewRobloxUrl(item.robloxId || item.id);
                    if (newUrl && newUrl !== item.remoteUrl) {
                        // 3. Update Firestore
                        await updateDoc(doc(db, item.collectionRef, item.id), {
                            remoteUrl: newUrl,
                            lastHealed: new Date().toISOString()
                        });
                        console.log(`✅ REPAIRED: ${item.name} -> ${newUrl}`);
                        fixedCount++;
                    }
                } catch (err) {
                    console.error(`❌ Failed to heal ${item.name}:`, err);
                }
            }
        }));
    }

    if (fixedCount > 0) {
        console.log(`🚑 AUTO-HEAL: Complete! Repaired ${fixedCount} broken images.`);
        // Optional: Show a toast notification
    } else {
        console.log("🚑 AUTO-HEAL: All images look healthy.");
    }
}

// Verifica si una imagen carga sin descargarla toda
function checkImageExists(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

// Obtiene URL fresca usando Proxy
async function getNewRobloxUrl(assetId) {
    if (!assetId) return null;
    const robloxApi = `https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&size=420x420&format=Png&isCircular=false`;
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(robloxApi)}`;

    try {
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error("Proxy error");
        const data = await res.json();

        if (data.data && data.data.length > 0 && data.data[0].state === 'Completed') {
            return data.data[0].imageUrl;
        }
    } catch (e) {
        // Silent fail
    }
    return null;
}
