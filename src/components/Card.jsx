import React from 'react';
import { Copy, Check, Heart } from 'lucide-react';

export default function Card({ id, displayName, group, imageSrc, codeId, isFavorite, onToggleFavorite }) {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(codeId || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="music-card facebase-card bg-[var(--card-light)] rounded-xl shadow-xl ring-1 ring-[var(--border)] overflow-hidden flex flex-col p-1.5 space-y-1.5 !w-full relative">
            <div className="favorite-container">
                <button
                    className="favorite-btn"
                    onClick={() => onToggleFavorite(id)}
                >
                    {isFavorite ? '❤️' : '🖤'}
                </button>
            </div>

            <div className="text-xs text-[var(--ink)] font-medium px-1 h-8 flex items-center justify-start gap-1">
                <span className="truncate">{displayName} ({group})</span>
            </div>

            <img
                src={imageSrc}
                alt={displayName}
                loading="lazy"
                className="w-full h-auto object-cover aspect-square rounded-md"
            />

            <div className="flex items-center gap-1.5 p-1">
                <input
                    readOnly
                    type="text"
                    value={codeId || ''}
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
