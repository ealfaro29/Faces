import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../../../core/firebase.js';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { Activity, Star, LayoutPanelLeft, Copy, Check, Search, Plus, X, UserPlus } from 'lucide-react';

export default function SessionBoard() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const judgeName = searchParams.get('judge');
  
  const [session, setSession] = useState(null);
  const [scores, setScores] = useState({});
  const [activePhase, setActivePhase] = useState('');
  const [activeEvent, setActiveEvent] = useState('');
  const [rankingFilter, setRankingFilter] = useState('event');
  const [codeCopied, setCodeCopied] = useState(false);

  // Participant search state (inline in sidebar)
  const [countries, setCountries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [cities, setCities] = useState([]);
  const [selectedParentCountry, setSelectedParentCountry] = useState(null);
  const [loadingCities, setLoadingCities] = useState(false);
  const searchDropdownRef = useRef(null);

  const initialPhaseSet = useRef(false);
  
  // Load countries for Global search
  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,cca3,flag')
      .then(res => res.json())
      .then(data => {
        const parsed = data.map(c => ({
          name: c.name?.common || '',
          flag: c.flag || '',
          id: c.cca3 || Math.random().toString()
        }))
        .filter(c => c.name)
        .sort((a,b) => a.name.localeCompare(b.name));
        setCountries(parsed);
      })
      .catch(err => console.error("Error fetching countries", err));
  }, []);

  // Load cities when parent country is selected (Nacional mode)
  useEffect(() => {
    if (session?.type === 'Nacional' && selectedParentCountry) {
      setCities([]);
      setLoadingCities(true);
      fetch('https://countriesnow.space/api/v0.1/countries/cities', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ country: selectedParentCountry.name })
      })
      .then(res => res.json())
      .then(data => {
        if(!data.error && data.data) {
          setCities(data.data.map(c => ({
            name: c,
            id: c.replace(/\s+/g, '').toUpperCase(),
            flag: selectedParentCountry.flag
          })));
        }
      })
      .catch(err => console.error("Error fetching cities", err))
      .finally(() => setLoadingCities(false));
    }
  }, [session?.type, selectedParentCountry]);

  // Filter search results
  useEffect(() => {
    if (searchQuery.length > 1) {
      if (session?.type === 'Nacional' && selectedParentCountry) {
        setSearchResults(cities.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 12));
      } else {
        setSearchResults(countries.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 12));
      }
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, countries, cities, session?.type, selectedParentCountry]);

  // Click outside to close dropdown
  useEffect(() => {
    const handler = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Session & scores listener
  useEffect(() => {
    if (!sessionId || !judgeName) {
      if (!judgeName) navigate('/session/join');
      return;
    }
    
    const sessionRef = doc(db, "sessions", sessionId);
    const unsubSession = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSession(data);
        if (!initialPhaseSet.current && data.phases) {
          const firstPhase = Object.keys(data.phases).find(k => data.phases[k]?.length > 0);
          if (firstPhase) {
            setActivePhase(firstPhase);
            setActiveEvent(data.phases[firstPhase][0]);
            initialPhaseSet.current = true;
          }
        }
      }
    });

    const scoresRef = doc(db, "sessions", `${sessionId}_scores`);
    const unsubScores = onSnapshot(scoresRef, (docSnap) => {
      if (docSnap.exists()) setScores(docSnap.data());
      else setScores({});
    });
    
    return () => { unsubSession(); unsubScores(); };
  }, [sessionId, judgeName, navigate]);

  const handleScoreChange = (participantId, value) => {
    if (value === '' || value === undefined) return;
    let numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 0 || numVal > 10) return;
    
    const scoresRef = doc(db, "sessions", `${sessionId}_scores`);
    setDoc(scoresRef, {
      [`${activePhase}_${activeEvent}`]: {
        [participantId]: { [judgeName]: numVal }
      }
    }, { merge: true });
  };

  const deleteScore = (participantId) => {
    const scoresRef = doc(db, "sessions", `${sessionId}_scores`);
    setDoc(scoresRef, {
      [`${activePhase}_${activeEvent}`]: {
        [participantId]: { [judgeName]: null }
      }
    }, { merge: true });
  };

  const addParticipant = async (item) => {
    const participants = session.participants || [];
    if (participants.find(p => p.id === item.id)) { setSearchQuery(''); setSearchResults([]); return; }
    const updated = [...participants, { ...item, type: session.type === 'Global' ? 'country' : 'city' }];
    await updateDoc(doc(db, "sessions", session.id), { participants: updated });
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeParticipant = async (id) => {
    const updated = (session.participants || []).filter(p => p.id !== id);
    await updateDoc(doc(db, "sessions", session.id), { participants: updated });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(session.id);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (!session) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-zinc-800 border-t-white rounded-full animate-spin"></div>
    </div>
  );

  const isHost = session.host === judgeName;
  const participants = session.participants || [];

  // Non-host waiting screen (only if host hasn't added anyone yet)
  if (!isHost && participants.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <Activity className="w-12 h-12 text-zinc-700 animate-pulse mb-4" />
        <h2 className="text-xl text-white font-medium mb-2">Sala de Espera</h2>
        <p className="text-zinc-500 max-w-sm">El anfitrión está configurando la lista de candidatas. Esta pantalla se actualizará automáticamente.</p>
        <p className="text-xs text-zinc-700 mt-6 font-mono">Sesión: {sessionId}</p>
      </div>
    );
  }

  const EVENT_LABELS = {
    opening: 'Opening Statement',
    swimsuit: 'Swimsuit',
    eveningGown: 'Evening Gown',
    questions: 'Final Q&A'
  };

  const getRankings = () => {
    return participants.map(p => {
      let sum = 0, count = 0;
      if (rankingFilter === 'event') {
        const eventScores = scores[`${activePhase}_${activeEvent}`]?.[p.id] || {};
        Object.values(eventScores).forEach(val => { if (val !== null) { sum += val; count++; } });
      } else {
        Object.keys(scores).forEach(eventKey => {
          const pScores = scores[eventKey]?.[p.id] || {};
          Object.values(pScores).forEach(val => { if (val !== null) { sum += val; count++; } });
        });
      }
      return { ...p, average: count > 0 ? sum / count : 0, votes: count };
    }).sort((a, b) => b.average - a.average);
  };

  const rankings = getRankings();
  const currentEventScores = scores[`${activePhase}_${activeEvent}`] || {};

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans flex flex-col h-screen overflow-hidden">
      
      {/* HEADER */}
      <header className="h-14 lg:h-16 border-b border-zinc-800/80 bg-zinc-950 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-3 lg:gap-4 min-w-0">
          <LayoutPanelLeft className="w-5 h-5 text-white shrink-0 hidden sm:block" />
          <h1 className="text-sm lg:text-lg font-bold text-white tracking-tight truncate">{session.name}</h1>
          <button 
            onClick={copyCode}
            className="flex items-center gap-1.5 bg-zinc-800 px-2 py-1 rounded text-xs font-mono tracking-widest text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-white transition-colors shrink-0 cursor-pointer"
            title="Copiar código de sesión"
          >
            {session.id}
            {codeCopied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-none">Panel</p>
            <p className="text-sm font-medium text-white">{judgeName} {isHost && <span className="text-[10px] ml-1 bg-white/10 text-white px-1.5 py-0.5 rounded">HOST</span>}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-xs font-bold text-white uppercase">
            {judgeName.substring(0, 2)}
          </div>
        </div>
      </header>

      {/* MOBILE: Phase/Event selector */}
      <div className="lg:hidden border-b border-zinc-800 bg-zinc-950/90 p-3 overflow-x-auto flex-shrink-0">
        <div className="flex gap-2">
          {Object.keys(session.phases || {}).map(phaseKey => {
            const events = session.phases[phaseKey] || [];
            return events.map(ev => {
              const isActive = activePhase === phaseKey && activeEvent === ev;
              return (
                <button
                  key={`${phaseKey}-${ev}`}
                  onClick={() => { setActivePhase(phaseKey); setActiveEvent(ev); }}
                  className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-medium transition-all ${isActive ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'}`}
                >
                  <span className="capitalize">{EVENT_LABELS[ev] || ev}</span>
                </button>
              );
            });
          })}
        </div>
      </div>

      {/* THREE COLUMNS */}
      <div className="flex flex-col lg:flex-row flex-grow overflow-hidden bg-zinc-950/50">
        
        {/* LEFT SIDEBAR — Phases + Add Participants (host only) */}
        <div className="hidden lg:flex w-72 xl:w-80 border-r border-zinc-800 bg-zinc-950/80 flex-col overflow-y-auto shrink-0">
          <div className="p-4 space-y-5">
            <div>
              <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase mb-3">Etapas</p>
              <div className="space-y-4">
                {Object.keys(session.phases || {}).map(phaseKey => {
                  const events = session.phases[phaseKey] || [];
                  if (events.length === 0) return null;
                  return (
                    <div key={phaseKey} className="space-y-1">
                      <h3 className="text-[11px] text-zinc-500 capitalize tracking-wider mb-2 pl-1">{phaseKey}</h3>
                      {events.map(ev => {
                        const isActive = activePhase === phaseKey && activeEvent === ev;
                        return (
                          <button key={ev} onClick={() => { setActivePhase(phaseKey); setActiveEvent(ev); }}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none ${isActive ? 'bg-white text-black font-semibold shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'}`}
                          >
                            {EVENT_LABELS[ev] || <span className="capitalize">{ev}</span>}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* INLINE ADD PARTICIPANTS — Host only */}
            {isHost && (
              <div className="border-t border-zinc-800 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Candidatas</p>
                  <span className="bg-zinc-800 text-zinc-400 text-[10px] px-1.5 py-0.5 rounded font-mono">{participants.length}</span>
                </div>

                {/* Nacional: Country selector first */}
                {session.type === 'Nacional' && !selectedParentCountry && (
                  <div className="relative mb-3" ref={searchDropdownRef}>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">1. Seleccionar País Sede</p>
                    <div className="relative">
                      <input 
                        type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Buscar país..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg h-9 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
                      />
                      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                    </div>
                    {searchResults.length > 0 && (
                      <div className="absolute mt-1 left-0 right-0 bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden z-30 shadow-2xl max-h-48 overflow-y-auto">
                        {searchResults.map(c => (
                          <button key={c.id} onClick={() => { setSelectedParentCountry(c); setSearchQuery(''); setSearchResults([]); }} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-700 transition-colors text-left text-xs border-b border-zinc-700/50 last:border-0">
                            <span>{c.flag}</span>
                            <span className="text-zinc-200">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {session.type === 'Nacional' && selectedParentCountry && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{selectedParentCountry.flag}</span>
                      <span className="text-xs text-white font-medium">{selectedParentCountry.name}</span>
                    </div>
                    <button onClick={() => {setSelectedParentCountry(null); setCities([]);}} className="text-[10px] text-zinc-500 hover:text-white transition-colors">✕</button>
                  </div>
                )}

                {/* Search input: show for Global always, and for Nacional after country selected */}
                {(session.type === 'Global' || (session.type === 'Nacional' && selectedParentCountry)) && (
                  <div className="relative" ref={searchDropdownRef}>
                    {session.type === 'Nacional' && <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">2. Agregar Ciudad</p>}
                    <div className="relative">
                      <input 
                        type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        disabled={session.type === 'Nacional' && loadingCities}
                        placeholder={session.type === 'Global' ? "Agregar país..." : (loadingCities ? "Cargando..." : "Agregar ciudad...")}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg h-9 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-40"
                      />
                      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                    </div>
                    {searchResults.length > 0 && (
                      <div className="absolute mt-1 left-0 right-0 bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden z-30 shadow-2xl max-h-48 overflow-y-auto">
                        {searchResults.map(c => (
                          <button key={c.id} onClick={() => addParticipant(c)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-700 transition-colors text-left text-xs border-b border-zinc-700/50 last:border-0">
                            {c.flag && <span>{c.flag}</span>}
                            <span className="text-zinc-200">{c.name}</span>
                            <Plus className="w-3 h-3 text-zinc-500 ml-auto" />
                          </button>
                        ))}
                      </div>
                    )}
                    {session.type === 'Nacional' && searchQuery.length > 1 && searchResults.length === 0 && cities.length > 0 && !loadingCities && (
                      <div className="absolute mt-1 left-0 right-0 bg-zinc-800 border border-zinc-700 rounded-lg p-3 z-30 shadow-2xl text-center">
                        <button onClick={() => addParticipant({name: searchQuery.trim(), id: searchQuery.replace(/\s+/g,'').toUpperCase(), flag: selectedParentCountry.flag})} className="text-[10px] bg-white text-black px-3 py-1.5 rounded font-medium hover:bg-zinc-200 transition-colors">
                          Añadir "{searchQuery}" 
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Mini roster list */}
                {participants.length > 0 && (
                  <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                    {participants.map(p => (
                      <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800/50 transition-colors group text-xs">
                        <span>{p.flag}</span>
                        <span className="text-zinc-300 flex-1 truncate">{p.name}</span>
                        <button onClick={() => removeParticipant(p.id)} className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MAIN SCORING TABLE */}
        <div className="flex-1 flex flex-col bg-[#050505] p-4 lg:p-8 overflow-hidden relative min-w-0">
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
          
          <div className="mb-4 lg:mb-6 flex items-end justify-between z-10 shrink-0">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5 capitalize">{activePhase}</p>
              <h2 className="text-xl lg:text-3xl font-bold text-white tracking-tight">{EVENT_LABELS[activeEvent] || <span className="capitalize">{activeEvent}</span>}</h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Mobile: Add participant button */}
              {isHost && (
                <button onClick={() => setShowSearch(!showSearch)} className="lg:hidden flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white transition-colors">
                  <UserPlus className="w-3.5 h-3.5" /> Agregar
                </button>
              )}
              <div className="flex items-center gap-1.5 text-zinc-600 text-[11px]">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> <span className="hidden sm:inline">En vivo</span>
              </div>
            </div>
          </div>

          {/* MOBILE: Inline search (toggled) */}
          {isHost && showSearch && (
            <div className="lg:hidden mb-4 relative z-20" ref={searchDropdownRef}>
              <div className="relative">
                <input 
                  type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder={session.type === 'Global' ? "Agregar país..." : "Agregar ciudad..."}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl h-11 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  autoFocus
                />
                <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-3.5" />
              </div>
              {searchResults.length > 0 && (
                <div className="absolute mt-1 left-0 right-0 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl max-h-52 overflow-y-auto">
                  {searchResults.map(c => (
                    <button key={c.id} onClick={() => { addParticipant(c); setShowSearch(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-zinc-700 transition-colors text-left text-sm border-b border-zinc-700/50 last:border-0">
                      {c.flag && <span className="text-lg">{c.flag}</span>}
                      <span className="text-zinc-200">{c.name}</span>
                      <Plus className="w-4 h-4 text-zinc-500 ml-auto" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {participants.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-3">
              <UserPlus className="w-12 h-12 opacity-20" />
              <p className="text-sm">Usa el buscador del panel lateral para agregar candidatas.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto rounded-xl border border-zinc-800 bg-zinc-900/40 relative z-10 shadow-2xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-900/80 backdrop-blur-md sticky top-0 border-b border-zinc-800 text-xs tracking-wider text-zinc-500 uppercase">
                  <tr>
                    <th className="font-normal py-3 lg:py-4 pl-4 lg:pl-6 pr-2 w-12"></th>
                    <th className="font-normal py-3 lg:py-4 px-2 lg:px-4">Delegada</th>
                    <th className="font-normal py-3 lg:py-4 px-2 lg:px-4 text-center w-28 lg:w-32 border-x border-zinc-800/50 bg-zinc-900/50">Tu Score</th>
                    <th className="font-normal py-3 lg:py-4 pr-4 lg:pr-6 pl-2 text-right w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {participants.map(p => {
                    const myScore = currentEventScores[p.id]?.[judgeName];
                    const hasScore = myScore !== undefined && myScore !== null;
                    
                    return (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3 lg:py-4 pl-4 lg:pl-6 pr-2 text-2xl lg:text-3xl">{p.flag}</td>
                        <td className="py-3 lg:py-4 px-2 lg:px-4 font-medium text-white text-sm">{p.name}</td>
                        <td className="py-3 lg:py-4 px-2 lg:px-4 border-x border-zinc-800/30 bg-zinc-900/20 text-center relative overflow-hidden">
                          {hasScore && <div className="absolute left-0 inset-y-0 w-0.5 bg-white shadow-[0_0_10px_white]"></div>}
                          <input 
                            type="number" min="0" max="10" step="0.1"
                            defaultValue={hasScore ? myScore : ''}
                            key={`${p.id}-${activePhase}-${activeEvent}-${myScore}`}
                            onBlur={(e) => handleScoreChange(p.id, e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                            className="w-16 lg:w-20 bg-transparent text-center text-base lg:text-lg font-bold text-white border-b-2 border-zinc-700 hover:border-zinc-500 focus:border-white focus:outline-none transition-colors mx-auto block py-1 font-mono"
                            placeholder="—"
                          />
                        </td>
                        <td className="py-3 lg:py-4 pr-4 lg:pr-6 pl-2 text-right">
                          {hasScore ? (
                            <button onClick={() => deleteScore(p.id)} className="text-[10px] text-zinc-500 hover:text-red-400 uppercase tracking-widest hover:bg-red-500/10 px-2 py-1 rounded transition-all">Borrar</button>
                          ) : (
                            <span className="text-[10px] text-zinc-700 uppercase tracking-widest">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: RANKING */}
        <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-950/80 flex flex-col overflow-hidden shrink-0">
          <div className="p-4 shrink-0 border-b border-zinc-800/50 bg-zinc-950 shadow-sm z-20">
            <h3 className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-3 flex items-center justify-between">
              Rankings en Vivo
              <Star className="w-4 h-4 text-zinc-600" />
            </h3>
            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
              <button onClick={() => setRankingFilter('event')} className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${rankingFilter === 'event' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Evento Actual</button>
              <button onClick={() => setRankingFilter('global')} className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${rankingFilter === 'global' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Promedio General</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-zinc-950/30">
            <div className="p-3">
              {rankings.length === 0 && (
                <p className="text-xs text-zinc-600 text-center py-6">Agrega candidatas para ver la tabla de posiciones.</p>
              )}
              {rankings.map((p, idx) => (
                <div key={p.id} className={`flex items-center gap-3 p-3 mb-2 rounded-xl border transition-colors group ${idx === 0 && p.votes > 0 ? 'border-zinc-700 bg-zinc-900/60' : 'border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-900'}`}>
                  <div className={`w-6 text-center font-mono text-xs font-bold ${idx === 0 ? 'text-white' : idx <= 2 ? 'text-zinc-400' : 'text-zinc-600'}`}>{idx + 1}</div>
                  <div className="text-xl">{p.flag}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${idx === 0 ? 'text-white font-medium' : 'text-zinc-400'}`}>{p.name}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-mono font-medium ${p.votes > 0 ? 'text-white' : 'text-zinc-700'}`}>{p.average.toFixed(2)}</p>
                    <p className="text-[10px] text-zinc-600">{p.votes} {p.votes === 1 ? 'voto' : 'votos'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
