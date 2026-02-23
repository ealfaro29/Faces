import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const ISO_MAP = {
    'BRAZIL': 'BR', 'UK': 'GB', 'USA': 'US', 'ZAMBIA': 'ZM', 'IRELAND': 'IE',
    'ITALY': 'IT', 'INDIA': 'IN', 'BELGIUM': 'BE', 'EGYPT': 'EG', 'SPAIN': 'ES',
    'FRANCE': 'FR', 'COSTA RICA': 'CR', 'THAILAND': 'TH', 'JAPAN': 'JP', 'KOREA': 'KR'
};

function getFlagEmoji(countryName) {
    const iso = ISO_MAP[countryName?.toUpperCase()];
    if (!iso) return null;
    return String.fromCodePoint(...iso.split('').map(c => 127397 + c.charCodeAt()));
}

export default function FacebaseCard({ group, isFavorite, onToggleFavorite }) {
    const [copied, setCopied] = useState(false);
    const [activeVariant, setActiveVariant] = useState(group.defaultItem);

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
            className="music-card facebase-card bg-[var(--card-light)] rounded-xl shadow-xl ring-1 ring-[var(--border)] overflow-hidden flex flex-col p-1.5 space-y-1.5 !w-full relative"
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
                    src={activeVariant.src}
                    alt={group.baseDisplayName}
                    loading="lazy"
                    className="w-full h-auto object-cover aspect-square rounded-md facebase-main-img"
                />
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
