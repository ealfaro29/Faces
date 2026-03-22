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
  const [preliminaryEvents, setPreliminaryEvents] = useState({ opening: true, swimsuit: true, eveningGown: true });
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
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans flex justify-center p-4 md:p-10">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 md:p-10 shadow-2xl h-fit">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Nueva Sesión</h1>
        <p className="text-zinc-500 text-sm mb-8">Configura el tablero de análisis. Serás el anfitrión (Host).</p>
        
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2">Nombre del Host</label>
              <input 
                required type="text" value={judgeName} onChange={e => setJudgeName(e.target.value)} 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg h-12 px-4 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors" 
                placeholder="Ej. Admin"
              />
            </div>
            <div>
              <label className="block text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2">Nombre del Certamen</label>
              <input 
                required type="text" value={sessionName} onChange={e => setSessionName(e.target.value)} 
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
              {/* Preliminary */}
              <div className="space-y-4">
                <label className="flex items-center cursor-pointer group">
                  <input type="checkbox" checked={phases.preliminary} onChange={e => setPhases({...phases, preliminary: e.target.checked})} className="sr-only" />
                  <div className={`w-5 h-5 rounded border ${phases.preliminary ? 'bg-white border-white' : 'border-zinc-600'} flex items-center justify-center mr-3 transition-colors`}>
                    {phases.preliminary && <span className="w-2.5 h-2.5 bg-black rounded-sm block" />}
                  </div>
                  <span className={`text-sm font-semibold transition-colors ${phases.preliminary ? 'text-white' : 'text-zinc-500'}`}>Fase Preliminar</span>
                </label>
                
                {phases.preliminary && (
                  <div className="pl-8 space-y-3 border-l border-zinc-800/50 py-1">
                    {Object.keys(preliminaryEvents).map(ev => (
                      <label key={ev} className="flex items-center cursor-pointer group">
                        <input type="checkbox" checked={preliminaryEvents[ev]} onChange={e => setPreliminaryEvents({...preliminaryEvents, [ev]: e.target.checked})} className="sr-only" />
                        <div className={`w-4 h-4 rounded-sm border ${preliminaryEvents[ev] ? 'bg-zinc-700 border-zinc-500' : 'border-zinc-700'} flex items-center justify-center mr-3 transition-colors`}>
                          {preliminaryEvents[ev] && <span className="w-1.5 h-1.5 bg-white rounded-[1px] block" />}
                        </div>
                        <span className={`text-sm capitalize transition-colors ${preliminaryEvents[ev] ? 'text-zinc-300' : 'text-zinc-600'}`}>{ev}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Final */}
              <div className="space-y-4">
                <label className="flex items-center cursor-pointer group">
                  <input type="checkbox" checked={phases.final} onChange={e => setPhases({...phases, final: e.target.checked})} className="sr-only" />
                  <div className={`w-5 h-5 rounded border ${phases.final ? 'bg-white border-white' : 'border-zinc-600'} flex items-center justify-center mr-3 transition-colors`}>
                    {phases.final && <span className="w-2.5 h-2.5 bg-black rounded-sm block" />}
                  </div>
                  <span className={`text-sm font-semibold transition-colors ${phases.final ? 'text-white' : 'text-zinc-500'}`}>Fase Final</span>
                </label>
                
                {phases.final && (
                  <div className="pl-8 space-y-3 border-l border-zinc-800/50 py-1">
                    {Object.keys(finalEvents).map(ev => (
                      <label key={ev} className="flex items-center cursor-pointer group">
                        <input type="checkbox" checked={finalEvents[ev]} onChange={e => setFinalEvents({...finalEvents, [ev]: e.target.checked})} className="sr-only" />
                        <div className={`w-4 h-4 rounded-sm border ${finalEvents[ev] ? 'bg-zinc-700 border-zinc-500' : 'border-zinc-700'} flex items-center justify-center mr-3 transition-colors`}>
                          {finalEvents[ev] && <span className="w-1.5 h-1.5 bg-white rounded-[1px] block" />}
                        </div>
                        <span className={`text-sm capitalize transition-colors ${finalEvents[ev] ? 'text-zinc-300' : 'text-zinc-600'}`}>{ev}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button type="submit" className="w-full h-14 mt-8 bg-white text-black font-bold uppercase tracking-widest text-sm rounded-xl hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]">
            Crear Sistema y Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
