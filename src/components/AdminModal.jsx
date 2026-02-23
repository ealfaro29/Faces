import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { auth, db } from '../../core/firebase.js'; // Adjust path if needed, we'll check it
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const CATEGORIES = {
    texture: ["Mesh", "Solid", "Translucid", "Mixed", "Makeup", "Tattoos", "Skin Details", "Fantasy"],
    facebase: ["Global", "Brazil", "UK", "USA", "Italy", "Spain", "France", "Japan", "Korea", "China", "Thailand"],
    avatar: ["Hair", "Mesh", "Accessory", "Clothing", "Hats", "Face"]
};

export default function AdminModal({ isOpen, onClose }) {
    const [user, setUser] = useState(null);
    const [itemType, setItemType] = useState('texture');
    const [robloxId, setRobloxId] = useState('');
    const [itemName, setItemName] = useState('');
    const [category, setCategory] = useState(CATEGORIES.texture[0]);
    const [previewUrl, setPreviewUrl] = useState('');
    const [previewState, setPreviewState] = useState('idle'); // 'idle', 'loading', 'valid', 'failed', 'force'
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        setCategory(CATEGORIES[itemType][0]);
    }, [itemType]);

    useEffect(() => {
        if (robloxId.length < 5) {
            setPreviewState('idle');
            setPreviewUrl('');
            return;
        }

        const timer = setTimeout(() => {
            fetchPreview(robloxId);
        }, 600);
        return () => clearTimeout(timer);
    }, [robloxId]);

    const handleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            setMsg({ text: error.message, type: 'error' });
        }
    };

    const handleLogout = () => {
        signOut(auth);
    };

    const fetchPreview = async (id) => {
        setPreviewState('loading');
        setPreviewUrl('');
        const robloxApi = `https://thumbnails.roblox.com/v1/assets?assetIds=${id}&size=420x420&format=Png&isCircular=false`;
        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(robloxApi)}`,
            `https://corsproxy.io/?${encodeURIComponent(robloxApi)}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(robloxApi)}`
        ];

        let foundUrl = null;
        for (const url of proxies) {
            try {
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (data.data?.length > 0 && data.data[0].state === 'Completed') {
                        foundUrl = data.data[0].imageUrl;
                        break;
                    }
                }
            } catch (e) {
                // ignore and try next
            }
        }

        if (foundUrl) {
            setPreviewUrl(foundUrl);
            setPreviewState('valid');
        } else {
            setPreviewState('failed');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!itemName || (previewState !== 'valid' && previewState !== 'force')) return;
        setIsSaving(true);
        setMsg({ text: '', type: '' });

        try {
            const collectionName = itemType === 'texture' ? 'textures' : itemType === 'facebase' ? 'facebases' : 'avatar';
            const finalUrl = previewState === 'force' ? null : previewUrl;

            await addDoc(collection(db, collectionName), {
                id: robloxId,
                robloxId: robloxId,
                name: itemName,
                category: category,
                type: itemType,
                remoteUrl: finalUrl,
                dateAdded: serverTimestamp(),
                searchName: itemName.toLowerCase()
            });

            setMsg({ text: '✅ Saved!', type: 'success' });
            setRobloxId('');
            setItemName('');
            setPreviewState('idle');
            setPreviewUrl('');
            setTimeout(() => setMsg({ text: '', type: '' }), 2000);
        } catch (error) {
            setMsg({ text: '❌ ' + error.message, type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal-overlay show" style={{ display: 'flex' }} role="dialog" aria-modal="true" onClick={onClose}>
            <div className={`modal-content ${user ? 'admin-modal-content' : 'p-10 text-center border border-zinc-700/50 bg-black/80 backdrop-blur-xl shadow-2xl rounded-2xl max-w-sm w-full relative'}`} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-2 right-4 text-zinc-400 hover:text-white transition text-3xl font-bold">&times;</button>

                {!user ? (
                    <div>
                        <img src="photos/app/logo.svg" alt="Fashion Muse Logo" className="w-32 h-auto mx-auto mb-8 opacity-90 drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]" />
                        <h2 className="text-xl font-bold text-white tracking-widest mb-1 font-serif">PRIVATE ACCESS</h2>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-8">Administrators Only</p>
                        <button onClick={handleLogin} className="w-full h-12 bg-white text-zinc-900 font-medium rounded hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02]">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.24.81-.6z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Sign in with Google
                        </button>
                        {msg.text && <p className="text-xs text-red-400 mt-4">{msg.text}</p>}
                    </div>
                ) : (
                    <div>
                        <h2 className="text-2xl font-semibold title-fancy gold-title mb-4">Admin Dashboard</h2>
                        <div className="flex justify-between items-center mb-6 pb-2 border-b border-zinc-800">
                            <span className="text-sm text-zinc-400">{user.email}</span>
                            <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-sm underline">Logout</button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-4">
                            <div className="grid grid-cols-3 gap-3">
                                {['texture', 'facebase', 'avatar'].map(type => (
                                    <label key={type} className="cursor-pointer">
                                        <input type="radio" name="itemType" value={type} checked={itemType === type} onChange={() => setItemType(type)} className="peer hidden" />
                                        <div className="flex flex-col items-center justify-center p-4 bg-zinc-900 border border-zinc-700 rounded-xl peer-checked:border-[var(--gold2)] peer-checked:bg-[var(--gold2)]/10 peer-checked:text-[var(--gold2)] hover:bg-zinc-800 transition-all text-zinc-400">
                                            <span className="text-xs font-bold uppercase tracking-wider">{type}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest pl-1">Roblox Asset ID</label>
                                <div className="relative">
                                    <input type="text" value={robloxId} onChange={(e) => setRobloxId(e.target.value)} placeholder="Paste ID (e.g. 129381293)" className="w-full h-12 bg-zinc-900 border border-zinc-700 rounded-lg px-4 text-white placeholder-zinc-600 focus:border-[var(--gold2)] focus:outline-none focus:ring-1 focus:ring-[var(--gold2)] transition-all" />
                                    {previewState === 'loading' && (
                                        <div className="absolute right-4 top-3.5">
                                            {/* spinner svg */}
                                            <svg className="animate-spin h-5 w-5 text-[var(--gold2)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full h-48 bg-black/50 rounded-lg flex items-center justify-center border border-zinc-700/50 mt-2 overflow-hidden relative group">
                                    {previewState === 'idle' && <span className="text-zinc-600 text-xs">Preview Area</span>}
                                    {previewState === 'valid' && (
                                        <>
                                            <img src={previewUrl} className="w-full h-full object-contain z-10 p-2" alt="Preview" />
                                            <div className="absolute top-2 right-2 bg-green-500 text-black text-[10px] font-bold px-2 py-0.5 rounded z-20">VALID</div>
                                        </>
                                    )}
                                    {previewState === 'force' && (
                                        <>
                                            <span className="text-zinc-600 text-xs">No image. Force allowed.</span>
                                            <div className="absolute top-2 right-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded z-20">FORCE</div>
                                        </>
                                    )}
                                    {previewState === 'failed' && (
                                        <div className="flex flex-col items-center w-full px-4">
                                            <span className="text-xs text-red-400 font-bold mb-1">PREVIEW FAILED</span>
                                            <button type="button" onClick={() => setPreviewState('force')} className="w-full py-2 mt-2 bg-zinc-800 border border-zinc-600 rounded text-xs text-white">⚠️ Force Allow ID</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest pl-1">Display Name</label>
                                    <input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Item Name" className="w-full h-10 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-sm text-white focus:border-[var(--gold2)] focus:outline-none" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs text-zinc-500 uppercase font-bold tracking-widest pl-1">Category</label>
                                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-10 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-sm text-white focus:border-[var(--gold2)] focus:outline-none">
                                        {CATEGORIES[itemType].map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-800">
                                <button type="submit" disabled={isSaving || !itemName || (previewState !== 'valid' && previewState !== 'force')} className="w-full h-12 bg-zinc-800 text-zinc-500 font-bold tracking-widest rounded-lg flex items-center justify-center transition-all disabled:opacity-50 hover:bg-[var(--gold2)] hover:text-black">
                                    {isSaving ? 'SAVING...' : 'ADD TO DATABASE'}
                                </button>
                                {msg.text && <p className={`text-center text-xs mt-3 font-bold ${msg.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>{msg.text}</p>}
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
