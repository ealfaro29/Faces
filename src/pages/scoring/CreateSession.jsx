import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../core/firebase.js';
import { doc, setDoc } from 'firebase/firestore';

export default function CreateSession() {
  const navigate = useNavigate();
  const [judgeName, setJudgeName] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [type, setType] = useState('Global');
  
  const [phases, setPhases] = useState({
    preliminary: true,
    final: true
  });

  const [preliminaryEvents, setPreliminaryEvents] = useState({
    opening: true,
    swimsuit: true,
    eveningGown: true
  });

  const [finalEvents, setFinalEvents] = useState({
    swimsuit: true,
    eveningGown: true,
    questions: true
  });

  const generateSessionId = () => {
    return 'MU-' + Math.random().toString(36).substring(2, 7).toUpperCase();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!judgeName || !sessionName) return alert("Por favor completa los datos básicos");
    
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
      alert("Error al crear sesión. Revisa la consola o tu configuración de Firestore.");
    }
  };

  return (
    <div className="p-6 md:p-10 text-white max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 font-['Playfair_Display'] text-[var(--gold2)]">Crear Sesión de Jueces</h1>
      
      <form onSubmit={handleCreate} className="space-y-6 bg-zinc-900/50 p-6 rounded-xl border border-[var(--border)]">
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Nombre del Juez (Host)</label>
            <input 
              type="text" 
              required
              className="w-full h-12 px-4 dark-input rounded-md"
              value={judgeName}
              onChange={e => setJudgeName(e.target.value)}
              placeholder="Ej: Osmel Sousa"
            />
          </div>
          
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Nombre del Certamen</label>
            <input 
              type="text" 
              required
              className="w-full h-12 px-4 dark-input rounded-md"
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              placeholder="Ej: Miss Universe 2024"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Tipo de Evento</label>
            <select 
              className="w-full h-12 px-4 dark-input rounded-md appearance-none"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              <option value="Global">Global (Países)</option>
              <option value="Nacional">Nacional (Ciudades/Estados)</option>
            </select>
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-6">
          <h3 className="text-lg font-semibold mb-4 text-[var(--gold)]">Fases del Certamen</h3>
          
          <div className="space-y-6">
            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <label className="flex items-center space-x-3 text-lg font-medium">
                <input 
                  type="checkbox" 
                  checked={phases.preliminary} 
                  onChange={e => setPhases({...phases, preliminary: e.target.checked})}
                  className="w-5 h-5 rounded accent-[var(--gold)]"
                />
                <span>Preliminary Competition</span>
              </label>
              
              {phases.preliminary && (
                <div className="mt-3 ml-8 grid grid-cols-2 gap-2 text-sm text-zinc-300">
                  {Object.keys(preliminaryEvents).map(ev => (
                    <label key={ev} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={preliminaryEvents[ev]}
                        onChange={e => setPreliminaryEvents({...preliminaryEvents, [ev]: e.target.checked})}
                        className="rounded accent-[var(--gold)]"
                      />
                      <span className="capitalize">{ev.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-zinc-800/50 p-4 rounded-lg">
              <label className="flex items-center space-x-3 text-lg font-medium">
                <input 
                  type="checkbox" 
                  checked={phases.final} 
                  onChange={e => setPhases({...phases, final: e.target.checked})}
                  className="w-5 h-5 rounded accent-[var(--gold)]"
                />
                <span>Final Competition</span>
              </label>

              {phases.final && (
                <div className="mt-3 ml-8 grid grid-cols-2 gap-2 text-sm text-zinc-300">
                  {Object.keys(finalEvents).map(ev => (
                    <label key={ev} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={finalEvents[ev]}
                        onChange={e => setFinalEvents({...finalEvents, [ev]: e.target.checked})}
                        className="rounded accent-[var(--gold)]"
                      />
                      <span className="capitalize">{ev.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full h-14 mt-6 bg-gradient-to-r from-[var(--gold)] to-[var(--gold2)] text-black font-bold text-lg rounded-md hover:opacity-90 transition-opacity"
        >
          Crear Sesión
        </button>
      </form>
    </div>
  );
}
