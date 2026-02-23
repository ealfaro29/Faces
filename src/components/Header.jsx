import React, { useState, useEffect } from 'react';
import { Camera, Clock, UploadCloud, Ticket, Sun, Moon, Crown, Heart, Zap, Diamond } from 'lucide-react';
import AdminModal from './AdminModal';
import PhotosModal from './PhotosModal';
import TimeConverterModal from './TimeConverterModal';
import DriveModal from './DriveModal';
import TicketModal from './TicketModal';

export default function Header({ activeTab, setActiveTab }) {
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const [isPhotosOpen, setIsPhotosOpen] = useState(false);
    const [isTimeConverterOpen, setIsTimeConverterOpen] = useState(false);
    const [isDriveOpen, setIsDriveOpen] = useState(false);
    const [isTicketOpen, setIsTicketOpen] = useState(false);

    const THEMES = ['pink', 'apple', 'gold', 'cyberpunk'];

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('app-theme') || 'pink';
    });

    useEffect(() => {
        if (theme && theme !== 'pink') {
            document.documentElement.setAttribute('data-theme', theme);
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => {
            const nextIndex = (THEMES.indexOf(prev) + 1) % THEMES.length;
            return THEMES[nextIndex];
        });
    };

    const renderThemeIcon = () => {
        switch (theme) {
            case 'apple': return <Sun className="w-5 h-5" />;
            case 'gold': return <Crown className="w-5 h-5" />;
            case 'cyberpunk': return <Zap className="w-5 h-5" />;
            case 'pink':
            default: return <Heart className="w-5 h-5" />;
        }
    };

    const tabs = [
        { id: 'favorites', label: '❤️' },
        { id: 'facebases', label: 'Facebases' },
        { id: 'avatar', label: 'Avatar' },
        { id: 'textures', label: 'Textures' },
        { id: 'music', label: 'Music' }
    ];

    return (
        <header className="panel flex flex-col md:flex-row items-center justify-between p-4 gap-4" role="banner">
            <a href="https://ealfaro29.github.io/Faces/index.html" target="_blank" rel="noreferrer" className="text-3xl lg:text-4xl title-fancy gold-title no-underline hover:brightness-110" aria-label="Fashion Muse Collection home">
                <h1>Fashion Muse Collection</h1>
            </a>
            <nav className="flex items-center justify-center flex-wrap gap-2" role="navigation" aria-label="Main navigation">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-nav-button ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                        aria-label={`${tab.label} tab`}
                        aria-pressed={activeTab === tab.id}
                    >
                        {tab.label}
                    </button>
                ))}
                <button
                    id="nav-admin-btn"
                    className="tab-nav-button"
                    aria-label="Admin Panel"
                    style={{ borderColor: '#333', color: '#666' }}
                    onClick={() => setIsAdminOpen(true)}
                >
                    + Admin
                </button>
            </nav>
            <div className="flex items-center gap-2" role="toolbar" aria-label="Utility actions">
                <button onClick={() => setIsPhotosOpen(true)} className="w-10 h-10 flex items-center justify-center bg-[var(--card-lighter)] text-[var(--gold2)] rounded-full border border-transparent hover:border-[var(--border)] hover:scale-110 transition-all" aria-label="Open photo gallery" title="Download Photos">
                    <Camera className="w-5 h-5" />
                </button>
                <button onClick={() => setIsTimeConverterOpen(true)} className="w-10 h-10 flex items-center justify-center bg-[var(--card-lighter)] text-[var(--gold2)] rounded-full border border-transparent hover:border-[var(--border)] hover:scale-110 transition-all" aria-label="Open time converter" title="Time Converter">
                    <Clock className="w-5 h-5" />
                </button>
                <button onClick={() => setIsDriveOpen(true)} className="w-10 h-10 flex items-center justify-center bg-[var(--card-lighter)] text-[var(--gold2)] rounded-full border border-transparent hover:border-[var(--border)] hover:scale-110 transition-all" aria-label="Upload to Google Drive" title="Subir a Drive">
                    <UploadCloud className="w-5 h-5" />
                </button>
                <button onClick={() => setIsTicketOpen(true)} className="w-10 h-10 flex items-center justify-center bg-[var(--card-lighter)] text-[var(--gold2)] rounded-full border border-transparent hover:border-[var(--border)] hover:scale-110 transition-all text-xl" aria-label="Copy ticket names" title="Ticket Names">
                    <Ticket className="w-5 h-5" />
                </button>
                <a href="https://gemini.google.com/gem/45de6cb382e1" target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center bg-[var(--card-lighter)] text-[var(--gold2)] rounded-full border border-transparent hover:border-[var(--border)] hover:scale-110 transition-all" aria-label="Open Gemini Gem" title="AI Assistant">
                    <Diamond className="w-5 h-5" />
                </a>
                <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center bg-[var(--card-lighter)] text-[var(--gold2)] rounded-full border border-transparent hover:border-[var(--border)] hover:scale-110 transition-all" aria-label="Toggle Theme" title={`Change Theme (Current: ${theme})`}>
                    {renderThemeIcon()}
                </button>
            </div>

            <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
            <PhotosModal isOpen={isPhotosOpen} onClose={() => setIsPhotosOpen(false)} />
            <TimeConverterModal isOpen={isTimeConverterOpen} onClose={() => setIsTimeConverterOpen(false)} />
            <DriveModal isOpen={isDriveOpen} onClose={() => setIsDriveOpen(false)} />
            <TicketModal isOpen={isTicketOpen} onClose={() => setIsTicketOpen(false)} />
        </header>
    );
}
