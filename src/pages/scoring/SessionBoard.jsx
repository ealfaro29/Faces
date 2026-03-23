import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../../../core/firebase.js';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import ParticipantSetup from './ParticipantSetup';
import { Activity, Star, LayoutPanelLeft, Copy, Check } from 'lucide-react';

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

  // Store initial phase selection flag in a ref (NOT in deps) to avoid re-subscribe loop
  const initialPhaseSet = useRef(false);
  
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
        // Only auto-select first phase/event ONCE
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
      if (docSnap.exists()) {
        setScores(docSnap.data());
      } else {
        setScores({});
      }
    });
    
    return () => { unsubSession(); unsubScores(); };
  }, [sessionId, judgeName, navigate]);

  const handleScoreChange = (participantId, value) => {
    // Allow clearing by typing — only write to Firestore when there's an actual number
    if (value === '' || value === undefined) return;
    let numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 0 || numVal > 10) return;
    
    const scoresRef = doc(db, "sessions", `${sessionId}_scores`);
    setDoc(scoresRef, {
      [`${activePhase}_${activeEvent}`]: {
        [participantId]: {
          [judgeName]: numVal
        }
      }
    }, { merge: true });
  };

  const deleteScore = (participantId) => {
    const scoresRef = doc(db, "sessions", `${sessionId}_scores`);
    setDoc(scoresRef, {
      [`${activePhase}_${activeEvent}`]: {
        [participantId]: {
          [judgeName]: null
        }
      }
    }, { merge: true });
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

  if (!session.participants) {
    if (isHost) return <ParticipantSetup session={session} />;
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
    if (!session.participants) return [];
    
    return session.participants.map(p => {
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
        
        {/* LEFT SIDEBAR — hidden on mobile (replaced with horizontal scroll above) */}
        <div className="hidden lg:flex w-72 xl:w-80 border-r border-zinc-800 bg-zinc-950/80 flex-col p-4 overflow-y-auto shrink-0">
          <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase mb-4">Etapas</p>
          <div className="space-y-5">
            {Object.keys(session.phases || {}).map(phaseKey => {
              const events = session.phases[phaseKey] || [];
              if (events.length === 0) return null;
              return (
                <div key={phaseKey} className="space-y-1">
                  <h3 className="text-[11px] text-zinc-500 capitalize tracking-wider mb-2 pl-1">{phaseKey}</h3>
                  {events.map(ev => {
                    const isActive = activePhase === phaseKey && activeEvent === ev;
                    return (
                      <button
                        key={ev}
                        onClick={() => { setActivePhase(phaseKey); setActiveEvent(ev); }}
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

        {/* MAIN SCORING TABLE */}
        <div className="flex-1 flex flex-col bg-[#050505] p-4 lg:p-8 overflow-hidden relative min-w-0 max-w-3xl mx-auto w-full">
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
          
          <div className="mb-4 lg:mb-6 flex items-end justify-between z-10 shrink-0">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5 capitalize">{activePhase}</p>
              <h2 className="text-xl lg:text-3xl font-bold text-white tracking-tight">{EVENT_LABELS[activeEvent] || <span className="capitalize">{activeEvent}</span>}</h2>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-600 text-[11px]">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Sincronización en vivo
            </div>
          </div>

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
                {session.participants.map(p => {
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
        </div>

        {/* RIGHT SIDEBAR: RANKING */}
        <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-950/80 flex flex-col overflow-hidden shrink-0">
          <div className="p-4 shrink-0 border-b border-zinc-800/50 bg-zinc-950 shadow-sm z-20">
            <h3 className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-3 flex items-center justify-between">
              Rankings en Vivo
              <Star className="w-4 h-4 text-zinc-600" />
            </h3>
            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
              <button 
                onClick={() => setRankingFilter('event')} 
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${rankingFilter === 'event' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >Evento Actual</button>
              <button 
                onClick={() => setRankingFilter('global')} 
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${rankingFilter === 'global' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >Promedio General</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-zinc-950/30">
            <div className="p-3">
              {rankings.map((p, idx) => (
                <div key={p.id} className={`flex items-center gap-3 p-3 mb-2 rounded-xl border transition-colors group ${idx === 0 && p.votes > 0 ? 'border-zinc-700 bg-zinc-900/60' : 'border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-900'}`}>
                  <div className={`w-6 text-center font-mono text-xs font-bold ${idx === 0 ? 'text-white' : idx <= 2 ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {idx + 1}
                  </div>
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
