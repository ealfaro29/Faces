import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../core/firebase.js';
import { doc, getDoc } from 'firebase/firestore';

export default function JoinSession() {
  const navigate = useNavigate();
  const [judgeName, setJudgeName] = useState('');
  const [sessionCode, setSessionCode] = useState('');

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!judgeName || !sessionCode) return;
    
    try {
      const sessionRef = doc(db, "sessions", sessionCode.toUpperCase());
      const docSnap = await getDoc(sessionRef);
      
      if (docSnap.exists()) {
        navigate(`/session/${sessionCode.toUpperCase()}?judge=${encodeURIComponent(judgeName)}`);
      } else {
        alert("Sesión no encontrada");
      }
    } catch(err) {
      console.error(err);
      alert("Error al conectar con la base de datos.");
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', color: '#000', backgroundColor: '#fff', minHeight: '100vh' }}>
      <h1>[UNIRSE A SESION]</h1>
      
      <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
        <div>
          <label>Nombre del Juez:</label><br />
          <input 
            type="text" 
            required
            value={judgeName}
            onChange={e => setJudgeName(e.target.value)}
            style={{ width: '100%', padding: '5px', border: '1px solid #000' }}
          />
        </div>
        
        <div>
          <label>Código de Sesión:</label><br />
          <input 
            type="text" 
            required
            value={sessionCode}
            onChange={e => setSessionCode(e.target.value)}
            style={{ width: '100%', padding: '5px', border: '1px solid #000', textTransform: 'uppercase' }}
          />
        </div>

        <button type="submit" style={{ padding: '10px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
          Entrar como Juez
        </button>
      </form>
    </div>
  );
}
