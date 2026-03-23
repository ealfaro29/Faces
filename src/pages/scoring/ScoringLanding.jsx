import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Plus, LogIn, Crown } from 'lucide-react';
import ScoringLanguageToggle from './ScoringLanguageToggle';
import { getStoredScoringLanguage, persistScoringLanguage, scoringCopy } from './scoringI18n';

export default function ScoringLanding() {
  const [language, setLanguage] = useState(getStoredScoringLanguage());
  const t = scoringCopy[language];

  useEffect(() => {
    persistScoringLanguage(language);
  }, [language]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        <div className="mb-10">
          <div className="mb-6 flex justify-center">
            <ScoringLanguageToggle language={language} label={t.languageLabel} onChange={setLanguage} />
          </div>
          <Crown className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{t.landing.title}</h1>
          <p className="text-zinc-500 text-sm max-w-xs mx-auto">{t.landing.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/session/create"
            className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-600 transition-all no-underline text-left shadow-lg hover:shadow-xl hover:shadow-white/[0.03]"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-zinc-800 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">{t.landing.createTitle}</h2>
            <p className="text-xs text-zinc-500 leading-relaxed">{t.landing.createDescription}</p>
          </Link>

          <Link
            to="/session/join"
            className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-600 transition-all no-underline text-left shadow-lg hover:shadow-xl hover:shadow-white/[0.03]"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-zinc-800 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
              <LogIn className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">{t.landing.joinTitle}</h2>
            <p className="text-xs text-zinc-500 leading-relaxed">{t.landing.joinDescription}</p>
          </Link>
        </div>

        <p className="text-[11px] text-zinc-700 mt-10">&copy; {new Date().getFullYear()} Scoring Engine &mdash; by <a href="https://discord.com/users/angelmuse_87856" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-2">Angel Muse Doll</a></p>
      </div>
    </div>
  );
}
