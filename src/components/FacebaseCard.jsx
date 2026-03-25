import React, { useState } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { getFlagEmoji } from '../../utils/countries.js';
import { reloadRobloxImage } from '../utils/image-reload';

export default function FacebaseCard({ group, isFavorite, onToggleFavorite }) {
    const [copied, setCopied] = useState(false);
    const [activeVariant, setActiveVariant] = useState(group.defaultItem);
    const [reloading, setReloading] = useState(false);
    const [overrideSrc, setOverrideSrc] = useState(null);

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

    // Collect all variant IDs for toggling favorites on the group
    const allVariantIds = Object.values(group.variants).map(v => v?.id).filter(Boolean);

    // Flag emoji
    const flagEmoji = getFlagEmoji(activeVariant.group);

    // Determine flag display
    let flagTag;
    if (flagEmoji) {
        flagTag = <span className="text-xl flag-emoji cursor-pointer" title={activeVariant.group}>{flagEmoji}</span>;
    } else {
        flagTag = <span className="text-xs text-zinc-500">{activeVariant.group}</span>;
    }

    // Variant buttons HTML
    const variantX = group.variants.X;
    const variantS = group.variants.S;

    return (
        <div
            className="music-card facebase-card bg-[var(--card-light)] rounded-xl shadow-xl ring-1 ring-[var(--border)] overflow-hidden flex flex-col p-1.5 space-y-1.5 !w-full relative group/card hover:ring-[var(--gold2)]/30 transition-all duration-200 hover:shadow-2xl hover:-translate-y-0.5"
            data-default-src={group.defaultItem.src}
            data-default-id={group.defaultItem.id}
        >
            <div className="favorite-container">
                <button
                    className="favorite-btn"
                    onClick={() => onToggleFavorite(activeVariant.id, allVariantIds)}
                >
                    {isFavorite(activeVariant.id) ? '❤️' : '🖤'}
                </button>
            </div>

            <div className="text-xs text-[var(--ink)] font-medium px-1 h-8 flex items-center justify-start gap-1">
                {flagTag}
                <span className="truncate">{group.baseDisplayName}</span>
            </div>

            <div className="relative">
                <img
                    src={overrideSrc || activeVariant.src}
                    alt={group.baseDisplayName}
                    loading="lazy"
                    className="w-full h-auto object-cover aspect-square rounded-md facebase-main-img"
                />
                <button
                    onClick={handleReloadImage}
                    title="Reload image from Roblox"
                    className={`absolute top-1.5 left-1.5 w-7 h-7 flex items-center justify-center rounded-md bg-black/60 text-zinc-300 opacity-0 group-hover/card:opacity-100 transition-opacity hover:text-white hover:bg-black/80 ${reloading ? 'animate-spin' : ''}`}
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
                {(variantX || variantS) && (
                    <div className="variant-buttons">
                        {variantX && (
                            <img
                                src="photos/app/x.webp"
                                className={`variant-button ${activeVariant.id === variantX.id ? 'active' : ''}`}
                                title="Ojos Cerrados"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setActiveVariant(activeVariant.id === variantX.id ? group.defaultItem : variantX);
                                }}
                                data-src={variantX.src}
                                data-id={variantX.id}
                                data-code-id={variantX.codeId || ''}
                            />
                        )}
                        {variantS && (
                            <img
                                src="photos/app/s.webp"
                                className={`variant-button ${activeVariant.id === variantS.id ? 'active' : ''}`}
                                title="Ojos de Lado"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setActiveVariant(activeVariant.id === variantS.id ? group.defaultItem : variantS);
                                }}
                                data-src={variantS.src}
                                data-id={variantS.id}
                                data-code-id={variantS.codeId || ''}
                            />
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1.5 p-1">
                <input
                    readOnly
                    type="text"
                    value={activeVariant.codeId || ''}
                    placeholder="…"
                    className="flex-grow w-0 h-8 px-2 text-xs dark-input rounded-md"
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
