import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  Folder, Users, Dumbbell, Layers, ClipboardCheck, History,
  UserCheck, Shield, CheckCircle2, XCircle
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.Rol === 'Admin';
  
  const { stats, statsLoading } = useData();

  const menuItems = [
    { 
      path: '/legajo', icon: Folder, label: 'Legajo', desc: 'Fichas completas',
      color: 'text-gold', bg: 'from-gold/20 to-gold/5', border: 'border-gold/20', visible: true 
    },
    { 
      path: '/gimnastas', icon: Users, label: 'Gimnastas', desc: 'Por categoría',
      color: 'text-gymRed', bg: 'from-gymRed/20 to-gymRed/5', border: 'border-gymRed/20', visible: true 
    },
    { 
      path: '/entrenadores', icon: Dumbbell, label: 'Entrenadores', desc: 'Equipo técnico',
      color: 'text-gold', bg: 'from-gold/20 to-gold/5', border: 'border-gold/20', visible: isAdmin 
    },
    { 
      path: '/grupos', icon: Layers, label: 'Grupos', desc: 'Horarios y profes',
      color: 'text-gymRed', bg: 'from-gymRed/20 to-gymRed/5', border: 'border-gymRed/20', visible: isAdmin 
    },
    { 
      path: '/asistencia', icon: ClipboardCheck, label: 'Asistencia', desc: 'Registrar hoy',
      color: 'text-checkGreen', bg: 'from-checkGreen/20 to-checkGreen/5', border: 'border-checkGreen/20', visible: true 
    },
    { 
      path: '/historial', icon: History, label: 'Historial', desc: 'Ver registros',
      color: 'text-white', bg: 'from-gray-500/20 to-gray-500/5', border: 'border-gray-500/20', visible: true 
    },
    { 
      path: '/usuarios', icon: Shield, label: 'Usuarios', desc: 'Administrar',
      color: 'text-gold', bg: 'from-gold/20 to-gold/5', border: 'border-gold/20', visible: isAdmin 
    },
  ].filter(i => i.visible);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  // Helper para mostrar valor o "..." mientras carga
  const valor = (v) => statsLoading && v === 0 ? '...' : v;

  return (
    <div className="space-y-5 pb-4">
      <div className="bg-gradient-to-br from-gold/10 via-darkCard to-darkCard border border-gold/20 rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-gold/80 uppercase tracking-wider font-semibold">{saludo}</p>
            <h2 className="text-xl font-bold mt-0.5">
              {user?.Usuario?.split(' ').slice(0, 2).join(' ')} 👋
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {new Date().toLocaleDateString('es-AR', { 
                weekday: 'long', day: 'numeric', month: 'long' 
              })}
            </p>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
            isAdmin ? 'bg-gold/20 text-gold' : 'bg-gymRed/20 text-gymRed'
          }`}>
            {user?.Rol}
          </div>
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard 
          icon={Layers} 
          value={valor(stats.grupos)} 
          label="Grupos" 
          color="text-gold" 
          bg="bg-gold/10" 
        />
        <StatCard 
          icon={Users} 
          value={valor(stats.gimnastas)} 
          label="Total" 
          color="text-gymRed" 
          bg="bg-gymRed/10" 
        />
        <StatCard 
          icon={UserCheck} 
          value={valor(stats.presentesHoy)} 
          label="Hoy" 
          color="text-checkGreen" 
          bg="bg-checkGreen/10" 
        />
      </div>

      {/* ✅ SOLO ADMIN: Activas e Inactivas */}
      {isAdmin && (
        <div className="grid grid-cols-2 gap-2">
          <StatCard 
            icon={CheckCircle2} 
            value={valor(stats.gimnastasActivas)} 
            label="Activas" 
            color="text-checkGreen" 
            bg="bg-checkGreen/10" 
          />
          <StatCard 
            icon={XCircle} 
            value={valor(stats.gimnastasInactivas)} 
            label="Inactivas" 
            color="text-gymRed" 
            bg="bg-gymRed/10" 
          />
        </div>
      )}

      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">
          Accesos rápidos
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative overflow-hidden bg-gradient-to-br ${item.bg} to-transparent border ${item.border} rounded-2xl p-4 active:scale-95 transition-all group`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition" />
              <item.icon className={`w-8 h-8 ${item.color} mb-3 relative z-10`} />
              <div className="relative z-10">
                <div className="font-bold text-sm">{item.label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{item.desc}</div>
              </div>
              <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full ${item.bg} opacity-50`} />
            </Link>
          ))}
        </div>
      </div>

      <div className="text-center py-3">
        <p className="text-[10px] text-gray-600">
          {isAdmin 
            ? '🔓 Tienes acceso completo al sistema' 
            : '🔒 Solo ves información de tus grupos asignados'}
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, color, bg }) {
  return (
    <div className={`${bg} border border-gray-800 rounded-xl p-3 text-center`}>
      <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-[9px] text-gray-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}