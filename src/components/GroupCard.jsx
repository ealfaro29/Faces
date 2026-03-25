import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Trash2, X } from 'lucide-react';

/**
 * GroupCard — Displays a user-created group as a stacked card.
 * Shows cover image with peeking cards behind, expands on click.
 */
export default function GroupCard({ group, allItems, onDelete, onItemClick }) {
    const [expanded, setExpanded] = useState(false);

    // Resolve items in this group
    const items = group.itemIds
        .map(id => allItems.find(item => item.id === id))
        .filter(Boolean);

    const coverItem = allItems.find(i => i.id === group.coverItemId) || items[0];

    if (items.length === 0) return null;

    // Stack offsets for the peeking cards behind cover
    const stackCards = items.slice(0, Math.min(3, items.length));

    return (
        <>
            <motion.div
                className="relative cursor-pointer group/stack"
                onClick={() => setExpanded(true)}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{ width: '100%' }}
            >
                {/* Stacked peek cards behind */}
                {stackCards.length > 2 && (
                    <div
                        className="absolute inset-0 rounded-xl bg-[var(--card-light)] ring-1 ring-[var(--border)] opacity-40"
                        style={{ transform: 'rotate(4deg) translateY(-6px) scale(0.95)', zIndex: 0 }}
                    />
                )}
                {stackCards.length > 1 && (
                    <div
                        className="absolute inset-0 rounded-xl bg-[var(--card-light)] ring-1 ring-[var(--border)] opacity-60"
                        style={{ transform: 'rotate(-2deg) translateY(-3px) scale(0.97)', zIndex: 1 }}
                    />
                )}

                {/* Main card */}
                <div
                    className="relative z-10 bg-[var(--card-light)] rounded-xl shadow-xl ring-1 ring-[var(--border)] overflow-hidden flex flex-col p-1.5 space-y-1.5 hover:ring-[var(--gold2)]/40 transition-all duration-200 hover:shadow-2xl"
                >
                    {/* Badge */}
                    <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full">
                        <Layers className="w-3 h-3 text-[var(--gold2)]" />
                        <span className="text-[10px] font-bold text-[var(--gold2)]">{items.length}</span>
                    </div>

                    {/* Group name */}
                    <div className="text-xs text-[var(--ink)] font-semibold px-1 h-8 flex items-center justify-start gap-1.5">
                        <span className="truncate">{group.name}</span>
                    </div>

                    {/* Cover image */}
                    {coverItem && (
                        <img
                            src={coverItem.src}
                            alt={group.name}
                            loading="lazy"
                            className="w-full h-auto object-cover aspect-square rounded-md"
                        />
                    )}

                    {/* Footer hint */}
                    <div className="flex items-center justify-center p-1">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                            Tap to expand
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Expanded overlay */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setExpanded(false)}
                    >
                        <motion.div
                            className="bg-[var(--card-light)] border border-[var(--border)] rounded-2xl p-4 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-[var(--gold2)]" />
                                    <h3 className="text-lg font-bold text-[var(--ink)]">{group.name}</h3>
                                    <span className="text-xs text-zinc-500">({items.length} items)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(group.id); setExpanded(false); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                                        title="Delete group"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setExpanded(false)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-700 hover:text-white transition"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {items.map(item => (
                                    <div
                                        key={item.id}
                                        className="rounded-lg overflow-hidden ring-1 ring-[var(--border)] hover:ring-[var(--gold2)]/40 transition cursor-pointer"
                                        onClick={() => onItemClick?.(item)}
                                    >
                                        <img
                                            src={item.src}
                                            alt={item.displayName || item.title}
                                            loading="lazy"
                                            className="w-full aspect-square object-cover"
                                        />
                                        <div className="p-1.5 bg-[var(--card-light)]">
                                            <p className="text-[10px] text-[var(--ink)] truncate font-medium">
                                                {item.displayName || item.title}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
