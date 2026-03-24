import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../../core/firebase.js';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ScoringLanguageToggle from './ScoringLanguageToggle';
import { getStoredScoringLanguage, normalizeScoringLanguage, persistScoringLanguage, scoringCopy } from './scoringI18n';

export default function JoinSession() {
  const [theme] = useState(localStorage.getItem('faces-scoring-theme') || 'dark');
  const [accentColor] = useState(localStorage.getItem('faces-scoring-accent') || '#ffffff');
  const navigate = useNavigate();
  const [judgeName, setJudgeName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [language, setLanguage] = useState(getStoredScoringLanguage());
  const t = scoringCopy[language];

  useEffect(() => {
    persistScoringLanguage(language);
  }, [language]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!judgeName.trim() || !sessionCode.trim()) return;
    if (submitting) return;
    
    setSubmitting(true);
    setError('');

    try {
      const code = sessionCode.trim().toUpperCase();
      const sessionRef = doc(db, "sessions", code);
      const docSnap = await getDoc(sessionRef);
      
      if (docSnap.exists()) {
        const sessionLanguage = normalizeScoringLanguage(docSnap.data()?.language || language);
        persistScoringLanguage(sessionLanguage);
        navigate(`/session/${code}?judge=${encodeURIComponent(judgeName.trim())}`);
      } else {
        setError(t.join.sessionMissing);
        setSubmitting(false);
      }
    } catch(err) {
      console.error(err);
      setError(t.join.connectionError);
      setSubmitting(false);
    }
  };

  return (
    <div 
      className={`theme-scoring-${theme} min-h-screen bg-app-bg text-app-text font-sans flex items-center justify-center p-4`}
      style={{ '--color-app-accent': accentColor, '--color-app-accent-muted': `${accentColor}22` }}
    >
      <div className="w-full max-w-sm">
        <Link to="/session" className="inline-flex items-center gap-2 text-xs text-app-muted/70 hover:text-white transition-colors mb-6 no-underline uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> {t.backToStart}
        </Link>

        <div className="bg-app-border/30/50 backdrop-blur-xl border border-app-border rounded-2xl p-8 shadow-2xl">
          <div className="mb-6 flex justify-end">
            <ScoringLanguageToggle language={language} label={t.languageLabel} onChange={setLanguage} />
          </div>
          <div className="min-h-[100px] mb-4">
            <h1 className="text-2xl font-bold text-white mb-2 text-center tracking-tight">{t.join.title}</h1>
            <p className="text-sm text-app-muted/70 text-center leading-relaxed">{t.join.subtitle}</p>
          </div>
          
          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold tracking-widest text-app-muted/70 uppercase mb-2">{t.join.judgeNameLabel}</label>
              <input 
                type="text" 
                required
                value={judgeName}
                onChange={e => { setJudgeName(e.target.value); setError(''); }}
                className="w-full bg-app-card border border-app-border rounded-lg h-12 px-4 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder={t.join.judgeNamePlaceholder}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold tracking-widest text-app-muted/70 uppercase mb-2">{t.join.sessionCodeLabel}</label>
              <input 
                type="text" 
                required
                value={sessionCode}
                onChange={e => { setSessionCode(e.target.value); setError(''); }}
                className="w-full bg-app-card border border-app-border rounded-lg h-12 px-4 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors uppercase font-mono tracking-widest"
                placeholder={t.join.sessionCodePlaceholder}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full h-12 mt-6 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.join.submitBusy}</> : t.join.submitIdle}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
