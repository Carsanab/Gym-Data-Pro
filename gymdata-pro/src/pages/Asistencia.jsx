import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { asistenciaAPI } from '../services/api';
import { 
  Check, X, Loader2, Save, Calendar, ArrowLeft, 
  Users, Award
} from 'lucide-react';

export default function Asistencia() {
  const { user } = useAuth();
  const isAdmin = user?.Rol === 'Admin';
  const { grupos, gimnastas, loading: loadingData } = useData();
  
  const [grupoSel, setGrupoSel] = useState(null);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [asistencias, setAsistencias] = useState({});
  const [asistenciasExistentes, setAsistenciasExistentes] = useState({});
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState('');

  // Filtrar grupos según rol
  const gruposFiltrados = useMemo(() => {
    if (isAdmin) {
      const gruposDelAdmin = grupos.filter(g => 
        String(g['Profesor(es)']).split(',').map(s => s.trim()).includes(user.Usuario)
      );
      return gruposDelAdmin.length > 0 ? gruposDelAdmin : grupos;
    } else {
      return grupos.filter(g => 
        String(g['Profesor(es)']).split(',').map(s => s.trim()).includes(user.Usuario)
      );
    }
  }, [grupos, user, isAdmin]);

  // Cargar asistencias existentes cuando cambia grupo o fecha
  useEffect(() => {
    if (!grupoSel) {
      setAsistencias({});
      setAsistenciasExistentes({});
      return;
    }
    
    setCargando(true);
    asistenciaAPI.get(grupoSel.IdGrupo, fecha)
      .then(asistExistentes => {
        const map = {};
        asistExistentes.forEach(a => {
          map[String(a.IdGimnasta)] = { estado: a.Estado, id: a.ID };
        });
        setAsistenciasExistentes(map);
        
        const gimnastasDelGrupo = gimnastas.filter(g => String(g.Grupo) === String(grupoSel.IdGrupo));
        const inicial = {};
        gimnastasDelGrupo.forEach(g => {
          const id = String(g['Submission ID']);
          inicial[id] = map[id]?.estado || 'P';
        });
        setAsistencias(inicial);
      })
      .finally(() => setCargando(false));
  }, [grupoSel, fecha, gimnastas]);

  const toggleEstado = (idGimnasta) => {
    setAsistencias(prev => {
      const actual = prev[idGimnasta];
      const nuevo = actual === 'P' ? 'A' : 'P';
      return { ...prev, [idGimnasta]: nuevo };
    });
  };

  const guardar = async () => {
    if (!grupoSel) return;
    
    setGuardando(true);
    try {
      const registros = Object.entries(asistencias)
        .filter(([idGimnasta, estado]) => {
          const existente = asistenciasExistentes[idGimnasta];
          return !existente || existente.estado !== estado;
        })
        .map(([idGimnasta, estado]) => ({
          idGimnasta,
          estado,
          idGrupo: grupoSel.IdGrupo,
          fecha,
          idProfesor: user.IdUsuarios
        }));
      
      if (registros.length === 0) {
        mostrarMsg('No hay cambios para guardar', false);
        setGuardando(false);
        return;
      }
      
      await asistenciaAPI.registrar(registros);
      mostrarMsg(`✓ ${registros.length} asistencias guardadas`, true);
      
      const asistActualizada = await asistenciaAPI.get(grupoSel.IdGrupo, fecha);
      const map = {};
      asistActualizada.forEach(a => {
        map[String(a.IdGimnasta)] = { estado: a.Estado, id: a.ID };
      });
      setAsistenciasExistentes(map);
    } catch (err) {
      mostrarMsg('Error al guardar', false);
    } finally {
      setGuardando(false);
    }
  };

  const mostrarMsg = (texto, ok) => {
    setMsg(texto);
    setTimeout(() => setMsg(''), 3000);
  };

  const contarEstado = (estado) => {
    return Object.values(asistencias).filter(v => v === estado).length;
  };

  const gimnastasDelGrupo = useMemo(() => {
    if (!grupoSel) return [];
    return gimnastas.filter(g => String(g.Grupo) === String(grupoSel.IdGrupo));
  }, [grupoSel, gimnastas]);

  if (loadingData) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  // ============ VISTA DE GRUPOS (LISTA PLANA CON BADGES DE PROFES) ============
  if (!grupoSel) {
    return (
      <div className="space-y-4 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gold">Asistencia</h2>
          <p className="text-xs text-gray-500">Selecciona un grupo para tomar asistencia</p>
        </div>

        {/* Selector de fecha */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold pointer-events-none" />
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="w-full bg-darkCard border border-gray-800 rounded-xl pl-10 pr-3 py-3 text-sm focus:border-gold focus:outline-none"
          />
        </div>

        {/* ✅ LISTA PLANA DE GRUPOS */}
        <div className="space-y-2">
          {gruposFiltrados.map(grupo => {
            const cantGimnastas = gimnastas.filter(g => String(g.Grupo) === String(grupo.IdGrupo)).length;
            const esFederado = grupo.Federado === 'Si';
            
            // Obtener todos los profesores del grupo
            const todosProfes = (grupo['Profesor(es)'] || '')
              .split(',')
              .map(p => p.trim())
              .filter(Boolean);
            
            return (
              <button
                key={grupo.IdGrupo}
                onClick={() => setGrupoSel(grupo)}
                className="w-full bg-darkCard border border-gray-800 rounded-xl p-3 text-left hover:border-gold/50 active:scale-[0.98] transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* ID y badge federado */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] text-gray-500 font-mono">#{grupo.IdGrupo}</span>
                      {esFederado && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gymRed/20 text-gymRed text-[10px] font-bold">
                          <Award className="w-2.5 h-2.5" /> FEDERADO
                        </span>
                      )}
                    </div>
                    
                    {/* Nombre del grupo */}
                    <div className="font-semibold text-sm leading-tight text-white mb-2">
                      {grupo['Nombre Grupo']}
                    </div>
                    
                    {/* ✅ BADGES DE TODOS LOS PROFESORES (todos iguales) */}
                    {todosProfes.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] text-gray-500 uppercase font-semibold">Profes:</span>
                        {todosProfes.map((prof, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-darkBg text-gray-300 border border-gray-700"
                          >
                            {prof}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Cantidad de gimnastas */}
                  <div className="flex items-center gap-1 bg-darkBg px-2 py-1 rounded-lg flex-shrink-0">
                    <Users className="w-3.5 h-3.5 text-gold" />
                    <span className="text-sm font-bold text-gold">{cantGimnastas}</span>
                  </div>
                </div>
              </button>
            );
          })}

          {gruposFiltrados.length === 0 && (
            <div className="text-center text-gray-500 py-8 text-sm">
              No tienes grupos asignados
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ VISTA DE GIMNASTAS DEL GRUPO SELECCIONADO ============
  return (
    <div className="space-y-4 pb-4">
      {/* Header con botón volver */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setGrupoSel(null)}
          className="p-2 rounded-lg bg-darkCard border border-gray-800 hover:border-gold/50 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gold" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gold truncate">#{grupoSel.IdGrupo} - {grupoSel['Nombre Grupo']}</h2>
          <p className="text-xs text-gray-500">{gimnastasDelGrupo.length} gimnastas</p>
        </div>
      </div>

      {/* Selector de fecha */}
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold pointer-events-none" />
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="w-full bg-darkCard border border-gray-800 rounded-xl pl-10 pr-3 py-3 text-sm focus:border-gold focus:outline-none"
        />
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-checkGreen/10 border border-checkGreen/30 rounded-xl p-2 text-center">
          <div className="text-xl font-bold text-checkGreen">{contarEstado('P')}</div>
          <div className="text-[9px] text-checkGreen/80 uppercase">Presentes</div>
        </div>
        <div className="bg-gymRed/10 border border-gymRed/30 rounded-xl p-2 text-center">
          <div className="text-xl font-bold text-gymRed">{contarEstado('A')}</div>
          <div className="text-[9px] text-gymRed/80 uppercase">Ausentes</div>
        </div>
        <div className="bg-gold/10 border border-gold/30 rounded-xl p-2 text-center">
          <div className="text-xl font-bold text-gold">{gimnastasDelGrupo.length}</div>
          <div className="text-[9px] text-gold/80 uppercase">Total</div>
        </div>
      </div>

      {/* Lista de gimnastas */}
      {cargando ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {gimnastasDelGrupo.map(g => {
            const id = String(g['Submission ID']);
            const estado = asistencias[id] || 'P';
            
            return (
              <div
                key={id}
                className={`bg-darkCard border rounded-xl p-3 transition ${
                  estado === 'P' ? 'border-checkGreen/40' : 'border-gymRed/40'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate text-white">
                      {g['Nombre y Apellido']}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {g.Categoria} · {g.Nivel}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleEstado(id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition ${
                        estado === 'P'
                          ? 'bg-checkGreen text-white shadow-lg shadow-checkGreen/20'
                          : 'bg-darkBg border border-gray-700 text-gray-400 hover:border-checkGreen/50'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>Presente</span>
                    </button>
                    <button
                      onClick={() => toggleEstado(id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition ${
                        estado === 'A'
                          ? 'bg-gymRed text-white shadow-lg shadow-gymRed/20'
                          : 'bg-darkBg border border-gray-700 text-gray-400 hover:border-gymRed/50'
                      }`}
                    >
                      <X className="w-4 h-4" />
                      <span>Ausente</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {gimnastasDelGrupo.length === 0 && (
            <div className="text-center text-gray-500 py-8 text-sm">
              Este grupo no tiene gimnastas asignados
            </div>
          )}
        </div>
      )}

      {/* Botón guardar */}
      {gimnastasDelGrupo.length > 0 && (
        <button
          onClick={guardar}
          disabled={guardando}
          className="w-full bg-gradient-to-r from-gymRed to-gymRedDark text-white font-bold py-4 rounded-xl shadow-lg shadow-gymRed/20 disabled:opacity-50 flex items-center justify-center gap-2 sticky bottom-4"
        >
          {guardando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          GUARDAR ASISTENCIA
        </button>
      )}

      {/* Mensaje toast */}
      {msg && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-semibold shadow-lg z-50 ${
          msg.includes('✓') ? 'bg-checkGreen text-white' : 'bg-gymRed text-white'
        }`}>
          {msg}
        </div>
      )}
    </div>
  );
}