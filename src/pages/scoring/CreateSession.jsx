import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../../core/firebase.js';
import { doc, setDoc } from 'firebase/firestore';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function CreateSession() {
  const navigate = useNavigate();
  const [judgeName, setJudgeName] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [type, setType] = useState('Global');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [hasPreliminary, setHasPreliminary] = useState(true);
  const [hasFinal, setHasFinal] = useState(true);

  const generateSessionId = () => 'MU-' + Math.random().toString(36).substring(2, 7).toUpperCase();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!judgeName.trim() || !sessionName.trim()) { setError('Completa todos los campos.'); return; }
    if (!hasPreliminary && !hasFinal) { setError('Selecciona al menos una fase.'); return; }
    if (submitting) return;
    
    setSubmitting(true);
    setError('');
    const sessionId = generateSessionId();
    
    const sessionData = {
      id: sessionId,
      name: sessionName.trim(),
      type,
      host: judgeName.trim(),
      phases: {
        ...(hasPreliminary ? { preliminary: [] } : {}),
        ...(hasFinal ? { final: [] } : {})
      },
      createdAt: Date.now()
    };

    try {
      await setDoc(doc(db, "sessions", sessionId), sessionData);
      navigate(`/session/${sessionId}?judge=${encodeURIComponent(judgeName.trim())}`);
    } catch(err) {
      console.error(err);
      setError('Error al crear la sesión. Intenta de nuevo.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans flex justify-center p-4 md:p-10">
      <div className="w-full max-w-md h-fit">
        <Link to="/session" className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors mb-6 no-underline uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 md:p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Nueva Sesión</h1>
          <p className="text-zinc-500 text-sm mb-8">Configura lo esencial. Podrás agregar eventos y candidatas dentro del tablero.</p>
          
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2">Tu Nombre (Host)</label>
              <input 
                required type="text" value={judgeName} onChange={e => { setJudgeName(e.target.value); setError(''); }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg h-12 px-4 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors" 
                placeholder="Ej. Admin"
              />
            </div>
            <div>
              <label className="block text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2">Nombre del Certamen</label>
              <input 
                required type="text" value={sessionName} onChange={e => { setSessionName(e.target.value); setError(''); }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg h-12 px-4 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder="Ej. Miss Universe 2026"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2">Tipo</label>
              <select 
                value={type} onChange={e => setType(e.target.value)} 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg h-12 px-4 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="Global">Global (Países)</option>
                <option value="Nacional">Nacional (Ciudades)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-zinc-800/80">
              <label className="block text-xs font-bold tracking-widest text-zinc-500 uppercase mb-4">Fases del Certamen</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setHasPreliminary(!hasPreliminary)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${hasPreliminary ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-600'}`}
                >
                  Preliminar
                </button>
                <button type="button" onClick={() => setHasFinal(!hasFinal)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${hasFinal ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-600'}`}
                >
                  Final
                </button>
              </div>
              <p className="text-[10px] text-zinc-600 mt-2 text-center">Agregarás los eventos (swimsuit, gown, etc.) dentro del tablero.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full h-14 mt-4 bg-white text-black font-bold uppercase tracking-widest text-sm rounded-xl hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</> : 'Crear Sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
