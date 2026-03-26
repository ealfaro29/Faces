import React from 'react';
import { Heart, Smile, User, Layers, Music } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'favorites', label: 'Favs', icon: <Heart className="w-5 h-5" /> },
    { id: 'facebases', label: 'Faces', icon: <Smile className="w-5 h-5" /> },
    { id: 'avatar', label: 'Avatar', icon: <User className="w-5 h-5" /> },
    { id: 'textures', label: 'Textur', icon: <Layers className="w-5 h-5" /> },
    { id: 'music', label: 'Music', icon: <Music className="w-5 h-5" /> }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0c0c0e]/95 backdrop-blur-xl border-t border-zinc-800/50 flex items-center justify-around py-2 px-1 z-50 shadow-[0_-10px_25px_rgba(0,0,0,0.3)]">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center gap-1 min-w-[60px] transition-all ${
            activeTab === tab.id 
              ? 'text-[var(--gold2)] scale-110' 
              : 'text-zinc-500 hover:text-zinc-400'
          }`}
        >
          <div className={`${activeTab === tab.id ? 'text-[var(--gold2)]' : 'text-zinc-500'}`}>
            {tab.icon}
          </div>
          <span className="text-[10px] font-medium tracking-wide uppercase">
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
