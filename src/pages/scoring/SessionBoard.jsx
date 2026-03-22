import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../../../core/firebase.js';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import ParticipantSetup from './ParticipantSetup';
import { motion } from 'framer-motion';

export default function SessionBoard() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const judgeName = searchParams.get('judge');
  
  const [session, setSession] = useState(null);
  const [scores, setScores] = useState({});
  const [activePhase, setActivePhase] = useState('');
  const [activeEvent, setActiveEvent] = useState('');
  const [rankingFilter, setRankingFilter] = useState('event'); // 'event' or 'global'
  
  // Real-time synchronization via Firestore
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
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-zinc-500 animate-pulse text-lg tracking-widest uppercase">Cargando Sesión...</div>
    </div>
  );

  const isHost = session.host === judgeName;

  if (!session.participants) {
    if (isHost) return <ParticipantSetup session={session} />;
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-center p-6">
        <div className="w-16 h-16 border-4 border-zinc-800 border-t-[var(--gold)] rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-white mb-2">Esperando al Host</h2>
        <p className="text-zinc-400">El host ({session.host}) está configurando la lista de participantes.</p>
      </div>
    );
  }

  // Calculate Rankings
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
        // Global average across all events
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
    <div className="flex flex-col h-screen bg-black text-white font-sans">
       <header className="flex-shrink-0 h-16 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between px-6">
         <div>
           <h1 className="text-xl font-bold font-['Playfair_Display'] text-[var(--gold)] tracking-wide">{session.name}</h1>
           <p className="text-xs text-zinc-500 mt-0.5">ID: <span className="font-mono text-zinc-300">{session.id}</span> • Juez: <span className="text-white">{judgeName}</span> {isHost && <span className="text-[var(--gold)] ml-1">(Host)</span>}</p>
         </div>
         <div className="flex items-center space-x-2">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
           <span className="text-xs text-zinc-400 font-medium">FIRESTORE LIVE</span>
         </div>
       </header>
       
       <div className="flex-1 flex overflow-hidden">
          {/* ZONE A: Phase Selector */}
          <aside className="w-64 bg-zinc-950 border-r border-zinc-900 overflow-y-auto hidden md:block">
             <div className="p-5">
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-6">Etapas del Certamen</h3>
               
               {Object.keys(session.phases || {}).map(phaseKey => {
                 const events = session.phases[phaseKey] || [];
                 if (events.length === 0) return null;
                 
                 return (
                   <div key={phaseKey} className="mb-8 group">
                     <h4 className="capitalize text-xs font-bold text-zinc-400 mb-3 px-3 tracking-wider">{phaseKey} Competition</h4>
                     <ul className="space-y-1.5">
                       {events.map(ev => {
                         const isActive = activePhase === phaseKey && activeEvent === ev;
                         return (
                           <li key={ev}>
                             <button
                               onClick={() => { setActivePhase(phaseKey); setActiveEvent(ev); }}
                               className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                                 isActive 
                                   ? 'bg-zinc-800 text-[var(--gold)] font-semibold shadow-sm border border-zinc-700/50' 
                                   : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                               }`}
                             >
                               {ev.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase())}
                             </button>
                           </li>
                         );
                       })}
                     </ul>
                   </div>
                 );
               })}
             </div>
          </aside>
          
          {/* ZONE B: Judge Input */}
          <main className="flex-1 bg-[#0a0a0a] overflow-y-auto relative p-4 md:p-8">
             <div className="max-w-3xl mx-auto">
               <div className="mb-8 pb-4 border-b border-zinc-800 sticky top-0 bg-[#0a0a0a] z-10 pt-4">
                 <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                   Puntuación: <span className="capitalize text-[var(--gold)] font-['Playfair_Display'] italic ml-1">{activeEvent.replace(/([A-Z])/g, ' $1').trim()}</span>
                 </h2>
                 <p className="text-zinc-500 text-sm">Califica a cada participante del 0 al 10. Los cambios se guardan automáticamente en Firestore.</p>
               </div>
               
               <div className="space-y-4 pb-20">
                 {session.participants.map(p => {
                   const myScore = currentEventScores[p.id]?.[judgeName];
                   
                   return (
                     <div key={p.id} className="group flex items-center justify-between p-5 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all shadow-sm">
                       <div className="flex items-center space-x-4">
                         {p.type === 'country' && <img src={p.flag} alt={`${p.name} flag`} className="w-10 h-7 object-cover rounded shadow-sm border border-zinc-800" />}
                         {p.type === 'city' && <span className="text-2xl">{p.flag}</span>}
                         <span className="font-semibold text-lg sm:text-xl text-zinc-100 group-hover:text-white transition-colors">{p.name}</span>
                       </div>
                       
                       <div className="flex items-center space-x-4">
                         {myScore !== undefined && myScore !== null && (
                           <button onClick={() => deleteScore(p.id)} className="text-xs text-red-500/70 hover:text-red-500 transition-colors" title="Borrar puntaje">
                             Borrar
                           </button>
                         )}
                         <input 
                           type="number" 
                           min="0" max="10" step="0.1"
                           placeholder="-"
                           value={(myScore !== undefined && myScore !== null) ? myScore : ''}
                           onChange={(e) => handleScoreChange(p.id, e.target.value)}
                           className={`w-24 text-center text-2xl font-bold bg-zinc-950 border rounded-lg py-2 focus:ring-2 focus:outline-none transition-colors ${
                             (myScore !== undefined && myScore !== null) ? 'border-[var(--gold)] text-[var(--gold)] focus:ring-[var(--gold)]' : 'border-zinc-700 text-white focus:border-zinc-500 focus:ring-zinc-600'
                           }`}
                         />
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>
          </main>

          {/* ZONE C: Live Ranking */}
          <aside className="w-80 md:w-96 bg-zinc-950 border-l border-zinc-900 flex flex-col hidden lg:flex">
             <div className="p-5 border-b border-zinc-900 flex-shrink-0 bg-zinc-900/50">
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--gold2)] mb-3 flex items-center justify-between">
                 <span>Ranking en Vivo</span>
               </h3>
               
               <div className="flex bg-zinc-950 rounded-md p-1 border border-zinc-800">
                 <button 
                   onClick={() => setRankingFilter('event')}
                   className={`flex-1 text-xs py-2 rounded-sm font-medium transition-colors ${rankingFilter === 'event' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                 >
                   Este Evento
                 </button>
                 <button 
                   onClick={() => setRankingFilter('global')}
                   className={`flex-1 text-xs py-2 rounded-sm font-medium transition-colors ${rankingFilter === 'global' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                 >
                   Global
                 </button>
               </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-5 space-y-3">
               {rankings.map((p, idx) => (
                 <motion.div 
                   layout 
                   key={p.id} 
                   className={`flex items-center justify-between p-3 rounded-lg border ${
                     idx === 0 ? 'bg-[var(--gold)]/10 border-[var(--gold)]/30' : 
                     idx < 5 ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-950 border-zinc-900 opacity-80'
                   }`}
                 >
                   <div className="flex items-center space-x-3">
                     <span className={`text-sm font-bold w-5 text-center ${idx === 0 ? 'text-[var(--gold)]' : 'text-zinc-500'}`}>{idx + 1}</span>
                     <span className="font-medium text-sm max-w-[120px] truncate">{p.name}</span>
                   </div>
                   <div className="text-right">
                     <div className={`font-bold ${idx === 0 ? 'text-[var(--gold)] text-lg' : 'text-white'}`}>
                       {p.average.toFixed(2)}
                     </div>
                     <div className="text-[10px] text-zinc-500">{p.votes} {p.votes === 1 ? 'voto' : 'votos'}</div>
                   </div>
                 </motion.div>
               ))}
               
               {rankings.filter(p => p.votes > 0).length === 0 && (
                 <div className="text-center text-zinc-600 text-sm mt-10">
                   <p>Esperando puntajes...</p>
                 </div>
               )}
             </div>
          </aside>
       </div>
    </div>
  );
}
