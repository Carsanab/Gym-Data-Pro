import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, Users, ClipboardCheck, History, LogOut, 
  Dumbbell, Menu, X, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '../utils/imagenes.jsx'; // ← NUEVO

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const navItems = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/gimnastas', icon: Users, label: 'Gimnastas' },
    { to: '/asistencia', icon: ClipboardCheck, label: 'Asistencia' },
    { to: '/historial', icon: History, label: 'Historial' },
  ];

  const menuItems = [
    { to: '/legajo', label: 'Legajos', icon: '📋' },
    { to: '/entrenadores', label: 'Entrenadores', icon: '🏋️' },
    ...(user?.Rol === 'Admin' ? [
      { to: '/grupos', label: 'Grupos', icon: '🏷️' },
      { to: '/usuarios', label: 'Usuarios', icon: '👥' },
    ] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen pb-20 bg-darkBg">
      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-40 bg-darkBg/95 backdrop-blur-lg border-b border-gold/20">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-goldDark flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-darkBg" />
            </div>
            <h1 className="font-bold text-lg leading-none">
              <span className="text-gold">Gym</span>
              <span className="text-white">Data Pro</span>
            </h1>
          </Link>

          <div className="flex items-center gap-2">
            {/* Info usuario (desktop) */}
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white truncate max-w-[120px]">
                {user?.Usuario}
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                user?.Rol === 'Admin' ? 'bg-gold/20 text-gold' : 'bg-gymRed/20 text-gymRed'
              }`}>
                {user?.Rol}
              </span>
            </div>
            
            {/* Avatar con foto real */}
            <Avatar 
              nombreUsuario={user?.Usuario} 
              size="md"
              className="ring-2 ring-gold/30"
            />

            <button 
              onClick={() => setMenuAbierto(true)}
              className="p-2 text-gray-400 hover:text-gold transition rounded-lg hover:bg-darkCard"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-4xl mx-auto">
        <Outlet />
      </main>

      {/* ============ BOTTOM NAVIGATION ============ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-darkCard/95 backdrop-blur-lg border-t border-gold/20 z-40">
        <div className="flex justify-around items-center max-w-md mx-auto py-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `
                flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all min-w-[60px]
                ${isActive ? 'text-gold' : 'text-gray-500 hover:text-gray-300'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-lg transition ${isActive ? 'bg-gold/10' : ''}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold mt-0.5">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ============ MENÚ LATERAL (DRAWER) ============ */}
      {menuAbierto && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMenuAbierto(false)}
          />
          
          <div className="relative ml-auto w-72 max-w-[85vw] h-full bg-darkCard border-l border-gold/20 flex flex-col">
            {/* Header del drawer con foto grande */}
            <div className="p-4 border-b border-gold/20 bg-gradient-to-br from-gold/10 to-transparent">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-gold" />
                  <span className="font-bold text-sm">
                    <span className="text-gold">Gym</span>
                    <span className="text-white">Data Pro</span>
                  </span>
                </div>
                <button 
                  onClick={() => setMenuAbierto(false)}
                  className="p-1.5 rounded-lg hover:bg-darkBg text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Info usuario con foto */}
              <div className="flex items-center gap-3">
                <Avatar nombreUsuario={user?.Usuario} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{user?.Usuario}</div>
                  <div className="text-xs text-gray-400 truncate">{user?.Correo}</div>
                  <span className={`inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full font-bold ${
                    user?.Rol === 'Admin' ? 'bg-gold/20 text-gold' : 'bg-gymRed/20 text-gymRed'
                  }`}>
                    {user?.Rol}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              <div className="px-3 py-2">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 mb-1">
                  Navegación
                </div>
                {menuItems.map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuAbierto(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-darkBg transition group"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="flex-1 text-sm font-medium text-gray-200 group-hover:text-gold transition">
                      {item.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gold transition" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-gold/20">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gymRed/10 border border-gymRed/30 text-gymRed font-semibold text-sm hover:bg-gymRed/20 transition"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
              <div className="text-center text-[10px] text-gray-600 mt-2">
                v1.0 · © 2026 Los Andes
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}