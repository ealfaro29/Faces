import { useState, useEffect } from 'react';
import { db } from '../../../core/firebase.js';
import { doc, updateDoc } from 'firebase/firestore';

export default function ParticipantSetup({ session }) {
  const [countries, setCountries] = useState([]);
  const [queryCountry, setQueryCountry] = useState('');
  const [countryResults, setCountryResults] = useState([]);
  
  const [selectedParentCountry, setSelectedParentCountry] = useState(null);
  
  const [cities, setCities] = useState([]);
  const [queryCity, setQueryCity] = useState('');
  const [cityResults, setCityResults] = useState([]);
  
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  // Load countries on mount
  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all')
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

  // Fetch Cities when Parent Country is chosen (for National)
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
                    id: c.replace(/\\s+/g, '').toUpperCase(),
                    flag: selectedParentCountry.flag // reuse country emoji
                }));
                setCities(parsedCities);
            }
        })
        .catch(err => console.error("Error fetching cities", err));
    }
  }, [session.type, selectedParentCountry]);

  // Autocomplete Logic
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
    if (selectedParticipants.length === 0) return alert("Agrega al menos un participante.");
    
    try {
      const sessionRef = doc(db, "sessions", session.id);
      await updateDoc(sessionRef, {
        participants: selectedParticipants
      });
    } catch(err) {
      console.error(err);
      alert("Error guardando participantes");
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', color: '#000', backgroundColor: '#fff', minHeight: '100vh', paddingBottom: '100px' }}>
      <h2 style={{borderBottom: '2px solid #000'}}>Setup de {session.type === 'Global' ? 'Países' : 'Ciudades'}</h2>
      <p style={{marginBottom: '20px'}}>Agrega los participantes buscando en el campo de texto.</p>

      {session.type === 'Global' && (
          <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '20px' }}>
              <label style={{fontWeight: 'bold'}}>Buscar País:</label><br/>
              <input 
                  type="text" 
                  value={queryCountry} 
                  onChange={e => setQueryCountry(e.target.value)} 
                  placeholder="Escribe el nombre..."
                  style={{ width: '100%', padding: '10px', border: '2px solid #000', outline: 'none', fontSize: '16px' }}
              />
              {countryResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '2px solid #000', borderTop: 'none', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                      {countryResults.map(c => (
                          <div 
                              key={c.id} 
                              onClick={() => handleAddGlobal(c)}
                              style={{ padding: '10px', borderBottom: '1px solid #ccc', cursor: 'pointer', background: '#f9f9f9', hover: {background: '#e0e0e0'} }}
                          >
                              {c.flag} {c.name}
                          </div>
                      ))}
                  </div>
              )}
              {queryCountry.length > 1 && countryResults.length === 0 && countries.length > 0 && (
                 <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '2px solid #000', zIndex: 10, padding: '10px' }}>
                    País no encontrado.
                 </div>
              )}
          </div>
      )}

      {session.type === 'Nacional' && (
          <div style={{ maxWidth: '400px', marginBottom: '20px' }}>
              {!selectedParentCountry ? (
                  <div style={{ position: 'relative' }}>
                      <label style={{fontWeight: 'bold'}}>1. País Anfitrión:</label><br/>
                      <input 
                          type="text" 
                          value={queryCountry} 
                          onChange={e => setQueryCountry(e.target.value)} 
                          placeholder="Escribe para buscar..."
                          style={{ width: '100%', padding: '10px', border: '2px solid #000', outline: 'none' }}
                      />
                      {countryResults.length > 0 && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '2px solid #000', borderTop: 'none', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                              {countryResults.map(c => (
                                  <div 
                                      key={c.id} 
                                      onClick={() => { setSelectedParentCountry(c); setQueryCountry(''); setCountryResults([]); }}
                                      style={{ padding: '10px', borderBottom: '1px solid #ccc', cursor: 'pointer', background: '#f9f9f9' }}
                                  >
                                      {c.flag} {c.name}
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              ) : (
                  <div>
                      <div style={{ padding: '10px', border: '1px dashed #000', marginBottom: '15px' }}>
                        <strong>Anfitrión seleccionado:</strong> {selectedParentCountry.flag} {selectedParentCountry.name} 
                        <button onClick={() => {setSelectedParentCountry(null); setCities([]); setSelectedParticipants([]);}} style={{marginLeft:'10px', cursor:'pointer', border:'1px solid #000', background:'#eee', padding:'2px 5px'}}>Cambiar</button>
                      </div>
                      
                      <div style={{ position: 'relative' }}>
                          <label style={{fontWeight: 'bold'}}>2. Buscar Ciudad:</label><br/>
                          <input 
                              type="text" 
                              value={queryCity} 
                              onChange={e => setQueryCity(e.target.value)} 
                              placeholder="Escribe la ciudad..."
                              style={{ width: '100%', padding: '10px', border: '2px solid #000', outline: 'none' }}
                              disabled={cities.length === 0}
                          />
                          {cities.length === 0 && <small style={{color:'gray'}}>Cargando lista de ciudades (API)...</small>}
                          
                          {cityResults.length > 0 && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '2px solid #000', borderTop: 'none', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                                  {cityResults.map(c => (
                                      <div 
                                          key={c.id} 
                                          onClick={() => handleAddNational(c)}
                                          style={{ padding: '10px', borderBottom: '1px solid #ccc', cursor: 'pointer', background: '#f9f9f9' }}
                                      >
                                          {c.flag} {c.name}
                                      </div>
                                  ))}
                              </div>
                          )}
                          {queryCity.length > 1 && cityResults.length === 0 && cities.length > 0 && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '2px solid #000', borderTop: 'none', zIndex: 10, padding: '10px' }}>
                                 Ciudad no encontrada en API. <br/>
                                 <button onClick={() => handleAddNational({name: queryCity.trim(), id: queryCity.replace(/\\s+/g,'').toUpperCase(), flag: selectedParentCountry.flag})} style={{textDecoration:'underline', border:'none', background:'none', cursor:'pointer', fontWeight:'bold', marginTop: '5px'}}>
                                   Agregar manualmente "{queryCity}"
                                 </button>
                              </div>
                          )}
                      </div>
                  </div>
              )}
          </div>
      )}

      <h3>({selectedParticipants.length}) Participantes Agregados</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
              <tr>
                  <th style={{ borderBottom: '2px solid #000', textAlign: 'left', padding: '8px' }}>P</th>
                  <th style={{ borderBottom: '2px solid #000', textAlign: 'left', padding: '8px' }}>Candidato</th>
                  <th style={{ borderBottom: '2px solid #000', textAlign: 'center', padding: '8px' }}>-</th>
              </tr>
          </thead>
          <tbody>
              {selectedParticipants.length === 0 && (
                  <tr><td colSpan="3" style={{padding:'20px', textAlign:'center', fontStyle: 'italic', borderBottom: '1px solid #ccc'}}>Vacío</td></tr>
              )}
              {selectedParticipants.map(p => (
                  <tr key={p.id}>
                      <td style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>{p.flag}</td>
                      <td style={{ borderBottom: '1px solid #ccc', padding: '8px', fontWeight: 'bold' }}>{p.name}</td>
                      <td style={{ borderBottom: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                          <button onClick={() => handleRemove(p.id)} style={{ color: 'red', border: '1px solid red', background: 'none', cursor: 'pointer', padding: '2px 8px' }}>x</button>
                      </td>
                  </tr>
              ))}
          </tbody>
      </table>

      <button 
          onClick={handleStart} 
          disabled={selectedParticipants.length === 0}
          style={{ padding: '15px 20px', width: '100%', maxWidth: '400px', background: selectedParticipants.length > 0 ? '#000' : '#ccc', color: '#fff', border: 'none', cursor: selectedParticipants.length > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '18px' }}
      >
          &gt; Iniciar Evento
      </button>

    </div>
  );
}
