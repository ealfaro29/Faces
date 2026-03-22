import { useState } from 'react';
import { db } from '../../../core/firebase.js';
import { doc, updateDoc } from 'firebase/firestore';

export default function ParticipantSetup({ session }) {
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);

  const loadGlobal = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca2');
      const data = await res.json();
      
      const formatted = data.map(c => ({
        id: c.cca2,
        name: c.name.common,
        flag: c.flags.svg || c.flags.png,
        type: 'country'
      })).sort((a,b) => a.name.localeCompare(b.name));
      
      setCountries(formatted);
    } catch(err) {
      console.error(err);
      alert("Error al cargar la lista de países.");
    } finally {
      setLoading(false);
    }
  };

  const saveParticipants = async (list) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "sessions", session.id), { participants: list });
    } catch(err) {
      console.error(err);
      alert("Error al guardar participantes en Firebase");
    } finally {
      setLoading(false);
    }
  };

  if (session.type !== 'Global') {
    return (
      <div className="p-8 text-center text-zinc-300 mt-20 max-w-xl mx-auto bg-zinc-900 border border-zinc-800 rounded-xl">
        <h2 className="text-2xl font-bold mb-4 text-[var(--gold)]">Configuración Nacional</h2>
        <p className="mb-6">El setup nacional automático está pendiente. Usa datos de prueba por ahora.</p>
        <button 
          onClick={() => saveParticipants([
            { id: 'MX-CDMX', name: 'Ciudad de México', flag: '🇲🇽', type: 'city' },
            { id: 'MX-JAL', name: 'Jalisco', flag: '🇲🇽', type: 'city' },
            { id: 'MX-NL', name: 'Nuevo León', flag: '🇲🇽', type: 'city' }
          ])} 
          disabled={loading}
          className="px-6 py-3 bg-[var(--gold)] text-black font-semibold rounded-md hover:opacity-90 transition-opacity"
        >
          {loading ? 'Guardando...' : 'Cargar Ciudades de Prueba'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto text-center mt-20 bg-zinc-900 border border-zinc-800 rounded-xl">
      <h2 className="text-3xl font-bold mb-4 text-[var(--gold)] font-['Playfair_Display']">Configurar Participantes</h2>
      <p className="text-zinc-400 mb-8">Obtén la lista global de países para comenzar la competencia.</p>
      
      {!countries.length ? (
        <button 
          onClick={loadGlobal} 
          disabled={loading} 
          className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-md transition-colors border border-zinc-600"
        >
           {loading ? 'Cargando de la API...' : 'Obtener países (REST Countries)'}
        </button>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4">
           <div className="flex items-center justify-center space-x-2 mb-6">
             <div className="w-10 h-10 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
               ✓
             </div>
             <p className="text-lg text-zinc-200">Se cargaron <strong>{countries.length}</strong> países exitosamente.</p>
           </div>
           
           <button 
             onClick={() => saveParticipants(countries)} 
             disabled={loading} 
             className="w-full px-6 py-4 bg-gradient-to-r from-[var(--gold)] to-[var(--gold2)] text-black font-bold text-lg rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
           >
              {loading ? 'Guardando...' : 'Confirmar y Empezar Sesión'}
           </button>
        </div>
      )}
    </div>
  );
}
