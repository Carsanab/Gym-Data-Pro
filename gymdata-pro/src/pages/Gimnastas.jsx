import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Search, Loader2, Award, Calendar, MapPin, Users, Shield } from 'lucide-react';

const formatearFecha = (fecha) => {
  if (!fecha) return null;
  const fechaStr = String(fecha).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaStr)) return fechaStr;
  if (fechaStr.includes('T')) {
    const [parteFecha] = fechaStr.split('T');
    const [anio, mes, dia] = parteFecha.split('-');
    return `${dia}/${mes}/${anio}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
    const [parteFecha] = fechaStr.split(' ');
    const [anio, mes, dia] = parteFecha.split('-');
    return `${dia}/${mes}/${anio}`;
  }
  const dateObj = new Date(fechaStr);
  if (!isNaN(dateObj.getTime())) {
    const dia = String(dateObj.getDate()).padStart(2, '0');
    const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
    const anio = dateObj.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }
  return fechaStr;
};

export default function Gimnastas() {
  const { user } = useAuth();
  const isAdmin = user?.Rol === 'Admin';
  const { gimnastas, categorias, grupos, loading } = useData();
  
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  const nivelesUnicos = useMemo(() => {
    const niveles = [...new Set(gimnastas.map(g => g.Nivel).filter(Boolean))];
    return niveles.sort();
  }, [gimnastas]);

  // ✅ FILTRO: Admin ve todo, Profesor solo ve Activos
  const gimnastasFiltradosPorRol = useMemo(() => {
    let filtrados;
    if (isAdmin) {
      const gruposDelAdmin = grupos.filter(grupo => 
        String(grupo['Profesor(es)']).split(',').map(s => s.trim()).includes(user.Usuario)
      );
      if (gruposDelAdmin.length > 0) {
        const idsGrupos = gruposDelAdmin.map(grupo => String(grupo.IdGrupo));
        filtrados = gimnastas.filter(gim => idsGrupos.includes(String(gim.Grupo)));
      } else {
        filtrados = gimnastas;
      }
    } else {
      const gruposDelProfe = grupos.filter(grupo => 
        String(grupo['Profesor(es)']).split(',').map(s => s.trim()).includes(user.Usuario)
      );
      const idsGrupos = gruposDelProfe.map(grupo => String(grupo.IdGrupo));
      filtrados = gimnastas.filter(gim => idsGrupos.includes(String(gim.Grupo)));
    }
    
    // Si es profesor, ocultar inactivos
    if (!isAdmin) {
      filtrados = filtrados.filter(g => g.Status === 'Activo');
    }
    
    return filtrados;
  }, [gimnastas, grupos, user, isAdmin]);

  const getNombreGrupo = (id) => {
    const g = grupos.find(gr => String(gr.IdGrupo) === String(id));
    return g ? g['Nombre Grupo'] : 'Sin grupo';
  };

  const getProfesores = (id) => {
    const g = grupos.find(gr => String(gr.IdGrupo) === String(id));
    return g ? g['Profesor(es)'] : '';
  };

  const filtrados = useMemo(() => {
    return gimnastasFiltradosPorRol.filter(g => {
      const matchNombre = g['Nombre y Apellido']?.toLowerCase().includes(busqueda.toLowerCase());
      const matchCategoria = !filtroCategoria || g.Categoria === filtroCategoria;
      const matchNivel = !filtroNivel || g.Nivel === filtroNivel;
      const matchStatus = !filtroStatus || g.Status === filtroStatus;
      return matchNombre && matchCategoria && matchNivel && matchStatus;
    });
  }, [gimnastasFiltradosPorRol, busqueda, filtroCategoria, filtroNivel, filtroStatus]);

  const porCategoria = useMemo(() => {
    const obj = {};
    filtrados.forEach(g => {
      const cat = g.Categoria || 'Sin categoría';
      if (!obj[cat]) obj[cat] = [];
      obj[cat].push(g);
    });
    return obj;
  }, [filtrados]);

  const categoriasOrdenadas = useMemo(() => {
    return Object.keys(porCategoria).sort((a, b) => {
      const catA = categorias.find(c => c.categoria === a);
      const catB = categorias.find(c => c.categoria === b);
      return (catA?.Idcategoria || 999) - (catB?.Idcategoria || 999);
    });
  }, [porCategoria, categorias]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;
  }

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h2 className="text-2xl font-bold text-gold">Gimnastas</h2>
        <p className="text-xs text-gray-500">{filtrados.length} gimnasta{filtrados.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input type="text" placeholder="Buscar gimnasta..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full bg-darkCard border border-gray-800 rounded-xl pl-10 pr-3 py-3 text-sm focus:border-gold focus:outline-none" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="bg-darkCard border border-gray-800 rounded-xl p-2.5 text-xs focus:border-gold focus:outline-none">
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c.Idcategoria} value={c.categoria}>{c.categoria}</option>)}
        </select>
        <select value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)} className="bg-darkCard border border-gray-800 rounded-xl p-2.5 text-xs focus:border-gold focus:outline-none">
          <option value="">Todos los niveles</option>
          {nivelesUnicos.map(nivel => <option key={nivel} value={nivel}>{nivel}</option>)}
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="bg-darkCard border border-gray-800 rounded-xl p-2.5 text-xs focus:border-gold focus:outline-none">
          <option value="">Todos los status</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </div>

      <div className="space-y-5">
        {categoriasOrdenadas.map(categoria => {
          const lista = porCategoria[categoria];
          const catInfo = categorias.find(c => c.categoria === categoria);
          return (
            <div key={categoria}>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-gold/30" />
                <h3 className="text-gold font-bold text-xs uppercase px-2 flex items-center gap-1.5">
                  {categoria} {catInfo?.edad && <span className="text-gray-500 font-normal">({catInfo.edad} años)</span>}
                  <span className="text-gray-500 font-normal">· {lista.length}</span>
                </h3>
                <div className="h-px flex-1 bg-gold/30" />
              </div>

              <div className="space-y-3">
                {lista.map(g => {
                  const nombreGrupo = getNombreGrupo(g.Grupo);
                  const profesores = getProfesores(g.Grupo);
                  const esFederado = g.Federados === 'TRUE' || g.Federados === true;
                  return (
                    <div key={g['Submission ID']} className="bg-darkCard border border-gray-800 rounded-xl p-4 hover:border-gold/30 transition">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base truncate text-white">{g['Nombre y Apellido']}</h3>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${g.Status === 'Activo' ? 'bg-checkGreen/20 text-checkGreen' : 'bg-gymRed/20 text-gymRed'}`}>
                          {g.Status}
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Calendar className="w-4 h-4 text-gold flex-shrink-0" />
                          <span className="font-medium">{formatearFecha(g['Fecha de Nacimiento'])}</span>
                          {g['Edad que cumple este año'] && <span className="text-gold font-semibold">({g['Edad que cumple este año']} años)</span>}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Shield className="w-4 h-4 text-gold flex-shrink-0" />
                          <span className="font-mono">{g.Documento || '—'}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-300">
                          <MapPin className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium text-white">{nombreGrupo}</div>
                            {profesores && <div className="text-xs text-gray-400 mt-0.5">👨‍🏫 {profesores}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-800">
                          <div className="flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-gold" />
                            <span className="text-sm font-semibold text-gold">{g.Nivel}</span>
                          </div>
                          {esFederado && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gold/20 text-gold">FEDERADO</span>}
                          <span className="px-2 py-0.5 rounded-full text-xs bg-darkBg text-gray-300">{g.Categoria}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {filtrados.length === 0 && <div className="text-center text-gray-500 py-8 text-sm">No se encontraron gimnastas</div>}
      </div>
    </div>
  );
}