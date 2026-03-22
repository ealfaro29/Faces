import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../../../core/firebase.js';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import ParticipantSetup from './ParticipantSetup';

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

  if (!session) return <div>Cargando...</div>;

  const isHost = session.host === judgeName;

  if (!session.participants) {
    if (isHost) return <ParticipantSetup session={session} />;
    return <div>Esperando al host para configurar participantes...</div>;
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
    <div style={{ padding: '20px', fontFamily: 'monospace', color: '#000', backgroundColor: '#fff', minHeight: '100vh' }}>
       <header style={{ borderBottom: '2px solid #000', marginBottom: '20px', paddingBottom: '10px' }}>
         <h1>{session.name} [{session.id}]</h1>
         <p>Juez: {judgeName} {isHost && <strong>(HOST)</strong>}</p>
       </header>
       
       <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          
          <div style={{ flex: '1', borderRight: '1px solid #ccc', paddingRight: '20px' }}>
             <h3>Fases</h3>
             {Object.keys(session.phases || {}).map(phaseKey => {
               const events = session.phases[phaseKey] || [];
               if (events.length === 0) return null;
               
               return (
                 <div key={phaseKey} style={{ marginBottom: '10px' }}>
                   <strong>{phaseKey.toUpperCase()}</strong>
                   <ul style={{ listStyle: 'none', padding: 0 }}>
                     {events.map(ev => {
                       const isActive = activePhase === phaseKey && activeEvent === ev;
                       return (
                         <li key={ev} style={{ margin: '5px 0' }}>
                           <button
                             onClick={() => { setActivePhase(phaseKey); setActiveEvent(ev); }}
                             style={{
                               width: '100%', textAlign: 'left', padding: '8px',
                               background: isActive ? '#000' : '#eee',
                               color: isActive ? '#fff' : '#000',
                               fontWeight: isActive ? 'bold' : 'normal',
                               border: '1px solid #000'
                             }}
                           >
                             {ev}
                           </button>
                         </li>
                       );
                     })}
                   </ul>
                 </div>
               );
             })}
          </div>
          
          <div style={{ flex: '3' }}>
             <h2>Puntuando: {activePhase} - {activeEvent}</h2>
             
             <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
               <thead>
                 <tr>
                   <th style={{ borderBottom: '2px solid #000', textAlign: 'left', padding: '5px' }}>Bandera</th>
                   <th style={{ borderBottom: '2px solid #000', textAlign: 'left', padding: '5px' }}>Nombre</th>
                   <th style={{ borderBottom: '2px solid #000', textAlign: 'center', padding: '5px' }}>Tu Puntaje</th>
                   <th style={{ borderBottom: '2px solid #000', textAlign: 'center', padding: '5px' }}>Acción</th>
                 </tr>
               </thead>
               <tbody>
                 {session.participants.map(p => {
                   const myScore = currentEventScores[p.id]?.[judgeName];
                   return (
                     <tr key={p.id}>
                       <td style={{ borderBottom: '1px solid #ccc', padding: '10px' }}>
                         {p.type === 'country' ? <img src={p.flag} alt="flag" width="30" /> : p.flag}
                       </td>
                       <td style={{ borderBottom: '1px solid #ccc', padding: '10px', fontWeight: 'bold' }}>
                         {p.name}
                       </td>
                       <td style={{ borderBottom: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>
                         <input 
                           type="number" min="0" max="10" step="0.1"
                           value={(myScore !== undefined && myScore !== null) ? myScore : ''}
                           onChange={(e) => handleScoreChange(p.id, e.target.value)}
                           style={{ width: '60px', padding: '5px', textAlign: 'center', border: '1px solid #000' }}
                         />
                       </td>
                       <td style={{ borderBottom: '1px solid #ccc', padding: '10px', textAlign: 'center' }}>
                         {myScore !== undefined && myScore !== null && (
                           <button onClick={() => deleteScore(p.id)} style={{ padding: '2px 5px', color: 'red' }}>Borrar</button>
                         )}
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
          </div>

          <div style={{ flex: '2', borderLeft: '1px solid #ccc', paddingLeft: '20px' }}>
             <h3>Ranking en Vivo</h3>
             <div style={{ marginBottom: '10px' }}>
               <button onClick={() => setRankingFilter('event')} style={{ background: rankingFilter === 'event' ? '#000' : '#eee', color: rankingFilter === 'event' ? '#fff' : '#000', border: '1px solid #000', padding: '5px' }}>Este Evento</button>
               <button onClick={() => setRankingFilter('global')} style={{ background: rankingFilter === 'global' ? '#000' : '#eee', color: rankingFilter === 'global' ? '#fff' : '#000', border: '1px solid #000', padding: '5px', marginLeft: '5px' }}>Global</button>
             </div>
             
             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                 <tr>
                   <th style={{ borderBottom: '1px solid #000', textAlign: 'left', padding: '5px' }}>Pos</th>
                   <th style={{ borderBottom: '1px solid #000', textAlign: 'left', padding: '5px' }}>Nombre</th>
                   <th style={{ borderBottom: '1px solid #000', textAlign: 'right', padding: '5px' }}>Promedio</th>
                 </tr>
               </thead>
               <tbody>
                 {rankings.map((p, idx) => (
                   <tr key={p.id}>
                     <td style={{ borderBottom: '1px solid #ccc', padding: '5px', fontWeight: idx === 0 ? 'bold' : 'normal' }}>{idx + 1}</td>
                     <td style={{ borderBottom: '1px solid #ccc', padding: '5px' }}>{p.name}</td>
                     <td style={{ borderBottom: '1px solid #ccc', padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>{p.average.toFixed(2)} <span style={{fontSize: '10px', fontWeight: 'normal'}}>({p.votes}v)</span></td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
       </div>
    </div>
  );
}
