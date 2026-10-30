import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usuariosAPI, gruposAPI } from '../services/api';
import { Search, Loader2, Plus, Edit2, Trash2, X, Save, Shield, User as UserIcon } from 'lucide-react';
import { Avatar } from '../utils/imagenes.jsx'; // ← NUEVO

export default function Usuarios() {
  const { user } = useAuth();
  const isAdmin = user?.Rol === 'Admin';
  const [usuarios, setUsuarios] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({
    Usuario: '', Correo: '', Contrasena: '', Rol: 'Profesor', Imagen: ''
  });

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([usuariosAPI.getAll(), gruposAPI.getAll()])
      .then(([u, g]) => {
        setUsuarios(u);
        setGrupos(g);
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const filtrados = usuarios.filter(u => {
    const matchNombre = u.Usuario?.toLowerCase().includes(busqueda.toLowerCase());
    const matchCorreo = u.Correo?.toLowerCase().includes(busqueda.toLowerCase());
    const matchRol = !filtroRol || u.Rol === filtroRol;
    return (matchNombre || matchCorreo) && matchRol;
  });

  const contarGrupos = (nombreUsuario) => 
    grupos.filter(g => String(g['Profesor(es)']).includes(nombreUsuario)).length;

  const abrirModal = (usuario = null) => {
    if (usuario) {
      setEditandoId(usuario.IdUsuarios);
      setFormData({
        Usuario: usuario.Usuario,
        Correo: usuario.Correo,
        Contrasena: usuario.Contrasena || '',
        Rol: usuario.Rol,
        Imagen: usuario.Imagen || ''
      });
    } else {
      setEditandoId(null);
      setFormData({ Usuario: '', Correo: '', Contrasena: '1234', Rol: 'Profesor', Imagen: '' });
    }
    setModalAbierto(true);
  };

  const guardar = async () => {
    if (!formData.Usuario || !formData.Correo || !formData.Contrasena) {
      alert('Completa todos los campos obligatorios');
      return;
    }
    try {
      if (editandoId) {
        await usuariosAPI.actualizar(user.IdUsuarios, editandoId, formData);
      } else {
        await usuariosAPI.crear(user.IdUsuarios, formData);
      }
      setModalAbierto(false);
      window.location.reload();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const eliminar = async (id, nombre) => {
    if (id === user.IdUsuarios) {
      alert('No puedes eliminarte a ti mismo');
      return;
    }
    if (!window.confirm(`¿Eliminar al usuario "${nombre}"?`)) return;
    try {
      await usuariosAPI.eliminar(user.IdUsuarios, id);
      window.location.reload();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-gymRed mx-auto mb-3" />
        <p className="text-gray-400">No tienes permisos para ver esta sección</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-gold animate-spin" /></div>;
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gold">Usuarios</h2>
          <p className="text-xs text-gray-500">{filtrados.length} usuarios registrados</p>
        </div>
        <button
          onClick={() => abrirModal()}
          className="bg-gold text-darkBg p-2.5 rounded-xl hover:bg-goldDark transition"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Filtros */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar usuario o correo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full bg-darkCard border border-gray-800 rounded-xl pl-10 pr-3 py-3 text-sm focus:border-gold focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {[
            { val: '', label: 'Todos' },
            { val: 'Admin', label: 'Admin' },
            { val: 'Profesor', label: 'Profesores' }
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => setFiltroRol(opt.val)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                filtroRol === opt.val
                  ? 'bg-gold text-darkBg'
                  : 'bg-darkCard border border-gray-800 text-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de usuarios con fotos */}
      <div className="space-y-2">
        {filtrados.map(u => (
          <div key={u.IdUsuarios} className="bg-darkCard border border-gray-800 rounded-xl p-3 hover:border-gold/30 transition">
            <div className="flex items-start gap-3">
              {/* Foto real del usuario */}
              <Avatar nombreUsuario={u.Usuario} size="lg" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm">{u.Usuario}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    u.Rol === 'Admin' ? 'bg-gold/20 text-gold' : 'bg-gymRed/20 text-gymRed'
                  }`}>
                    {u.Rol}
                  </span>
                </div>
                <div className="text-xs text-gray-500 truncate mt-0.5">{u.Correo}</div>
                {u.Rol === 'Profesor' && (
                  <div className="text-[10px] text-gold mt-1">
                    {contarGrupos(u.Usuario)} grupos asignados
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-3 pt-2 border-t border-gray-800">
              <button
                onClick={() => abrirModal(u)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-gold hover:bg-gold/10 rounded-lg text-xs font-semibold"
              >
                <Edit2 className="w-3.5 h-3.5" /> Editar
              </button>
              <button
                onClick={() => eliminar(u.IdUsuarios, u.Usuario)}
                disabled={u.IdUsuarios === user.IdUsuarios}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-gymRed hover:bg-gymRed/10 rounded-lg text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center" onClick={() => setModalAbierto(false)}>
          <div className="bg-darkCard w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto border border-gold/20" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-darkCard border-b border-gold/20 p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gold">{editandoId ? 'Editar' : 'Nuevo'} Usuario</h3>
              <button onClick={() => setModalAbierto(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-4 space-y-3">
              {/* Preview de la foto */}
              {formData.Usuario && (
                <div className="flex flex-col items-center py-3 bg-darkBg rounded-xl">
                  <Avatar nombreUsuario={formData.Usuario} size="xl" />
                  <p className="text-[10px] text-gray-500 mt-2">
                    Vista previa de la imagen
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs text-gold font-semibold mb-1 block">NOMBRE DE USUARIO *</label>
                <input
                  value={formData.Usuario}
                  onChange={e => setFormData({ ...formData, Usuario: e.target.value })}
                  placeholder="Ej: PROFE JUAN"
                  className="w-full bg-darkBg border border-gray-700 rounded-lg p-3 text-sm focus:border-gold focus:outline-none"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  💡 La imagen se carga automáticamente según el nombre
                </p>
              </div>

              <div>
                <label className="text-xs text-gold font-semibold mb-1 block">CORREO *</label>
                <input
                  type="email"
                  value={formData.Correo}
                  onChange={e => setFormData({ ...formData, Correo: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  className="w-full bg-darkBg border border-gray-700 rounded-lg p-3 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gold font-semibold mb-1 block">CONTRASEÑA *</label>
                <input
                  type="text"
                  value={formData.Contrasena}
                  onChange={e => setFormData({ ...formData, Contrasena: e.target.value })}
                  placeholder="1234"
                  className="w-full bg-darkBg border border-gray-700 rounded-lg p-3 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-gold font-semibold mb-1 block">ROL *</label>
                <div className="flex gap-2">
                  {['Admin', 'Profesor'].map(rol => (
                    <button
                      key={rol}
                      onClick={() => setFormData({ ...formData, Rol: rol })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${
                        formData.Rol === rol
                          ? rol === 'Admin' ? 'bg-gold text-darkBg' : 'bg-gymRed text-white'
                          : 'bg-darkBg border border-gray-700 text-gray-400'
                      }`}
                    >
                      {rol}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={guardar}
                className="w-full bg-gradient-to-r from-gymRed to-gymRedDark text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-4"
              >
                <Save className="w-4 h-4" /> {editandoId ? 'Actualizar' : 'Crear'} Usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}