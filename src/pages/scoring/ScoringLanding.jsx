import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Plus, LogIn, Crown, Sun, Moon } from 'lucide-react';
import ScoringLanguageToggle from './ScoringLanguageToggle';
import { getStoredScoringLanguage, persistScoringLanguage, scoringCopy } from './scoringI18n';

export default function ScoringLanding() {
  const [theme, setTheme] = useState(localStorage.getItem('faces-scoring-theme') || 'dark');
  const [language, setLanguage] = useState(getStoredScoringLanguage());
  const t = scoringCopy[language];

  useEffect(() => {
    persistScoringLanguage(language);
  }, [language]);

  return (
    <div className={`theme-scoring-${theme} min-h-screen bg-app-bg text-app-text font-sans flex items-center justify-center p-4`}>
      <div className="w-full max-w-lg text-center">
        <div className="mb-10 min-h-[165px] flex flex-col justify-end">
          <div className="mb-6 flex justify-center items-center gap-3">
            <ScoringLanguageToggle language={language} label={t.languageLabel} onChange={setLanguage} />
            <button onClick={() => {
              const newTheme = theme === 'dark' ? 'light' : 'dark';
              setTheme(newTheme);
              localStorage.setItem('faces-scoring-theme', newTheme);
            }} className="p-2.5 bg-app-card border border-app-border rounded-full cursor-pointer transition-colors text-app-muted hover:text-app-text shadow-sm" title="Alternar Tema">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-amber-500" />}
            </button>
          </div>
          <Crown className="w-10 h-10 text-app-muted/50 mx-auto mb-4 shrink-0" />
          <h1 className="text-3xl font-bold text-app-text tracking-tight mb-2 shrink-0">{t.landing.title}</h1>
          <p className="text-app-muted/70 text-sm max-w-xs mx-auto shrink-0">{t.landing.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/session/create"
            className="group min-h-[180px] flex flex-col justify-center bg-app-border/30 border border-app-border rounded-2xl p-6 hover:border-app-muted/50 transition-all no-underline text-left shadow-lg hover:shadow-xl hover:shadow-white/[0.03]"
          >
            <div className="w-10 h-10 rounded-xl bg-app-card border border-app-border flex items-center justify-center mb-4 group-hover:bg-app-border/50 transition-colors">
              <Plus className="w-5 h-5 text-app-text" />
            </div>
            <h2 className="text-lg font-bold text-app-text mb-1">{t.landing.createTitle}</h2>
            <p className="text-xs text-app-muted/70 leading-relaxed max-w-[90%]">{t.landing.createDescription}</p>
          </Link>

          <Link
            to="/session/join"
            className="group min-h-[180px] flex flex-col justify-center bg-app-border/30 border border-app-border rounded-2xl p-6 hover:border-app-muted/50 transition-all no-underline text-left shadow-lg hover:shadow-xl hover:shadow-white/[0.03]"
          >
            <div className="w-10 h-10 rounded-xl bg-app-card border border-app-border flex items-center justify-center mb-4 group-hover:bg-app-border/50 transition-colors">
              <LogIn className="w-5 h-5 text-app-text" />
            </div>
            <h2 className="text-lg font-bold text-app-text mb-1">{t.landing.joinTitle}</h2>
            <p className="text-xs text-app-muted/70 leading-relaxed max-w-[90%]">{t.landing.joinDescription}</p>
          </Link>
        </div>

        <p className="text-[11px] text-app-muted/30 mt-10">&copy; {new Date().getFullYear()} Scoring Engine &mdash; by <a href="https://discord.com/users/angelmuse_87856" target="_blank" rel="noopener noreferrer" className="text-app-muted/70 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-2">Angel Muse Doll</a></p>
      </div>
    </div>
  );
}
