import React, { useState } from 'react';
import { Copy, Check, RefreshCw, Layers, Trash2 } from 'lucide-react';
import { reloadRobloxImage } from '../utils/image-reload';

/**
 * GroupCard — Displays a user-created group.
 * Matches the behavior of TextureCard exactly.
 */
export default function GroupCard({ group, allItems, onDelete, isFavorite, onToggleFavorite }) {
    const [copied, setCopied] = useState(false);
    const [showVariants, setShowVariants] = useState(false);
    const [reloading, setReloading] = useState(false);
    const [overrideSrc, setOverrideSrc] = useState(null);

    // Resolve items in this group
    const items = group.itemIds
        .map(id => allItems.find(item => item.id === id))
        .filter(Boolean);

    // activeVariant state initialized to coverItemId or first item
    const [activeVariant, setActiveVariant] = useState(() => 
        items.find(i => i.id === group.coverItemId) || items[0]
    );

    if (items.length === 0) return null;

    const hasVariants = items.length > 1;
    const otherVariantsCount = items.length - 1;

    const handleReloadImage = async (e) => {
        e.stopPropagation();
        const assetId = activeVariant.codeId;
        if (!assetId || reloading) return;
        setReloading(true);
        try {
            const newSrc = await reloadRobloxImage(assetId);
            if (newSrc) setOverrideSrc(newSrc);
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
        <div className={`music-card facebase-card bg-[var(--card-light)] rounded-xl shadow-xl ring-1 ring-[var(--border)] overflow-hidden flex flex-col p-1.5 space-y-1.5 !w-full relative texture-group-card group/card hover:ring-[var(--gold2)]/30 transition-all duration-200 hover:shadow-2xl hover:-translate-y-0.5 ${showVariants ? 'show-variants' : ''}`}>
            {/* Header: Favorites and Delete */}
            <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(group.id); }}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-black/40 text-red-400 hover:bg-red-500/20 transition-all backdrop-blur-sm opacity-0 group-hover/card:opacity-100"
                    title="Delete custom group"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="favorite-container !relative !top-0 !right-0 !bg-black/40 !w-7 !h-7">
                    <button
                        className="favorite-btn"
                        onClick={() => onToggleFavorite(activeVariant.id)}
                    >
                        {isFavorite(activeVariant.id) ? '❤️' : '🖤'}
                    </button>
                </div>
            </div>

            <div className="variant-display-container">
                {/* Name and Group Indicator */}
                <div className="text-xs text-[var(--ink)] font-medium px-1 h-8 flex items-center justify-start gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[var(--gold2)] flex-shrink-0" />
                    <span className="truncate main-display-name">{group.name}</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase flex-shrink-0">({items.length})</span>
                </div>

                {/* Main Image */}
                <div className="relative">
                    <img
                        src={overrideSrc || activeVariant.src}
                        alt={activeVariant.displayName || activeVariant.title}
                        loading="lazy"
                        className="w-full h-auto object-cover aspect-square rounded-md main-image"
                    />
                    
                    {/* Reload Button */}
                    <button
                        onClick={handleReloadImage}
                        title="Reload image from Roblox"
                        className={`absolute top-1.5 left-1.5 w-7 h-7 flex items-center justify-center rounded-md bg-black/60 text-zinc-300 opacity-0 group-hover/card:opacity-100 transition-opacity hover:text-white hover:bg-black/80 z-10 ${reloading ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    {/* Variant Indicator (Identical to TextureCard) */}
                    {hasVariants && (
                        <button
                            className="variant-indicator-btn"
                            title={`Ver ${items.length} items`}
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
            </div>

            {/* Internal Variant Gallery (Identical to TextureCard) */}
            {hasVariants && showVariants && (
                <div className="variants-gallery-overlay" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowVariants(false) }} style={{ opacity: 1, visibility: 'visible' }}>
                    <div className="variants-gallery-container" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-zinc-100">{group.name}</h4>
                            <X className="w-4 h-4 text-zinc-400 cursor-pointer hover:text-white" onClick={() => setShowVariants(false)} />
                        </div>
                        <div className="variants-grid">
                            {items.map(item => {
                                const isActive = activeVariant.id === item.id;
                                return (
                                    <div
                                        key={item.id}
                                        className={`variant-thumbnail ${isActive ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setActiveVariant(item);
                                            setShowVariants(false);
                                            setOverrideSrc(null); // Reset reload override when switching
                                        }}
                                    >
                                        <img src={item.src} alt={item.displayName || item.title} loading="lazy" className="w-full h-auto object-cover aspect-square rounded-md" />
                                        <span className="variant-name truncate px-1">
                                            {item.displayName || item.title}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer: Code and Copy (Identical to TextureCard) */}
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
