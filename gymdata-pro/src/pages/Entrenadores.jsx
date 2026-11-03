import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Loader2, Users, ChevronDown, ChevronUp, Shield, Layers } from 'lucide-react';
import { Avatar } from '../utils/imagenes.jsx';
import ModalImagen from '../components/ModalImagen.jsx'; // ✅ NUEVO

export default function Entrenadores() {
  const { user } = useAuth();
  const isAdmin = user?.Rol === 'Admin';
  const { usuarios, grupos, gimnastas, loading } = useData();
  const [expandido, setExpandido] = useState({});
  const [imagenModal, setImagenModal] = useState(null); // ✅ NUEVO

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-gymRed mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">Acceso Restringido</h3>
        <p className="text-gray-400 text-sm">Solo los administradores pueden ver esta sección.</p>
      </div>
    );
  }

  const data = useMemo(() => {
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
    
    result.sort((a, b) => {
      if (a.esAdmin && !b.esAdmin) return -1;
      if (!a.esAdmin && b.esAdmin) return 1;
      return a.profesor.Usuario.localeCompare(b.profesor.Usuario);
    });
    
    return result;
  }, [usuarios, grupos, gimnastas]);

  const toggleExpandido = (id) => {
    setExpandido(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;
  }

  const totalAdmins = data.filter(d => d.esAdmin).length;
  const totalProfes = data.filter(d => !d.esAdmin).length;

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h2 className="text-2xl font-bold text-gold">Entrenadores</h2>
        <p className="text-xs text-gray-500">
          {totalProfes} profesores · {totalAdmins} admins con grupos asignados
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
                className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-gold/10 to-transparent border-b border-gold/20 text-left hover:from-gold/15 transition"
              >
                {/* ✅ IMAGEN CLICKEABLE */}
                <div 
                  className="relative group flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation(); // Evita expandir/colapsar
                    setImagenModal(profesor.Usuario);
                  }}
                >
                  <Avatar nombreUsuario={profesor.Usuario} size="lg" />
                  {/* Overlay de zoom al hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <div className="font-bold text-sm truncate">{profesor.Usuario}</div>
                    {esAdmin && (
                      <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-gold/20 text-gold font-bold">
                        <Shield className="w-2.5 h-2.5" /> ADMIN
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {grupos.length} {grupos.length === 1 ? 'grupo' : 'grupos'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {totalGimnastas} gimnastas
                    </span>
                  </div>
                </div>
                
                {isExpandido ? (
                  <ChevronUp className="w-5 h-5 text-gold flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gold flex-shrink-0" />
                )}
              </button>

              {isExpandido && (
                <div className="p-3 space-y-2 bg-darkBg/30">
                  {grupos.length === 0 ? (
                    <p className="text-center text-gray-500 text-xs py-4">Sin grupos asignados</p>
                  ) : (
                    grupos.map(({ grupo, gimnastas }) => (
                      <div key={grupo.IdGrupo} className="bg-darkCard border border-gray-800 rounded-lg p-3">
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
        
        {data.length === 0 && (
          <div className="text-center text-gray-500 py-8 text-sm">
            No hay entrenadores con grupos asignados
          </div>
        )}
      </div>

      {/* ✅ MODAL DE IMAGEN */}
      {imagenModal && (
        <ModalImagen 
          nombreUsuario={imagenModal} 
          onClose={() => setImagenModal(null)} 
        />
      )}
    </div>
  );
}