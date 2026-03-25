/**
 * Robust image reloader for Roblox thumbnails.
 * Tries multiple CORS proxies and a direct redirector fallback.
 * 
 * @param {string} assetId - The Roblox asset ID
 * @returns {Promise<string|null>} - The new image URL or null if all failed
 */
export async function reloadRobloxImage(assetId) {
    if (!assetId) return null;

    const targetUrl = `https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&size=420x420&format=Png&isCircular=false`;
    
    const proxies = [
        // 1. AllOrigins (JSON wrapper - often more reliable than /raw)
        async () => {
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
            const data = await res.json();
            const inner = JSON.parse(data.contents);
            return inner.data?.[0]?.imageUrl;
        },
        // 2. CodeTabs
        async () => {
            const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);
            const data = await res.json();
            return data.data?.[0]?.imageUrl;
        },
        // 3. CORSProxy.io
        async () => {
            const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
            const data = await res.json();
            return data.data?.[0]?.imageUrl;
        },
        // 4. ThingProxy (Fallback)
        async () => {
            const res = await fetch(`https://thingproxy.freeboard.io/fetch/${targetUrl}`);
            const data = await res.json();
            return data.data?.[0]?.imageUrl;
        }
    ];

    for (const attempt of proxies) {
        try {
            const result = await attempt();
            if (result && result.startsWith('http')) {
                return result;
            }
        } catch (e) {
            console.warn("Proxy attempt failed:", e);
        }
    }

    // FINAL FALLBACK: Return the direct Roblox redirector URL with a cache-buster.
    // This doesn't let us "see" the new URL, but it forces the browser to try a fresh load.
    return `https://www.roblox.com/asset-thumbnail/image?assetId=${assetId}&width=420&height=420&format=png&t=${Date.now()}`;
}
