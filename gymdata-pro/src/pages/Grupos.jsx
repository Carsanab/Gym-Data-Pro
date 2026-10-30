import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { gruposAPI, gimnastasAPI, usuariosAPI } from '../services/api';
import { Search, Users, Award, Loader2, Plus, Edit2, Trash2, X, Save } from 'lucide-react';

export default function Grupos() {
  const { user } = useAuth();
  const isAdmin = user?.Rol === 'Admin';
  const [grupos, setGrupos] = useState([]);
  const [gimnastas, setGimnastas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroFederado, setFiltroFederado] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal CRUD
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({ 'Nombre Grupo': '', Federado: 'No', 'Profesor(es)': '' });

  useEffect(() => {
    Promise.all([gruposAPI.getAll(), gimnastasAPI.getAll(), usuariosAPI.getAll()])
      .then(([gr, g, u]) => {
        let gruposFiltrados = gr;
        if (!isAdmin) {
          gruposFiltrados = gr.filter(g => String(g['Profesor(es)']).includes(user.Usuario));
        }
        setGrupos(gruposFiltrados);
        setGimnastas(g);
        setUsuarios(u);
      })
      .finally(() => setLoading(false));
  }, [user, isAdmin]);

  const contarGimnastas = (idGrupo) => 
    gimnastas.filter(g => String(g.Grupo) === String(idGrupo)).length;

  const filtrados = grupos.filter(g => {
    const matchNombre = g['Nombre Grupo']?.toLowerCase().includes(busqueda.toLowerCase());
    const matchProfesor = g['Profesor(es)']?.toLowerCase().includes(busqueda.toLowerCase());
    const matchFederado = !filtroFederado || g.Federado === filtroFederado;
    return (matchNombre || matchProfesor) && matchFederado;
  });

  const abrirModal = (grupo = null) => {
    if (grupo) {
      setEditandoId(grupo.IdGrupo);
      setFormData({
        'Nombre Grupo': grupo['Nombre Grupo'],
        Federado: grupo.Federado,
        'Profesor(es)': grupo['Profesor(es)']
      });
    } else {
      setEditandoId(null);
      setFormData({ 'Nombre Grupo': '', Federado: 'No', 'Profesor(es)': '' });
    }
    setModalAbierto(true);
  };

  const guardar = async () => {
    if (!formData['Nombre Grupo'] || !formData['Profesor(es)']) {
      alert('Completa todos los campos');
      return;
    }
    try {
      if (editandoId) {
        await gruposAPI.actualizar(user.IdUsuarios, editandoId, formData);
      } else {
        await gruposAPI.crear(user.IdUsuarios, formData);
      }
      setModalAbierto(false);
      window.location.reload();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este grupo? Los gimnastas quedarán sin grupo asignado.')) return;
    try {
      await gruposAPI.eliminar(user.IdUsuarios, id);
      window.location.reload();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const toggleFederado = (profes) => {
    const actual = formData['Profesor(es)'];
    const lista = actual ? actual.split(',').map(s => s.trim()).filter(Boolean) : [];
    const idx = lista.indexOf(profes);
    if (idx >= 0) lista.splice(idx, 1);
    else lista.push(profes);
    setFormData({ ...formData, 'Profesor(es)': lista.join(', ') });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;
  }

  const profes = usuarios.filter(u => u.Rol === 'Profesor');

  return (
    <div className="space-y-4 pb-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gold">Grupos</h2>
          <p className="text-xs text-gray-500">
            {filtrados.length} grupos · {filtrados.reduce((acc, g) => acc + contarGimnastas(g.IdGrupo), 0)} gimnastas
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => abrirModal()}
            className="bg-gold text-darkBg p-2.5 rounded-xl hover:bg-goldDark transition"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar grupo o profesor..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full bg-darkCard border border-gray-800 rounded-xl pl-10 pr-3 py-3 text-sm focus:border-gold focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {[
            { val: '', label: 'Todos', color: 'bg-gold text-darkBg' },
            { val: 'Si', label: 'Federados', color: 'bg-gymRed text-white' },
            { val: 'No', label: 'No Federados', color: 'bg-checkGreen text-white' }
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => setFiltroFederado(opt.val)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                filtroFederado === opt.val ? opt.color : 'bg-darkCard border border-gray-800 text-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtrados.map(g => (
          <div key={g.IdGrupo} className="bg-darkCard border border-gray-800 rounded-xl p-3 hover:border-gold/30 transition">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] text-gray-500 font-mono">#{g.IdGrupo}</span>
                  {g.Federado === 'Si' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gymRed/20 text-gymRed text-[10px] font-bold">
                      <Award className="w-2.5 h-2.5" /> FEDERADO
                    </span>
                  )}
                </div>
                <div className="font-semibold text-sm leading-tight">{g['Nombre Grupo']}</div>
              </div>
              <div className="flex items-center gap-1 bg-darkBg px-2 py-1 rounded-lg">
                <Users className="w-3.5 h-3.5 text-gold" />
                <span className="text-sm font-bold text-gold">{contarGimnastas(g.IdGrupo)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <span className="text-[10px] text-gray-500 uppercase">Profesores:</span>
              {g['Profesor(es)']?.split(',').map((p, i) => (
                <span key={i} className="text-[11px] bg-gold/10 text-gold px-2 py-0.5 rounded-full font-medium">
                  {p.trim()}
                </span>
              ))}
            </div>

            {isAdmin && (
              <div className="flex gap-2 pt-2 border-t border-gray-800">
                <button
                  onClick={() => abrirModal(g)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-gold hover:bg-gold/10 rounded-lg text-xs font-semibold"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={() => eliminar(g.IdGrupo)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 text-gymRed hover:bg-gymRed/10 rounded-lg text-xs font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center" onClick={() => setModalAbierto(false)}>
          <div className="bg-darkCard w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto border border-gold/20" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-darkCard border-b border-gold/20 p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gold">{editandoId ? 'Editar' : 'Nuevo'} Grupo</h3>
              <button onClick={() => setModalAbierto(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-gold font-semibold mb-1 block">NOMBRE DEL GRUPO</label>
                <input
                  value={formData['Nombre Grupo']}
                  onChange={e => setFormData({ ...formData, 'Nombre Grupo': e.target.value })}
                  placeholder="Ej: Lun - Mie - 17:00 A 18:30"
                  className="w-full bg-darkBg border border-gray-700 rounded-lg p-3 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gold font-semibold mb-1 block">FEDERADO</label>
                <div className="flex gap-2">
                  {['Si', 'No'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setFormData({ ...formData, Federado: opt })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
                        formData.Federado === opt
                          ? opt === 'Si' ? 'bg-gymRed text-white' : 'bg-checkGreen text-white'
                          : 'bg-darkBg border border-gray-700 text-gray-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gold font-semibold mb-2 block">PROFESORES</label>
                <div className="grid grid-cols-2 gap-2">
                  {profes.map(p => {
                    const seleccionado = formData['Profesor(es)'].split(',').map(s => s.trim()).includes(p.Usuario);
                    return (
                      <button
                        key={p.IdUsuarios}
                        onClick={() => toggleFederado(p.Usuario)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold transition ${
                          seleccionado
                            ? 'bg-gold text-darkBg'
                            : 'bg-darkBg border border-gray-700 text-gray-400'
                        }`}
                      >
                        {p.Usuario}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={guardar}
                className="w-full bg-gradient-to-r from-gymRed to-gymRedDark text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> {editandoId ? 'Actualizar' : 'Crear'} Grupo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}