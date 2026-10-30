import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Mail, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-darkBg via-darkCard to-darkBg">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-goldDark mb-4 shadow-lg shadow-gold/20">
            <Dumbbell className="w-8 h-8 text-darkBg" />
          </div>
          <h1 className="text-3xl font-bold">
            <span className="text-gold">Gym</span>
            <span className="text-white">Data Pro</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de gestión deportiva</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-darkCard border border-gold/10 rounded-2xl p-6 space-y-4 shadow-xl">
          <div>
            <label className="text-xs text-gold font-semibold mb-1 block">CORREO</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-darkBg border border-gray-800 rounded-lg pl-10 pr-3 py-3 text-sm focus:border-gold focus:outline-none transition"
                placeholder="correo@gym.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gold font-semibold mb-1 block">CONTRASEÑA</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-darkBg border border-gray-800 rounded-lg pl-10 pr-3 py-3 text-sm focus:border-gold focus:outline-none transition"
                placeholder="••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-gymRed/10 border border-gymRed/30 text-gymRed text-xs p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-gymRed to-gymRedDark hover:from-red-700 hover:to-red-800 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-gymRed/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'INGRESAR'}
          </button>
        </form>
      </div>
    </div>
  );
}