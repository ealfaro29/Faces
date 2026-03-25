import React, { useState } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';

export default function TextureCard({ group, isFavorite, onToggleFavorite }) {
    const [copied, setCopied] = useState(false);
    const [showVariants, setShowVariants] = useState(false);
    const [activeVariant, setActiveVariant] = useState(group.mainVariant);
    const [reloading, setReloading] = useState(false);
    const [overrideSrc, setOverrideSrc] = useState(null);

    const hasVariants = group.variants.length > 1;
    const variantName = activeVariant.displayName.split(' ').pop();
    const otherVariantsCount = group.variants.length - 1;

    const handleReloadImage = async (e) => {
        e.stopPropagation();
        const assetId = activeVariant.codeId;
        if (!assetId || reloading) return;
        setReloading(true);
        try {
            const proxies = [
                `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&size=420x420&format=Png&isCircular=false`)}`,
                `https://corsproxy.io/?${encodeURIComponent(`https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&size=420x420&format=Png&isCircular=false`)}`
            ];
            for (const url of proxies) {
                try {
                    const res = await fetch(url);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.data?.[0]?.state === 'Completed') {
                            setOverrideSrc(data.data[0].imageUrl);
                            break;
                        }
                    }
                } catch {}
            }
        } finally {
            setReloading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(activeVariant.codeId || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="music-card facebase-card bg-[var(--card-light)] rounded-xl shadow-xl ring-1 ring-[var(--border)] overflow-hidden flex flex-col p-1.5 space-y-1.5 !w-full relative texture-group-card group/card hover:ring-[var(--gold2)]/30 transition-all duration-200 hover:shadow-2xl hover:-translate-y-0.5">
            <div className="absolute top-1.5 right-1.5 z-10 favorite-container !bg-transparent !backdrop-filter-none !w-auto !h-auto">
                <button
                    className="favorite-btn"
                    onClick={() => onToggleFavorite(activeVariant.id)}
                >
                    {isFavorite(activeVariant.id) ? '❤️' : '🖤'}
                </button>
            </div>

            <div className="variant-display-container">
                <div className="text-xs text-[var(--ink)] font-medium px-1 h-8 flex items-center justify-start gap-1">
                    <span className="truncate main-display-name">{group.baseName}</span>
                    {hasVariants && <span className="text-xs font-medium text-zinc-400 main-variant-name">({variantName})</span>}
                </div>
                <img
                    src={overrideSrc || activeVariant.src}
                    alt={activeVariant.displayName}
                    loading="lazy"
                    className="w-full h-auto object-cover aspect-square rounded-md main-image"
                />
                <button
                    onClick={handleReloadImage}
                    title="Reload image from Roblox"
                    className={`absolute top-1.5 left-1.5 w-7 h-7 flex items-center justify-center rounded-md bg-black/60 text-zinc-300 opacity-0 group-hover/card:opacity-100 transition-opacity hover:text-white hover:bg-black/80 z-10 ${reloading ? 'animate-spin' : ''}`}
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
                {hasVariants && (
                    <button
                        className="variant-indicator-btn"
                        title={`Ver ${group.variants.length} variantes`}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowVariants(true);
                        }}
                    >
                        {otherVariantsCount}+
                    </button>
                )}
            </div>

            {hasVariants && showVariants && (
                <div className="variants-gallery-overlay" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowVariants(false) }} style={{ opacity: 1, visibility: 'visible' }}>
                    <div className="variants-gallery-container" onClick={e => e.stopPropagation()}>
                        <h4 className="text-sm font-semibold text-zinc-100 mb-2">{group.baseName} Variants</h4>
                        <div className="variants-grid">
                            {group.variants.map(variant => {
                                const vName = variant.displayName.split(' ').pop();
                                const isActive = activeVariant.id === variant.id;
                                return (
                                    <div
                                        key={variant.id}
                                        className={`variant-thumbnail ${isActive ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setActiveVariant(variant);
                                            setShowVariants(false);
                                        }}
                                    >
                                        <img src={variant.src} alt={variant.displayName} loading="lazy" className="w-full h-auto object-cover aspect-square rounded-md" />
                                        <span className="variant-name">{vName}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-1.5 p-1 card-footer">
                <input
                    readOnly
                    type="text"
                    value={activeVariant.codeId || ''}
                    placeholder="…"
                    className="flex-grow w-0 h-8 px-2 text-xs dark-input rounded-md main-code-id-input"
                />
                <button
                    onClick={handleCopy}
                    className={`copy-btn flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md border transition-all ${copied
                        ? 'bg-green-500/20 text-green-500 border-green-500/50'
                        : 'bg-[var(--card-lighter)] text-[var(--ink)] border-[var(--border)] hover:bg-[var(--card-hover)]'
                        }`}
                    title="Copy Code"
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}
