import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../../core/firebase.js';
import { doc, setDoc } from 'firebase/firestore';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ScoringLanguageToggle from './ScoringLanguageToggle';
import { getDefaultPhaseName, getStoredScoringLanguage, persistScoringLanguage, scoringCopy } from './scoringI18n';

export default function CreateSession() {
  const [theme] = useState(localStorage.getItem('faces-scoring-theme') || 'dark');
  const [accentColor] = useState(localStorage.getItem('faces-scoring-accent') || '#ffffff');
  const navigate = useNavigate();
  const [judgeName, setJudgeName] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [type, setType] = useState('Global');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState(getStoredScoringLanguage());
  const t = scoringCopy[language];

  useEffect(() => {
    persistScoringLanguage(language);
  }, [language]);

  const generateSessionId = () => 'MU-' + Math.random().toString(36).substring(2, 7).toUpperCase();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!judgeName.trim() || !sessionName.trim()) { setError(t.create.completeFields); return; }
    if (submitting) return;
    
    setSubmitting(true);
    setError('');
    const sessionId = generateSessionId();
    
    const sessionData = {
      id: sessionId,
      name: sessionName.trim(),
      type,
      language,
      host: judgeName.trim(),
      currentPhaseIndex: 0,
      phases: [{ name: getDefaultPhaseName(0, language), cutoff: null, status: 'active' }],
      participants: [],
      judges: [judgeName.trim()],
      createdAt: Date.now()
    };

    try {
      await setDoc(doc(db, "sessions", sessionId), sessionData);
      navigate(`/session/${sessionId}?judge=${encodeURIComponent(judgeName.trim())}`);
    } catch(err) {
      console.error(err);
      setError(t.create.createError);
      setSubmitting(false);
    }
  };

  return (
    <div 
      className={`theme-scoring-${theme} min-h-screen bg-app-bg text-app-text font-sans flex justify-center p-4 md:p-10`}
      style={{ '--color-app-accent': accentColor, '--color-app-accent-muted': `${accentColor}22` }}
    >
      <div className="w-full max-w-md h-fit">
        <Link to="/session" className="inline-flex items-center gap-2 text-xs text-app-muted/70 hover:text-white transition-colors mb-6 no-underline uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> {t.backToStart}
        </Link>

        <div className="bg-app-border/30 border border-app-border/80 rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="mb-6 flex justify-end">
            <ScoringLanguageToggle language={language} label={t.languageLabel} onChange={setLanguage} />
          </div>
          <div className="min-h-[100px] mb-4">
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">{t.create.title}</h1>
            <p className="text-app-muted/70 text-sm leading-relaxed">{t.create.subtitle}</p>
          </div>
          
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-xs font-bold tracking-widest text-app-muted/70 uppercase mb-2">{t.create.hostLabel}</label>
              <input 
                required type="text" value={judgeName} onChange={e => { setJudgeName(e.target.value); setError(''); }}
                className="w-full bg-app-card border border-app-border rounded-lg h-12 px-4 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors" 
                placeholder={t.create.hostPlaceholder}
              />
            </div>
            <div>
              <label className="block text-xs font-bold tracking-widest text-app-muted/70 uppercase mb-2">{t.create.sessionNameLabel}</label>
              <input 
                required type="text" value={sessionName} onChange={e => { setSessionName(e.target.value); setError(''); }}
                className="w-full bg-app-card border border-app-border rounded-lg h-12 px-4 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder={t.create.sessionNamePlaceholder}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold tracking-widest text-app-muted/70 uppercase mb-2">{t.create.typeLabel}</label>
              <select 
                value={type} onChange={e => setType(e.target.value)} 
                className="w-full bg-app-card border border-app-border rounded-lg h-12 px-4 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="Global">{t.create.globalOption}</option>
                <option value="Nacional">{t.create.nationalOption}</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full h-14 mt-4 bg-white text-black font-bold uppercase tracking-widest text-sm rounded-xl hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.create.submitBusy}</> : t.create.submitIdle}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
