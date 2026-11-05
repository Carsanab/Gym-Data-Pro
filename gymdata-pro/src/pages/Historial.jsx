import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { asistenciaAPI } from '../services/api';
import { Check, X, Loader2, Calendar, Trash2, ArrowLeft, Users, Award, Minus, Edit3 } from 'lucide-react';

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '—';
  const date = new Date(fechaStr);
  if (isNaN(date.getTime())) return fechaStr;
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const anio = date.getFullYear();
  return `${dia}/${mes}/${anio}`;
};

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
  
  const [grupoSel, setGrupoSel] = useState(null);
  const [datos, setDatos] = useState([]);
  const [fechas, setFechas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardandoColumna, setGuardandoColumna] = useState(false);
  
  // Modal edición de celda
  const [accionCelda, setAccionCelda] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  
  // ✅ Modal edición de columna (fecha completa)
  const [fechaColumnaSel, setFechaColumnaSel] = useState(null);
  const [nuevaFechaColumna, setNuevaFechaColumna] = useState('');

  const gruposFiltrados = useMemo(() => {
    if (isAdmin) {
      const gruposDelAdmin = grupos.filter(g => String(g['Profesor(es)']).split(',').map(s => s.trim()).includes(user.Usuario));
      return gruposDelAdmin.length > 0 ? gruposDelAdmin : grupos;
    } else {
      return grupos.filter(g => String(g['Profesor(es)']).split(',').map(s => s.trim()).includes(user.Usuario));
    }
  }, [grupos, user, isAdmin]);

  const fechaLimite = useMemo(() => {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() - 90);
    return hoy.toISOString().split('T')[0];
  }, []);

  useEffect(() => {
    if (!grupoSel) { setDatos([]); setFechas([]); return; }
    setCargando(true);
    asistenciaAPI.getHistorial(grupoSel.IdGrupo).then(asistencias => {
      const asistenciasRecientes = asistencias.filter(a => a.Fecha >= fechaLimite);

      let delGrupo = gimnastas.filter(g => String(g.Grupo) === String(grupoSel.IdGrupo));
      if (!isAdmin) {
        delGrupo = delGrupo.filter(g => g.Status === 'Activo');
      }
      
      const fechasUnicas = [...new Set(asistenciasRecientes.map(a => a.Fecha))].sort((a, b) => new Date(b) - new Date(a));
      setFechas(fechasUnicas);
      
      const matriz = delGimnasta => {
        const id = String(delGimnasta['Submission ID']);
        const fechasMap = {};
        asistenciasRecientes.filter(a => String(a.IdGimnasta) === id).forEach(a => { 
          fechasMap[a.Fecha] = { estado: a.Estado, id: a.ID }; 
        });
        return { gimnasta: delGimnasta, fechas: fechasMap };
      };
      setDatos(delGrupo.map(matriz));
    }).finally(() => setCargando(false));
  }, [grupoSel, gimnastas, fechaLimite]);

  // ==========================================
  // ✅ TOGGLE RÁPIDO: Presente ↔ Ausente
  // ==========================================
  const handleToggleRapido = async (gimnastaId, fecha, registroActual) => {
    const nuevoEstado = registroActual?.estado === 'P' ? 'A' : 'P';
    
    try {
      if (registroActual) {
        // Ya existe registro, solo cambiar estado
        await asistenciaAPI.editar(registroActual.id, nuevoEstado);
        setDatos(prev => prev.map(d => {
          if (String(d.gimnasta['Submission ID']) !== String(gimnastaId)) return d;
          return { ...d, fechas: { ...d.fechas, [fecha]: { ...registroActual, estado: nuevoEstado } } };
        }));
      } else {
        // No existe registro, crear uno nuevo
        const respuesta = await asistenciaAPI.registrar([{ 
          idGimnasta: gimnastaId, 
          estado: nuevoEstado, 
          idGrupo: grupoSel.IdGrupo, 
          fecha, 
          idProfesor: user.IdUsuarios 
        }]);
        
        // Obtener el ID del nuevo registro
        const nuevoId = respuesta?.[0]?.id || `temp_${Date.now()}`;
        
        setDatos(prev => prev.map(d => {
          if (String(d.gimnasta['Submission ID']) !== String(gimnastaId)) return d;
          return { ...d, fechas: { ...d.fechas, [fecha]: { estado: nuevoEstado, id: nuevoId } } };
        }));
        
        // Agregar fecha a la lista si es nueva
        if (!fechas.includes(fecha)) {
          setFechas(prev => [...prev, fecha].sort((a, b) => new Date(b) - new Date(a)));
        }
      }
    } catch (err) { 
      alert('Error al cambiar asistencia: ' + err.message); 
    }
  };

  // ==========================================
  // ✅ DESMARCAR (Solo Admin)
  // ==========================================
  const handleDesmarcar = async (gimnastaId, fecha, registro) => {
    if (!registro) return;
    if (!window.confirm('¿Desmarcar esta asistencia (dejarla neutra)?')) return;
    
    try {
      await asistenciaAPI.eliminar(registro.id);
      setDatos(prev => prev.map(d => {
        if (String(d.gimnasta['Submission ID']) !== String(gimnastaId)) return d;
        const nuevasFechas = { ...d.fechas };
        delete nuevasFechas[fecha];
        return { ...d, fechas: nuevasFechas };
      }));
    } catch (err) { 
      alert('Error al desmarcar: ' + err.message); 
    }
  };

  // ==========================================
  // ✅ CAMBIAR FECHA DE COLUMNA (Todos pueden)
  // ==========================================
  const handleConfirmarCambioFechaColumna = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nuevaFechaColumna)) { 
      alert("Formato de fecha inválido. Use AAAA-MM-DD"); 
      return; 
    }
    if (!window.confirm(`¿Cambiar la fecha de TODA la columna de ${formatearFecha(fechaColumnaSel)} a ${formatearFecha(nuevaFechaColumna)}?`)) return;

    setGuardandoColumna(true);
    try {
      const registrosAActualizar = [];
      datos.forEach(row => {
        const record = row.fechas[fechaColumnaSel];
        if (record) {
          registrosAActualizar.push({
            idGimnasta: row.gimnasta['Submission ID'],
            estado: record.estado,
            idGrupo: grupoSel.IdGrupo,
            fecha: nuevaFechaColumna,
            idProfesor: user.IdUsuarios,
            oldId: record.id
          });
        }
      });

      if (registrosAActualizar.length > 0) {
        await Promise.all(registrosAActualizar.map(r => asistenciaAPI.eliminar(r.oldId)));
        const nuevosRegistros = registrosAActualizar.map(({ oldId, ...rest }) => rest);
        await asistenciaAPI.registrar(nuevosRegistros);
      }

      setDatos(prev => prev.map(row => {
        const nuevasFechas = { ...row.fechas };
        if (nuevasFechas[fechaColumnaSel]) {
          const record = nuevasFechas[fechaColumnaSel];
          delete nuevasFechas[fechaColumnaSel];
          nuevasFechas[nuevaFechaColumna] = { estado: record.estado, id: 'temp_' + Date.now() };
        }
        return { ...row, fechas: nuevasFechas };
      }));

      setFechas(prev => {
        const filtradas = prev.filter(f => f !== fechaColumnaSel);
        if (!filtradas.includes(nuevaFechaColumna)) filtradas.push(nuevaFechaColumna);
        return filtradas.sort((a, b) => new Date(b) - new Date(a));
      });

      setFechaColumnaSel(null);
      setNuevaFechaColumna('');
    } catch (err) { 
      alert('Error al cambiar la fecha de la columna: ' + err.message); 
    } finally { 
      setGuardandoColumna(false); 
    }
  };

  // ==========================================
  // ✅ CAMBIAR FECHA INDIVIDUAL (Solo Admin)
  // ==========================================
  const handleConfirmarCambioFechaIndividual = async () => {
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
        nuevasFechas[nuevaFecha] = { estado: accionCelda.registro.estado, id: 'temp_' + Date.now() };
        return { ...d, fechas: nuevasFechas };
      }));
      
      setFechas(prev => !prev.includes(nuevaFecha) ? [...prev, nuevaFecha].sort((a, b) => new Date(b) - new Date(a)) : prev);
      setAccionCelda(null); 
      setNuevaFecha('');
    } catch (err) { 
      alert('Error al cambiar la fecha: ' + err.message); 
    }
  };

  if (loadingData) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;

  // ==========================================
  // VISTA 1: LISTA DE GRUPOS
  // ==========================================
  if (!grupoSel) {
    return (
      <div className="space-y-4 pb-4">
        <div><h2 className="text-2xl font-bold text-gold">Historial</h2><p className="text-xs text-gray-500">Selecciona un grupo para ver el historial de asistencia</p></div>
        <div className="space-y-2">
          {gruposFiltrados.map(grupo => {
            const cantGimnastas = gimnastas.filter(g => String(g.Grupo) === String(grupo.IdGrupo)).length;
            const esFederado = grupo.Federado === 'Si';
            const todosProfes = (grupo['Profesor(es)'] || '').split(',').map(p => p.trim()).filter(Boolean);
            return (
              <button key={grupo.IdGrupo} onClick={() => setGrupoSel(grupo)} className="w-full bg-darkCard border border-gray-800 rounded-xl p-3 text-left hover:border-gold/50 active:scale-[0.98] transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] text-gray-500 font-mono">#{grupo.IdGrupo}</span>
                      {esFederado && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gymRed/20 text-gymRed text-[10px] font-bold"><Award className="w-2.5 h-2.5" /> FEDERADO</span>}
                    </div>
                    <div className="font-semibold text-sm leading-tight text-white mb-2">{grupo['Nombre Grupo']}</div>
                    {todosProfes.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] text-gray-500 uppercase font-semibold">Profes:</span>
                        {todosProfes.map((prof, idx) => <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-darkBg text-gray-300 border border-gray-700">{prof}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-darkBg px-2 py-1 rounded-lg flex-shrink-0"><Users className="w-3.5 h-3.5 text-gold" /><span className="text-sm font-bold text-gold">{cantGimnastas}</span></div>
                </div>
              </button>
            );
          })}
          {gruposFiltrados.length === 0 && <div className="text-center text-gray-500 py-8 text-sm">No tienes grupos asignados</div>}
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA 2: TABLA DE HISTORIAL
  // ==========================================
  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={() => { setGrupoSel(null); setAccionCelda(null); setNuevaFecha(''); setFechaColumnaSel(null); }} className="p-2 rounded-lg bg-darkCard border border-gray-800 hover:border-gold/50 transition"><ArrowLeft className="w-5 h-5 text-gold" /></button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gold truncate">#{grupoSel.IdGrupo} - {grupoSel['Nombre Grupo']}</h2>
          <p className="text-xs text-gray-500">Historial de los últimos 90 días</p>
        </div>
      </div>

      {/* Instrucciones rápidas */}
      <div className="bg-darkCard border border-gold/20 rounded-lg p-3 text-xs text-gray-400">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-gold font-bold">💡 Cómo usar:</span>
        </div>
        <ul className="space-y-0.5 ml-2">
          <li>• <strong className="text-white">Toca una celda</strong> → Alterna entre Presente/Ausente</li>
          {isAdmin && <li>• <strong className="text-gold">Mantén presionado</strong> una celda → Opciones avanzadas (desmarcar, cambiar fecha)</li>}
          <li>• <strong className="text-gold">Toca la fecha del encabezado</strong> → Cambiar fecha de toda la columna</li>
        </ul>
      </div>

      {cargando ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div> : datos.length > 0 && fechas.length > 0 ? (
        <div className="overflow-x-auto border border-gray-800 rounded-xl bg-darkCard">
          <table className="text-sm w-full">
            <thead className="bg-darkCard2 sticky top-0">
              <tr>
                <th className="p-3 text-left text-gold text-xs font-bold sticky left-0 bg-darkCard2 z-10 min-w-[150px] border-r border-gray-800">Gimnasta</th>
                {/* ✅ ENCABEZADOS DE FECHA CLICKEABLES (todos pueden) */}
                {fechas.map(f => (
                  <th 
                    key={f} 
                    className="p-2 text-center text-gold text-xs font-bold min-w-[70px] cursor-pointer hover:bg-gold/10 transition group relative"
                    onClick={() => setFechaColumnaSel(f)}
                    title="Toca para cambiar la fecha de toda la columna"
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      {formatearFechaCorta(f)}
                      <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datos.map((row, i) => (
                <tr key={i} className="border-t border-gray-800">
                  <td className="p-3 text-xs font-semibold sticky left-0 bg-darkCard z-10 border-r border-gray-800">{row.gimnasta['Nombre y Apellido']}</td>
                  {fechas.map(f => {
                    const cell = row.fechas[f];
                    const gimnastaId = String(row.gimnasta['Submission ID']);
                    
                    return (
                      <td 
                        key={f} 
                        onClick={() => handleToggleRapido(gimnastaId, f, cell)}
                        onContextMenu={(e) => {
                          // Solo admin puede usar click derecho / mantener presionado
                          if (isAdmin && cell) {
                            e.preventDefault();
                            setAccionCelda({ gimnastaId, gimnastaNombre: row.gimnasta['Nombre y Apellido'], fecha: f, registro: cell });
                          }
                        }}
                        className={`p-2 text-center cursor-pointer transition-colors ${
                          cell?.estado === 'P' ? 'bg-checkGreen/10 hover:bg-checkGreen/20' : 
                          cell?.estado === 'A' ? 'bg-gymRed/10 hover:bg-gymRed/20' : 
                          'hover:bg-darkCard2'
                        }`}
                      >
                        {cell?.estado === 'P' && <Check className="w-5 h-5 text-checkGreen mx-auto" />}
                        {cell?.estado === 'A' && <X className="w-5 h-5 text-gymRed mx-auto" />}
                        {!cell && <span className="text-gray-600 text-lg">·</span>}
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
          <p className="text-gray-500 text-sm">{fechas.length === 0 ? 'No hay registros de asistencia en los últimos 90 días' : 'Sin datos de asistencia'}</p>
        </div>
      )}

      {/* ========================================== */}
      {/* ✅ MODAL: CAMBIAR FECHA DE COLUMNA (Todos) */}
      {/* ========================================== */}
      {fechaColumnaSel && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => { setFechaColumnaSel(null); setNuevaFechaColumna(''); }}>
          <div className="bg-darkCard border border-gold/20 rounded-xl p-5 w-full max-w-sm space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <h3 className="text-gold font-bold text-lg flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5" /> Cambiar Fecha de Columna
              </h3>
              <p className="text-sm text-gray-300 mt-2">
                Mover todos los registros de:
              </p>
              <p className="text-base font-bold text-gold my-1">{formatearFecha(fechaColumnaSel)}</p>
              <p className="text-sm text-gray-300">a la nueva fecha:</p>
            </div>
            
            <div>
              <label className="text-xs text-gold font-semibold mb-1 block">Nueva Fecha para toda la columna</label>
              <input 
                type="date" 
                value={nuevaFechaColumna} 
                onChange={(e) => setNuevaFechaColumna(e.target.value)} 
                className="w-full bg-darkBg border border-gray-700 rounded-lg p-3 text-sm focus:border-gold focus:outline-none" 
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                onClick={handleConfirmarCambioFechaColumna} 
                disabled={guardandoColumna || !nuevaFechaColumna}
                className="bg-gold text-darkBg py-3 rounded-lg font-bold text-sm hover:bg-goldDark transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {guardandoColumna ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
              </button>
              <button 
                onClick={() => { setFechaColumnaSel(null); setNuevaFechaColumna(''); }} 
                className="bg-gray-800 text-gray-400 py-3 rounded-lg font-bold text-sm hover:bg-darkBg transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* ✅ MODAL: OPCIONES AVANZADAS (Solo Admin)  */}
      {/* ========================================== */}
      {accionCelda && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => { setAccionCelda(null); setNuevaFecha(''); }}>
          <div className="bg-darkCard border border-gold/20 rounded-xl p-5 w-full max-w-sm space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <h3 className="text-gold font-bold text-lg">Opciones Avanzadas</h3>
              <p className="text-sm text-gray-300 mt-1 font-semibold">{accionCelda.gimnastaNombre}</p>
              <p className="text-xs text-gray-500">{formatearFecha(accionCelda.fecha)}</p>
              <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                accionCelda.registro.estado === 'P' ? 'bg-checkGreen/20 text-checkGreen' : 'bg-gymRed/20 text-gymRed'
              }`}>
                Actual: {accionCelda.registro.estado === 'P' ? 'Presente' : 'Ausente'}
              </div>
            </div>
            
            {!nuevaFecha ? (
              <div className="space-y-2">
                {/* Botón Desmarcar (grande, para admin) */}
                <button onClick={() => handleDesmarcar(accionCelda.gimnastaId, accionCelda.fecha, accionCelda.registro)} className="w-full bg-gray-800 text-gray-300 py-3.5 rounded-lg font-bold text-sm hover:bg-gray-700 transition flex items-center justify-center gap-2 border border-gray-700">
                  <Minus className="w-5 h-5" /> Desmarcar (Neutro)
                </button>

                {/* Botón Cambiar Fecha Individual */}
                <button onClick={() => setNuevaFecha(accionCelda.fecha.split('T')[0])} className="w-full bg-gold/20 text-gold py-3.5 rounded-lg font-bold text-sm hover:bg-gold/30 transition flex items-center justify-center gap-2">
                  <Calendar className="w-5 h-5" /> Cambiar Fecha (individual)
                </button>
                
                {/* Botón Eliminar */}
                <button onClick={async () => {
                  if (!window.confirm('¿Eliminar este registro?')) return;
                  try {
                    await asistenciaAPI.eliminar(accionCelda.registro.id);
                    setDatos(prev => prev.map(d => {
                      if (String(d.gimnasta['Submission ID']) !== String(accionCelda.gimnastaId)) return d;
                      const nuevasFechas = { ...d.fechas };
                      delete nuevasFechas[accionCelda.fecha];
                      return { ...d, fechas: nuevasFechas };
                    }));
                    setAccionCelda(null);
                  } catch (err) { alert('Error al eliminar: ' + err.message); }
                }} className="w-full bg-gymRed/10 text-gymRed py-3.5 rounded-lg font-bold text-sm hover:bg-gymRed/20 transition flex items-center justify-center gap-2 border border-gymRed/30">
                  <Trash2 className="w-5 h-5" /> Eliminar Registro
                </button>
              </div>
            ) : (
              <div className="space-y-3 animate-fadeIn">
                <div>
                  <label className="text-xs text-gold font-semibold mb-1 block">Nueva Fecha</label>
                  <input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} className="w-full bg-darkBg border border-gray-700 rounded-lg p-3 text-sm focus:border-gold focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleConfirmarCambioFechaIndividual} className="bg-gold text-darkBg py-3 rounded-lg font-bold text-sm hover:bg-goldDark transition">Confirmar</button>
                  <button onClick={() => setNuevaFecha('')} className="bg-gray-800 text-gray-400 py-3 rounded-lg font-bold text-sm hover:bg-darkBg transition">Volver</button>
                </div>
              </div>
            )}
            <button onClick={() => { setAccionCelda(null); setNuevaFecha(''); }} className="w-full border border-gray-700 text-gray-400 py-3 rounded-lg font-bold text-sm hover:bg-darkBg transition">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}