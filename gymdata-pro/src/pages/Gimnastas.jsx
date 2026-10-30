import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { gimnastasAPI, categoriasAPI, gruposAPI } from '../services/api';
import { Search, Loader2, Plus, Edit2, Trash2, X, Save } from 'lucide-react';

export default function Gimnastas() {
  const { user } = useAuth();
  const isAdmin = user?.Rol === 'Admin';
  
  const [gimnastas, setGimnastas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    'Nombre y Apellido': '',
    Categoria: '',
    Nivel: '',
    Grupo: '',
    Status: 'Activo'
  });

  useEffect(() => {
    Promise.all([
      gimnastasAPI.getAll(),
      categoriasAPI.getAll(),
      gruposAPI.getAll()
    ]).then(([g, c, gr]) => {
      let gFiltrados = g;
      
      if (isAdmin) {
        const gruposDelAdmin = gr.filter(grupo => 
          String(grupo['Profesor(es)']).split(',').map(s => s.trim()).includes(user.Usuario)
        );
        
        if (gruposDelAdmin.length > 0) {
          const idsGrupos = gruposDelAdmin.map(grupo => String(grupo.IdGrupo));
          gFiltrados = g.filter(gim => idsGrupos.includes(String(gim.Grupo)));
        }
      } else {
        const gruposDelProfe = gr.filter(grupo => 
          String(grupo['Profesor(es)']).split(',').map(s => s.trim()).includes(user.Usuario)
        );
        const idsGrupos = gruposDelProfe.map(grupo => String(grupo.IdGrupo));
        gFiltrados = g.filter(gim => idsGrupos.includes(String(gim.Grupo)));
      }
      
      setGimnastas(gFiltrados);
      setCategorias(c.sort((a, b) => a.Idcategoria - b.Idcategoria));
      setGrupos(gr);
    }).finally(() => setLoading(false));
  }, [user, isAdmin]);

  const filtrados = gimnastas.filter(g => {
    const matchNombre = g['Nombre y Apellido']?.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = !filtroCategoria || g.Categoria === filtroCategoria;
    const matchStatus = !filtroStatus || g.Status === filtroStatus;
    return matchNombre && matchCategoria && matchStatus;
  });

  const porCategoria = {};
  filtrados.forEach(g => {
    const cat = g.Categoria || 'Sin categoría';
    if (!porCategoria[cat]) porCategoria[cat] = [];
    porCategoria[cat].push(g);
  });

  const abrirModal = (gimnasta = null) => {
    if (gimnasta) {
      setEditandoId(gimnasta['Submission ID']);
      setFormData({
        'Nombre y Apellido': gimnasta['Nombre y Apellido'] || '',
        Categoria: gimnasta.Categoria || '',
        Nivel: gimnasta.Nivel || '',
        Grupo: String(gimnasta.Grupo) || '',
        Status: gimnasta.Status || 'Activo'
      });
    } else {
      setEditandoId(null);
      setFormData({
        'Nombre y Apellido': '',
        Categoria: '',
        Nivel: '',
        Grupo: '',
        Status: 'Activo'
      });
    }
    setModalAbierto(true);
  };

  const guardar = async () => {
    if (!formData['Nombre y Apellido'] || !formData.Categoria) {
      alert('Completa al menos el nombre y la categoría');
      return;
    }
    try {
      if (editandoId) {
        await gimnastasAPI.actualizar(user.IdUsuarios, editandoId, formData);
      } else {
        await gimnastasAPI.crear(user.IdUsuarios, formData);
      }
      setModalAbierto(false);
      window.location.reload();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  };

  const eliminar = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await gimnastasAPI.eliminar(user.IdUsuarios, id);
      window.location.reload();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gold">Gimnastas</h2>
          <p className="text-xs text-gray-500">
            {filtrados.length} gimnasta{filtrados.length !== 1 ? 's' : ''}
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar gimnasta..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full bg-darkCard border border-gray-800 rounded-xl pl-10 pr-3 py-3 text-sm focus:border-gold focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={filtroCategoria}
          onChange={e => setFiltroCategoria(e.target.value)}
          className="bg-darkCard border border-gray-800 rounded-xl p-2.5 text-xs focus:border-gold focus:outline-none"
        >
          <option value="">Todas las categorías</option>
          {categorias.map(c => (
            <option key={c.Idcategoria} value={c.categoria}>{c.categoria}</option>
          ))}
        </select>
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value)}
          className="bg-darkCard border border-gray-800 rounded-xl p-2.5 text-xs focus:border-gold focus:outline-none"
        >
          <option value="">Todos los status</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </div>

      <div className="space-y-5">
        {Object.entries(porCategoria).map(([categoria, lista]) => (
          <div key={categoria}>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px flex-1 bg-gold/30" />
              <h3 className="text-gold font-bold text-xs uppercase px-2">
                {categoria} <span className="text-gray-500">({lista.length})</span>
              </h3>
              <div className="h-px flex-1 bg-gold/30" />
            </div>

            <div className="space-y-2">
              {lista.map(g => (
                <div 
                  key={g['Submission ID']} 
                  className="bg-darkCard border border-gray-800 rounded-xl p-3 hover:border-gold/30 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {g['Nombre y Apellido']}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{g.Nivel}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                          g.Status === 'Activo' 
                            ? 'bg-checkGreen/20 text-checkGreen' 
                            : 'bg-gymRed/20 text-gymRed'
                        }`}>
                          {g.Status}
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => abrirModal(g)}
                          className="p-2 text-gold hover:bg-gold/10 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => eliminar(g['Submission ID'], g['Nombre y Apellido'])}
                          className="p-2 text-gymRed hover:bg-gymRed/10 rounded-lg transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <div className="text-center text-gray-500 py-8 text-sm">
            No se encontraron gimnastas
          </div>
        )}
      </div>

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
                {editandoId ? 'Editar' : 'Nuevo'} Gimnasta
              </h3>
              <button 
                onClick={() => setModalAbierto(false)}
                className="p-1.5 rounded-lg hover:bg-darkBg text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-gold font-semibold mb-1 block">NOMBRE Y APELLIDO *</label>
                <input
                  value={formData['Nombre y Apellido']}
                  onChange={e => setFormData({ ...formData, 'Nombre y Apellido': e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  className="w-full bg-darkBg border border-gray-700 rounded-lg p-3 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gold font-semibold mb-1 block">CATEGORÍA *</label>
                <select
                  value={formData.Categoria}
                  onChange={e => setFormData({ ...formData, Categoria: e.target.value })}
                  className="w-full bg-darkBg border border-gray-700 rounded-lg p-3 text-sm focus:border-gold focus:outline-none"
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map(c => (
                    <option key={c.Idcategoria} value={c.categoria}>
                      {c.categoria} ({c.edad} años)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gold font-semibold mb-1 block">NIVEL</label>
                <input
                  value={formData.Nivel}
                  onChange={e => setFormData({ ...formData, Nivel: e.target.value })}
                  placeholder="Ej: E1, USAG 1B, USAG 2"
                  className="w-full bg-darkBg border border-gray-700 rounded-lg p-3 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gold font-semibold mb-1 block">GRUPO</label>
                <select
                  value={formData.Grupo}
                  onChange={e => setFormData({ ...formData, Grupo: e.target.value })}
                  className="w-full bg-darkBg border border-gray-700 rounded-lg p-3 text-sm focus:border-gold focus:outline-none"
                >
                  <option value="">Seleccionar grupo</option>
                  {grupos.map(g => (
                    <option key={g.IdGrupo} value={g.IdGrupo}>
                      #{g.IdGrupo} - {g['Nombre Grupo']}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gold font-semibold mb-1 block">STATUS</label>
                <div className="flex gap-2">
                  {['Activo', 'Inactivo'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setFormData({ ...formData, Status: opt })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
                        formData.Status === opt
                          ? opt === 'Activo' 
                            ? 'bg-checkGreen text-white' 
                            : 'bg-gymRed text-white'
                          : 'bg-darkBg border border-gray-700 text-gray-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={guardar}
                className="w-full bg-gradient-to-r from-gymRed to-gymRedDark text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-4 shadow-lg shadow-gymRed/20"
              >
                <Save className="w-4 h-4" />
                {editandoId ? 'Actualizar' : 'Crear'} Gimnasta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}