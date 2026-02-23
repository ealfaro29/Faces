import { useState, useEffect } from 'react';
import Header from './components/Header';
import Card from './components/Card';
import TextureCard from './components/TextureCard';
import FacebaseCard from './components/FacebaseCard';
import MusicCard from './components/MusicCard';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeAllData } from '../data-loader.js';
import { useFavorites } from './hooks/useFavorites.js';
import { groupTextureVariants } from '../tabs/textures.js';
import { groupFacebaseVariants } from '../core/search.js';

function App() {
    const [activeTab, setActiveTab] = useState('favorites');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const { isFavorite, toggleFavorite } = useFavorites();

    // Reset category when tab changes
    useEffect(() => {
        setSelectedCategory('all');
        setSearchQuery('');
    }, [activeTab]);

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

        if (activeTab === 'avatar') {
            const avatarCategories = ['all', ...new Set(data.allAvatarItems.map(item => item.group).filter(Boolean))].sort();

            const items = data.allAvatarItems.filter(item => {
                const matchesSearch = item.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.group?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesCategory = selectedCategory === 'all' || item.group === selectedCategory;
                return matchesSearch && matchesCategory;
            });
            return (
                <div className="pr-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {items.map(item => (
                        <Card
                            key={item.id}
                            id={item.id}
                            displayName={item.displayName}
                            group={item.group}
                            imageSrc={item.src}
                            codeId={item.codeId}
                            isFavorite={isFavorite(item.id)}
                            onToggleFavorite={toggleFavorite}
                        />
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
                return matchesSearch && matchesCategory;
            });
            return (
                <div className="pr-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {groups.map(group => (
                        <TextureCard
                            key={group.baseName}
                            group={group}
                            isFavorite={isFavorite}
                            onToggleFavorite={toggleFavorite}
                        />
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

                return matchesSearch && matchesCategory;
            });
            return (
                <div className="pr-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {groups.map(group => (
                        <FacebaseCard
                            key={group.baseDisplayName + group.group}
                            group={group}
                            isFavorite={isFavorite}
                            onToggleFavorite={toggleFavorite}
                        />
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

                return matchesSearchParam && matchesCategoryFilter;
            });
            return (
                <div className="pr-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {items.map((item, index) => (
                        <MusicCard
                            key={item.id || `music_${index}`}
                            code={item}
                            isFavorite={isFavorite}
                            onToggleFavorite={toggleFavorite}
                        />
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
                        <p>Marca un artículo como favorito (❤️) para verlo aquí.</p>
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

    return (
        <>
            <div id="custom-toast"></div>
            <div className={`container ${!loading ? 'loaded' : ''}`} id="app-container">
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

                        {/* Rendering Filter Dropdown if applicable */}
                        {activeTab !== 'favorites' && (
                            <div className="relative w-full sm:w-48">
                                <select
                                    className="w-full h-12 px-4 text-sm dark-input rounded-md appearance-none cursor-pointer"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    aria-label={`Filter ${activeTab} by category`}
                                >
                                    <option value="all">Todas las Categorías</option>
                                    {activeTab === 'facebases' && [...new Set(data?.allFacebaseItems?.map(i => i.group).filter(Boolean))].sort().map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                    {activeTab === 'avatar' && [...new Set(data?.allAvatarItems?.map(i => i.group).filter(Boolean))].sort().map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                    {activeTab === 'textures' && [...new Set(data?.allTextureItems?.map(i => i.group).filter(Boolean))].sort().map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                    {activeTab === 'music' && [...new Set(data?.allMusicCodes?.map(i => i.category).filter(Boolean))].sort().map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
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
                <p>&copy; 2024 Fashion Muse. Migrating to React ⚛️.</p>
            </footer>
        </>
    );
}

export default App;
