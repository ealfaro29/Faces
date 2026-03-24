import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Plus, LogIn, Crown, Sun, Moon } from 'lucide-react';
import ScoringLanguageToggle from './ScoringLanguageToggle';
import { getStoredScoringLanguage, persistScoringLanguage, scoringCopy } from './scoringI18n';

export default function ScoringLanding() {
  const [theme, setTheme] = useState(localStorage.getItem('faces-scoring-theme') || 'dark');
  const [accentColor, setAccentColor] = useState(localStorage.getItem('faces-scoring-accent') || '#ffffff');
  const [language, setLanguage] = useState(getStoredScoringLanguage());
  const t = scoringCopy[language];

  const accents = [
    { name: 'White', color: '#ffffff' },
    { name: 'Gold', color: '#fbbf24' },
    { name: 'Rose', color: '#fb7185' },
    { name: 'Cyan', color: '#22d3ee' },
    { name: 'Purple', color: '#c084fc' },
  ];

  useEffect(() => {
    persistScoringLanguage(language);
  }, [language]);

  return (
    <div 
      className={`theme-scoring-${theme} min-h-screen bg-app-bg text-app-text font-sans flex items-center justify-center p-4`}
      style={{ '--color-app-accent': accentColor, '--color-app-accent-muted': `${accentColor}22` }}
    >
      <div className="w-full max-w-lg text-center">
        <div className="mb-10 min-h-[190px] flex flex-col justify-end">
          <div className="mb-6 flex flex-wrap justify-center items-center gap-4 h-12">
            <ScoringLanguageToggle language={language} label={t.languageLabel} onChange={setLanguage} />
            
            <div className="flex items-center gap-2 bg-app-card border border-app-border px-3 py-1.5 rounded-full shadow-sm h-10">
              {accents.map(acc => (
                <button
                  key={acc.color}
                  onClick={() => {
                    setAccentColor(acc.color);
                    localStorage.setItem('faces-scoring-accent', acc.color);
                  }}
                  className={`w-4 h-4 rounded-full border transition-all ${accentColor === acc.color ? 'scale-125 border-white ring-2 ring-white/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: acc.color }}
                  title={acc.name}
                />
              ))}
            </div>

            <button onClick={() => {
              const newTheme = theme === 'dark' ? 'light' : 'dark';
              setTheme(newTheme);
              localStorage.setItem('faces-scoring-theme', newTheme);
            }} className="w-10 h-10 flex items-center justify-center bg-app-card border border-app-border rounded-full cursor-pointer transition-colors text-app-muted hover:text-app-text shadow-sm" title="Alternar Tema">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-app-accent" />}
            </button>
          </div>
          <Crown className="w-10 h-10 text-app-accent opacity-50 mx-auto mb-4 shrink-0 transition-colors" />
          <h1 className="text-3xl font-bold text-app-text tracking-tight mb-2 shrink-0 h-9 overflow-hidden">{t.landing.title}</h1>
          <p className="text-app-muted/70 text-sm max-w-xs mx-auto shrink-0 h-10 overflow-hidden leading-tight flex items-center justify-center text-center">{t.landing.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/session/create"
            className="group h-[200px] flex flex-col justify-center bg-app-border/30 border border-app-border rounded-2xl p-6 hover:border-app-muted/50 transition-all no-underline text-left shadow-lg hover:shadow-xl hover:shadow-white/[0.03]"
          >
            <div className="w-10 h-10 rounded-xl bg-app-card border border-app-border flex items-center justify-center mb-4 group-hover:bg-app-border/50 transition-colors">
              <Plus className="w-5 h-5 text-app-text" />
            </div>
            <h2 className="text-lg font-bold text-app-text mb-1 h-7 overflow-hidden">{t.landing.createTitle}</h2>
            <p className="text-xs text-app-muted/70 leading-relaxed max-w-[90%] h-12 overflow-hidden">{t.landing.createDescription}</p>
          </Link>

          <Link
            to="/session/join"
            className="group h-[200px] flex flex-col justify-center bg-app-border/30 border border-app-border rounded-2xl p-6 hover:border-app-muted/50 transition-all no-underline text-left shadow-lg hover:shadow-xl hover:shadow-white/[0.03]"
          >
            <div className="w-10 h-10 rounded-xl bg-app-card border border-app-border flex items-center justify-center mb-4 group-hover:bg-app-border/50 transition-colors">
              <LogIn className="w-5 h-5 text-app-text" />
            </div>
            <h2 className="text-lg font-bold text-app-text mb-1 h-7 overflow-hidden">{t.landing.joinTitle}</h2>
            <p className="text-xs text-app-muted/70 leading-relaxed max-w-[90%] h-12 overflow-hidden">{t.landing.joinDescription}</p>
          </Link>
        </div>

        <p className="text-[11px] text-app-muted/30 mt-10">&copy; {new Date().getFullYear()} Scoring Engine &mdash; by <a href="https://discord.com/users/angelmuse_87856" target="_blank" rel="noopener noreferrer" className="text-app-muted/70 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-2">Angel Muse Doll</a></p>
      </div>
    </div>
  );
}
