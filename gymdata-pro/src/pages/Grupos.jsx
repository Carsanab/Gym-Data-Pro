import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { gruposAPI, gimnastasAPI, usuariosAPI } from '../services/api';
import { 
  Search, Users, Award, Loader2, Plus, Edit2, Trash2, X, Save, 
  ChevronDown, ChevronUp, User as UserIcon
} from 'lucide-react';
import { Avatar } from '../utils/imagenes.jsx';

export default function Grupos() {
  const { user } = useAuth();
  const isAdmin = user?.Rol === 'Admin';
  
  const { grupos: gruposCache, gimnastas: gimnastasCache, usuarios: usuariosCache, loading, refreshGrupos } = useData();
  
  const [busqueda, setBusqueda] = useState('');
  const [filtroFederado, setFiltroFederado] = useState('');
  const [expandidos, setExpandidos] = useState({});
  
  // Modal CRUD
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({ 'Nombre Grupo': '', Federado: 'No', 'Profesor(es)': '' });

  // Filtrar grupos según rol
  const gruposFiltradosPorRol = useMemo(() => {
    if (isAdmin) {
      const gruposDelAdmin = gruposCache.filter(g => 
        String(g['Profesor(es)']).split(',').map(s => s.trim()).includes(user.Usuario)
      );
      return gruposDelAdmin.length > 0 ? gruposDelAdmin : gruposCache;
    } else {
      return gruposCache.filter(g => 
        String(g['Profesor(es)']).split(',').map(s => s.trim()).includes(user.Usuario)
      );
    }
  }, [gruposCache, user, isAdmin]);

  // Contar gimnastas por grupo
  const contarGimnastas = (idGrupo) => 
    gimnastasCache.filter(g => String(g.Grupo) === String(idGrupo)).length;

  // Aplicar filtros de búsqueda y federado
  const filtrados = useMemo(() => {
    return gruposFiltradosPorRol.filter(g => {
      const matchNombre = g['Nombre Grupo']?.toLowerCase().includes(busqueda.toLowerCase());
      const matchProfesor = g['Profesor(es)']?.toLowerCase().includes(busqueda.toLowerCase());
      const matchFederado = !filtroFederado || g.Federado === filtroFederado;
      return (matchNombre || matchProfesor) && matchFederado;
    });
  }, [gruposFiltradosPorRol, busqueda, filtroFederado]);

  // Agrupar por profesor
  const gruposPorProfesor = useMemo(() => {
    const mapa = {};
    
    filtrados.forEach(grupo => {
      const profesoresStr = grupo['Profesor(es)'] || 'Sin asignar';
      const profesores = profesoresStr.split(',').map(p => p.trim()).filter(Boolean);
      
      profesores.forEach(prof => {
        if (!mapa[prof]) {
          mapa[prof] = [];
        }
        mapa[prof].push(grupo);
      });
    });
    
    // Convertir a array y ordenar
    return Object.entries(mapa)
      .map(([profesor, grupos]) => {
        // Buscar info del usuario
        const userInfo = usuariosCache.find(u => u.Usuario === profesor);
        const totalGimnastas = grupos.reduce((acc, g) => acc + contarGimnastas(g.IdGrupo), 0);
        
        return {
          profesor,
          userInfo,
          grupos,
          totalGimnastas,
          esAdmin: userInfo?.Rol === 'Admin' || false
        };
      })
      .sort((a, b) => {
        // Admins primero, luego por nombre
        if (a.esAdmin && !b.esAdmin) return -1;
        if (!a.esAdmin && b.esAdmin) return 1;
        return a.profesor.localeCompare(b.profesor);
      });
  }, [filtrados, usuariosCache, gimnastasCache]);

  // Toggle expandir/colapsar profesor
  const toggleProfesor = (profesor) => {
    setExpandidos(prev => ({ ...prev, [profesor]: !prev[profesor] }));
  };

  // Expandir todos al inicio
  useEffect(() => {
    const todosExpandidos = {};
    gruposPorProfesor.forEach(({ profesor }) => {
      todosExpandidos[profesor] = true;
    });
    setExpandidos(todosExpandidos);
  }, [gruposPorProfesor.length]);

  // Funciones CRUD
  const abrirModal = (grupo = null) => {
    if (grupo) {
      setEditandoId(grupo.IdGrupo);
      setFormData({
        'Nombre Grupo': grupo['Nombre Grupo'],
        Federado: grupo.Federado,
        'Profesor(es)': grupo['Profesor(es)']
      });
    } else {
      setEditandoId(null);
      setFormData({ 'Nombre Grupo': '', Federado: 'No', 'Profesor(es)': '' });
    }
    setModalAbierto(true);
  };

  const guardar = async () => {
    if (!formData['Nombre Grupo'] || !formData['Profesor(es)']) {
      alert('Completa todos los campos');
      return;
    }
    try {
      if (editandoId) {
        await gruposAPI.actualizar(user.IdUsuarios, editandoId, formData);
      } else {
        await gruposAPI.crear(user.IdUsuarios, formData);
      }
      setModalAbierto(false);
      await refreshGrupos();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este grupo? Los gimnastas quedarán sin grupo asignado.')) return;
    try {
      await gruposAPI.eliminar(user.IdUsuarios, id);
      await refreshGrupos();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const toggleFederado = (profes) => {
  const actual = formData['Profesor(es)'];
  const lista = actual ? actual.split(',').map(s => s.trim()).filter(Boolean) : [];
  const idx = lista.indexOf(profes);
  if (idx >= 0) {
    lista.splice(idx, 1);  // Remover si ya está seleccionado
  } else {
    lista.push(profes);  // 
  }
  setFormData({ ...formData, 'Profesor(es)': lista.join(', ') });
};

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;
  }

  const profes = usuariosCache.filter(u => u.Rol === 'Profesor' || u.Rol === 'Admin');
  const totalGrupos = filtrados.length;
  const totalGimnastas = filtrados.reduce((acc, g) => acc + contarGimnastas(g.IdGrupo), 0);

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gold">Grupos</h2>
          <p className="text-xs text-gray-500">
            {totalGrupos} grupos · {totalGimnastas} gimnastas · {gruposPorProfesor.length} profesores
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => abrirModal()}
            className="bg-gold text-darkBg p-2.5 rounded-xl hover:bg-goldDark transition shadow-lg shadow-gold/20"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar grupo o profesor..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full bg-darkCard border border-gray-800 rounded-xl pl-10 pr-3 py-3 text-sm focus:border-gold focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {[
            { val: '', label: 'Todos', color: 'bg-gold text-darkBg' },
            { val: 'Si', label: 'Federados', color: 'bg-gymRed text-white' },
            { val: 'No', label: 'No Federados', color: 'bg-checkGreen text-white' }
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => setFiltroFederado(opt.val)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                filtroFederado === opt.val ? opt.color : 'bg-darkCard border border-gray-800 text-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista agrupada por profesor */}
      <div className="space-y-3">
        {gruposPorProfesor.map(({ profesor, userInfo, grupos, totalGimnastas, esAdmin }) => {
          const isExpandido = expandidos[profesor] !== false; // Por defecto expandido
          
          return (
            <div key={profesor} className="bg-darkCard border border-gray-800 rounded-2xl overflow-hidden">
              {/* Header del profesor */}
              <button
                onClick={() => toggleProfesor(profesor)}
                className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-gold/10 to-transparent border-b border-gold/20 text-left hover:from-gold/15 transition"
              >
                {/* Avatar del profesor */}
                {userInfo ? (
                  <Avatar nombreUsuario={profesor} size="md" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {profesor[0]}
                  </div>
                )}
                
                {/* Info del profesor */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-bold text-sm truncate">{profesor}</div>
                    {esAdmin && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-gold/20 text-gold font-bold">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {grupos.length} {grupos.length === 1 ? 'grupo' : 'grupos'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {totalGimnastas} gimnastas
                    </span>
                  </div>
                </div>
                
                {/* Chevron */}
                {isExpandido ? (
                  <ChevronUp className="w-5 h-5 text-gold flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gold flex-shrink-0" />
                )}
              </button>

              {/* Lista de grupos del profesor */}
              {isExpandido && (
                <div className="p-3 space-y-2 bg-darkBg/30">
                  {grupos.map(g => (
                    <div 
                      key={g.IdGrupo} 
                      className="bg-darkCard border border-gray-800 rounded-xl p-3 hover:border-gold/30 transition"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[10px] text-gray-500 font-mono">#{g.IdGrupo}</span>
                            {g.Federado === 'Si' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gymRed/20 text-gymRed text-[10px] font-bold">
                                <Award className="w-2.5 h-2.5" /> FEDERADO
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-sm leading-tight">
                            {g['Nombre Grupo']}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-darkBg px-2 py-1 rounded-lg flex-shrink-0">
                          <Users className="w-3.5 h-3.5 text-gold" />
                          <span className="text-sm font-bold text-gold">{contarGimnastas(g.IdGrupo)}</span>
                        </div>
                      </div>

                      {/* Profesores (por si tiene más de uno) */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-gray-500 uppercase">Profesores:</span>
                        {g['Profesor(es)']?.split(',').map((p, i) => (
                          <span 
                            key={i}
                            className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                              p.trim() === profesor 
                                ? 'bg-gold/20 text-gold border border-gold/30' 
                                : 'bg-gold/10 text-gold/70'
                            }`}
                          >
                            {p.trim()}
                          </span>
                        ))}
                      </div>

                      {/* Botones CRUD (solo Admin) */}
                      {isAdmin && (
                        <div className="flex gap-2 mt-3 pt-2 border-t border-gray-800">
                          <button
                            onClick={() => abrirModal(g)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-gold hover:bg-gold/10 rounded-lg text-xs font-semibold"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button
                            onClick={() => eliminar(g.IdGrupo)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-gymRed hover:bg-gymRed/10 rounded-lg text-xs font-semibold"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {gruposPorProfesor.length === 0 && (
          <div className="text-center text-gray-500 py-8 text-sm">
            No se encontraron grupos
          </div>
        )}
      </div>

      {/* Modal CRUD */}
      {modalAbierto && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setModalAbierto(false)}
        >
          <div 
            className="bg-darkCard w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto border border-gold/20"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-darkCard border-b border-gold/20 p-4 flex justify-between items-center z-10">
              <h3 className="text-lg font-bold text-gold">
                {editandoId ? 'Editar' : 'Nuevo'} Grupo
              </h3>
              <button 
                onClick={() => setModalAbierto(false)}
                className="p-1.5 rounded-lg hover:bg-darkBg text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-gold font-semibold mb-1 block">
                  NOMBRE DEL GRUPO *
                </label>
                <input
                  value={formData['Nombre Grupo']}
                  onChange={e => setFormData({ ...formData, 'Nombre Grupo': e.target.value })}
                  placeholder="Ej: Lun - Mie - 17:00 A 18:30"
                  className="w-full bg-darkBg border border-gray-700 rounded-lg p-3 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gold font-semibold mb-1 block">
                  FEDERADO
                </label>
                <div className="flex gap-2">
                  {['Si', 'No'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setFormData({ ...formData, Federado: opt })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
                        formData.Federado === opt
                          ? opt === 'Si' ? 'bg-gymRed text-white' : 'bg-checkGreen text-white'
                          : 'bg-darkBg border border-gray-700 text-gray-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gold font-semibold mb-2 block">
                  PROFESORES *
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {profes.map(p => {
                    const seleccionado = formData['Profesor(es)']
                      .split(',')
                      .map(s => s.trim())
                      .includes(p.Usuario);
                    return (
                      <button
                        key={p.IdUsuarios}
                        onClick={() => toggleFederado(p.Usuario)}
                        className={`flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                          seleccionado
                            ? 'bg-gold text-darkBg'
                            : 'bg-darkBg border border-gray-700 text-gray-400 hover:border-gold/50'
                        }`}
                      >
                        <Avatar nombreUsuario={p.Usuario} size="sm" />
                        <span className="truncate">{p.Usuario}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-500 mt-2">
                  💡 Puedes seleccionar varios profesores para un mismo grupo
                </p>
              </div>

              <button
                onClick={guardar}
                className="w-full bg-gradient-to-r from-gymRed to-gymRedDark text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-gymRed/20"
              >
                <Save className="w-4 h-4" />
                {editandoId ? 'Actualizar' : 'Crear'} Grupo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}