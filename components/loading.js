// Loading skeleton component

export function showSkeleton(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const skeletonHTML = `
        <div class="skeleton-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-2">
            ${Array(10).fill(0).map(() => `
                <div class="skeleton-card bg-[#151722] rounded-xl shadow-xl ring-1 ring-[var(--border)] overflow-hidden flex flex-col p-1.5 space-y-1.5 animate-pulse">
                    <div class="h-6 bg-[#1b1d24] rounded w-3/4"></div>
                    <div class="aspect-square bg-[#1b1d24] rounded-md"></div>
                    <div class="h-8 bg-[#1b1d24] rounded"></div>
                </div>
            `).join('')}
        </div>
    `;

    container.innerHTML = skeletonHTML;
}

export function hideSkeleton(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
}
