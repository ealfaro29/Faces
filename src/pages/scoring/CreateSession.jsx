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
  
  const [phases, setPhases] = useState({ preliminary: true, final: true });
  const [preliminaryEvents, setPreliminaryEvents] = useState({ opening: true, swimsuit: true, eveningGown: true });
  const [finalEvents, setFinalEvents] = useState({ swimsuit: true, eveningGown: true, questions: true });

  const EVENT_LABELS = {
    opening: 'Opening Statement',
    swimsuit: 'Swimsuit',
    eveningGown: 'Evening Gown',
    questions: 'Final Q&A'
  };

  const generateSessionId = () => 'MU-' + Math.random().toString(36).substring(2, 7).toUpperCase();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!judgeName.trim() || !sessionName.trim()) { setError('Completa todos los campos.'); return; }
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
        preliminary: phases.preliminary ? Object.keys(preliminaryEvents).filter(k => preliminaryEvents[k]) : [],
        final: phases.final ? Object.keys(finalEvents).filter(k => finalEvents[k]) : []
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

  const Checkbox = ({ checked, onChange, label, size = 'md' }) => (
    <label className="flex items-center cursor-pointer group">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <div className={`${size === 'md' ? 'w-5 h-5 rounded' : 'w-4 h-4 rounded-sm'} border ${checked ? (size === 'md' ? 'bg-white border-white' : 'bg-zinc-600 border-zinc-500') : 'border-zinc-700'} flex items-center justify-center mr-3 transition-all duration-150`}>
        {checked && <span className={`${size === 'md' ? 'w-2.5 h-2.5' : 'w-1.5 h-1.5'} ${size === 'md' ? 'bg-black' : 'bg-white'} rounded-[2px] block`} />}
      </div>
      <span className={`text-sm transition-colors ${checked ? (size === 'md' ? 'text-white font-semibold' : 'text-zinc-300') : 'text-zinc-600'}`}>{label}</span>
    </label>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans flex justify-center p-4 md:p-10">
      <div className="w-full max-w-2xl h-fit">
        <Link to="/session" className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors mb-6 no-underline uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 md:p-10 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Nueva Sesión</h1>
          <p className="text-zinc-500 text-sm mb-8">Configura el tablero de análisis. Serás el anfitrión (Host).</p>
          
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2">Nombre del Host</label>
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
            </div>
            
            <div>
              <label className="block text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2">Tipo de Competencia</label>
              <select 
                value={type} onChange={e => setType(e.target.value)} 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg h-12 px-4 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="Global">Global (Países)</option>
                <option value="Nacional">Nacional (Ciudades)</option>
              </select>
            </div>

            <div className="pt-6 mt-6 border-t border-zinc-800/80">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Configuración de Etapas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Checkbox checked={phases.preliminary} onChange={e => setPhases({...phases, preliminary: e.target.checked})} label="Fase Preliminar" size="md" />
                  {phases.preliminary && (
                    <div className="pl-8 space-y-3 border-l border-zinc-800/50 py-1">
                      {Object.keys(preliminaryEvents).map(ev => (
                        <Checkbox key={ev} checked={preliminaryEvents[ev]} onChange={e => setPreliminaryEvents({...preliminaryEvents, [ev]: e.target.checked})} label={EVENT_LABELS[ev] || ev} size="sm" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Checkbox checked={phases.final} onChange={e => setPhases({...phases, final: e.target.checked})} label="Fase Final" size="md" />
                  {phases.final && (
                    <div className="pl-8 space-y-3 border-l border-zinc-800/50 py-1">
                      {Object.keys(finalEvents).map(ev => (
                        <Checkbox key={ev} checked={finalEvents[ev]} onChange={e => setFinalEvents({...finalEvents, [ev]: e.target.checked})} label={EVENT_LABELS[ev] || ev} size="sm" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full h-14 mt-8 bg-white text-black font-bold uppercase tracking-widest text-sm rounded-xl hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</> : 'Crear Sesión y Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
