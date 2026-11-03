import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { asistenciaAPI } from '../services/api';
import { Check, X, Loader2, Calendar } from 'lucide-react';

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
  
  const [grupoSel, setGrupoSel] = useState('');
  const [datos, setDatos] = useState([]);
  const [fechas, setFechas] = useState([]);
  const [cargando, setCargando] = useState(false);

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
    return hoy.toISOString().split('T')[0]; // YYYY-MM-DD
  }, []);

  // Cargar historial cuando cambia el grupo seleccionado
  useEffect(() => {
    if (!grupoSel) { 
      setDatos([]); 
      setFechas([]); 
      return; 
    }
    setCargando(true);
    
    asistenciaAPI.getHistorial(grupoSel).then(asistencias => {
      // ✅ FILTRAR: Solo asistencias de los últimos 90 días
      const asistenciasRecientes = asistencias.filter(a => {
        const fechaAsistencia = a.Fecha;
        return fechaAsistencia >= fechaLimite;
      });

      // Filtrar gimnastas del grupo seleccionado
      const delGrupo = gimnastas.filter(g => String(g.Grupo) === String(grupoSel));
      
      // Obtener fechas únicas ordenadas (más reciente primero)
      const fechasUnicas = [...new Set(asistenciasRecientes.map(a => a.Fecha))]
        .sort((a, b) => new Date(b) - new Date(a));
      setFechas(fechasUnicas);
      
      // Construir matriz de datos
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

  const toggleEstado = async (gimnastaId, fecha) => {
    const registro = datos.find(d => String(d.gimnasta['Submission ID']) === String(gimnastaId));
    const actual = registro?.fechas[fecha];
    if (!actual) return;
    
    const nuevo = actual.estado === 'P' ? 'A' : 'P';
    
    try {
      await asistenciaAPI.editar(actual.id, nuevo);
      setDatos(prev => prev.map(d => {
        if (String(d.gimnasta['Submission ID']) !== String(gimnastaId)) return d;
        return {
          ...d,
          fechas: { ...d.fechas, [fecha]: { ...actual, estado: nuevo } }
        };
      }));
    } catch (err) {
      alert('Error al editar');
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h2 className="text-2xl font-bold text-gold">Historial</h2>
        <p className="text-xs text-gray-500">
          Mostrando registros de los últimos 90 días
        </p>
      </div>

      <select
        value={grupoSel}
        onChange={e => setGrupoSel(e.target.value)}
        className="w-full bg-darkCard border border-gray-800 rounded-xl p-3 text-sm focus:border-gold focus:outline-none"
      >
        <option value="">Seleccionar grupo...</option>
        {gruposFiltrados.map(g => (
          <option key={g.IdGrupo} value={g.IdGrupo}>
            #{g.IdGrupo} - {g['Nombre Grupo']}
          </option>
        ))}
      </select>

      {cargando ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      ) : datos.length > 0 && fechas.length > 0 ? (
        <div className="overflow-x-auto border border-gray-800 rounded-xl bg-darkCard">
          <table className="text-sm">
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
                        onClick={() => cell && toggleEstado(String(row.gimnasta['Submission ID']), f)}
                        className={`p-2 text-center ${cell ? 'cursor-pointer hover:bg-darkCard2' : ''}`}
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
      ) : grupoSel ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">
            {fechas.length === 0 
              ? 'No hay registros de asistencia en los últimos 90 días' 
              : 'Sin datos de asistencia'}
          </p>
        </div>
      ) : null}
    </div>
  );
}