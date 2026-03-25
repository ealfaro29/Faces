export function groupFacebaseVariants(items) {
    const grouped = {};
    const variantRegex = /^(.*?)( S| X)$/i;

    for (const item of items) {
        if (!item) continue;
        
        let baseDisplayName = item.displayName;
        const match = item.displayName.match(variantRegex);

        if (match) {
            baseDisplayName = match[1].trim();
        }

        const key = `${item.group}-${baseDisplayName}`;

        if (!grouped[key]) {
            grouped[key] = {
                group: item.group,
                baseDisplayName: baseDisplayName,
                items: []
            };
        }

        grouped[key].items.push(item);
    }

    return Object.values(grouped).map(g => {
        const variants = {};
        const itemsList = g.items;
        
        itemsList.forEach(item => {
            const match = item.displayName.match(variantRegex);
            const variant = match ? match[2].trim().toUpperCase() : 'default';
            
            // If this variant slot is already occupied, use a unique key to prevent disappearance
            if (variants[variant]) {
                variants[`${variant}_${item.id}`] = item;
            } else {
                variants[variant] = item;
            }
        });

        return {
            group: g.group,
            baseDisplayName: g.baseDisplayName,
            variants,
            defaultItem: variants['default'] || itemsList[0]
        };
    });
}
