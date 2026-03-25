import { useState } from 'react';
import { auth } from '../../core/firebase.js';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Si funciona, App.jsx detectará el cambio de estado automáticamente y mostrará el Dashboard
        } catch (err) {
            console.error(err);
            setError("Credenciales incorrectas o el usuario no existe.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4 font-sans text-white">
            <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center">
                <img src="photos/app/logo.svg" alt="Fashion Muse" className="w-32 mb-6 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]" />
                <h1 className="text-2xl font-['Playfair_Display'] text-[var(--gold)] mb-2 text-center">Acceso Privado</h1>
                <p className="text-zinc-500 text-sm text-center tracking-wide mb-8">Por favor, inicia sesión para acceder a la colección.</p>

                <form onSubmit={handleLogin} className="w-full space-y-5">
                    <div>
                        <label className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Correo Electrónico</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg h-12 px-4 text-sm text-white focus:outline-none focus:border-[var(--gold2)] transition-colors"
                            placeholder="admin@pageants.app"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Contraseña</label>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg h-12 px-4 text-sm text-white focus:outline-none focus:border-[var(--gold2)] transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-xs p-3 rounded text-center">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full h-12 mt-4 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-zinc-300 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Entrando...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
}
