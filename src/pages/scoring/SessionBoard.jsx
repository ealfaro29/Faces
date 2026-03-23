import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../../../core/firebase.js';
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Copy, Check, Search, Plus, X, ChevronRight, Globe, MapPin, AlertTriangle } from 'lucide-react';

export default function SessionBoard() {
  // Reset body styles
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = { htmlP: html.style.padding, bodyP: body.style.padding, bodyO: body.style.overflow, bodyBg: body.style.background };
    html.style.padding = '0'; body.style.padding = '0'; body.style.overflow = 'hidden'; body.style.background = '#0a0a0a';
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

  // Search state
  const [countries, setCountries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedParentCountry, setSelectedParentCountry] = useState(null);
  const [loadingCities, setLoadingCities] = useState(false);
  const searchRef = useRef(null);

  // Load countries
  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,cca3,flag')
      .then(r => r.json())
      .then(data => {
        setCountries(
          data.map(c => ({ name: c.name?.common || '', flag: c.flag || '', id: c.cca3 || Math.random().toString() }))
          .filter(c => c.name).sort((a, b) => a.name.localeCompare(b.name))
        );
      }).catch(() => {});
  }, []);

  // Load cities for Nacional
  useEffect(() => {
    if (session?.type === 'Nacional' && selectedParentCountry) {
      setCities([]); setLoadingCities(true);
      fetch('https://countriesnow.space/api/v0.1/countries/cities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: selectedParentCountry.name })
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
  const handleScore = (participantId, value) => {
    if (value === '' || value === undefined) return;
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 10) return;
    const phaseKey = `phase_${session.currentPhaseIndex}`;
    setDoc(doc(db, "sessions", `${sessionId}_scores`), {
      [phaseKey]: { [participantId]: { [judgeName]: num } }
    }, { merge: true });
  };

  const deleteScore = (participantId) => {
    const phaseKey = `phase_${session.currentPhaseIndex}`;
    setDoc(doc(db, "sessions", `${sessionId}_scores`), {
      [phaseKey]: { [participantId]: { [judgeName]: null } }
    }, { merge: true });
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
    const phases = [...session.phases];
    phases[session.currentPhaseIndex] = { ...phases[session.currentPhaseIndex], name };
    await updateDoc(doc(db, "sessions", session.id), { phases });
  };

  const updatePhaseCutoff = async (value) => {
    const phases = [...session.phases];
    const num = parseInt(value);
    phases[session.currentPhaseIndex] = { ...phases[session.currentPhaseIndex], cutoff: isNaN(num) || num <= 0 ? null : num };
    await updateDoc(doc(db, "sessions", session.id), { phases });
  };

  const advancePhase = async () => {
    const phase = session.phases[session.currentPhaseIndex];
    const phaseKey = `phase_${session.currentPhaseIndex}`;
    const phaseScores = scores[phaseKey] || {};
    const currentParticipants = getPhaseParticipants(session.currentPhaseIndex);
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
      currentParticipants.forEach(p => {
        judges.forEach(j => {
          if (!phaseScores[p.id]?.[j] && phaseScores[p.id]?.[j] !== 0) {
            updates[`${phaseKey}.${p.id}.${j}`] = 1;
          }
        });
      });
      if (Object.keys(updates).length > 0) {
        await updateDoc(doc(db, "sessions", `${sessionId}_scores`), updates);
      }
    }

    // Mark current phase complete, add new phase
    const phases = [...session.phases];
    phases[session.currentPhaseIndex] = { ...phases[session.currentPhaseIndex], status: 'completed' };
    const newPhaseIndex = session.currentPhaseIndex + 1;
    phases.push({ name: `Fase ${newPhaseIndex + 1}`, cutoff: null, status: 'active' });

    await updateDoc(doc(db, "sessions", session.id), {
      phases,
      currentPhaseIndex: newPhaseIndex
    });
    setForceAttempted(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(session?.id || '');
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // --- Computed ---
  if (!session) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div>
    </div>
  );

  const isHost = session.host === judgeName;
  const allParticipants = session.participants || [];
  const judges = session.judges || [];
  const currentPhase = session.phases?.[session.currentPhaseIndex] || { name: 'Fase 1', cutoff: null, status: 'active' };
  const phaseKey = `phase_${session.currentPhaseIndex}`;
  const phaseScores = scores[phaseKey] || {};

  // Get participants for a given phase index
  const getPhaseParticipants = (phaseIdx) => {
    if (phaseIdx === 0) return allParticipants;
    const prevPhase = session.phases[phaseIdx - 1];
    if (!prevPhase || !prevPhase.cutoff) return allParticipants;
    const prevKey = `phase_${phaseIdx - 1}`;
    const prevScores = scores[prevKey] || {};
    const prevParticipants = getPhaseParticipants(phaseIdx - 1);
    const ranked = prevParticipants.map(p => {
      const pScores = prevScores[p.id] || {};
      const vals = Object.values(pScores).filter(v => v !== null && v !== undefined);
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return { ...p, avg };
    }).sort((a, b) => b.avg - a.avg);
    return ranked.slice(0, prevPhase.cutoff);
  };

  const currentParticipants = getPhaseParticipants(session.currentPhaseIndex);

  // Score + sort participants for current phase
  const scoredParticipants = currentParticipants.map(p => {
    const pScores = phaseScores[p.id] || {};
    const vals = Object.values(pScores).filter(v => v !== null && v !== undefined);
    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const myScore = pScores[judgeName];
    return { ...p, avg, voteCount: vals.length, myScore };
  }).sort((a, b) => b.avg - a.avg || a.name.localeCompare(b.name));

  // Check completion for advance button
  const allJudgesComplete = currentParticipants.length > 0 && currentParticipants.every(p => {
    const pScores = phaseScores[p.id] || {};
    return judges.every(j => pScores[j] !== undefined && pScores[j] !== null);
  });
  const votedJudges = judges.filter(j => currentParticipants.every(p => {
    const ps = phaseScores[p.id] || {};
    return ps[j] !== undefined && ps[j] !== null;
  })).length;

  // Global results: track all participants + their elimination phase
  const globalResults = allParticipants.map(p => {
    // Find the last phase this participant was active in
    let lastActivePhase = 0;
    let eliminated = false;
    let totalAvg = 0;
    let totalVotes = 0;

    for (let i = 0; i <= session.currentPhaseIndex; i++) {
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
    if (a.isCurrentlyActive && !b.isCurrentlyActive) return -1;
    if (!a.isCurrentlyActive && b.isCurrentlyActive) return 1;
    return b.totalAvg - a.totalAvg;
  });

  const canAdvance = currentPhase.cutoff && currentPhase.cutoff < currentParticipants.length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans flex flex-col h-screen overflow-hidden">
      
      {/* HEADER */}
      <header className="h-11 border-b border-zinc-800/80 bg-zinc-950 flex items-center justify-between px-4 flex-shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          {session.type === 'Global' ? <Globe className="w-4 h-4 text-zinc-500 shrink-0" /> : <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />}
          <h1 className="text-sm font-bold text-white tracking-tight truncate">{session.name}</h1>
          <span className="text-[10px] text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 shrink-0">{session.type}</span>
          <span className="text-[10px] text-zinc-600 shrink-0">{judges.length} {judges.length === 1 ? 'juez' : 'jueces'}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={copyCode} className="flex items-center gap-1.5 bg-zinc-800 px-2 py-1 rounded text-[10px] font-mono tracking-widest text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer" title="Copiar código">
            {session.id}
            {codeCopied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">{judgeName}</span>
            {isHost && <span className="text-[9px] bg-white/10 text-white px-1.5 py-0.5 rounded">HOST</span>}
          </div>
        </div>
      </header>

      {/* TWO PANELS */}
      <div className="flex flex-col lg:flex-row flex-grow overflow-hidden">
        
        {/* LEFT: FASE ACTUAL */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-zinc-800 min-w-0">
          {/* Phase header */}
          <div className="p-4 border-b border-zinc-800/50 bg-zinc-950/50 shrink-0">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Phase nav pills (completed + current) */}
              {session.phases.map((ph, i) => (
                <div key={i} className={`text-[10px] px-2.5 py-1 rounded-md font-medium ${
                  i === session.currentPhaseIndex ? 'bg-white text-black' : 
                  ph.status === 'completed' ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-900 text-zinc-600'
                }`}>
                  {ph.name}
                  {ph.status === 'completed' && <span className="ml-1 text-zinc-600">✓</span>}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3">
              {isHost ? (
                <input
                  type="text" value={currentPhase.name}
                  onChange={e => updatePhaseName(e.target.value)}
                  className="bg-transparent text-lg font-bold text-white focus:outline-none border-b border-transparent focus:border-zinc-500 transition-colors flex-1 min-w-0"
                  placeholder="Nombre de la fase"
                />
              ) : (
                <h2 className="text-lg font-bold text-white">{currentPhase.name}</h2>
              )}
              {isHost && (
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 shrink-0">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Clasifican:</span>
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
              <p className="text-[10px] text-zinc-600 mt-1">Clasifican: {currentPhase.cutoff} de {currentParticipants.length}</p>
            )}
          </div>

          {/* Search bar (host, first phase only for adding) */}
          {isHost && session.currentPhaseIndex === 0 && (
            <div className="px-4 py-2 border-b border-zinc-800/30 bg-zinc-950/30 shrink-0">
              {session.type === 'Nacional' && !selectedParentCountry && (
                <div className="relative mb-2" ref={searchRef}>
                  <div className="relative">
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Primero, selecciona el país sede..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-8 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-zinc-600 transition-colors" />
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2" />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="absolute mt-1 left-0 right-0 bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden z-30 shadow-2xl max-h-40 overflow-y-auto">
                      {searchResults.map(c => (
                        <button key={c.id} onClick={() => { setSelectedParentCountry(c); setSearchQuery(''); setSearchResults([]); }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-700 transition-colors text-left text-xs border-b border-zinc-700/50 last:border-0">
                          <span>{c.flag}</span><span className="text-zinc-200">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {session.type === 'Nacional' && selectedParentCountry && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs">{selectedParentCountry.flag} {selectedParentCountry.name}</span>
                  <button onClick={() => { setSelectedParentCountry(null); setCities([]); }} className="text-[10px] text-zinc-500 hover:text-white">✕</button>
                </div>
              )}
              {(session.type === 'Global' || (session.type === 'Nacional' && selectedParentCountry)) && (
                <div className="relative" ref={searchRef}>
                  <div className="relative">
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      disabled={session.type === 'Nacional' && loadingCities}
                      placeholder={session.type === 'Global' ? "Agregar país..." : loadingCities ? "Cargando..." : "Agregar ciudad..."}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-8 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-zinc-600 transition-colors disabled:opacity-40" />
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2" />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="absolute mt-1 left-0 right-0 bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden z-30 shadow-2xl max-h-40 overflow-y-auto">
                      {searchResults.map(c => (
                        <button key={c.id} onClick={() => addParticipant(c)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-700 transition-colors text-left text-xs border-b border-zinc-700/50 last:border-0">
                          {c.flag && <span>{c.flag}</span>}<span className="text-zinc-200">{c.name}</span>
                          <Plus className="w-3 h-3 text-zinc-500 ml-auto" />
                        </button>
                      ))}
                    </div>
                  )}
                  {session.type === 'Nacional' && searchQuery.length > 1 && searchResults.length === 0 && cities.length > 0 && !loadingCities && (
                    <div className="absolute mt-1 left-0 right-0 bg-zinc-800 border border-zinc-700 rounded-lg p-2 z-30 shadow-2xl text-center">
                      <button onClick={() => addParticipant({ name: searchQuery.trim(), id: searchQuery.replace(/\s+/g, '').toUpperCase(), flag: selectedParentCountry.flag })}
                        className="text-[10px] bg-white text-black px-3 py-1 rounded font-medium hover:bg-zinc-200 transition-colors">
                        Añadir "{searchQuery}"
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Scoring table */}
          <div className="flex-1 overflow-auto">
            {scoredParticipants.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2 p-4">
                <Search className="w-10 h-10 opacity-20" />
                <p className="text-xs text-center">{session.currentPhaseIndex === 0 ? 'Usa la barra de búsqueda para agregar candidatas.' : 'No hay candidatas en esta fase.'}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-zinc-900/80 sticky top-0 border-b border-zinc-800 text-[10px] tracking-wider text-zinc-500 uppercase">
                  <tr>
                    <th className="font-normal py-2 pl-3 pr-1 w-6 text-center">#</th>
                    <th className="font-normal py-2 px-2 text-left">Delegada</th>
                    <th className="font-normal py-2 px-2 text-center w-16">Prom.</th>
                    <th className="font-normal py-2 px-2 text-center w-20 bg-zinc-900/50 border-x border-zinc-800/50">Tu Score</th>
                    {isHost && session.currentPhaseIndex === 0 && <th className="font-normal py-2 pr-3 w-8"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/30">
                  {scoredParticipants.map((p, idx) => {
                    const hasScore = p.myScore !== undefined && p.myScore !== null;
                    const isCutoff = currentPhase.cutoff && idx >= currentPhase.cutoff;
                    return (
                      <tr key={p.id} className={`transition-colors ${isCutoff ? 'opacity-30 bg-zinc-950' : 'hover:bg-white/[0.02]'}`}>
                        <td className="py-2 pl-3 pr-1 text-center">
                          <span className={`text-[10px] font-mono font-bold ${idx === 0 ? 'text-white' : idx <= 2 ? 'text-zinc-400' : 'text-zinc-600'}`}>{idx + 1}</span>
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{p.flag}</span>
                            <span className="text-xs font-medium text-white truncate">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className={`text-xs font-mono ${p.voteCount > 0 ? 'text-zinc-300' : 'text-zinc-700'}`}>{p.avg.toFixed(2)}</span>
                          <span className="text-[8px] text-zinc-600 ml-0.5">{p.voteCount > 0 && `(${p.voteCount})`}</span>
                        </td>
                        <td className="py-2 px-2 bg-zinc-900/10 border-x border-zinc-800/20 text-center">
                          <input
                            type="number" min="0" max="10" step="0.1"
                            defaultValue={hasScore ? p.myScore : ''}
                            key={`${p.id}-${session.currentPhaseIndex}-${p.myScore}`}
                            onBlur={e => handleScore(p.id, e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                            className="w-14 bg-transparent text-center text-sm font-bold text-white border-b border-zinc-700 hover:border-zinc-500 focus:border-white focus:outline-none transition-colors font-mono"
                            placeholder="—"
                          />
                        </td>
                        {isHost && session.currentPhaseIndex === 0 && (
                          <td className="py-2 pr-3 text-center">
                            <button onClick={() => removeParticipant(p.id)} className="text-zinc-700 hover:text-red-400 transition-colors p-0.5">
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
            <div className="p-3 border-t border-zinc-800 bg-zinc-950 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] text-zinc-500">
                  <span className={votedJudges === judges.length ? 'text-green-400' : 'text-zinc-400'}>{votedJudges}/{judges.length}</span> jueces completaron
                </div>
                {canAdvance && (
                  <button
                    onClick={advancePhase}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                      forceAttempted
                        ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                        : allJudgesComplete
                          ? 'bg-white text-black hover:bg-zinc-200'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {forceAttempted ? (
                      <><AlertTriangle className="w-3.5 h-3.5" /> Forzar Avance (pendientes = 1)</>
                    ) : (
                      <><ChevronRight className="w-3.5 h-3.5" /> Avanzar Fase</>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: RESULTADOS GLOBALES */}
        <div className="w-full lg:w-80 xl:w-96 flex flex-col overflow-hidden shrink-0 bg-zinc-950/80">
          <div className="px-4 py-3 border-b border-zinc-800/50 bg-zinc-950 shrink-0">
            <h3 className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Resultados Globales</h3>
            <p className="text-[9px] text-zinc-700 mt-0.5">{allParticipants.length} candidatas • {session.phases.filter(p => p.status === 'completed').length} fases completadas</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {globalResults.length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-8">Sin participantes aún.</p>
              )}
              {globalResults.map((p, idx) => {
                const eliminated = p.eliminated;
                return (
                  <div key={p.id} className={`flex items-center gap-2 px-2.5 py-2 mb-1 rounded-lg transition-colors ${
                    eliminated ? 'opacity-30' : 'hover:bg-zinc-900/50'
                  }`}>
                    <div className={`w-5 text-center font-mono text-[10px] font-bold ${eliminated ? 'text-zinc-700' : idx === 0 ? 'text-white' : 'text-zinc-500'}`}>{idx + 1}</div>
                    <span className={`text-base ${eliminated ? 'grayscale' : ''}`}>{p.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate ${eliminated ? 'text-zinc-600 line-through' : idx === 0 ? 'text-white font-medium' : 'text-zinc-400'}`}>{p.name}</p>
                      {eliminated && (
                        <p className="text-[9px] text-red-400/50">Eliminada en {session.phases[p.lastActivePhase]?.name || `Fase ${p.lastActivePhase + 1}`}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-mono ${eliminated ? 'text-zinc-700' : 'text-white'}`}>{p.totalAvg.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
