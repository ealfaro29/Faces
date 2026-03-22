import { useState, useEffect } from 'react';
import { db } from '../../../core/firebase.js';
import { doc, updateDoc } from 'firebase/firestore';
import { Search, Plus, X, Globe, MapPin } from 'lucide-react';

export default function ParticipantSetup({ session }) {
  const [countries, setCountries] = useState([]);
  const [queryCountry, setQueryCountry] = useState('');
  const [countryResults, setCountryResults] = useState([]);
  
  const [selectedParentCountry, setSelectedParentCountry] = useState(null);
  
  const [cities, setCities] = useState([]);
  const [queryCity, setQueryCity] = useState('');
  const [cityResults, setCityResults] = useState([]);
  
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,cca3,flag')
      .then(res => res.json())
      .then(data => {
        const parsed = data.map(c => ({
          name: c.name?.common || '',
          flag: c.flag || '',
          id: c.cca3 || Math.random().toString()
        }))
        .filter(c => c.name)
        .sort((a,b) => a.name.localeCompare(b.name));
        setCountries(parsed);
      })
      .catch(err => console.error("Error", err));
  }, []);

  useEffect(() => {
    if (session.type === 'Nacional' && selectedParentCountry) {
        setCities([]);
        fetch('https://countriesnow.space/api/v0.1/countries/cities', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ country: selectedParentCountry.name })
        })
        .then(res => res.json())
        .then(data => {
            if(!data.error && data.data) {
                const parsedCities = data.data.map(c => ({
                    name: c,
                    id: c.replace(/\s+/g, '').toUpperCase(),
                    flag: selectedParentCountry.flag
                }));
                setCities(parsedCities);
            }
        })
        .catch(err => console.error("Error", err));
    }
  }, [session.type, selectedParentCountry]);

  useEffect(() => {
    if (queryCountry.length > 1) {
        setCountryResults(countries.filter(c => c.name.toLowerCase().includes(queryCountry.toLowerCase())));
    } else {
        setCountryResults([]);
    }
  }, [queryCountry, countries]);

  useEffect(() => {
    if (queryCity.length > 1) {
        setCityResults(cities.filter(c => c.name.toLowerCase().includes(queryCity.toLowerCase())));
    } else {
        setCityResults([]);
    }
  }, [queryCity, cities]);

  const handleAddGlobal = (country) => {
    if (!selectedParticipants.find(p => p.id === country.id)) {
        setSelectedParticipants([...selectedParticipants, { ...country, type: 'country' }]);
    }
    setQueryCountry('');
    setCountryResults([]);
  };

  const handleAddNational = (city) => {
    if (!selectedParticipants.find(p => p.id === city.id)) {
        setSelectedParticipants([...selectedParticipants, { ...city, type: 'city' }]);
    }
    setQueryCity('');
    setCityResults([]);
  }

  const handleRemove = (id) => {
    setSelectedParticipants(selectedParticipants.filter(p => p.id !== id));
  };

  const handleStart = async () => {
    if (selectedParticipants.length === 0) return alert("Agrega herramientas.");
    try {
      const sessionRef = doc(db, "sessions", session.id);
      await updateDoc(sessionRef, { participants: selectedParticipants });
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full flex justify-center py-10 px-4 h-full overflow-y-auto">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 h-fit">
        
        {/* Columna Izquierda: Búsqueda */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg h-fit">
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            {session.type === 'Global' ? <Globe className="w-5 h-5 text-zinc-400"/> : <MapPin className="w-5 h-5 text-zinc-400"/>}
            Añadir Candidatas
          </h2>
          <p className="text-zinc-500 text-sm mb-6">Busca y selecciona perfiles para agregar a la competencia.</p>

          {session.type === 'Global' && (
            <div className="relative">
              <div className="relative">
                <input 
                  type="text" value={queryCountry} onChange={e => setQueryCountry(e.target.value)} 
                  placeholder="Escibe el nombre del país..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-12 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors"
                />
                <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-3.5" />
              </div>
              
              {countryResults.length > 0 && (
                <div className="absolute top-14 left-0 right-0 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden z-20 shadow-2xl max-h-60 overflow-y-auto">
                  {countryResults.map(c => (
                    <button key={c.id} onClick={() => handleAddGlobal(c)} className="w-full flex items-center gap-3 p-3 hover:bg-zinc-700 transition-colors text-left border-b border-zinc-700/50 last:border-0">
                      <span className="text-lg">{c.flag}</span>
                      <span className="text-zinc-200 text-sm">{c.name}</span>
                      <Plus className="w-4 h-4 text-zinc-500 ml-auto" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {session.type === 'Nacional' && (
            <div className="space-y-6">
              {!selectedParentCountry ? (
                <div className="relative">
                  <label className="block text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2">1. País Sede</label>
                  <div className="relative">
                    <input 
                      type="text" value={queryCountry} onChange={e => setQueryCountry(e.target.value)} 
                      placeholder="Busca el país anfitrión..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-12 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                    <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-3.5" />
                  </div>
                  {countryResults.length > 0 && (
                    <div className="absolute top-[72px] left-0 right-0 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden z-20 shadow-2xl max-h-60 overflow-y-auto">
                      {countryResults.map(c => (
                        <button key={c.id} onClick={() => { setSelectedParentCountry(c); setQueryCountry(''); setCountryResults([]); }} className="w-full flex items-center gap-3 p-3 hover:bg-zinc-700 transition-colors text-left border-b border-zinc-700/50 last:border-0">
                          <span className="text-lg">{c.flag}</span>
                          <span className="text-zinc-200 text-sm">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-zinc-950/50 border border-zinc-800/80 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{selectedParentCountry.flag}</span>
                      <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest">Sede Nacional</p>
                        <p className="text-white font-medium">{selectedParentCountry.name}</p>
                      </div>
                    </div>
                    <button onClick={() => {setSelectedParentCountry(null); setCities([]); setSelectedParticipants([]);}} className="text-xs text-zinc-400 hover:text-white underline decoration-zinc-700 underline-offset-4">Modificar</button>
                  </div>
                  
                  <div className="relative">
                    <label className="block text-xs font-bold tracking-widest text-zinc-500 uppercase mb-2">2. Agregar Ciudad</label>
                    <div className="relative">
                      <input 
                        type="text" value={queryCity} onChange={e => setQueryCity(e.target.value)} disabled={cities.length === 0}
                        placeholder={cities.length === 0 ? "Cargando cartografía..." : "Buscar ciudad..."}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-12 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-50"
                      />
                      <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-3.5" />
                    </div>
                    
                    {cityResults.length > 0 && (
                      <div className="absolute mt-2 left-0 right-0 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden z-20 shadow-2xl max-h-60 overflow-y-auto">
                        {cityResults.map(c => (
                          <button key={c.id} onClick={() => handleAddNational(c)} className="w-full flex items-center gap-3 p-3 hover:bg-zinc-700 transition-colors text-left border-b border-zinc-700/50 last:border-0">
                            <span className="text-zinc-200 text-sm">{c.name}</span>
                            <Plus className="w-4 h-4 text-zinc-500 ml-auto" />
                          </button>
                        ))}
                      </div>
                    )}
                    {queryCity.length > 1 && cityResults.length === 0 && cities.length > 0 && (
                      <div className="absolute mt-2 left-0 right-0 bg-zinc-800 border border-zinc-700 rounded-xl p-4 z-20 shadow-2xl text-center">
                        <p className="text-sm text-zinc-400 mb-3">No hay resultados en la API pública.</p>
                        <button onClick={() => handleAddNational({name: queryCity.trim(), id: queryCity.replace(/\s+/g,'').toUpperCase(), flag: selectedParentCountry.flag})} className="text-xs bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors">
                          Añadir "{queryCity}" Manualmente
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Columna Derecha: Tabla */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Nómina Base</h3>
            <span className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded-md font-mono">{selectedParticipants.length}</span>
          </div>

          <div className="flex-grow overflow-y-auto border border-zinc-800 rounded-xl bg-zinc-950/30 mb-6">
            {selectedParticipants.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 p-8 text-center gap-3">
                <Globe className="w-10 h-10 opacity-20" />
                <p className="text-sm">El certamen está vacío.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-900 sticky top-0 border-b border-zinc-800 z-10 text-xs tracking-wider text-zinc-500 uppercase">
                  <tr>
                    <th className="font-normal py-3 pl-4 pr-2 w-10">#</th>
                    <th className="font-normal py-3 px-2">Candidata</th>
                    <th className="font-normal py-3 pr-4 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {selectedParticipants.map((p, i) => (
                    <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="py-3 pl-4 pr-2 text-xl">{p.flag}</td>
                      <td className="py-3 px-2 font-medium text-zinc-200">{p.name}</td>
                      <td className="py-3 pr-4 text-right">
                        <button onClick={() => handleRemove(p.id)} className="w-6 h-6 flex items-center justify-center rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors ml-auto opacity-0 group-hover:opacity-100">
                          <X className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <button 
            onClick={handleStart} 
            disabled={selectedParticipants.length === 0}
            className="w-full h-14 bg-white text-black font-bold uppercase tracking-widest text-sm rounded-xl hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.05)] disabled:opacity-20 disabled:shadow-none"
          >
            Iniciar Evento
          </button>
        </div>

      </div>
    </div>
  );
}
