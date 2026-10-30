import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { gruposAPI, gimnastasAPI, asistenciaAPI } from '../services/api';
import { Check, X, Loader2, Save, Calendar, Trash2, Edit2 } from 'lucide-react';

export default function Asistencia() {
  const { user } = useAuth();
  const isAdmin = user?.Rol === 'Admin';
  
  const [grupos, setGrupos] = useState([]);
  const [grupoSel, setGrupoSel] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [gimnastas, setGimnastas] = useState([]);
  const [asistencias, setAsistencias] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Cargar grupos (Admin con grupos → solo sus grupos; Admin sin grupos → todos; Profesor → solo los suyos)
  useEffect(() => {
    gruposAPI.getAll().then(data => {
      if (isAdmin) {
        const gruposDelAdmin = data.filter(g => 
          String(g['Profesor(es)']).split(',').map(s => s.trim()).includes(user.Usuario)
        );
        setGrupos(gruposDelAdmin.length > 0 ? gruposDelAdmin : data);
      } else {
        const gruposDelProfe = data.filter(g => 
          String(g['Profesor(es)']).split(',').map(s => s.trim()).includes(user.Usuario)
        );
        setGrupos(gruposDelProfe);
      }
    });
  }, [user, isAdmin]);

  // Cargar gimnastas del grupo + asistencia existente
  useEffect(() => {
    if (!grupoSel) { setGimnastas([]); setAsistencias({}); return; }
    setLoading(true);
    
    Promise.all([
      gimnastasAPI.getAll(),
      asistenciaAPI.get(grupoSel, fecha)
    ]).then(([allGimnastas, asistExistentes]) => {
      const delGrupo = allGimnastas.filter(g => String(g.Grupo) === String(grupoSel));
      setGimnastas(delGrupo);
      
      const map = {};
      asistExistentes.forEach(a => {
        map[String(a.IdGimnasta)] = { estado: a.Estado, id: a.ID };
      });
      setAsistencias(map);
    }).finally(() => setLoading(false));
  }, [grupoSel, fecha]);

  const toggleEstado = (idGimnasta) => {
    setAsistencias(prev => {
      const actual = prev[idGimnasta]?.estado;
      const nuevo = actual === 'P' ? 'A' : 'P';
      return { ...prev, [idGimnasta]: { ...prev[idGimnasta], estado: nuevo } };
    });
  };

  const editarRegistro = async (idGimnasta) => {
    const registro = asistencias[idGimnasta];
    if (!registro?.id) return;
    const nuevoEstado = registro.estado === 'P' ? 'A' : 'P';
    try {
      await asistenciaAPI.editar(registro.id, nuevoEstado);
      setAsistencias(prev => ({
        ...prev,
        [idGimnasta]: { ...prev[idGimnasta], estado: nuevoEstado }
      }));
    } catch (err) {
      alert('Error al editar');
    }
  };

  const eliminarRegistro = async (idGimnasta) => {
    const registro = asistencias[idGimnasta];
    if (!registro?.id) return;
    if (!window.confirm('¿Eliminar este registro de asistencia?')) return;
    try {
      await asistenciaAPI.eliminar(registro.id);
      setAsistencias(prev => {
        const nuevo = { ...prev };
        delete nuevo[idGimnasta];
        return nuevo;
      });
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const guardar = async () => {
    if (!grupoSel) { mostrarMsg('Selecciona un grupo', false); return; }
    setSaving(true);
    try {
      const registros = Object.entries(asistencias)
        .filter(([_, v]) => v.estado && !v.id)
        .map(([idGimnasta, v]) => ({
          idGimnasta,
          estado: v.estado,
          idGrupo: grupoSel,
          fecha,
          idProfesor: user.IdUsuarios
        }));
      
      if (registros.length === 0) {
        mostrarMsg('No hay cambios nuevos para guardar', false);
        setSaving(false);
        return;
      }
      
      await asistenciaAPI.registrar(registros);
      mostrarMsg(`✓ ${registros.length} asistencias guardadas`, true);
      
      const asistActualizada = await asistenciaAPI.get(grupoSel, fecha);
      const map = {};
      asistActualizada.forEach(a => {
        map[String(a.IdGimnasta)] = { estado: a.Estado, id: a.ID };
      });
      setAsistencias(map);
    } catch (err) {
      mostrarMsg('Error al guardar', false);
    } finally {
      setSaving(false);
    }
  };

  const mostrarMsg = (texto, ok) => {
    setMsg(texto);
    setTimeout(() => setMsg(''), 3000);
  };

  const presentes = Object.values(asistencias).filter(v => v.estado === 'P').length;
  const ausentes = Object.values(asistencias).filter(v => v.estado === 'A').length;
  const sinMarcar = gimnastas.length - presentes - ausentes;

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-2xl font-bold text-gold">Asistencia</h2>

      <div className="space-y-3">
        <select
          value={grupoSel}
          onChange={e => setGrupoSel(e.target.value)}
          className="w-full bg-darkCard border border-gray-800 rounded-xl p-3 text-sm focus:border-gold focus:outline-none"
        >
          <option value="">Seleccionar grupo...</option>
          {grupos.map(g => (
            <option key={g.IdGrupo} value={g.IdGrupo}>
              #{g.IdGrupo} - {g['Nombre Grupo']}
            </option>
          ))}
        </select>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold pointer-events-none" />
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="w-full bg-darkCard border border-gray-800 rounded-xl pl-10 pr-3 py-3 text-sm focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      {grupoSel && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-checkGreen/10 border border-checkGreen/30 rounded-xl p-2 text-center">
            <div className="text-xl font-bold text-checkGreen">{presentes}</div>
            <div className="text-[9px] text-checkGreen/80 uppercase">Presentes</div>
          </div>
          <div className="bg-gymRed/10 border border-gymRed/30 rounded-xl p-2 text-center">
            <div className="text-xl font-bold text-gymRed">{ausentes}</div>
            <div className="text-[9px] text-gymRed/80 uppercase">Ausentes</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-2 text-center">
            <div className="text-xl font-bold text-gray-400">{sinMarcar}</div>
            <div className="text-[9px] text-gray-500 uppercase">Sin marcar</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {gimnastas.map(g => {
            const id = String(g['Submission ID']);
            const estado = asistencias[id]?.estado;
            const tieneRegistro = !!asistencias[id]?.id;
            
            return (
              <div
                key={id}
                className={`flex items-center gap-2 p-3 rounded-xl border transition ${
                  estado === 'P' ? 'bg-checkGreen/10 border-checkGreen/40' :
                  estado === 'A' ? 'bg-gymRed/10 border-gymRed/40' :
                  'bg-darkCard border-gray-800'
                }`}
              >
                <button
                  onClick={() => toggleEstado(id)}
                  className="flex-1 flex items-center justify-between min-w-0"
                >
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-semibold text-sm truncate">{g['Nombre y Apellido']}</div>
                    <div className="text-xs text-gray-500">{g.Categoria} · {g.Nivel}</div>
                  </div>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ml-2 flex-shrink-0 ${
                    estado === 'P' ? 'bg-checkGreen text-white' :
                    estado === 'A' ? 'bg-gymRed text-white' :
                    'bg-gray-800 text-gray-600'
                  }`}>
                    {estado === 'P' ? <Check className="w-5 h-5" /> :
                     estado === 'A' ? <X className="w-5 h-5" /> : '?'}
                  </div>
                </button>

                {tieneRegistro && (
                  <div className="flex gap-1 border-l border-gray-700 pl-2">
                    <button
                      onClick={() => editarRegistro(id)}
                      className="p-1.5 text-gold hover:bg-gold/10 rounded-lg"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => eliminarRegistro(id)}
                      className="p-1.5 text-gymRed hover:bg-gymRed/10 rounded-lg"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {grupoSel && gimnastas.length === 0 && (
            <div className="text-center text-gray-500 py-8 text-sm">
              Este grupo no tiene gimnastas asignados
            </div>
          )}
        </div>
      )}

      {grupoSel && gimnastas.length > 0 && (
        <button
          onClick={guardar}
          disabled={saving}
          className="w-full bg-gradient-to-r from-gymRed to-gymRedDark text-white font-bold py-4 rounded-xl shadow-lg shadow-gymRed/20 disabled:opacity-50 flex items-center justify-center gap-2 sticky bottom-4"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          GUARDAR ASISTENCIA
        </button>
      )}

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