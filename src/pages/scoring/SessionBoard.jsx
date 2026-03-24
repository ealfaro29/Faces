import { useState, useEffect, useRef, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../../../core/firebase.js';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Copy, Check, Search, Plus, X, ChevronRight, Globe, MapPin, AlertTriangle, Crown, BarChart3, Sun, Moon } from 'lucide-react';
import {
  getCountryDisplayName,
  getDefaultPhaseName,
  getSessionTypeLabel,
  getStoredScoringLanguage,
  normalizeScoringLanguage,
  persistScoringLanguage,
  scoringCopy
} from './scoringI18n';
import PhaseReportModal from './PhaseReportModal';

function getDefaultPhase(language) {
  return { name: getDefaultPhaseName(0, language), cutoff: null, participantIds: null, status: 'active' };
}

function normalizePhase(phase, index, currentPhaseIndex, language) {
  const cutoff = Number.parseInt(phase?.cutoff, 10);
  const participantIds = Array.isArray(phase?.participantIds)
    ? phase.participantIds.filter(id => typeof id === 'string' && id.trim())
    : null;

  return {
    name: typeof phase?.name === 'string' && phase.name.trim() ? phase.name.trim() : getDefaultPhaseName(index, language),
    cutoff: Number.isFinite(cutoff) && cutoff > 0 ? cutoff : null,
    participantIds: participantIds?.length ? participantIds : null,
    status:
      phase?.status === 'completed' || phase?.status === 'active'
        ? phase.status
        : index === currentPhaseIndex
          ? 'active'
          : 'completed'
  };
}

function getPhaseOrder(key, phase, fallbackIndex) {
  if (typeof phase?.index === 'number') return phase.index;

  const match = String(key).match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : fallbackIndex;
}

function normalizePhases(rawPhases, currentPhaseIndex = 0, language = 'es') {
  if (Array.isArray(rawPhases) && rawPhases.length > 0) {
    return rawPhases.map((phase, index) => normalizePhase(phase, index, currentPhaseIndex, language));
  }

  if (rawPhases && typeof rawPhases === 'object') {
    if ('name' in rawPhases || 'cutoff' in rawPhases || 'status' in rawPhases) {
      return [normalizePhase(rawPhases, 0, currentPhaseIndex, language)];
    }

    const normalized = Object.entries(rawPhases)
      .filter(([, phase]) => phase && typeof phase === 'object')
      .sort((a, b) => getPhaseOrder(a[0], a[1], 0) - getPhaseOrder(b[0], b[1], 0))
      .map(([, phase], index) => normalizePhase(phase, index, currentPhaseIndex, language));

    if (normalized.length > 0) return normalized;
  }

  return [getDefaultPhase(language)];
}

function rankParticipantsByPhaseScores(participants, phaseScores) {
  return participants
    .map(participant => {
      const participantScores = phaseScores[participant.id] || {};
      const values = Object.values(participantScores).filter(value => value !== null && value !== undefined);
      const avg = values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

      return {
        ...participant,
        avg,
        voteCount: values.length
      };
    })
    .sort((a, b) => b.avg - a.avg || a.name.localeCompare(b.name));
}

export default function SessionBoard() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = { htmlP: html.style.padding, bodyP: body.style.padding, bodyO: body.style.overflow, bodyBg: body.style.background };
    html.style.padding = '0'; body.style.padding = '0'; body.style.overflow = 'hidden'; body.style.background = '#0a0a0a';
    document.title = `Scoring System v${__APP_VERSION__}`;
    return () => { html.style.padding = prev.htmlP; body.style.padding = prev.bodyP; body.style.overflow = prev.bodyO; body.style.background = prev.bodyBg; };
  }, []);

  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const judgeName = searchParams.get('judge');

  const [session, setSession] = useState(null);
  const [scores, setScores] = useState({});
  const [codeCopied, setCodeCopied] = useState(false);
  const [forceAttempted, setForceAttempted] = useState(false);
  const [scoreDrafts, setScoreDrafts] = useState({});
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('faces-scoring-theme') || 'dark');
  const [accentColor, setAccentColor] = useState(localStorage.getItem('faces-scoring-accent') || '#ffffff');

  // Search state
  const [countries, setCountries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedParentCountry, setSelectedParentCountry] = useState(null);
  const [loadingCities, setLoadingCities] = useState(false);
  const searchRef = useRef(null);
  const scoreSaveTimersRef = useRef({});
  const fallbackLanguage = getStoredScoringLanguage();
  const currentLanguage = normalizeScoringLanguage(session?.language || fallbackLanguage);
  const t = scoringCopy[currentLanguage];

  useEffect(() => {
    persistScoringLanguage(currentLanguage);
  }, [currentLanguage]);

  // Load countries
  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,translations,cca3,flag')
      .then(r => r.json())
      .then(data => {
        setCountries(
          data.map(c => ({
            name: getCountryDisplayName(c, currentLanguage),
            apiName: c.name?.common || '',
            flag: c.flag || '',
            id: c.cca3 || Math.random().toString()
          }))
          .filter(c => c.name).sort((a, b) => a.name.localeCompare(b.name))
        );
      }).catch(() => {});
  }, [currentLanguage]);

  // Load cities for Nacional
  useEffect(() => {
    if (session?.type === 'Nacional' && selectedParentCountry) {
      setCities([]); setLoadingCities(true);
      fetch('https://countriesnow.space/api/v0.1/countries/cities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: selectedParentCountry.apiName || selectedParentCountry.name })
      }).then(r => r.json()).then(data => {
        if (!data.error && data.data) setCities(data.data.map(c => ({ name: c, id: c.replace(/\s+/g, '').toUpperCase(), flag: selectedParentCountry.flag })));
      }).catch(() => {}).finally(() => setLoadingCities(false));
    }
  }, [session?.type, selectedParentCountry]);

  // Filter search
  useEffect(() => {
    if (searchQuery.length > 1) {
      const pool = session?.type === 'Nacional' && selectedParentCountry ? cities : countries;
      setSearchResults(pool.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 10));
    } else setSearchResults([]);
  }, [searchQuery, countries, cities, session?.type, selectedParentCountry]);

  // Click outside
  useEffect(() => {
    const h = e => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchResults([]); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    Object.values(scoreSaveTimersRef.current).forEach(clearTimeout);
    scoreSaveTimersRef.current = {};
    setScoreDrafts({});
  }, [sessionId, judgeName, session?.currentPhaseIndex]);

  useEffect(() => {
    return () => {
      Object.values(scoreSaveTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  // Session + scores listener
  useEffect(() => {
    if (!sessionId || !judgeName) { if (!judgeName) navigate('/session/join'); return; }
    const unsubS = onSnapshot(doc(db, "sessions", sessionId), snap => {
      if (snap.exists()) setSession(snap.data());
    });
    const unsubSc = onSnapshot(doc(db, "sessions", `${sessionId}_scores`), snap => {
      setScores(snap.exists() ? snap.data() : {});
    });
    // Register judge
    updateDoc(doc(db, "sessions", sessionId), { judges: arrayUnion(judgeName) }).catch(() => {});
    return () => { unsubS(); unsubSc(); };
  }, [sessionId, judgeName, navigate]);

  // --- Actions ---
  const handleScore = async (participantId, value) => {
    if (value === '' || value === undefined) {
      await deleteScore(participantId);
      return;
    }
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 10) return;
    const phaseKey = `phase_${currentPhaseIndex}`;
    await setDoc(doc(db, "sessions", `${sessionId}_scores`), {
      [phaseKey]: { [participantId]: { [judgeName]: num } }
    }, { merge: true });
  };

  const deleteScore = async (participantId) => {
    const phaseKey = `phase_${currentPhaseIndex}`;
    await setDoc(doc(db, "sessions", `${sessionId}_scores`), {
      [phaseKey]: { [participantId]: { [judgeName]: null } }
    }, { merge: true });
  };

  const queueScoreSave = (participantId, value) => {
    setScoreDrafts(prev => ({ ...prev, [participantId]: value }));

    if (scoreSaveTimersRef.current[participantId]) {
      clearTimeout(scoreSaveTimersRef.current[participantId]);
    }

    scoreSaveTimersRef.current[participantId] = setTimeout(() => {
      handleScore(participantId, value).catch(() => {});
      delete scoreSaveTimersRef.current[participantId];
    }, 250);
  };

  const flushScoreSave = (participantId, fallbackValue) => {
    if (scoreSaveTimersRef.current[participantId]) {
      clearTimeout(scoreSaveTimersRef.current[participantId]);
      delete scoreSaveTimersRef.current[participantId];
    }

    handleScore(participantId, scoreDrafts[participantId] ?? fallbackValue ?? '').catch(() => {});
  };

  const addParticipant = async (item) => {
    const participants = session.participants || [];
    if (participants.find(p => p.id === item.id)) { setSearchQuery(''); setSearchResults([]); return; }
    await updateDoc(doc(db, "sessions", session.id), {
      participants: [...participants, { ...item, type: session.type === 'Global' ? 'country' : 'city' }]
    });
    setSearchQuery(''); setSearchResults([]);
  };

  const removeParticipant = async (id) => {
    await updateDoc(doc(db, "sessions", session.id), {
      participants: (session.participants || []).filter(p => p.id !== id)
    });
  };

  const updatePhaseName = async (name) => {
    const nextPhases = [...phases];
    nextPhases[currentPhaseIndex] = { ...nextPhases[currentPhaseIndex], name };
    await updateDoc(doc(db, "sessions", session.id), { phases: nextPhases });
  };

  const updatePhaseCutoff = async (value) => {
    const nextPhases = [...phases];
    const num = parseInt(value);
    nextPhases[currentPhaseIndex] = { ...nextPhases[currentPhaseIndex], cutoff: isNaN(num) || num <= 0 ? null : num };
    await updateDoc(doc(db, "sessions", session.id), { phases: nextPhases });
  };

  const advancePhase = async () => {
    const phaseKey = `phase_${currentPhaseIndex}`;
    let phaseScores = scores[phaseKey] || {};
    const currentParticipants = getPhaseParticipants(currentPhaseIndex);
    const judges = session.judges || [];

    // Check if all judges have scored all participants
    const allComplete = currentParticipants.every(p => {
      const pScores = phaseScores[p.id] || {};
      return judges.every(j => pScores[j] !== undefined && pScores[j] !== null);
    });

    if (!allComplete && !forceAttempted) {
      setForceAttempted(true);
      return; // Show warning, next click will force
    }

    // Force: fill missing scores with 1
    if (!allComplete) {
      const updates = {};
      const nextPhaseScores = { ...phaseScores };
      currentParticipants.forEach(p => {
        nextPhaseScores[p.id] = { ...(nextPhaseScores[p.id] || {}) };
        judges.forEach(j => {
          if (!phaseScores[p.id]?.[j] && phaseScores[p.id]?.[j] !== 0) {
            updates[`${phaseKey}.${p.id}.${j}`] = 1;
            nextPhaseScores[p.id][j] = 1;
          }
        });
      });
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, "sessions", `${sessionId}_scores`), updates);
      }
      phaseScores = nextPhaseScores;
    }

    // Mark current phase complete, add new phase
    const nextPhases = [...phases];
    const rankedCurrentParticipants = rankParticipantsByPhaseScores(currentParticipants, phaseScores);
    const qualifiedParticipants = rankedCurrentParticipants.slice(0, currentPhase.cutoff || rankedCurrentParticipants.length);

    nextPhases[currentPhaseIndex] = {
      ...nextPhases[currentPhaseIndex],
      status: 'completed',
      participantIds: currentParticipants.map(participant => participant.id)
    };
    const newPhaseIndex = currentPhaseIndex + 1;
    nextPhases.push({
      name: getDefaultPhaseName(newPhaseIndex, currentLanguage),
      cutoff: null,
      status: 'active',
      participantIds: qualifiedParticipants.map(participant => participant.id)
    });

    await updateDoc(doc(db, "sessions", session.id), {
      phases: nextPhases,
      currentPhaseIndex: newPhaseIndex
    });
    setForceAttempted(false);
  };

  const revealWinner = async () => {
    const phaseKey = `phase_${currentPhaseIndex}`;
    let phaseScores = scores[phaseKey] || {};
    const currentParticipants = getPhaseParticipants(currentPhaseIndex);
    const judges = session.judges || [];

    const allComplete = currentParticipants.every(participant => {
      const participantScores = phaseScores[participant.id] || {};
      return judges.every(judge => participantScores[judge] !== undefined && participantScores[judge] !== null);
    });

    if (!allComplete && !forceAttempted) {
      setForceAttempted(true);
      return;
    }

    if (!allComplete) {
      const updates = {};
      const nextPhaseScores = { ...phaseScores };
      currentParticipants.forEach(participant => {
        nextPhaseScores[participant.id] = { ...(nextPhaseScores[participant.id] || {}) };
        judges.forEach(judge => {
          if (!phaseScores[participant.id]?.[judge] && phaseScores[participant.id]?.[judge] !== 0) {
            updates[`${phaseKey}.${participant.id}.${judge}`] = 1;
            nextPhaseScores[participant.id][judge] = 1;
          }
        });
      });
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, "sessions", `${sessionId}_scores`), updates);
      }
      phaseScores = nextPhaseScores;
    }

    const rankedCurrentParticipants = rankParticipantsByPhaseScores(currentParticipants, phaseScores);
    const winner = rankedCurrentParticipants[0];
    const nextPhases = [...phases];

    nextPhases[currentPhaseIndex] = {
      ...nextPhases[currentPhaseIndex],
      status: 'completed',
      participantIds: currentParticipants.map(participant => participant.id)
    };

    await updateDoc(doc(db, "sessions", session.id), {
      phases: nextPhases,
      status: 'completed',
      winnerId: winner?.id || null,
      winnerPhaseIndex: currentPhaseIndex,
      completedAt: Date.now()
    });
    setForceAttempted(false);
  };

  const handlePhaseAction = () => {
    if (currentPhase.cutoff === 1) {
      revealWinner().catch(() => {});
      return;
    }

    advancePhase().catch(() => {});
  };

  const copyCode = () => {
    navigator.clipboard.writeText(session?.id || '');
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // --- Computed ---
  if (!session) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-app-border border-t-white rounded-full animate-spin"></div>
    </div>
  );

  const isHost = session.host === judgeName;
  const allParticipants = session.participants || [];
  const judges = session.judges || [];
  const requestedPhaseIndex = Number.isInteger(session.currentPhaseIndex) ? session.currentPhaseIndex : 0;
  const phases = normalizePhases(session.phases, requestedPhaseIndex, currentLanguage);
  const currentPhaseIndex = Math.min(Math.max(requestedPhaseIndex, 0), phases.length - 1);
  const currentPhase = phases[currentPhaseIndex] || getDefaultPhase(currentLanguage);
  const participantMap = new Map(allParticipants.map(participant => [participant.id, participant]));
  const phaseKey = `phase_${currentPhaseIndex}`;
  const phaseScores = scores[phaseKey] || {};

  // Get participants for a given phase index
  const getPhaseParticipants = (phaseIdx) => {
    if (phaseIdx < 0) return [];
    if (phaseIdx === 0) return allParticipants;
    const phase = phases[phaseIdx];
    if (phase?.participantIds?.length) {
      return phase.participantIds.map(participantId => participantMap.get(participantId)).filter(Boolean);
    }

    const prevPhase = phases[phaseIdx - 1];
    const prevParticipants = getPhaseParticipants(phaseIdx - 1);
    if (!prevPhase || !prevPhase.cutoff) return prevParticipants;
    const prevKey = `phase_${phaseIdx - 1}`;
    const prevScores = scores[prevKey] || {};
    const ranked = rankParticipantsByPhaseScores(prevParticipants, prevScores);
    return ranked.slice(0, prevPhase.cutoff);
  };

  const currentParticipants = getPhaseParticipants(currentPhaseIndex);

  // Score + sort participants for current phase
  const scoredParticipants = currentParticipants.map(p => {
    const pScores = phaseScores[p.id] || {};
    const vals = Object.values(pScores).filter(v => v !== null && v !== undefined);
    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const myScore = pScores[judgeName];
    return { ...p, avg, voteCount: vals.length, myScore };
  });

  // Calculate who is actually making the cut based on scores, not alphabetical order
  const rankedForCutoff = rankParticipantsByPhaseScores(currentParticipants, phaseScores);
  const cutoffLimit = currentPhase.cutoff || rankedForCutoff.length;
  const qualifiedIds = new Set(rankedForCutoff.slice(0, cutoffLimit).map(p => p.id));

  // Check completion for advance button
  const allJudgesComplete = currentParticipants.length > 0 && currentParticipants.every(p => {
    const pScores = phaseScores[p.id] || {};
    return judges.every(j => pScores[j] !== undefined && pScores[j] !== null);
  });
  const votedJudges = judges.filter(j => currentParticipants.every(p => {
    const ps = phaseScores[p.id] || {};
    return ps[j] !== undefined && ps[j] !== null;
  })).length;
  const pendingJudges = Math.max(judges.length - votedJudges, 0);
  const isFinalRound = currentPhase.cutoff === 1;
  const isSessionComplete = session.status === 'completed' && Boolean(session.winnerId);

  // Global results: track all participants + their elimination phase
  const globalResults = allParticipants.map(p => {
    // Find the last phase this participant was active in
    let lastActivePhase = 0;
    let eliminated = false;
    let totalAvg = 0;
    let totalVotes = 0;

    for (let i = 0; i <= currentPhaseIndex; i++) {
      const phaseParticipants = getPhaseParticipants(i);
      const isInPhase = phaseParticipants.find(pp => pp.id === p.id);
      if (!isInPhase) {
        eliminated = true;
        break;
      }
      lastActivePhase = i;
      const pk = `phase_${i}`;
      const ps = scores[pk]?.[p.id] || {};
      const vals = Object.values(ps).filter(v => v !== null && v !== undefined);
      if (vals.length > 0) {
        totalAvg = vals.reduce((a, b) => a + b, 0) / vals.length;
        totalVotes += vals.length;
      }
    }

    const isCurrentlyActive = !eliminated;
    return { ...p, lastActivePhase, eliminated, totalAvg, totalVotes, isCurrentlyActive };
  }).sort((a, b) => {
    if (session.winnerId === a.id && session.winnerId !== b.id) return -1;
    if (session.winnerId !== a.id && session.winnerId === b.id) return 1;
    if (a.isCurrentlyActive && !b.isCurrentlyActive) return -1;
    if (!a.isCurrentlyActive && b.isCurrentlyActive) return 1;
    return b.totalAvg - a.totalAvg;
  });
  const winner = session.winnerId ? participantMap.get(session.winnerId) : null;
  const winnerResult = session.winnerId ? globalResults.find(participant => participant.id === session.winnerId) : null;
  const winnerPhaseName = phases[session.winnerPhaseIndex]?.name || currentPhase.name;

  const canAdvance = !isSessionComplete && currentParticipants.length > 0;

  return (
    <div 
      className={`theme-scoring-${theme} min-h-screen bg-app-bg text-app-text font-sans flex flex-col h-screen overflow-hidden`}
      style={{ '--color-app-accent': accentColor, '--color-app-accent-muted': `${accentColor}22` }}
    >
      
      {/* HEADER */}
      <header className="h-12 border-b border-app-border/60 bg-app-card/80 backdrop-blur-md flex items-center justify-between px-5 flex-shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          {session.type === 'Global' ? <Globe className="w-4 h-4 text-app-muted/70 shrink-0" /> : <MapPin className="w-4 h-4 text-app-muted/70 shrink-0" />}
          <h1 className="text-sm font-bold text-white tracking-tight truncate">{session.name}</h1>
          <span className="text-[10px] text-app-muted/50 bg-app-border/30 px-2 py-0.5 rounded border border-app-border shrink-0">{getSessionTypeLabel(session.type, currentLanguage)}</span>
          <span className="text-[10px] text-app-muted/50 shrink-0">{judges.length} {judges.length === 1 ? t.board.judgeSingular : t.board.judgePlural}</span>
          <span className="text-[9px] text-app-muted/70 font-mono bg-app-border/30 px-1.5 py-0.5 rounded border border-app-border shrink-0" title="Versión de despliegue">v{__APP_VERSION__}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isHost && (
            <button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-1.5 bg-app-border px-2 py-1 rounded text-[10px] font-medium text-app-text border border-app-border/70 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer">
              <BarChart3 className="w-3 h-3" />
              Reportes
            </button>
          )}
          <button onClick={copyCode} className="flex items-center gap-1.5 bg-app-border px-2 py-1 rounded text-[10px] font-mono tracking-widest text-app-muted border border-app-border/70 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer" title={t.board.copyCode}>
            {session.id}
            {codeCopied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-app-muted">{judgeName}</span>
            {isHost && <span className="text-[9px] bg-white/10 text-white px-1.5 py-0.5 rounded">HOST</span>}
            <button onClick={() => {
              const newTheme = theme === 'dark' ? 'light' : 'dark';
              setTheme(newTheme);
              localStorage.setItem('faces-scoring-theme', newTheme);
            }} className="p-1.5 bg-app-border/50 hover:bg-app-border rounded cursor-pointer transition-colors text-app-muted hover:text-app-text">
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* TWO PANELS */}
      <div className="flex flex-col lg:flex-row flex-grow overflow-hidden">
        
        {/* LEFT: FASE ACTUAL */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-app-border min-w-0">
          {/* Phase header */}
          <div className="p-4 border-b border-app-border/50 bg-app-card/50 shrink-0">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Phase nav pills (completed + current) */}
              {phases.map((ph, i) => (
                <div key={i} className={`text-[10px] px-2.5 py-1 rounded-md font-medium ${
                  i === currentPhaseIndex ? 'bg-white text-black' : 
                  ph.status === 'completed' ? 'bg-app-border text-app-muted/70' : 'bg-app-border/30 text-app-muted/50'
                }`}>
                  {ph.name}
                  {ph.status === 'completed' && <span className="ml-1 text-app-muted/50">✓</span>}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3">
              {isHost ? (
                <input
                  type="text" value={currentPhase.name}
                  onChange={e => updatePhaseName(e.target.value)}
                  className="bg-transparent text-lg font-bold text-white focus:outline-none border-b border-transparent focus:border-zinc-500 transition-colors flex-1 min-w-0"
                  placeholder={t.board.phaseNamePlaceholder}
                />
              ) : (
                <h2 className="text-lg font-bold text-white">{currentPhase.name}</h2>
              )}
              {isHost && (
                <div className="flex items-center gap-2 bg-app-border/30 border border-app-border rounded-lg px-2.5 py-1.5 shrink-0">
                  <span className="text-[9px] text-app-muted/70 uppercase tracking-widest">{t.board.classifyLabel}</span>
                  <input
                    type="number" min="1" max={currentParticipants.length || 99}
                    value={currentPhase.cutoff || ''}
                    onChange={e => updatePhaseCutoff(e.target.value)}
                    placeholder="—"
                    className="bg-transparent text-sm text-white font-mono font-bold text-center focus:outline-none w-10"
                  />
                </div>
              )}
            </div>
            {!isHost && currentPhase.cutoff && (
              <p className="text-[10px] text-app-muted/50 mt-1">{t.board.classifySummary(currentPhase.cutoff, currentParticipants.length)}</p>
            )}
          </div>

          {/* Search bar (host, first phase only for adding) */}
          {isHost && currentPhaseIndex === 0 && !isSessionComplete && (
            <div className="px-5 py-4 border-b border-app-border/30 bg-app-card/30 shrink-0">
              {session.type === 'Nacional' && !selectedParentCountry && (
                <div className="relative mb-2" ref={searchRef}>
                  <div className="relative">
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder={t.board.addHostCountryFirst}
                      className="w-full bg-app-border/30 border border-app-border rounded-lg h-8 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-zinc-600 transition-colors" />
                    <Search className="w-3.5 h-3.5 text-app-muted/70 absolute left-2.5 top-2" />
                  </div>
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute mt-2 left-0 right-0 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden z-30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-h-48 overflow-y-auto p-1 custom-scrollbar"
                      >
                        {searchResults.map(c => (
                          <button key={c.id} onClick={() => { setSelectedParentCountry(c); setSearchQuery(''); setSearchResults([]); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--color-app-accent)] hover:text-black transition-all text-left text-xs rounded-lg group">
                            <span className="text-base group-hover:scale-110 transition-transform">{c.flag}</span>
                            <span className="text-zinc-200 group-hover:text-black font-medium">{c.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {session.type === 'Nacional' && selectedParentCountry && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs">{t.board.hostCountryLabel}: {selectedParentCountry.flag} {selectedParentCountry.name}</span>
                  <button onClick={() => { setSelectedParentCountry(null); setCities([]); }} className="text-[10px] text-app-muted/70 hover:text-white">✕</button>
                </div>
              )}
              {(session.type === 'Global' || (session.type === 'Nacional' && selectedParentCountry)) && (
                <div className="relative" ref={searchRef}>
                  <div className="relative">
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      disabled={session.type === 'Nacional' && loadingCities}
                      placeholder={session.type === 'Global' ? t.board.addCountryPlaceholder : loadingCities ? t.board.loadingCities : t.board.addCityPlaceholder}
                      className="w-full bg-app-border/30 border border-app-border rounded-lg h-8 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-zinc-600 transition-colors disabled:opacity-40" />
                    <Search className="w-3.5 h-3.5 text-app-muted/70 absolute left-2.5 top-2" />
                  </div>
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute mt-2 left-0 right-0 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden z-30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-h-48 overflow-y-auto p-1 custom-scrollbar"
                      >
                        {searchResults.map(c => (
                          <button key={c.id} onClick={() => addParticipant(c)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--color-app-accent)] hover:text-black transition-all text-left text-xs rounded-lg group">
                            {c.flag && <span className="text-base group-hover:scale-110 transition-transform">{c.flag}</span>}
                            <span className="text-zinc-200 group-hover:text-black font-medium">{c.name}</span>
                            <Plus className="w-3 h-3 text-app-muted/70 ml-auto group-hover:text-black transition-colors" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                    {session.type === 'Nacional' && searchQuery.length > 1 && searchResults.length === 0 && cities.length > 0 && !loadingCities && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute mt-2 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 z-30 shadow-2xl text-center"
                      >
                        <button onClick={() => addParticipant({ name: searchQuery.trim(), id: searchQuery.replace(/\s+/g, '').toUpperCase(), flag: selectedParentCountry.flag })}
                          className="text-[10px] bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-zinc-200 transition-all uppercase tracking-widest">
                          {t.board.addManualEntry(searchQuery)}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {isSessionComplete ? (
            <div className="flex-1 overflow-auto p-4 md:p-6">
              <div className="relative flex min-h-full items-center justify-center overflow-hidden rounded-[2rem] border border-amber-300/20 bg-[radial-gradient(circle_at_top,#fde68a22,transparent_40%),linear-gradient(180deg,#18181b_0%,#09090b_100%)] p-8 text-center shadow-[0_0_60px_rgba(251,191,36,0.08)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_18%),radial-gradient(circle_at_80%_15%,rgba(251,191,36,0.18),transparent_20%),radial-gradient(circle_at_50%_85%,rgba(255,255,255,0.05),transparent_20%)] opacity-80" />
                <div className="relative z-10 flex max-w-xl flex-col items-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-amber-200/20 bg-amber-300/10 text-amber-200 shadow-[0_0_30px_rgba(251,191,36,0.2)]">
                    <Crown className="h-10 w-10" />
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.45em] text-amber-200/70">{t.board.winnerTitle}</p>
                  <h2 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">{winner?.flag} {winner?.name || t.board.winnerPending}</h2>
                  <p className="mt-3 text-sm text-app-muted">{t.board.winnerSubtitle}</p>
                  {winnerResult && (
                    <div className="mt-8 grid w-full max-w-sm grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-app-border bg-app-card/70 px-5 py-4">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-app-muted/70">{t.board.winnerScore}</p>
                        <p className="mt-2 text-2xl font-mono text-white">{winnerResult.totalAvg.toFixed(2)}</p>
                      </div>
                      <div className="rounded-2xl border border-app-border bg-app-card/70 px-5 py-4">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-app-muted/70">{currentPhase.name}</p>
                        <p className="mt-2 text-sm text-app-text">{t.board.winnerFromPhase(winnerPhaseName)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Scoring table */}
              <div className="flex-1 overflow-auto">
                {scoredParticipants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-app-muted/50 gap-2 p-4">
                    <Search className="w-10 h-10 opacity-20" />
                    <p className="text-xs text-center">{currentPhaseIndex === 0 ? t.board.useSearchToAdd : t.board.noParticipantsPhase}</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-app-border/30/80 sticky top-0 border-b border-app-border text-[10px] tracking-wider text-app-muted/70 uppercase">
                      <tr>
                        <th className="font-normal py-3 pl-3 pr-1 w-6 text-center">#</th>
                        <th className="font-normal py-3 px-2 text-left">{t.board.contestantHeader}</th>
                        <th className="font-normal py-3 px-2 text-center w-16">{t.board.averageHeader}</th>
                        <th className="font-normal py-3 px-2 text-center w-44 bg-app-border/30/50 border-x border-app-border/50">{t.board.yourScoreHeader}</th>
                        {isHost && currentPhaseIndex === 0 && <th className="font-normal py-3 pr-3 w-8"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/30">
                      {scoredParticipants.map((p, idx) => {
                        const hasScore = p.myScore !== undefined && p.myScore !== null;
                        const isQualified = qualifiedIds.has(p.id);
                        const sliderValue = scoreDrafts[p.id] ?? (hasScore ? String(p.myScore) : '0');
                        const displayScore = Number.parseFloat(sliderValue);
                        const showScoreValue = Number.isFinite(displayScore);

                        return (
                          <tr key={p.id} className={`transition-all duration-300 ${!isQualified ? 'opacity-40 bg-red-950/5 grayscale-[50%]' : 'hover:bg-app-border/30/40'}`}>
                            <td className="py-4 pl-4 pr-2 text-center">
                              <span className={`text-[10px] font-mono font-bold ${idx === 0 ? 'text-app-accent' : isQualified ? 'text-white' : 'text-app-muted/50'}`}>{idx + 1}</span>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{p.flag}</span>
                                <span className={`text-xs font-medium truncate ${isQualified ? 'text-white' : 'text-app-muted/70'}`}>{p.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className={`text-xs font-mono font-bold ${isQualified ? 'text-app-accent' : 'text-app-muted/30'}`}>{p.avg.toFixed(2)}</span>
                              <span className="text-[8px] text-app-muted/50 ml-0.5">{p.voteCount > 0 && `(${p.voteCount})`}</span>
                            </td>
                            <td className="py-3 px-3 bg-app-border/30/10 border-x border-app-border/20 text-center">
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  value={sliderValue}
                                  onChange={e => queueScoreSave(p.id, e.target.value)}
                                  onMouseUp={e => flushScoreSave(p.id, e.currentTarget.value)}
                                  onTouchEnd={e => flushScoreSave(p.id, e.currentTarget.value)}
                                  onBlur={e => flushScoreSave(p.id, e.target.value)}
                                  className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-app-border accent-app-accent"
                                  aria-label={`${t.board.yourScoreHeader}: ${p.name}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (scoreSaveTimersRef.current[p.id]) {
                                      clearTimeout(scoreSaveTimersRef.current[p.id]);
                                      delete scoreSaveTimersRef.current[p.id];
                                    }
                                    setScoreDrafts(prev => {
                                      const next = { ...prev };
                                      delete next[p.id];
                                      return next;
                                    });
                                    deleteScore(p.id).catch(() => {});
                                  }}
                                  className="w-6 h-6 rounded border border-app-border text-[10px] text-app-muted/70 hover:border-zinc-600 hover:text-white transition-colors"
                                  title={t.board.removeVote}
                                  aria-label={`${t.board.removeVote}: ${p.name}`}
                                >
                                  ×
                                </button>
                              </div>
                              <div className="mt-1 flex items-center justify-between text-[10px] font-mono">
                                <span className="text-app-muted/50">0.0</span>
                                <span className={hasScore ? 'text-app-accent' : 'text-app-muted'}>
                                  {hasScore || scoreDrafts[p.id] !== undefined
                                    ? (showScoreValue ? displayScore.toFixed(1) : '0.0')
                                    : t.board.notVoted}
                                </span>
                                <span className="text-app-muted/50">10.0</span>
                              </div>
                            </td>
                            {isHost && currentPhaseIndex === 0 && (
                              <td className="py-3 pr-3 text-center">
                                <button onClick={() => removeParticipant(p.id)} className="text-app-muted/30 hover:text-red-400 transition-colors p-0.5">
                                  <X className="w-3 h-3" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Advance button (host only) */}
              {isHost && currentParticipants.length > 0 && (
                <div className="p-3 border-t border-app-border bg-app-card shrink-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] text-app-muted/70">
                      <span className={votedJudges === judges.length ? 'text-green-400' : 'text-app-muted'}>{t.board.judgesCompleted(votedJudges, judges.length)}</span>
                    </div>
                    {canAdvance && (
                      <button
                        onClick={handlePhaseAction}
                        className={`flex items-center gap-2 px-5 py-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                          forceAttempted
                            ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                            : allJudgesComplete
                              ? 'bg-white text-black hover:bg-zinc-200'
                              : 'bg-app-border text-app-muted hover:bg-zinc-700 hover:text-white'
                        }`}
                      >
                        {forceAttempted ? (
                          <><AlertTriangle className="w-3.5 h-3.5" /> {isFinalRound ? t.board.forceViewWinner(pendingJudges) : t.board.forceAdvance(pendingJudges)}</>
                        ) : (
                          <><ChevronRight className="w-3.5 h-3.5" /> {isFinalRound ? t.board.viewWinner : t.board.advancePhase}</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT: RESULTADOS GLOBALES */}
        <div className="w-full lg:w-80 xl:w-96 flex flex-col overflow-hidden shrink-0 bg-app-card/80">
          <div className="px-5 py-4 border-b border-app-border/50 bg-app-card shrink-0">
            <h3 className="text-[10px] font-bold tracking-widest text-app-muted/70 uppercase">{t.board.globalResults}</h3>
            <p className="text-[9px] text-app-muted/30 mt-0.5">{t.board.phasesCompleted(allParticipants.length, phases.filter(p => p.status === 'completed').length)}</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {globalResults.length === 0 && (
                <p className="text-xs text-app-muted/50 text-center py-8">{t.board.noGlobalParticipants}</p>
              )}
              {globalResults.map((p, idx) => {
                const eliminated = p.eliminated;
                const isWinner = session.winnerId === p.id;
                return (
                  <div key={p.id} className={`flex items-center gap-2 px-2.5 py-3 mb-1 rounded-lg transition-colors ${
                    isWinner ? 'border border-amber-300/20 bg-amber-300/5' : eliminated ? 'opacity-30' : 'hover:bg-app-border/30/50'
                  }`}>
                    <div className={`w-5 text-center font-mono text-[10px] font-bold ${eliminated ? 'text-app-muted/30' : isWinner || idx === 0 ? 'text-white' : 'text-app-muted/70'}`}>{idx + 1}</div>
                    <span className={`text-base ${eliminated ? 'grayscale' : ''}`}>{p.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate ${eliminated ? 'text-app-muted/50 line-through' : isWinner || idx === 0 ? 'text-white font-medium' : 'text-app-muted'}`}>{p.name}</p>
                      {isWinner && (
                        <p className="text-[9px] text-amber-200/70">{t.board.winnerTitle}</p>
                      )}
                      {eliminated && (
                        <p className="text-[9px] text-red-400/50">{t.board.eliminatedIn(phases[p.lastActivePhase]?.name || getDefaultPhaseName(p.lastActivePhase, currentLanguage))}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-mono ${eliminated ? 'text-app-muted/30' : 'text-white'}`}>{p.totalAvg.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <PhaseReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        session={session}
        scores={scores}
        phases={phases}
        currentPhaseIndex={currentPhaseIndex}
        getPhaseParticipants={getPhaseParticipants}
        rankParticipantsByPhaseScores={rankParticipantsByPhaseScores}
        language={currentLanguage}
        globalResults={globalResults}
        winner={winner}
        winnerResult={winnerResult}
        winnerPhaseName={winnerPhaseName}
      />
    </div>
  );
}
