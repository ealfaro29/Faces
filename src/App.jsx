import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../core/firebase.js';
import Header from './components/Header';
import Card from './components/Card';
import TextureCard from './components/TextureCard';
import FacebaseCard from './components/FacebaseCard';
import MusicCard from './components/MusicCard';
import { Search, Layers, CheckSquare, Square, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeAllData } from '../data-loader.js';
import { useFavorites } from './hooks/useFavorites.js';
import { useGroups } from './hooks/useGroups.js';
import { groupTextureVariants } from '../tabs/textures.js';
import { groupFacebaseVariants } from '../core/search.js';
import CreateSession from './pages/scoring/CreateSession';
import JoinSession from './pages/scoring/JoinSession';
import SessionBoard from './pages/scoring/SessionBoard';
import ScoringLanding from './pages/scoring/ScoringLanding';
import Login from './pages/Login';
import GroupCard from './components/GroupCard';

// Friendly names for texture category codes
const TEXTURE_TYPE_MAP = { 'M': 'Mesh', 'T': 'Translucid', 'S': 'Solid' };
const getFilterLabel = (tab, cat) => {
    if (tab === 'textures' && TEXTURE_TYPE_MAP[cat]) return TEXTURE_TYPE_MAP[cat];
    return cat;
};

function Dashboard() {
    const [activeTab, setActiveTab] = useState('favorites');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { isFavorite, toggleFavorite } = useFavorites();
    const { groups, createGroup, deleteGroup } = useGroups();

    // Selection mode for grouping
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [showGroupDialog, setShowGroupDialog] = useState(false);
    const [groupName, setGroupName] = useState('');

    const toggleSelection = (itemId) => {
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
            return next;
        });
    };

    const handleCreateGroup = () => {
        if (!groupName.trim() || selectedItems.size < 2) return;
        createGroup(groupName.trim(), Array.from(selectedItems), Array.from(selectedItems)[0]);
        setGroupName('');
        setSelectedItems(new Set());
        setSelectionMode(false);
        setShowGroupDialog(false);
    };

    const cancelSelection = () => {
        setSelectionMode(false);
        setSelectedItems(new Set());
        setShowGroupDialog(false);
    };

    // Build a flat list of all items for GroupCard lookups
    const allFlatItems = data ? [
        ...(data.allAvatarItems || []),
        ...(data.allTextureItems || []),
        ...(data.allFacebaseItems || []),
        ...(data.allMusicCodes || []).map(m => ({ ...m, displayName: m.title }))
    ] : [];

    // Per-tab search & filter state — preserved across tab switches
    const [tabState, setTabState] = useState({});
    const searchQuery = tabState[activeTab]?.query || '';
    const selectedCategory = tabState[activeTab]?.category || 'all';

    const setSearchQuery = (q) => setTabState(prev => ({
        ...prev, [activeTab]: { ...prev[activeTab], query: q, category: prev[activeTab]?.category || 'all' }
    }));
    const setSelectedCategory = (c) => setTabState(prev => ({
        ...prev, [activeTab]: { ...prev[activeTab], category: c, query: prev[activeTab]?.query || '' }
    }));

    useEffect(() => {
        async function fetchData() {
            try {
                const result = await initializeAllData();
                setData(result);
            } catch (error) {
                console.error("React Migration Error:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <div className="w-10 h-10 border-4 border-zinc-800 border-t-[var(--gold2)] rounded-full animate-spin"></div>
                    <p className="text-zinc-500 uppercase tracking-widest text-sm">Cargando base de datos...</p>
                </div>
            )
        }

        if (!data) return <p className="text-red-500 text-center p-10">Error loading data.</p>;

        // Helper: wraps a card with selection checkbox when in selection mode
        const SelectionWrap = ({ itemId, children }) => {
            if (!selectionMode) return children;
            const isSelected = selectedItems.has(itemId);
            return (
                <div className="relative" onClick={() => toggleSelection(itemId)}>
                    <div className={`absolute top-1 left-1 z-20 w-6 h-6 flex items-center justify-center rounded-md transition-all cursor-pointer ${isSelected ? 'bg-[var(--gold2)] text-black' : 'bg-black/60 text-zinc-300'}`}>
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </div>
                    <div className={`transition-all ${isSelected ? 'ring-2 ring-[var(--gold2)] rounded-xl' : ''}`}>
                        {children}
                    </div>
                </div>
            );
        };

        // Collect all item IDs that are already in custom groups for this tab
        const groupedItemIds = new Set(tabGroups.flatMap(g => g.itemIds));

        // Render groups for the current tab
        const renderTabGroups = () => {
            if (tabGroups.length === 0) return null;
            return tabGroups.map(g => (
                <GroupCard 
                    key={g.id} 
                    group={g} 
                    allItems={allFlatItems} 
                    onDelete={deleteGroup}
                    isFavorite={isFavorite}
                    onToggleFavorite={toggleFavorite}
                />
            ));
        };

        if (activeTab === 'avatar') {
            const avatarCategories = ['all', ...new Set(data.allAvatarItems.map(item => item.group).filter(Boolean))].sort();

            const items = data.allAvatarItems.filter(item => {
                const matchesSearch = item.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.group?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesCategory = selectedCategory === 'all' || item.group === selectedCategory;
                const isGrouped = groupedItemIds.has(item.id);
                return matchesSearch && matchesCategory && !isGrouped;
            });
            return (
                <div className="pr-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {renderTabGroups()}
                    {items.length === 0 ? (
                        <p className="col-span-full text-center text-zinc-500 py-10">No results found.</p>
                    ) : items.map(item => (
                        <SelectionWrap key={item.id} itemId={item.id}>
                            <Card
                                id={item.id}
                                displayName={item.displayName}
                                group={item.group}
                                imageSrc={item.src}
                                codeId={item.codeId}
                                isFavorite={isFavorite(item.id)}
                                onToggleFavorite={toggleFavorite}
                            />
                        </SelectionWrap>
                    ))}
                </div>
            );
        }

        if (activeTab === 'textures') {
            const rawTextureGroups = groupTextureVariants(data.allTextureItems || []);
            const textureCategories = ['all', ...new Set(data.allTextureItems.map(item => item.group).filter(Boolean))].sort();

            const groups = rawTextureGroups.filter(group => {
                const matchesSearch = group.baseName.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesCategory = selectedCategory === 'all' || group.variants.some(v => v.group === selectedCategory);
                const isGrouped = groupedItemIds.has(group.mainVariant.id);
                return matchesSearch && matchesCategory && !isGrouped;
            });
            return (
                <div className="pr-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {renderTabGroups()}
                    {groups.length === 0 ? (
                        <p className="col-span-full text-center text-zinc-500 py-10">No results found.</p>
                    ) : groups.map(group => (
                        <SelectionWrap key={group.baseName} itemId={group.mainVariant.id}>
                            <TextureCard
                                group={group}
                                isFavorite={isFavorite}
                                onToggleFavorite={toggleFavorite}
                            />
                        </SelectionWrap>
                    ))}
                </div>
            );
        }

        if (activeTab === 'facebases') {
            const rawFacebaseGroups = groupFacebaseVariants(data.allFacebaseItems || []);
            const facebaseCategories = ['all', ...new Set(data.allFacebaseItems.map(item => item.group).filter(Boolean))].sort();

            const groups = rawFacebaseGroups.filter(group => {
                const matchesSearch = !searchQuery.trim() ||
                    group.baseDisplayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    group.group.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesCategory = selectedCategory === 'all' || group.group === selectedCategory.toUpperCase();
                const isGrouped = groupedItemIds.has(group.defaultItem.id);

                return matchesSearch && matchesCategory && !isGrouped;
            });
            return (
                <div className="pr-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {renderTabGroups()}
                    {groups.length === 0 ? (
                        <p className="col-span-full text-center text-zinc-500 py-10">No results found.</p>
                    ) : groups.map(group => (
                        <SelectionWrap key={group.baseDisplayName + group.group} itemId={group.defaultItem.id}>
                            <FacebaseCard
                                group={group}
                                isFavorite={isFavorite}
                                onToggleFavorite={toggleFavorite}
                            />
                        </SelectionWrap>
                    ))}
                </div>
            );
        }

        if (activeTab === 'music') {
            const musicCategories = ['all', ...new Set((data.allMusicCodes || []).map(item => item.category).filter(Boolean))].sort();

            const items = (data.allMusicCodes || []).filter(item => {
                if (!item) return false;
                const matchesTitle = item.title ? item.title.toLowerCase().includes(searchQuery.toLowerCase()) : false;
                const matchesSearchCategory = item.category ? item.category.toLowerCase().includes(searchQuery.toLowerCase()) : false;
                const matchesArtist = item.artist ? item.artist.toLowerCase().includes(searchQuery.toLowerCase()) : false;
                const matchesSearchParam = matchesTitle || matchesSearchCategory || matchesArtist;

                const matchesCategoryFilter = selectedCategory === 'all' || item.category === selectedCategory;
                const isGrouped = groupedItemIds.has(item.id);

                return matchesSearchParam && matchesCategoryFilter && !isGrouped;
            });
            return (
                <div className="pr-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {renderTabGroups()}
                    {items.length === 0 ? (
                        <p className="col-span-full text-center text-zinc-500 py-10">No results found.</p>
                    ) : items.map((item, index) => (
                        <SelectionWrap key={item.id || `music_${index}`} itemId={item.id}>
                            <MusicCard
                                code={item}
                                isFavorite={isFavorite}
                                onToggleFavorite={toggleFavorite}
                            />
                        </SelectionWrap>
                    ))}
                </div>
            );
        }

        if (activeTab === 'favorites') {
            // Need to flatten all lists, find items marked as favorites, and render them.
            // Simplified rendering since they're different types. In original, it dynamically rendered appropriate cards.
            const allItems = [
                ...(data.allAvatarItems || []).map(i => ({ ...i, _type: 'avatar' })),
                ...(data.allTextureItems || []).map(i => ({ ...i, _type: 'texture' })),
                ...(data.allFacebaseItems || []).map(i => ({ ...i, _type: 'facebase' })),
                ...(data.allMusicCodes || []).map(i => ({ ...i, _type: 'music' })),
            ];

            const favoriteItems = allItems.filter(item => {
                // If it's a texture or facebase group object (which the arrays are NOT, they're individual items here)
                // Actually, DataLoader provides flat arrays, except the custom group functions we call later.
                // It's safer to check if the ID is favored.
                return isFavorite(item.id);
            });

            if (favoriteItems.length === 0) {
                return (
                    <div className="text-center text-zinc-500 pt-10">
                        <p>Mark an item as favorite (❤️) to see it here.</p>
                    </div>
                );
            }

            return (
                <div className="pr-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {favoriteItems.map(item => {
                        if (item._type === 'avatar') {
                            return <Card key={item.id} id={item.id} displayName={item.displayName} group={item.group} imageSrc={item.src} codeId={item.codeId} isFavorite={isFavorite(item.id)} onToggleFavorite={toggleFavorite} />
                        }
                        if (item._type === 'music') {
                            return <MusicCard key={item.id} code={item} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />
                        }
                        // For textures and facebases, we need group rendering in favorites which is more complex. Let's just render simplified cards for now or leave a placeholder.
                        // The original logic dynamically handled this. For now let's just use generic Card for them if they appear in favorites, or we can use the specific ones if we map them correctly.
                        // Let's use generic card for texture/facebase if they appear here for simplicity, the original code had dedicated logic to re-form groups for favorites?
                        // Actually, the vanilla JS fetched the raw HTML if it was a favorite. We'll just render it as a generic Card for now as a fallback to get things showing.
                        return <Card key={item.id} id={item.id} displayName={item.displayName || item.baseName || item.title} group={item.group || item.category} imageSrc={item.src || (item.defaultItem && item.defaultItem.src) || ''} codeId={item.codeId} isFavorite={isFavorite(item.id)} onToggleFavorite={toggleFavorite} />
                    })}
                </div>
            )
        }

        return (
            <div className="text-center text-zinc-500 pt-10">
                <p>Módulo de <strong>{activeTab}</strong> pendiente de migrar.</p>
            </div>
        )
    };

    // Filter groups relevant to the current tab
    const tabGroups = groups.filter(g => {
        if (!data) return false;
        const tabItemIds = activeTab === 'avatar' ? data.allAvatarItems.map(i => i.id) :
            activeTab === 'textures' ? data.allTextureItems.map(i => i.id) :
            activeTab === 'facebases' ? data.allFacebaseItems.map(i => i.id) :
            activeTab === 'music' ? (data.allMusicCodes || []).map(i => i.id) : [];
        return g.itemIds.some(id => tabItemIds.includes(id));
    });

    return (
        <>
            <div id="custom-toast"></div>
            <div className={`app-wrapper ${!loading ? 'loaded' : ''}`} id="app-container">
                <Header activeTab={activeTab} setActiveTab={setActiveTab} />
                <main className="panel" role="main">
                    <div id="search-controls" className="flex-shrink-0 flex flex-col sm:flex-row gap-4 mb-4 pb-4 border-b border-[var(--border)]" role="search">
                        <div className="relative flex-grow">
                            <input
                                type="search"
                                id="search-bar"
                                placeholder={`Search in ${activeTab}...`}
                                className="w-full h-12 pl-10 pr-4 text-sm dark-input rounded-md"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none" aria-hidden="true">
                                <Search className="w-5 h-5 text-zinc-400" />
                            </div>
                        </div>

                        {/* Group toggle button */}
                        {activeTab !== 'favorites' && (
                            <button
                                onClick={() => selectionMode ? cancelSelection() : setSelectionMode(true)}
                                className={`flex-shrink-0 h-12 px-3 flex items-center gap-2 rounded-md border transition-all text-sm font-medium ${
                                    selectionMode
                                        ? 'bg-[var(--gold2)]/10 text-[var(--gold2)] border-[var(--gold2)]/40'
                                        : 'bg-[var(--card-light)] text-zinc-400 border-[var(--border)] hover:text-[var(--gold2)] hover:border-[var(--gold2)]/30'
                                }`}
                                title={selectionMode ? 'Cancel selection' : 'Select items to group'}
                            >
                                <Layers className="w-4 h-4" />
                                {selectionMode ? 'Cancel' : 'Group'}
                            </button>
                        )}

                        {/* Rendering Filter Dropdown if applicable */}
                        {activeTab !== 'favorites' && (
                            <div className="relative w-full sm:w-48">
                                <select
                                    className="w-full h-12 px-4 text-sm dark-input rounded-md appearance-none cursor-pointer"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    aria-label={`Filter ${activeTab} by category`}
                                >
                                    <option value="all">All Categories</option>
                                    {activeTab === 'facebases' && [...new Set(data?.allFacebaseItems?.map(i => i.group).filter(Boolean))].sort().map(cat => (
                                        <option key={cat} value={cat}>{getFilterLabel(activeTab, cat)}</option>
                                    ))}
                                    {activeTab === 'avatar' && [...new Set(data?.allAvatarItems?.map(i => i.group).filter(Boolean))].sort().map(cat => (
                                        <option key={cat} value={cat}>{getFilterLabel(activeTab, cat)}</option>
                                    ))}
                                    {activeTab === 'textures' && [...new Set(data?.allTextureItems?.map(i => i.group).filter(Boolean))].sort().map(cat => (
                                        <option key={cat} value={cat}>{getFilterLabel(activeTab, cat)}</option>
                                    ))}
                                    {activeTab === 'music' && [...new Set(data?.allMusicCodes?.map(i => i.category).filter(Boolean))].sort().map(cat => (
                                        <option key={cat} value={cat}>{getFilterLabel(activeTab, cat)}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        )}
                    </div>
                    <div id="tab-content-wrapper" className="flex-grow relative min-h-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="absolute inset-0 scrollable-content"
                            >
                                {renderContent()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>
            <footer className="text-center py-4 text-zinc-500 text-sm">
                <p>&copy; 2026 Pageants. All rights reserved.</p>
            </footer>

            {/* Floating selection toolbar */}
            <AnimatePresence>
                {selectionMode && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1a1c24] border border-[var(--border)] rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4"
                    >
                        <span className="text-sm text-zinc-300">
                            <span className="font-bold text-[var(--gold2)]">{selectedItems.size}</span> selected
                        </span>

                        {showGroupDialog ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Group name..."
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                                    className="h-9 px-3 text-sm dark-input rounded-lg w-40"
                                    autoFocus
                                />
                                <button
                                    onClick={handleCreateGroup}
                                    disabled={!groupName.trim() || selectedItems.size < 2}
                                    className="h-9 px-4 bg-[var(--gold2)] text-black text-sm font-semibold rounded-lg hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Create
                                </button>
                                <button onClick={() => setShowGroupDialog(false)} className="text-zinc-400 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowGroupDialog(true)}
                                disabled={selectedItems.size < 2}
                                className="h-9 px-4 bg-[var(--gold2)] text-black text-sm font-semibold rounded-lg hover:brightness-110 transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Layers className="w-4 h-4" />
                                Create Group
                            </button>
                        )}

                        <button onClick={cancelSelection} className="text-zinc-400 hover:text-white transition">
                            <X className="w-5 h-5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function App() {
    const [user, setUser] = useState(undefined);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    if (user === undefined) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-zinc-800 border-t-[var(--gold)] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <Routes>
            {/* Rutas Públicas (El Scoring System) — deben ir ANTES del wildcard */}
            <Route path="/session" element={<ScoringLanding />} />
            <Route path="/session/create" element={<CreateSession />} />
            <Route path="/session/join" element={<JoinSession />} />
            <Route path="/session/:sessionId" element={<SessionBoard />} />
            
            {/* Rutas Privadas (El app original) — wildcard al final */}
            <Route path="/*" element={user ? <Dashboard /> : <Login />} />
        </Routes>
    );
}

export default App;
