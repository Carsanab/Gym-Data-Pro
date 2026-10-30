import { useState, useEffect } from 'react';
import { usuariosAPI, gruposAPI, gimnastasAPI } from '../services/api';
import { Loader2, Users, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { Avatar } from '../utils/imagenes';

export default function Entrenadores() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState({});

  useEffect(() => {
    Promise.all([
      usuariosAPI.getAll(),
      gruposAPI.getAll(),
      gimnastasAPI.getAll()
    ]).then(([usuarios, grupos, gimnastas]) => {
      // Incluir profesores Y admins que tengan grupos asignados
      const usuariosConGrupos = usuarios.filter(u => {
        const tieneGrupos = grupos.some(g => 
          String(g['Profesor(es)']).split(',').map(s => s.trim()).includes(u.Usuario)
        );
        return tieneGrupos;
      });
      
      const result = usuariosConGrupos.map(p => {
        const susGrupos = grupos.filter(g => 
          String(g['Profesor(es)']).split(',').map(s => s.trim()).includes(p.Usuario)
        );
        const gruposConGimnastas = susGrupos.map(grupo => ({
          grupo,
          gimnastas: gimnastas.filter(g => String(g.Grupo) === String(grupo.IdGrupo))
        }));
        return { 
          profesor: p, 
          grupos: gruposConGimnastas,
          esAdmin: p.Rol === 'Admin'
        };
      });
      
      // Ordenar: Admins primero, luego profesores
      result.sort((a, b) => {
        if (a.esAdmin && !b.esAdmin) return -1;
        if (!a.esAdmin && b.esAdmin) return 1;
        return a.profesor.Usuario.localeCompare(b.profesor.Usuario);
      });
      
      setData(result);
    }).finally(() => setLoading(false));
  }, []);

  const toggleExpandido = (id) => {
    setExpandido(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;
  }

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h2 className="text-2xl font-bold text-gold">Entrenadores</h2>
        <p className="text-xs text-gray-500">
          {data.filter(d => !d.esAdmin).length} profesores · {data.filter(d => d.esAdmin).length} admins con grupos
        </p>
      </div>

      <div className="space-y-3">
        {data.map(({ profesor, grupos, esAdmin }) => {
          const totalGimnastas = grupos.reduce((acc, g) => acc + g.gimnastas.length, 0);
          const isExpandido = expandido[profesor.IdUsuarios];

          return (
            <div key={profesor.IdUsuarios} className="bg-darkCard border border-gray-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleExpandido(profesor.IdUsuarios)}
                className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-gold/10 to-transparent border-b border-gold/20 text-left"
              >
                <Avatar nombreUsuario={profesor.Usuario} size="lg" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-bold text-sm truncate">{profesor.Usuario}</div>
                    {esAdmin && (
                      <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-gold/20 text-gold font-bold">
                        <Shield className="w-2.5 h-2.5" /> ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {grupos.length} grupos · {totalGimnastas} gimnastas
                  </div>
                </div>
                {isExpandido ? (
                  <ChevronUp className="w-5 h-5 text-gold flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gold flex-shrink-0" />
                )}
              </button>

              {isExpandido && (
                <div className="p-3 space-y-2">
                  {grupos.length === 0 ? (
                    <p className="text-center text-gray-500 text-xs py-4">Sin grupos asignados</p>
                  ) : (
                    grupos.map(({ grupo, gimnastas }) => (
                      <div key={grupo.IdGrupo} className="bg-darkBg rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-semibold text-gold truncate flex-1">
                            #{grupo.IdGrupo} · {grupo['Nombre Grupo']}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 ml-2 flex-shrink-0">
                            <Users className="w-3 h-3" />
                            {gimnastas.length}
                          </div>
                        </div>
                        {gimnastas.length > 0 && (
                          <div className="space-y-1">
                            {gimnastas.slice(0, 5).map(g => (
                              <div key={g['Submission ID']} className="text-[11px] text-gray-400 truncate">
                                • {g['Nombre y Apellido']} <span className="text-gray-600">({g.Categoria})</span>
                              </div>
                            ))}
                            {gimnastas.length > 5 && (
                              <div className="text-[10px] text-gold font-semibold">
                                + {gimnastas.length - 5} más
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}