import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../core/firebase.js';
import { doc, getDoc } from 'firebase/firestore';

export default function JoinSession() {
  const navigate = useNavigate();
  const [judgeName, setJudgeName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!judgeName || !sessionId) return alert("Completa los datos");

    setLoading(true);
    try {
      const code = sessionId.toUpperCase().trim();
      const sessionRef = doc(db, "sessions", code);
      const snapshot = await getDoc(sessionRef);
      
      if (snapshot.exists()) {
        navigate(`/session/${code}?judge=${encodeURIComponent(judgeName)}`);
      } else {
        alert("La sesión no existe o el código es incorrecto.");
      }
    } catch (err) {
      console.error(err);
      alert("Error al intentar conectarse a la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 text-white max-w-lg mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-2 font-['Playfair_Display'] text-[var(--gold)] text-center">Unirse como Juez</h1>
      <p className="text-zinc-400 text-center mb-8">Ingresa tus datos y el código de la sesión para comenzar a calificar.</p>
      
      <form onSubmit={handleJoin} className="space-y-6 bg-zinc-900/50 p-6 rounded-xl border border-[var(--border)]">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Nombre (Cómo te verán los demás)</label>
          <input 
            type="text" 
            required
            className="w-full h-12 px-4 dark-input rounded-md"
            value={judgeName}
            onChange={e => setJudgeName(e.target.value)}
            placeholder="Ej: Cynthia de la Vega"
          />
        </div>

        <div>
           <label className="block text-sm text-zinc-400 mb-1">Código de Sesión</label>
           <input 
             type="text" 
             required
             className="w-full h-12 px-4 dark-input rounded-md uppercase tracking-widest font-mono translate-uppercase"
             value={sessionId}
             onChange={e => setSessionId(e.target.value)}
             placeholder="MU-XXXXX"
           />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full h-14 mt-6 bg-gradient-to-r from-[var(--gold)] to-[var(--gold2)] text-black font-bold text-lg rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Verificando...' : 'Entrar a la Sesión'}
        </button>
      </form>
    </div>
  );
}
