// src/utils/roblox-legacy.js
// Extracted from legacy utils/roblox.js

export const getRobloxThumbnailUrl = (assetId, size = '420x420') => {
    if (!assetId) return '';
    return `https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&size=${size}&format=Png&isCircular=false`;
};
