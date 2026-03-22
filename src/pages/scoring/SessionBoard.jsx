import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../../../core/firebase.js';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import ParticipantSetup from './ParticipantSetup';
import { Activity, Star, EyeOff, LayoutPanelLeft } from 'lucide-react';

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
        if (data && !activePhase && data.phases) {
          const firstPhase = Object.keys(data.phases).find(k => data.phases[k] && data.phases[k].length > 0);
          if (firstPhase) {
            setActivePhase(firstPhase);
            setActiveEvent(data.phases[firstPhase][0]);
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
    
    return () => {
      unsubSession();
      unsubScores();
    };
  }, [sessionId, judgeName, navigate, activePhase]);

  const handleScoreChange = (participantId, value) => {
    if (value === '') return;
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
        <p className="text-zinc-500 max-w-sm">El anfitrión está configurando la lista de candidatas para el evento. Esta pantalla se actualizará automáticamente en breve.</p>
      </div>
    );
  }

  const getRankings = () => {
    if (!session.participants) return [];
    
    return session.participants.map(p => {
      let sum = 0;
      let count = 0;

      if (rankingFilter === 'event') {
        const eventScores = scores[`${activePhase}_${activeEvent}`]?.[p.id] || {};
        Object.values(eventScores).forEach(val => { 
            if (val !== null) { sum += val; count++; }
        });
      } else {
        Object.keys(scores).forEach(eventKey => {
           const pScores = scores[eventKey]?.[p.id] || {};
           Object.values(pScores).forEach(val => { 
               if (val !== null) { sum += val; count++; }
           });
        });
      }

      const avg = count > 0 ? (sum / count) : 0;
      return { ...p, average: avg, votes: count };
    }).sort((a, b) => b.average - a.average);
  };

  const rankings = getRankings();
  const currentEventScores = scores[`${activePhase}_${activeEvent}`] || {};

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans flex flex-col h-screen overflow-hidden">
      
      {/* HEADER NAVBAR */}
      <header className="h-16 border-b border-zinc-800/80 bg-zinc-950 flex items-center justify-between px-6 flex-shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-4">
          <LayoutPanelLeft className="w-5 h-5 text-white" />
          <h1 className="text-lg font-bold text-white tracking-tight">{session.name}</h1>
          <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs font-mono tracking-widest text-zinc-400 border border-zinc-700"> {session.id} </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-zinc-500 uppercase tracking-widest leading-none">Miembro de Panel</p>
            <p className="text-sm font-medium text-white">{judgeName} {isHost && <span className="text-xs ml-1 bg-white/10 text-white px-2 py-0.5 rounded">HOST</span>}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-xs font-bold text-white uppercase">
            {judgeName.substring(0, 2)}
          </div>
        </div>
      </header>

      {/* TRES COLUMNAS */}
      <div className="flex flex-col lg:flex-row flex-grow overflow-hidden bg-zinc-950/50">
        
        {/* SIDEBAR NAVEGACION FASES */}
        <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-zinc-800 bg-zinc-950/80 flex flex-col p-4 overflow-y-auto">
          <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase mb-4">Etapas de Evaluación</p>
          <div className="space-y-6">
            {Object.keys(session.phases || {}).map(phaseKey => {
              const events = session.phases[phaseKey] || [];
              if (events.length === 0) return null;
              
              return (
                <div key={phaseKey} className="space-y-2">
                  <h3 className="text-xs text-zinc-400 capitalize underline decoration-zinc-700 underline-offset-4 mb-3">{phaseKey}</h3>
                  <div className="space-y-1 pl-1">
                    {events.map(ev => {
                      const isActive = activePhase === phaseKey && activeEvent === ev;
                      return (
                        <button
                          key={ev}
                          onClick={() => { setActivePhase(phaseKey); setActiveEvent(ev); }}
                          className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none ${isActive ? 'bg-white text-black font-semibold' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'}`}
                        >
                          <span className="capitalize">{ev}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TABLA DE JUECES CENTRAL */}
        <div className="flex-1 flex flex-col bg-[#050505] p-6 lg:p-10 overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
          
          <div className="mb-6 flex items-end justify-between z-10 shrink-0">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{activePhase} Session</p>
              <h2 className="text-3xl font-bold text-white capitalize tracking-tight">{activeEvent} Evaluator</h2>
            </div>
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <EyeOff className="w-4 h-4"/> Live sync
            </div>
          </div>

          <div className="flex-1 overflow-auto rounded-xl border border-zinc-800 bg-zinc-900/40 relative z-10 shadow-2xl">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-900/80 backdrop-blur-md sticky top-0 border-b border-zinc-800 text-xs tracking-wider text-zinc-500 uppercase">
                <tr>
                  <th className="font-normal py-4 pl-6 pr-4 w-12 rounded-tl-xl">Flag</th>
                  <th className="font-normal py-4 px-4 w-1/3 min-w-[200px]">Delegate</th>
                  <th className="font-normal py-4 px-4 text-center w-32 border-x border-zinc-800/50 bg-zinc-900/50">Your Score</th>
                  <th className="font-normal py-4 pr-6 pl-4 text-right text-zinc-600 rounded-tr-xl">-</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {session.participants.map(p => {
                  const myScore = currentEventScores[p.id]?.[judgeName];
                  const hasScore = myScore !== undefined && myScore !== null;
                  
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-4 pl-6 pr-4 text-3xl font-emoji">{p.type === 'country' ? <span className="opacity-90">{p.flag}</span> : p.flag}</td>
                      <td className="py-4 px-4 font-medium text-white">{p.name}</td>
                      <td className="py-4 px-4 border-x border-zinc-800/30 bg-zinc-900/20 text-center relative overflow-hidden transition-colors">
                        {hasScore && <div className="absolute left-0 inset-y-0 w-0.5 bg-white shadow-[0_0_10px_white]"></div>}
                        <input 
                          type="number" min="0" max="10" step="0.1"
                          value={hasScore ? myScore : ''}
                          onChange={(e) => handleScoreChange(p.id, e.target.value)}
                          className="w-20 bg-transparent text-center text-lg font-bold text-white border-b-2 border-zinc-700 hover:border-zinc-500 focus:border-white focus:outline-none transition-colors mx-auto block py-1 font-mono"
                          placeholder="--"
                        />
                      </td>
                      <td className="py-4 pr-6 pl-4 text-right">
                        {hasScore ? (
                          <button onClick={() => deleteScore(p.id)} className="text-xs text-zinc-500 hover:text-red-400 uppercase tracking-widest border border-zinc-500/0 hover:border-red-400/50 px-2 py-1 rounded transition-all">Clear</button>
                        ) : (
                          <span className="text-xs text-zinc-700 uppercase tracking-widest px-2 py-1">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SIDEBAR RANKING DERECHO */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-950/80 flex flex-col overflow-hidden">
          <div className="p-4 shrink-0 border-b border-zinc-800/50 bg-zinc-950 shadow-sm relative z-20">
            <h3 className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-3 flex items-center justify-between">
              Live Standings
              <Star className="w-4 h-4 text-zinc-600" />
            </h3>
            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
              <button 
                onClick={() => setRankingFilter('event')} 
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${rankingFilter === 'event' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >Current</button>
              <button 
                onClick={() => setRankingFilter('global')} 
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${rankingFilter === 'global' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >Overall Average</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-zinc-950/30">
            <div className="p-3">
              {rankings.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3 p-3 mb-2 rounded-xl border border-zinc-800/50 bg-zinc-900/20 hover:bg-zinc-900 transition-colors group">
                  <div className={`w-6 text-center font-mono text-xs ${idx === 0 ? 'text-white' : idx <= 2 ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {idx + 1}
                  </div>
                  <div className="text-xl filter grayscale group-hover:grayscale-0 transition-all opacity-80 group-hover:opacity-100">{p.flag}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${idx === 0 ? 'text-white font-medium' : 'text-zinc-400'}`}>{p.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-white font-medium">{p.average.toFixed(2)}</p>
                    <p className="text-[10px] text-zinc-600">{p.votes} vol</p>
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
