// src/utils/facebase-utils.js
// Extracted from legacy core/search.js

export function groupFacebaseVariants(items) {
    const grouped = {};
    const variantRegex = /^(.*?)( S| X)$/i;

    for (const item of items) {
        if (!item) continue;
        
        let baseDisplayName = item.displayName;
        let variant = 'default';

        const match = item.displayName.match(variantRegex);

        if (match) {
            baseDisplayName = match[1].trim();
            variant = match[2].trim().toUpperCase();
        }

        const key = `${item.group}-${baseDisplayName}`;

        if (!grouped[key]) {
            grouped[key] = {
                group: item.group,
                baseDisplayName: baseDisplayName,
                defaultItem: null,
                variants: {}
            };
        }

        grouped[key].variants[variant] = item;
        if (variant === 'default') {
            grouped[key].defaultItem = item;
        }
    }

    // Ensure we have a default item for each group
    return Object.values(grouped).filter(g => g.defaultItem);
}
