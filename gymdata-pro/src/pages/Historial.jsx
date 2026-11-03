import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { asistenciaAPI } from '../services/api';
import { Check, X, Loader2, Calendar, Trash2, ArrowLeft, Users, Award } from 'lucide-react';

// Función para formatear fecha a dd/mm/yyyy
const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '—';
  const date = new Date(fechaStr);
  if (isNaN(date.getTime())) return fechaStr;
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const anio = date.getFullYear();
  return `${dia}/${mes}/${anio}`;
};

// Función para formatear fecha corta (para headers de tabla)
const formatearFechaCorta = (fechaStr) => {
  if (!fechaStr) return '—';
  const date = new Date(fechaStr);
  if (isNaN(date.getTime())) return fechaStr;
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
};

export default function Historial() {
  const { user } = useAuth();
  const isAdmin = user?.Rol === 'Admin';
  
  const { grupos, gimnastas, loading: loadingData } = useData();
  
  // ✅ Ahora grupoSel guarda el objeto completo del grupo, o null si estamos en la lista
  const [grupoSel, setGrupoSel] = useState(null);
  const [datos, setDatos] = useState([]);
  const [fechas, setFechas] = useState([]);
  const [cargando, setCargando] = useState(false);
  
  // Estado para el modal de edición de celda
  const [accionCelda, setAccionCelda] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState('');

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

  // Calcular fecha límite (90 días atrás)
  const fechaLimite = useMemo(() => {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() - 90);
    return hoy.toISOString().split('T')[0];
  }, []);

  // Cargar historial cuando cambia el grupo seleccionado
  useEffect(() => {
    if (!grupoSel) { 
      setDatos([]); 
      setFechas([]); 
      return; 
    }
    setCargando(true);
    
    asistenciaAPI.getHistorial(grupoSel.IdGrupo).then(asistencias => {
      const asistenciasRecientes = asistencias.filter(a => {
        const fechaAsistencia = a.Fecha;
        return fechaAsistencia >= fechaLimite;
      });

      const delGrupo = gimnastas.filter(g => String(g.Grupo) === String(grupoSel.IdGrupo));
      
      const fechasUnicas = [...new Set(asistenciasRecientes.map(a => a.Fecha))]
        .sort((a, b) => new Date(b) - new Date(a));
      setFechas(fechasUnicas);
      
      const matriz = delGimnasta => {
        const id = String(delGimnasta['Submission ID']);
        const fechasMap = {};
        asistenciasRecientes
          .filter(a => String(a.IdGimnasta) === id)
          .forEach(a => { 
            fechasMap[a.Fecha] = { estado: a.Estado, id: a.ID }; 
          });
        return { gimnasta: delGimnasta, fechas: fechasMap };
      };
      
      setDatos(delGrupo.map(matriz));
    }).finally(() => setCargando(false));
  }, [grupoSel, gimnastas, fechaLimite]);

  // ============ FUNCIONES DE EDICIÓN ============
  const handleCambiarEstado = async (nuevoEstado) => {
    try {
      await asistenciaAPI.editar(accionCelda.registro.id, nuevoEstado);
      setDatos(prev => prev.map(d => {
        if (String(d.gimnasta['Submission ID']) !== String(accionCelda.gimnastaId)) return d;
        return {
          ...d,
          fechas: { ...d.fechas, [accionCelda.fecha]: { ...accionCelda.registro, estado: nuevoEstado } }
        };
      }));
      setAccionCelda(null);
    } catch (err) {
      alert('Error al editar: ' + err.message);
    }
  };

  const handlePrepararCambioFecha = () => {
    setNuevaFecha(accionCelda.fecha.split('T')[0]);
  };

  const handleConfirmarCambioFecha = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha)) {
      alert("Formato de fecha inválido. Use AAAA-MM-DD");
      return;
    }

    try {
      await asistenciaAPI.eliminar(accionCelda.registro.id);
      await asistenciaAPI.registrar([{
        idGimnasta: accionCelda.gimnastaId,
        estado: accionCelda.registro.estado,
        idGrupo: grupoSel.IdGrupo,
        fecha: nuevaFecha,
        idProfesor: user.IdUsuarios
      }]);
      
      setDatos(prev => prev.map(d => {
        if (String(d.gimnasta['Submission ID']) !== String(accionCelda.gimnastaId)) return d;
        const nuevasFechas = { ...d.fechas };
        delete nuevasFechas[accionCelda.fecha];
        nuevasFechas[nuevaFecha] = { 
          estado: accionCelda.registro.estado, 
          id: 'temp_' + Date.now()
        };
        return { ...d, fechas: nuevasFechas };
      }));
      
      setFechas(prev => {
        if (!prev.includes(nuevaFecha)) {
          return [...prev, nuevaFecha].sort((a, b) => new Date(b) - new Date(a));
        }
        return prev;
      });
      
      setAccionCelda(null);
      setNuevaFecha('');
    } catch (err) {
      alert('Error al cambiar la fecha: ' + err.message);
    }
  };

  const handleEliminar = async () => {
    if (!window.confirm('¿Está seguro de eliminar este registro de asistencia?')) return;
    try {
      await asistenciaAPI.eliminar(accionCelda.registro.id);
      setDatos(prev => prev.map(d => {
        if (String(d.gimnasta['Submission ID']) !== String(accionCelda.gimnastaId)) return d;
        const nuevasFechas = { ...d.fechas };
        delete nuevasFechas[accionCelda.fecha];
        return { ...d, fechas: nuevasFechas };
      }));
      setAccionCelda(null);
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  // ============ VISTA 1: LISTA DE GRUPOS (Igual que en Asistencia) ============
  if (!grupoSel) {
    return (
      <div className="space-y-4 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gold">Historial</h2>
          <p className="text-xs text-gray-500">Selecciona un grupo para ver el historial de asistencia</p>
        </div>

        <div className="space-y-2">
          {gruposFiltrados.map(grupo => {
            const cantGimnastas = gimnastas.filter(g => String(g.Grupo) === String(grupo.IdGrupo)).length;
            const esFederado = grupo.Federado === 'Si';
            const todosProfes = (grupo['Profesor(es)'] || '').split(',').map(p => p.trim()).filter(Boolean);
            
            return (
              <button
                key={grupo.IdGrupo}
                onClick={() => setGrupoSel(grupo)}
                className="w-full bg-darkCard border border-gray-800 rounded-xl p-3 text-left hover:border-gold/50 active:scale-[0.98] transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] text-gray-500 font-mono">#{grupo.IdGrupo}</span>
                      {esFederado && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gymRed/20 text-gymRed text-[10px] font-bold">
                          <Award className="w-2.5 h-2.5" /> FEDERADO
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-sm leading-tight text-white mb-2">
                      {grupo['Nombre Grupo']}
                    </div>
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

  // ============ VISTA 2: TABLA DE HISTORIAL DEL GRUPO ============
  return (
    <div className="space-y-4 pb-4">
      {/* Header con botón volver */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setGrupoSel(null);
            setAccionCelda(null);
            setNuevaFecha('');
          }}
          className="p-2 rounded-lg bg-darkCard border border-gray-800 hover:border-gold/50 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gold" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gold truncate">#{grupoSel.IdGrupo} - {grupoSel['Nombre Grupo']}</h2>
          <p className="text-xs text-gray-500">Historial de los últimos 90 días</p>
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : datos.length > 0 && fechas.length > 0 ? (
        <div className="overflow-x-auto border border-gray-800 rounded-xl bg-darkCard">
          <table className="text-sm w-full">
            <thead className="bg-darkCard2 sticky top-0">
              <tr>
                <th className="p-3 text-left text-gold text-xs font-bold sticky left-0 bg-darkCard2 z-10 min-w-[150px] border-r border-gray-800">
                  Gimnasta
                </th>
                {fechas.map(f => (
                  <th key={f} className="p-2 text-center text-gold text-xs font-bold min-w-[70px]">
                    {formatearFechaCorta(f)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datos.map((row, i) => (
                <tr key={i} className="border-t border-gray-800">
                  <td className="p-3 text-xs font-semibold sticky left-0 bg-darkCard z-10 border-r border-gray-800">
                    {row.gimnasta['Nombre y Apellido']}
                  </td>
                  {fechas.map(f => {
                    const cell = row.fechas[f];
                    return (
                      <td
                        key={f}
                        onClick={() => {
                          if (cell) {
                            setAccionCelda({
                              gimnastaId: String(row.gimnasta['Submission ID']),
                              gimnastaNombre: row.gimnasta['Nombre y Apellido'],
                              fecha: f,
                              registro: cell
                            });
                          }
                        }}
                        className={`p-2 text-center ${cell ? 'cursor-pointer hover:bg-darkCard2 transition-colors' : ''}`}
                      >
                        {cell?.estado === 'P' && <Check className="w-4 h-4 text-checkGreen mx-auto" />}
                        {cell?.estado === 'A' && <X className="w-4 h-4 text-gymRed mx-auto" />}
                        {!cell && <span className="text-gray-700">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">
            {fechas.length === 0 
              ? 'No hay registros de asistencia en los últimos 90 días' 
              : 'Sin datos de asistencia'}
          </p>
        </div>
      )}

      {/* ============ MODAL DE EDICIÓN DE CELDA ============ */}
      {accionCelda && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-darkCard border border-gold/20 rounded-xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="text-center">
              <h3 className="text-gold font-bold text-lg">Editar Asistencia</h3>
              <p className="text-sm text-gray-300 mt-1 font-semibold">{accionCelda.gimnastaNombre}</p>
              <p className="text-xs text-gray-500">{formatearFecha(accionCelda.fecha)}</p>
              <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                accionCelda.registro.estado === 'P' ? 'bg-checkGreen/20 text-checkGreen' : 'bg-gymRed/20 text-gymRed'
              }`}>
                Actual: {accionCelda.registro.estado === 'P' ? 'Presente' : 'Ausente'}
              </div>
            </div>
            
            {!nuevaFecha ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleCambiarEstado('P')} 
                    className="bg-checkGreen/20 text-checkGreen py-2.5 rounded-lg font-bold text-sm hover:bg-checkGreen/30 transition flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Presente
                  </button>
                  <button 
                    onClick={() => handleCambiarEstado('A')} 
                    className="bg-gymRed/20 text-gymRed py-2.5 rounded-lg font-bold text-sm hover:bg-gymRed/30 transition flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> Ausente
                  </button>
                </div>
                
                <button 
                  onClick={handlePrepararCambioFecha} 
                  className="w-full bg-gold/20 text-gold py-2.5 rounded-lg font-bold text-sm hover:bg-gold/30 transition flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" /> Cambiar Fecha
                </button>
                
                <button 
                  onClick={handleEliminar} 
                  className="w-full bg-gray-800 text-gray-400 py-2.5 rounded-lg font-bold text-sm hover:bg-gymRed/20 hover:text-gymRed transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar Registro
                </button>
              </>
            ) : (
              <div className="space-y-3 animate-fadeIn">
                <div>
                  <label className="text-xs text-gold font-semibold mb-1 block">Nueva Fecha</label>
                  <input
                    type="date"
                    value={nuevaFecha}
                    onChange={(e) => setNuevaFecha(e.target.value)}
                    className="w-full bg-darkBg border border-gray-700 rounded-lg p-2.5 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handleConfirmarCambioFecha} 
                    className="bg-gold text-darkBg py-2.5 rounded-lg font-bold text-sm hover:bg-goldDark transition"
                  >
                    Confirmar
                  </button>
                  <button 
                    onClick={() => setNuevaFecha('')} 
                    className="bg-gray-800 text-gray-400 py-2.5 rounded-lg font-bold text-sm hover:bg-darkBg transition"
                  >
                    Volver
                  </button>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => { setAccionCelda(null); setNuevaFecha(''); }} 
              className="w-full border border-gray-700 text-gray-400 py-2.5 rounded-lg font-bold text-sm hover:bg-darkBg transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}