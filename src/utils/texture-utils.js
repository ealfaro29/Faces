// src/utils/texture-utils.js
// Extracted from legacy tabs/textures.js

export function groupTextureVariants(textureItems) {
    const grouped = {};

    textureItems.forEach(item => {
        if (!item || typeof item !== 'object') return;

        let groupingKey = item.baseName;

        if (!groupingKey) {
            const parts = item.displayName.split(' ');
            if (parts.length > 1) {
                parts.pop();
                groupingKey = parts.join(' ');
            } else {
                groupingKey = item.displayName;
            }
        }

        const normalizedKey = groupingKey.toLowerCase().trim();

        if (!grouped[normalizedKey]) {
            grouped[normalizedKey] = {
                group: item.group,
                baseName: groupingKey,
                mainVariant: item,
                variants: [item]
            };
        } else {
            grouped[normalizedKey].variants.push(item);
        }
    });

    return Object.values(grouped);
}
