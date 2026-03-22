import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../core/firebase.js';
import { doc, setDoc } from 'firebase/firestore';

export default function CreateSession() {
  const navigate = useNavigate();
  const [judgeName, setJudgeName] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [type, setType] = useState('Global');
  
  const [phases, setPhases] = useState({ preliminary: true, final: true });
  const [preliminaryEvents, setPreliminaryEvents] = useState({ opening: true, swimsuit: true, eveningGown: true, interview: false });
  const [finalEvents, setFinalEvents] = useState({ swimsuit: true, eveningGown: true, questions: true });

  const generateSessionId = () => 'MU-' + Math.random().toString(36).substring(2, 7).toUpperCase();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!judgeName || !sessionName) return alert("Completa los datos");
    
    const sessionId = generateSessionId();
    
    const sessionData = {
      id: sessionId,
      name: sessionName,
      type: type,
      host: judgeName,
      phases: {
        preliminary: phases.preliminary ? Object.keys(preliminaryEvents).filter(k => preliminaryEvents[k]) : [],
        final: phases.final ? Object.keys(finalEvents).filter(k => finalEvents[k]) : []
      },
      createdAt: Date.now()
    };

    try {
      await setDoc(doc(db, "sessions", sessionId), sessionData);
      navigate(`/session/${sessionId}?judge=${encodeURIComponent(judgeName)}`);
    } catch(err) {
      console.error(err);
      alert("Error al crear sesión.");
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', color: '#000', backgroundColor: '#fff', minHeight: '100vh' }}>
      <h1>[CREAR SESION]</h1>
      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
        <div>
          <label>Host:</label><br />
          <input required type="text" value={judgeName} onChange={e => setJudgeName(e.target.value)} style={{ width: '100%', padding: '5px', border: '1px solid #000' }} />
        </div>
        <div>
          <label>Certamen:</label><br />
          <input required type="text" value={sessionName} onChange={e => setSessionName(e.target.value)} style={{ width: '100%', padding: '5px', border: '1px solid #000' }} />
        </div>
        <div>
          <label>Tipo:</label><br />
          <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '5px', border: '1px solid #000' }}>
            <option value="Global">Global</option>
            <option value="Nacional">Nacional</option>
          </select>
        </div>

        <div style={{ borderTop: '1px solid #000', paddingTop: '10px' }}>
          <h3>Fases</h3>
          <label><input type="checkbox" checked={phases.preliminary} onChange={e => setPhases({...phases, preliminary: e.target.checked})} /> Preliminary</label>
          {phases.preliminary && <div style={{ paddingLeft: '20px' }}>
            {Object.keys(preliminaryEvents).map(ev => (
              <label key={ev} style={{ display: 'block' }}><input type="checkbox" checked={preliminaryEvents[ev]} onChange={e => setPreliminaryEvents({...preliminaryEvents, [ev]: e.target.checked})} /> {ev}</label>
            ))}
          </div>}

          <div style={{ marginTop: '10px' }}>
            <label><input type="checkbox" checked={phases.final} onChange={e => setPhases({...phases, final: e.target.checked})} /> Final</label>
            {phases.final && <div style={{ paddingLeft: '20px' }}>
              {Object.keys(finalEvents).map(ev => (
                <label key={ev} style={{ display: 'block' }}><input type="checkbox" checked={finalEvents[ev]} onChange={e => setFinalEvents({...finalEvents, [ev]: e.target.checked})} /> {ev}</label>
              ))}
            </div>}
          </div>
        </div>

        <button type="submit" style={{ padding: '10px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Crear Sesión</button>
      </form>
    </div>
  );
}
