import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Plus, LogIn, Crown, Sun, Moon } from 'lucide-react';
import ScoringLanguageToggle from './ScoringLanguageToggle';
import { getStoredScoringLanguage, persistScoringLanguage, scoringCopy } from './scoringI18n';
import {
  getScoringThemeStyleVars,
  getStoredScoringAccent,
  getStoredScoringTheme,
  persistScoringAccent,
  persistScoringTheme
} from './scoringTheme';

export default function ScoringLanding() {
  const [theme, setTheme] = useState(getStoredScoringTheme());
  const [accentColor, setAccentColor] = useState(getStoredScoringAccent());
  const [language, setLanguage] = useState(getStoredScoringLanguage());
  const t = scoringCopy[language];

  const accents = [
    { key: 'white', color: '#ffffff' },
    { key: 'gold', color: '#fbbf24' },
    { key: 'rose', color: '#fb7185' },
    { key: 'cyan', color: '#22d3ee' },
    { key: 'purple', color: '#c084fc' },
  ];

  useEffect(() => {
    persistScoringLanguage(language);
    document.title = t.appTitle;
  }, [language, t]);

  return (
    <div 
      className={`theme-scoring-${theme} min-h-screen bg-app-bg text-app-text font-sans flex items-center justify-center p-4`}
      style={getScoringThemeStyleVars(accentColor)}
    >
      <div className="w-full max-w-lg text-center">
        <div className="mb-10 flex flex-col gap-6">
          <div className="flex flex-wrap justify-center items-center gap-4">
            <ScoringLanguageToggle language={language} label={t.languageLabel} onChange={setLanguage} />
            
            <div className="flex items-center gap-2 bg-app-card border border-app-border px-3 py-1.5 rounded-full shadow-sm">
              {accents.map(acc => (
                <button
                  key={acc.color}
                  onClick={() => {
                    setAccentColor(acc.color);
                    persistScoringAccent(acc.color);
                  }}
                  className={`w-4 h-4 rounded-full border transition-all ${accentColor === acc.color ? 'scale-125 border-app-text ring-2 ring-app-text/10' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: acc.color }}
                  title={`${t.accentLabel}: ${t.accentNames[acc.key]}`}
                  aria-label={`${t.accentLabel}: ${t.accentNames[acc.key]}`}
                />
              ))}
            </div>

            <button onClick={() => {
              const newTheme = theme === 'dark' ? 'light' : 'dark';
              setTheme(newTheme);
              persistScoringTheme(newTheme);
            }} className="w-10 h-10 flex items-center justify-center bg-app-card border border-app-border rounded-full cursor-pointer transition-colors text-app-muted hover:text-app-text shadow-sm" title={t.themeToggleLabel} aria-label={t.themeToggleLabel}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-app-accent" />}
            </button>
          </div>
          <div>
            <Crown className="w-10 h-10 text-app-accent opacity-50 mx-auto mb-4 transition-colors" />
            <h1 className="text-3xl font-bold text-app-text tracking-tight mb-2">{t.landing.title}</h1>
            <p className="text-app-muted/80 text-sm max-w-sm mx-auto leading-tight text-center">{t.landing.subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/session/create"
            className="group scoring-panel min-h-[200px] flex flex-col justify-between rounded-2xl p-6 transition-all no-underline text-left hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-xl bg-app-card border border-app-border flex items-center justify-center mb-4 group-hover:bg-app-border/50 transition-colors">
              <Plus className="w-5 h-5 text-app-text" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-app-text">{t.landing.createTitle}</h2>
              <p className="text-xs text-app-muted/80 leading-relaxed max-w-[92%]">{t.landing.createDescription}</p>
            </div>
          </Link>

          <Link
            to="/session/join"
            className="group scoring-panel min-h-[200px] flex flex-col justify-between rounded-2xl p-6 transition-all no-underline text-left hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-xl bg-app-card border border-app-border flex items-center justify-center mb-4 group-hover:bg-app-border/50 transition-colors">
              <LogIn className="w-5 h-5 text-app-text" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-app-text">{t.landing.joinTitle}</h2>
              <p className="text-xs text-app-muted/80 leading-relaxed max-w-[92%]">{t.landing.joinDescription}</p>
            </div>
          </Link>
        </div>

        <p className="text-[11px] text-app-muted/50 mt-10">
          &copy; {new Date().getFullYear()} Pageants · {t.footerByLabel}{' '}
          <a href="https://discord.com/users/angelmuse_87856" target="_blank" rel="noopener noreferrer" className="text-app-text/80 hover:text-app-text transition-colors underline decoration-app-border underline-offset-2">Angel Muse Doll</a>
        </p>
      </div>
    </div>
  );
}
