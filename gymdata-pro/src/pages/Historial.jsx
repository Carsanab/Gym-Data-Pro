import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { gruposAPI, gimnastasAPI, asistenciaAPI } from '../services/api';
import { Check, X, Loader2 } from 'lucide-react';

export default function Historial() {
  const { user } = useAuth();
  const isAdmin = user?.Rol === 'Admin';
  
  const [grupos, setGrupos] = useState([]);
  const [grupoSel, setGrupoSel] = useState('');
  const [datos, setDatos] = useState([]);
  const [fechas, setFechas] = useState([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (!grupoSel) { setDatos([]); setFechas([]); return; }
    setLoading(true);
    
    Promise.all([
      gimnastasAPI.getAll(),
      asistenciaAPI.getHistorial(grupoSel)
    ]).then(([allGimnastas, asistencias]) => {
      const delGrupo = allGimnastas.filter(g => String(g.Grupo) === String(grupoSel));
      
      const fechasUnicas = [...new Set(asistencias.map(a => a.Fecha))]
        .sort((a, b) => new Date(b) - new Date(a));
      setFechas(fechasUnicas);
      
      const matriz = delGimnasta => {
        const id = String(delGimnasta['Submission ID']);
        const fechasMap = {};
        asistencias
          .filter(a => String(a.IdGimnasta) === id)
          .forEach(a => { fechasMap[a.Fecha] = { estado: a.Estado, id: a.ID }; });
        return { gimnasta: delGimnasta, fechas: fechasMap };
      };
      
      setDatos(delGrupo.map(matriz));
    }).finally(() => setLoading(false));
  }, [grupoSel]);

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

  return (
    <div className="space-y-4 pb-4">
      <h2 className="text-2xl font-bold text-gold">Historial</h2>

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

      {loading ? (
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
                    {new Date(f + 'T00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
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
      ) : grupoSel && (
        <p className="text-center text-gray-500 py-8">Sin datos de asistencia</p>
      )}
    </div>
  );
}