import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../../core/firebase.js';
import { doc, updateDoc } from 'firebase/firestore';
import { Search, Plus, X, Globe, MapPin, Loader2 } from 'lucide-react';

export default function ParticipantSetup({ session }) {
  const [theme] = useState(localStorage.getItem('faces-scoring-theme') || 'dark');
  const [accentColor] = useState(localStorage.getItem('faces-scoring-accent') || '#ffffff');
  const [countries, setCountries] = useState([]);
  const [queryCountry, setQueryCountry] = useState('');
  const [countryResults, setCountryResults] = useState([]);
  const [selectedParentCountry, setSelectedParentCountry] = useState(null);
  const [cities, setCities] = useState([]);
  const [queryCity, setQueryCity] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const countryDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);

  // Click-outside handler to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target)) {
        setCountryResults([]);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) {
        setCityResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      .catch(err => console.error("Error fetching countries", err));
  }, []);

  useEffect(() => {
    if (session.type === 'Nacional' && selectedParentCountry) {
      setCities([]);
      setLoadingCities(true);
      fetch('https://countriesnow.space/api/v0.1/countries/cities', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ country: selectedParentCountry.name })
      })
      .then(res => res.json())
      .then(data => {
        if(!data.error && data.data) {
          setCities(data.data.map(c => ({
            name: c,
            id: c.replace(/\s+/g, '').toUpperCase(),
            flag: selectedParentCountry.flag
          })));
        }
      })
      .catch(err => console.error("Error fetching cities", err))
      .finally(() => setLoadingCities(false));
    }
  }, [session.type, selectedParentCountry]);

  useEffect(() => {
    if (queryCountry.length > 1) {
      setCountryResults(countries.filter(c => c.name.toLowerCase().includes(queryCountry.toLowerCase())).slice(0, 15));
    } else {
      setCountryResults([]);
    }
  }, [queryCountry, countries]);

  useEffect(() => {
    if (queryCity.length > 1) {
      setCityResults(cities.filter(c => c.name.toLowerCase().includes(queryCity.toLowerCase())).slice(0, 15));
    } else {
      setCityResults([]);
    }
  }, [queryCity, cities]);

  const handleAddGlobal = (country) => {
    if (!selectedParticipants.find(p => p.id === country.id)) {
      setSelectedParticipants(prev => [...prev, { ...country, type: 'country' }]);
    }
    setQueryCountry('');
    setCountryResults([]);
  };

  const handleAddNational = (city) => {
    if (!selectedParticipants.find(p => p.id === city.id)) {
      setSelectedParticipants(prev => [...prev, { ...city, type: 'city' }]);
    }
    setQueryCity('');
    setCityResults([]);
  };

  const handleRemove = (id) => {
    setSelectedParticipants(prev => prev.filter(p => p.id !== id));
  };

  const handleStart = async () => {
    if (selectedParticipants.length === 0) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "sessions", session.id), { participants: selectedParticipants });
    } catch(err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  return (
    <div 
      className={`theme-scoring-${theme} min-h-screen bg-app-bg text-app-text font-sans flex justify-center p-4 md:p-10`}
      style={{ '--color-app-accent': accentColor, '--color-app-accent-muted': `${accentColor}22` }}
    >
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6 h-fit">
        
        {/* Search Panel */}
        <div className="bg-app-border/30 border border-app-border rounded-2xl p-6 shadow-lg h-fit">
          <div className="min-h-[85px] mb-4">
            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              {session.type === 'Global' ? <Globe className="w-5 h-5 text-app-accent opacity-70"/> : <MapPin className="w-5 h-5 text-app-accent opacity-70"/>}
              Añadir Candidatas
            </h2>
            <p className="text-app-muted/70 text-sm">Busca y selecciona perfiles para agregar a la competencia.</p>
          </div>

          {session.type === 'Global' && (
            <div className="relative" ref={countryDropdownRef}>
              <div className="relative">
                <input 
                  type="text" value={queryCountry} onChange={e => setQueryCountry(e.target.value)}
                  placeholder="Escribe el nombre del país..."
                  className="w-full bg-app-card border border-app-border rounded-xl h-12 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors"
                />
                <Search className="w-5 h-5 text-app-muted/70 absolute left-4 top-3.5" />
              </div>
              <AnimatePresence>
                {countryResults.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-14 left-0 right-0 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden z-30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-h-60 overflow-y-auto p-1 custom-scrollbar"
                  >
                    {countryResults.map(item => (
                      <button key={item.id} onClick={() => handleAddGlobal(item)} 
                        className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-app-accent)] hover:text-black transition-all text-left rounded-lg group">
                        {item.flag && <span className="text-xl group-hover:scale-110 transition-transform">{item.flag}</span>}
                        <span className="text-zinc-200 group-hover:text-black font-medium text-sm">{item.name}</span>
                        <Plus className="w-4 h-4 text-app-accent group-hover:text-black ml-auto shrink-0 transition-colors" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {session.type === 'Nacional' && (
            <div className="space-y-6">
              {!selectedParentCountry ? (
                <div className="relative" ref={countryDropdownRef}>
                  <label className="block text-xs font-bold tracking-widest text-app-muted/70 uppercase mb-2">1. País Sede</label>
                  <div className="relative">
                    <input 
                      type="text" value={queryCountry} onChange={e => setQueryCountry(e.target.value)}
                      placeholder="Busca el país anfitrión..."
                      className="w-full bg-app-card border border-app-border rounded-xl h-12 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                    <Search className="w-5 h-5 text-app-muted/70 absolute left-4 top-3.5" />
                  </div>
                  <AnimatePresence>
                    {countryResults.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-[75px] left-0 right-0 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden z-30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-h-60 overflow-y-auto p-1 custom-scrollbar"
                      >
                        {countryResults.map(c => (
                          <button key={c.id} onClick={() => { setSelectedParentCountry(c); setQueryCountry(''); setCountryResults([]); }} 
                            className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-app-accent)] hover:text-black transition-all text-left rounded-lg group">
                            <span className="text-xl group-hover:scale-110 transition-transform">{c.flag}</span>
                            <span className="text-zinc-200 group-hover:text-black font-medium text-sm">{c.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-app-card/50 border border-app-border/80 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{selectedParentCountry.flag}</span>
                      <div>
                        <p className="text-xs text-app-muted/70 uppercase tracking-widest">Sede Nacional</p>
                        <p className="text-white font-medium">{selectedParentCountry.name}</p>
                      </div>
                    </div>
                    <button onClick={() => {setSelectedParentCountry(null); setCities([]); setSelectedParticipants([]);}} className="text-xs text-app-muted hover:text-white underline decoration-zinc-700 underline-offset-4 transition-colors">Cambiar</button>
                  </div>
                  
                  <div className="relative" ref={cityDropdownRef}>
                    <label className="block text-xs font-bold tracking-widest text-app-muted/70 uppercase mb-2">2. Agregar Ciudad</label>
                    <div className="relative">
                      <input 
                        type="text" value={queryCity} onChange={e => setQueryCity(e.target.value)}
                        disabled={loadingCities}
                        placeholder={loadingCities ? "Cargando ciudades..." : "Buscar ciudad..."}
                        className="w-full bg-app-card border border-app-border rounded-xl h-12 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-40"
                      />
                      <Search className="w-5 h-5 text-app-muted/70 absolute left-4 top-3.5" />
                    </div>
                    
                    <AnimatePresence>
                      {cityResults.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute mt-2 left-0 right-0 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden z-30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-h-60 overflow-y-auto p-1 custom-scrollbar"
                        >
                          {cityResults.map(c => (
                            <button key={c.id} onClick={() => handleAddNational(c)} 
                              className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-app-accent)] hover:text-black transition-all text-left rounded-lg group">
                              <span className="text-zinc-200 group-hover:text-black font-medium text-sm">{c.name}</span>
                              <Plus className="w-4 h-4 text-app-accent group-hover:text-black ml-auto shrink-0 transition-colors" />
                            </button>
                          ))}
                        </motion.div>
                      )}
                      {queryCity.length > 1 && cityResults.length === 0 && cities.length > 0 && !loadingCities && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute mt-2 left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-6 z-30 shadow-2xl text-center"
                        >
                          <p className="text-sm text-app-muted mb-4 opacity-70">No se encontró en la base de datos.</p>
                          <button onClick={() => handleAddNational({name: queryCity.trim(), id: queryCity.replace(/\s+/g,'').toUpperCase(), flag: selectedParentCountry.flag})} 
                            className="text-xs bg-white text-black px-5 py-2.5 rounded-xl font-bold hover:bg-zinc-200 transition-all uppercase tracking-widest shadow-lg">
                            Añadir "{queryCity}" Manualmente
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Roster Table */}
        <div className="bg-app-border/30 border border-app-border rounded-2xl p-6 shadow-lg flex flex-col min-h-[420px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Nómina Base</h3>
            <span className="bg-app-accent text-app-bg text-[10px] px-2.5 py-1 rounded-md font-mono font-bold shadow-[0_0_10px_var(--color-app-accent-muted)]">{selectedParticipants.length}</span>
          </div>

          <div className="flex-grow overflow-y-auto border border-app-border rounded-xl bg-app-card/30 mb-6">
            {selectedParticipants.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-app-muted/50 p-8 text-center gap-3">
                <Globe className="w-10 h-10 opacity-20" />
                <p className="text-sm">El certamen está vacío.<br/><span className="text-app-muted/30">Usa el buscador para agregar candidatas.</span></p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-app-border/30 sticky top-0 border-b border-app-border z-10 text-xs tracking-wider text-app-muted/70 uppercase">
                  <tr>
                    <th className="font-normal py-3 pl-4 pr-2 w-10">#</th>
                    <th className="font-normal py-3 px-2">Candidata</th>
                    <th className="font-normal py-3 pr-4 text-right w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {selectedParticipants.map((p, i) => (
                    <tr key={p.id} className="hover:bg-app-border/30 transition-colors group">
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
            disabled={selectedParticipants.length === 0 || submitting}
            className="w-full h-14 bg-white text-black font-bold uppercase tracking-widest text-sm rounded-xl hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.05)] disabled:opacity-20 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : `Iniciar Evento (${selectedParticipants.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
