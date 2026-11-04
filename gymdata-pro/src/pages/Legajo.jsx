import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { gimnastasAPI } from '../services/api';
import { 
  Search, X, User, Phone, MessageCircle, Heart, Shield, FileText, Award, 
  Loader2, Calendar, MapPin, Briefcase, AlertTriangle, 
  Stethoscope, Users, FileCheck, Plus, Edit2, Trash2, Save, Sparkles
} from 'lucide-react';

// Función para formatear fecha a dd/mm/yyyy
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

const fechaAInput = (fecha) => {
  if (!fecha) return '';
  const fechaStr = String(fecha).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(fechaStr)) return fechaStr.split(' ')[0];
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaStr)) {
    const [dia, mes, anio] = fechaStr.split('/');
    return `${anio}-${mes}-${dia}`;
  }
  const dateObj = new Date(fechaStr);
  if (!isNaN(dateObj.getTime())) {
    const dia = String(dateObj.getDate()).padStart(2, '0');
    const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
    const anio = dateObj.getFullYear();
    return `${anio}-${mes}-${dia}`;
  }
  return '';
};

const NIVELES = ['E1', 'E2', 'USAG 1A', 'USAG 1B', 'USAG 2', 'USAG 3', 'USAG 4', 'USAG 5', 'USAG 6', 'USAG 7', 'USAG 8', 'USAG 9'];

export default function Legajo() {
  const { user } = useAuth();
  const isAdmin = user?.Rol === 'Admin';
  const { gimnastas, grupos, categorias, loading, refreshGimnastas } = useData();
  
  const [busqueda, setBusqueda] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!modalAbierto) return;
    const edad = formData['Edad que cumple este año'];
    if (edad && edad !== '') {
      const edadNum = parseInt(edad);
      const categoriasOrdenadas = [...categorias].sort((a, b) => a.edad - b.edad);
      let categoriaEncontrada = null;
      for (const cat of categoriasOrdenadas) {
        if (edadNum >= cat.edad) categoriaEncontrada = cat.categoria;
      }
      if (!categoriaEncontrada && categoriasOrdenadas.length > 0) {
        categoriaEncontrada = categoriasOrdenadas[0].categoria;
      }
      if (categoriaEncontrada) {
        setFormData(prev => ({ ...prev, Categoria: categoriaEncontrada }));
      }
    } else {
      setFormData(prev => ({ ...prev, Categoria: '' }));
    }
  }, [formData['Edad que cumple este año'], categorias, modalAbierto]);

  useEffect(() => {
    if (!modalAbierto) return;
    const grupoId = formData.Grupo;
    if (grupoId && grupoId !== '') {
      const grupo = grupos.find(g => String(g.IdGrupo) === String(grupoId));
      if (grupo) {
        setFormData(prev => ({ ...prev, Profesores: grupo['Profesor(es)'] || '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, Profesores: '' }));
    }
  }, [formData.Grupo, grupos, modalAbierto]);

  const gimnastasFiltradosPorRol = useMemo(() => {
    if (isAdmin) {
      const gruposDelAdmin = grupos.filter(grupo => 
        String(grupo['Profesor(es)']).split(',').map(s => s.trim()).includes(user.Usuario)
      );
      if (gruposDelAdmin.length > 0) {
        const idsGrupos = gruposDelAdmin.map(grupo => String(grupo.IdGrupo));
        return gimnastas.filter(gim => idsGrupos.includes(String(gim.Grupo)));
      }
      return gimnastas;
    } else {
      const gruposDelProfe = grupos.filter(grupo => 
        String(grupo['Profesor(es)']).split(',').map(s => s.trim()).includes(user.Usuario)
      );
      const idsGrupos = gruposDelProfe.map(grupo => String(grupo.IdGrupo));
      return gimnastas.filter(gim => idsGrupos.includes(String(gim.Grupo)));
    }
  }, [gimnastas, grupos, user, isAdmin]);

  // ✅ NUEVA FUNCIÓN: retorna objeto con nombre y flag sinGrupo
  const getGrupoInfo = (id) => {
    const g = grupos.find(gr => String(gr.IdGrupo) === String(id));
    if (g) {
      return { nombre: g['Nombre Grupo'], sinGrupo: false };
    }
    return { nombre: 'Sin grupo', sinGrupo: true };
  };

  const filtrados = useMemo(() => {
    return gimnastasFiltradosPorRol.filter(g => {
      const matchNombre = g['Nombre y Apellido']?.toLowerCase().includes(busqueda.toLowerCase());
      const matchGrupo = !filtroGrupo || String(g.Grupo) === String(filtroGrupo);
      const matchStatus = !filtroStatus || g.Status === filtroStatus;
      return matchNombre && matchGrupo && matchStatus;
    });
  }, [gimnastasFiltradosPorRol, busqueda, filtroGrupo, filtroStatus]);

  const gruposDelUsuario = useMemo(() => {
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

  const tieneAlerta = (g) => 
    g['¿Presenta Alguna Condición Médica, Aspecto de Salud ó Cuidado Especial?'] === 'Si' || 
    g['¿Es Alérgico?'] === 'Si';

  const abrirModalCrear = () => {
    setEditandoId(null);
    setFormData({
      'Nombre y Apellido': '', 'Documento': '', 'Fecha de Nacimiento': '',
      'Edad que cumple este año': '', 'Nombres y Apellido': '', 'Profesión': '',
      'Domicilio': '', 'Teléfono': '', 'Días disponibles para asistir a la actividad': '',
      '¿Presenta Alguna Condición Médica, Aspecto de Salud ó Cuidado Especial?': 'No',
      'Especificar': '', '¿A padecido enfermedades o intervenciones quirúrgicas?': 'No',
      'Enumere Enfermedades y/o Intervenciones Quirúrgicas que ha padecido': '',
      '¿Es Alérgico?': 'No', '¿A qué es Alérgico?': '',
      '¿Posee Cobertura Médica?': 'No', 'Tipo de Cobertura Médica': '',
      'Nº de Afiliado': '',
      'En caso de accidente, si debiera ser traslado para su atención, mencionar establecimientos asistenciales preferidos en la zona.': '',
      'Teléfono 1': '', 'Teléfono 2': '', 'Documento Nº': '',
      'Nombre Autorizado': '', 'Documento Autorizado': '', 'Parentesco': '',
      'Autorizo a que mi hijo(a) baje y/o retirarse solo(a) del gimnasio.': 'No',
      'Indicar como lo entregará': '', 'Adjunto Certificado': '',
      'Acepto el reglamento de gimnasia artística(compartido por Whatsapp) y estoy en conocimiento de todos los puntos citados. (Acepto)': 'Acepto',
      'Categoria': '', 'Nivel': '', 'Status': 'Activo', 'Federados': '', 
      'Grupo': '', 'Profesores': ''
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (gimnasta) => {
    setEditandoId(gimnasta['Submission ID']);
    const campos = [
      'Nombre y Apellido', 'Documento', 'Fecha de Nacimiento', 'Edad que cumple este año',
      'Nombres y Apellido', 'Profesión', 'Domicilio', 'Teléfono',
      'Días disponibles para asistir a la actividad',
      '¿Presenta Alguna Condición Médica, Aspecto de Salud ó Cuidado Especial?', 'Especificar',
      '¿A padecido enfermedades o intervenciones quirúrgicas?',
      'Enumere Enfermedades y/o Intervenciones Quirúrgicas que ha padecido',
      '¿Es Alérgico?', '¿A qué es Alérgico?', '¿Posee Cobertura Médica?',
      'Tipo de Cobertura Médica', 'Nº de Afiliado',
      'En caso de accidente, si debiera ser traslado para su atención, mencionar establecimientos asistenciales preferidos en la zona.',
      'Teléfono 1', 'Teléfono 2', 'Documento Nº', 
      'Nombre Autorizado', 'Documento Autorizado', 'Parentesco',
      'Autorizo a que mi hijo(a) baje y/o retirarse solo(a) del gimnasio.',
      'Indicar como lo entregará', 'Adjunto Certificado',
      'Acepto el reglamento de gimnasia artística(compartido por Whatsapp) y estoy en conocimiento de todos los puntos citados. (Acepto)',
      'Categoria', 'Nivel', 'Status', 'Federados', 'Grupo', 'Profesores'
    ];
    const data = {};
    campos.forEach(c => { 
      let valor = gimnasta[c] || '';
      if (c === 'Fecha de Nacimiento' && valor) {
        valor = fechaAInput(valor);
      }
      data[c] = valor;
    });
    setFormData(data);
    setModalAbierto(true);
  };

  const guardar = async () => {
    if (!formData['Nombre y Apellido']) {
      alert('El nombre es obligatorio');
      return;
    }
    setGuardando(true);
    try {
      if (editandoId) {
        await gimnastasAPI.actualizar(user.IdUsuarios, editandoId, formData);
      } else {
        await gimnastasAPI.crear(user.IdUsuarios, formData);
      }
      setModalAbierto(false);
      await refreshGimnastas();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar a "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await gimnastasAPI.eliminar(user.IdUsuarios, id);
      await refreshGimnastas();
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
          <h2 className="text-2xl font-bold text-gold">Legajos</h2>
          <p className="text-xs text-gray-500">Ficha completa de cada gimnasta</p>
        </div>
        {isAdmin && (
          <button
            onClick={abrirModalCrear}
            className="bg-gold text-darkBg p-2.5 rounded-xl hover:bg-goldDark transition shadow-lg shadow-gold/20"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full bg-darkCard border border-gray-800 rounded-xl pl-10 pr-3 py-3 text-sm focus:border-gold focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={filtroGrupo}
            onChange={e => setFiltroGrupo(e.target.value)}
            className="bg-darkCard border border-gray-800 rounded-xl p-2.5 text-xs focus:border-gold focus:outline-none"
          >
            <option value="">Todos los grupos</option>
            {gruposDelUsuario.map(g => (
              <option key={g.IdGrupo} value={g.IdGrupo}>
                #{g.IdGrupo} - {g['Nombre Grupo'].substring(0, 25)}
              </option>
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
      </div>

      <div className="text-xs text-gray-500">
        {filtrados.length} gimnasta{filtrados.length !== 1 ? 's' : ''}
      </div>

      <div className="space-y-2">
        {filtrados.map(g => {
          const grupoInfo = getGrupoInfo(g.Grupo); // ✅ Usar nueva función
          return (
            <div
              key={g['Submission ID']}
              className={`bg-darkCard border rounded-xl p-3 transition ${
                tieneAlerta(g) ? 'border-gymRed/40' : 'border-gray-800 hover:border-gold/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => setSeleccionado(g)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="font-semibold text-sm truncate">{g['Nombre y Apellido']}</div>
                    {tieneAlerta(g) && (
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gymRed/20 text-gymRed text-[9px] font-bold flex-shrink-0">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        ALERTA
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {g.Categoria} · {g.Nivel} · {g.Status}
                  </div>
                  {/* ✅ "Sin grupo" en amarillo y más grande */}
                  {grupoInfo.sinGrupo ? (
                    <div className="text-sm font-bold text-gold mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {grupoInfo.nombre}
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-600 mt-1 truncate">
                      {grupoInfo.nombre}
                    </div>
                  )}
                </button>
                <div className="flex flex-col items-end gap-1">
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    g.Status === 'Activo' 
                      ? 'bg-checkGreen/20 text-checkGreen' 
                      : 'bg-gymRed/20 text-gymRed'
                  }`}>
                    {g.Status}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={() => abrirModalEditar(g)}
                        className="p-1.5 text-gold hover:bg-gold/10 rounded-lg transition"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => eliminar(g['Submission ID'], g['Nombre y Apellido'])}
                        className="p-1.5 text-gymRed hover:bg-gymRed/10 rounded-lg transition"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtrados.length === 0 && (
          <div className="text-center text-gray-500 py-8 text-sm">
            No se encontraron gimnastas
          </div>
        )}
      </div>

      {seleccionado && (
        <DetalleLegajo 
          gimnasta={seleccionado} 
          grupoInfo={getGrupoInfo(seleccionado.Grupo)} // ✅ Pasar objeto completo
          grupos={grupos} 
          onClose={() => setSeleccionado(null)} 
        />
      )}

      {modalAbierto && (
        <ModalCRUDLegajo
          editandoId={editandoId}
          formData={formData}
          setFormData={setFormData}
          categorias={categorias}
          grupos={grupos}
          onGuardar={guardar}
          onClose={() => setModalAbierto(false)}
          guardando={guardando}
        />
      )}
    </div>
  );
}

// ModalCRUDLegajo (sin cambios)
function ModalCRUDLegajo({ editandoId, formData, setFormData, categorias, grupos, onGuardar, onClose, guardando }) {
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const Section = ({ icon: Icon, title, color = 'text-gold', children }) => (
    <div className="bg-darkBg rounded-xl p-3 border border-gray-800">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${color}`} />
        <h3 className={`text-xs font-bold uppercase ${color}`}>{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );

  const Input = ({ label, field, type = 'text', placeholder = '', helpText = '' }) => (
    <div>
      <label className="text-[10px] text-gray-500 uppercase font-semibold mb-1 block">{label}</label>
      <input
        type={type}
        value={formData[field] || ''}
        onChange={e => updateField(field, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-darkCard border border-gray-700 rounded-lg p-2.5 text-sm focus:border-gold focus:outline-none"
      />
      {helpText && (
        <div className="flex items-center gap-1 mt-1 text-[10px] text-gold">
          <Sparkles className="w-3 h-3" />
          <span className="italic">{helpText}</span>
        </div>
      )}
    </div>
  );

  const TextArea = ({ label, field, placeholder = '', rows = 3 }) => (
    <div>
      <label className="text-[10px] text-gray-500 uppercase font-semibold mb-1 block">{label}</label>
      <textarea
        value={formData[field] || ''}
        onChange={e => updateField(field, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-darkCard border border-gray-700 rounded-lg p-2.5 text-sm focus:border-gold focus:outline-none resize-none"
      />
    </div>
  );

  const Select = ({ label, field, options }) => (
    <div>
      <label className="text-[10px] text-gray-500 uppercase font-semibold mb-1 block">{label}</label>
      <select
        value={formData[field] || ''}
        onChange={e => updateField(field, e.target.value)}
        className="w-full bg-darkCard border border-gray-700 rounded-lg p-2.5 text-sm focus:border-gold focus:outline-none"
      >
        <option value="">Seleccionar...</option>
        {options.map((opt, i) => (
          <option key={i} value={typeof opt === 'string' ? opt : opt.value}>
            {typeof opt === 'string' ? opt : opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  const YesNo = ({ label, field }) => (
    <div>
      <label className="text-[10px] text-gray-500 uppercase font-semibold mb-1 block">{label}</label>
      <div className="flex gap-2">
        {['Si', 'No'].map(opt => (
          <button
            key={opt}
            onClick={() => updateField(field, opt)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
              formData[field] === opt
                ? opt === 'Si' ? 'bg-gymRed text-white' : 'bg-checkGreen text-white'
                : 'bg-darkCard border border-gray-700 text-gray-400'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  const CampoAutomatico = ({ label, value, helpText, color = 'text-gold', bgColor = 'bg-gold/5', borderColor = 'border-gold/30' }) => (
    <div>
      <label className="text-[10px] text-gray-500 uppercase font-semibold mb-1 block flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-gold" />
        {label}
      </label>
      <div className={`w-full ${bgColor} border ${borderColor} rounded-lg p-2.5 text-sm font-bold ${color} cursor-not-allowed`}>
        {value || <span className="text-gray-500 font-normal italic">Se calcula automáticamente</span>}
      </div>
      {helpText && (
        <div className="flex items-center gap-1 mt-1 text-[10px] text-gold">
          <Sparkles className="w-3 h-3" />
          <span className="italic">{helpText}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-darkCard w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[95vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-darkCard border-b border-gold/20 p-4 flex justify-between items-center z-10">
          <h3 className="text-lg font-bold text-gold">{editandoId ? 'Editar' : 'Nuevo'} Legajo</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-darkBg text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4">
          <Section icon={User} title="Datos de la Gimnasta">
            <Input label="Nombre y Apellido *" field="Nombre y Apellido" placeholder="Ej: Juan Pérez" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Documento" field="Documento" placeholder="12345678" />
              <Input 
                label="Edad que cumple este año *" 
                field="Edad que cumple este año" 
                type="number" 
                placeholder="8"
                helpText="Define la categoría automáticamente"
              />
            </div>
            <Input label="Fecha de Nacimiento" field="Fecha de Nacimiento" type="date" />
          </Section>

          <Section icon={Users} title="Datos del Representante">
            <Input label="Nombre y Apellido" field="Nombres y Apellido" placeholder="Nombre del padre/madre/tutor" />
            <Input label="Profesión" field="Profesión" placeholder="Ej: Docente" />
            <TextArea label="Domicilio" field="Domicilio" placeholder="Dirección completa" rows={2} />
            <Input label="Teléfono" field="Teléfono" placeholder="1123456789" />
            <Input label="Días disponibles" field="Días disponibles para asistir a la actividad" placeholder="Ej: Lunes, Miércoles, Viernes" />
          </Section>

          <Section icon={Heart} title="Información de Salud" color="text-gymRed">
            <YesNo label="¿Presenta condición médica especial?" field="¿Presenta Alguna Condición Médica, Aspecto de Salud ó Cuidado Especial?" />
            {formData['¿Presenta Alguna Condición Médica, Aspecto de Salud ó Cuidado Especial?'] === 'Si' && (
              <TextArea label="Especificar condición" field="Especificar" placeholder="Describir la condición" rows={2} />
            )}
            <YesNo label="¿Padeció enfermedades o cirugías?" field="¿A padecido enfermedades o intervenciones quirúrgicas?" />
            {formData['¿A padecido enfermedades o intervenciones quirúrgicas?'] === 'Si' && (
              <TextArea label="Enumerar enfermedades/cirugías" field="Enumere Enfermedades y/o Intervenciones Quirúrgicas que ha padecido" placeholder="Listar enfermedades y cirugías" rows={3} />
            )}
            <YesNo label="¿Es alérgico?" field="¿Es Alérgico?" />
            {formData['¿Es Alérgico?'] === 'Si' && (
              <Input label="¿A qué es alérgico?" field="¿A qué es Alérgico?" placeholder="Ej: Penicilina, polen, etc." />
            )}

            <div className="border-t border-gymRed/20 pt-3 mt-3">
              <div className="text-[10px] text-checkGreen uppercase font-bold mb-2">Cobertura Médica</div>
              <YesNo label="¿Posee cobertura médica?" field="¿Posee Cobertura Médica?" />
              {formData['¿Posee Cobertura Médica?'] === 'Si' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Tipo de cobertura" field="Tipo de Cobertura Médica" placeholder="Ej: Obra Social" />
                    <Input label="Nº de Afiliado" field="Nº de Afiliado" placeholder="Número" />
                  </div>
                  <TextArea label="Establecimientos preferidos" field="En caso de accidente, si debiera ser traslado para su atención, mencionar establecimientos asistenciales preferidos en la zona." placeholder="Hospitales, clínicas" rows={2} />
                </>
              )}
            </div>
          </Section>

          <Section icon={Phone} title="Autorizados para Retirar" color="text-checkGreen">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Teléfono 1" field="Teléfono 1" placeholder="1123456789" />
              <Input label="Teléfono 2" field="Teléfono 2" placeholder="1198765432" />
            </div>
            <Input label="Nombre y Apellido" field="Nombre Autorizado" placeholder="Nombre del autorizado" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Documento" field="Documento Autorizado" placeholder="12345678" />
              <Input label="Parentesco" field="Parentesco" placeholder="Ej: Mamá, Papá" />
            </div>
          </Section>

          <Section icon={FileCheck} title="Autorizaciones y Documentos">
            <YesNo label="¿Autoriza retiro solo del gimnasio?" field="Autorizo a que mi hijo(a) baje y/o retirarse solo(a) del gimnasio." />
            <TextArea label="¿Cómo entregará el certificado?" field="Indicar como lo entregará" placeholder="Ej: Adjunto en formulario" rows={2} />
            <Input label="URL del certificado adjunto" field="Adjunto Certificado" placeholder="https://..." />
          </Section>

          <Section icon={Award} title="Detalles Deportivos" color="text-gold">
            <div className="grid grid-cols-2 gap-3">
              <CampoAutomatico
                label="Categoría (automática)"
                value={formData.Categoria}
                helpText="Se calcula por edad"
              />
              <Select label="Nivel" field="Nivel" options={NIVELES} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Status" field="Status" options={['Activo', 'Inactivo']} />
              <Select label="Federado" field="Federados" options={[{ value: 'TRUE', label: 'Sí' }, { value: 'FALSE', label: 'No' }]} />
            </div>
            <Select 
              label="Grupo" 
              field="Grupo" 
              options={grupos.map(g => ({ value: g.IdGrupo, label: `#${g.IdGrupo} - ${g['Nombre Grupo']}` }))}
            />
            <CampoAutomatico
              label="Profesor(es) del grupo"
              value={formData['Profesores']}
              helpText="Se completa al elegir un grupo"
              color="text-gold"
              bgColor="bg-gold/5"
              borderColor="border-gold/30"
            />
          </Section>

          <button
            onClick={onGuardar}
            disabled={guardando}
            className="w-full bg-gradient-to-r from-gymRed to-gymRedDark text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-gymRed/20 disabled:opacity-50"
          >
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editandoId ? 'Actualizar' : 'Crear'} Legajo
          </button>
        </div>
      </div>
    </div>
  );
}

// CampoTelefono (sin cambios)
function CampoTelefono({ label, value }) {
  if (!value) return null;
  const clean = String(value).replace(/\D/g, '');
  const telLink = clean ? `tel:+${clean}` : '#';
  const waNumber = clean.startsWith('54') ? clean : `54${clean}`;
  const waLink = clean ? `https://wa.me/${waNumber}` : '#';

  return (
    <div className="bg-darkBg/50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Phone className="w-3.5 h-3.5 text-gray-400" />
        <div className="text-[11px] text-gray-400 uppercase font-semibold tracking-wide">{label}</div>
      </div>
      <div className="flex items-center gap-3">
        <a 
          href={telLink} 
          className="font-medium text-[15px] leading-tight text-white hover:text-gold transition font-mono flex-1 truncate"
          title="Llamar"
        >
          {String(value)}
        </a>
        <a 
          href={waLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-checkGreen/10 text-checkGreen hover:bg-checkGreen/20 transition flex-shrink-0"
          title="Enviar WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

// ==========================================================
// ✅ COMPONENTE DETALLE ACTUALIZADO
// ==========================================================
function DetalleLegajo({ gimnasta, grupoInfo, grupos, onClose }) {
  const g = gimnasta;

  const profesoresCalculados = useMemo(() => {
    if (g.Profesores) return g.Profesores;
    if (g.Grupo) {
      const grupo = grupos.find(gr => String(gr.IdGrupo) === String(g.Grupo));
      return grupo?.['Profesor(es)'] || '';
    }
    return '';
  }, [g.Profesores, g.Grupo, grupos]);

  const Section = ({ icon: Icon, title, subtitle, color = 'text-gold', bgColor = 'bg-gold/5', borderColor = 'border-gold/20', children, alert = false }) => (
    <div className={`rounded-xl p-4 border ${alert ? 'bg-gymRed/5 border-gymRed/30' : `${bgColor} ${borderColor}`}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-2 rounded-lg ${alert ? 'bg-gymRed/20' : bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="flex-1">
          <h3 className={`text-sm font-bold uppercase ${color}`}>{title}</h3>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-2.5 text-sm">{children}</div>
    </div>
  );

  const Field = ({ label, value, highlight, icon: Icon, mono, truncate = false }) => {
    if (value === undefined || value === null || value === '' || value === ' ') return null;
    const valorStr = String(value);
    
    return (
      <div className="bg-darkBg/50 rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-1">
          {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
          <div className="text-[11px] text-gray-400 uppercase font-semibold tracking-wide">{label}</div>
        </div>
        <div className={`font-medium text-[15px] leading-tight ${highlight ? 'text-gymRed font-bold' : 'text-white'} ${mono ? 'font-mono' : ''} ${truncate ? 'truncate' : 'break-words'}`}>
          {valorStr}
        </div>
      </div>
    );
  };

  const AlertaMedica = ({ titulo, valor }) => (
    <div className="bg-gymRed/10 border border-gymRed/30 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <AlertTriangle className="w-4 h-4 text-gymRed" />
        <div className="text-xs text-gymRed uppercase font-bold">{titulo}</div>
      </div>
      <div className="text-[14px] text-white font-semibold leading-tight break-words">{String(valor)}</div>
    </div>
  );

  const formatearBooleano = (valor) => {
    if (valor === true || valor === 'TRUE' || valor === 'true' || valor === 'Acepto') return 'Acepto';
    if (valor === false || valor === 'FALSE' || valor === 'false') return 'No acepto';
    return valor;
  };

  const esURL = (valor) => typeof valor === 'string' && (valor.startsWith('http') || valor.startsWith('www.'));

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-darkCard w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-gradient-to-r from-gold/20 via-darkCard to-darkCard border-b border-gold/20 p-5 flex items-start justify-between gap-2 z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs text-gray-400 font-mono">ID: {g['Submission ID']}</span>
            </div>
            <h2 className="font-bold text-xl leading-tight break-words">{g['Nombre y Apellido']}</h2>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <span className="text-sm bg-gold/20 text-gold px-2.5 py-1 rounded-full font-semibold">{g.Categoria}</span>
              <span className="text-sm bg-darkBg text-gray-300 px-2.5 py-1 rounded-full">{g.Nivel}</span>
              <span className={`text-sm px-2.5 py-1 rounded-full font-bold ${g.Status === 'Activo' ? 'bg-checkGreen/20 text-checkGreen' : 'bg-gymRed/20 text-gymRed'}`}>{g.Status}</span>
            </div>
            {/* ✅ "Sin grupo" en amarillo y más grande en el header */}
            {grupoInfo.sinGrupo ? (
              <div className="text-base font-bold text-gold mt-2.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {grupoInfo.nombre}
              </div>
            ) : (
              <div className="text-sm text-gold mt-2.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{grupoInfo.nombre}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-darkBg/50 hover:bg-darkBg text-white flex-shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          <Section icon={User} title="Datos de la Gimnasta" subtitle="Información personal">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Documento" value={g['Documento']} icon={FileText} mono />
              <Field label="Edad" value={g['Edad que cumple este año'] ? `${g['Edad que cumple este año']} años` : null} icon={Calendar} />
            </div>
            <Field label="Fecha de Nacimiento" value={formatearFecha(g['Fecha de Nacimiento'])} icon={Calendar} />
          </Section>

          <Section icon={Users} title="Datos del Representante" subtitle="Padre, madre o tutor">
            <Field label="Nombre y Apellido" value={g['Nombres y Apellido']} icon={User} />
            <Field label="Profesión" value={g['Profesión']} icon={Briefcase} />
            <Field label="Domicilio" value={g.Domicilio} icon={MapPin} />
            <div className="grid grid-cols-2 gap-2.5">
              <CampoTelefono label="Teléfono" value={g.Teléfono} />
              <Field label="Días disponibles" value={g['Días disponibles para asistir a la actividad']} icon={Calendar} />
            </div>
          </Section>

          <Section icon={Heart} title="Información de Salud" subtitle="Condiciones médicas y cobertura" color="text-gymRed" bgColor="bg-gymRed/5" borderColor="border-gymRed/20" alert={g['¿Presenta Alguna Condición Médica, Aspecto de Salud ó Cuidado Especial?'] === 'Si' || g['¿Es Alérgico?'] === 'Si'}>
            {g['¿Presenta Alguna Condición Médica, Aspecto de Salud ó Cuidado Especial?'] === 'Si' && <AlertaMedica titulo="Condición Médica Especial" valor={g.Especificar} />}
            {g['¿Es Alérgico?'] === 'Si' && <AlertaMedica titulo="Alergia" valor={g['¿A qué es Alérgico?']} />}
            <Field label="¿Presenta condición médica?" value={g['¿Presenta Alguna Condición Médica, Aspecto de Salud ó Cuidado Especial?']} icon={Stethoscope} />
            <Field label="¿Padeció enfermedades/cirugías?" value={g['¿A padecido enfermedades o intervenciones quirúrgicas?']} icon={Stethoscope} />
            <Field label="Detalle" value={g['Enumere Enfermedades y/o Intervenciones Quirúrgicas que ha padecido']} icon={Stethoscope} />
            <div className="border-t border-gymRed/20 pt-3 mt-3">
              <div className="text-xs text-checkGreen uppercase font-bold mb-2.5 flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Cobertura Médica
              </div>
              <Field label="¿Posee cobertura?" value={g['¿Posee Cobertura Médica?']} />
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Tipo" value={g['Tipo de Cobertura Médica']} />
                <Field label="Nº de Afiliado" value={g['Nº de Afiliado']} mono />
              </div>
              <Field label="Establecimientos preferidos" value={g['En caso de accidente, si debiera ser traslado para su atención, mencionar establecimientos asistenciales preferidos en la zona.']} icon={MapPin} />
            </div>
          </Section>

          <Section icon={Phone} title="Autorizados para Retirar" subtitle="Contacto de emergencia" color="text-checkGreen" bgColor="bg-checkGreen/5" borderColor="border-checkGreen/20">
            <div className="grid grid-cols-2 gap-2.5">
              <CampoTelefono label="Teléfono 1" value={g['Teléfono 1']} />
              <CampoTelefono label="Teléfono 2" value={g['Teléfono 2']} />
            </div>
            <Field label="Nombre y Apellido" value={g['Nombre Autorizado']} icon={User} />
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Documento" value={g['Documento Autorizado']} icon={FileText} mono />
              <Field label="Parentesco" value={g.Parentesco} />
            </div>
          </Section>

          <Section icon={FileCheck} title="Autorizaciones y Documentos" subtitle="Certificados y reglamento">
            <Field label="Autoriza retiro solo" value={g['Autorizo a que mi hijo(a) baje y/o retirarse solo(a) del gimnasio.']} />
            
            {g['Indicar como lo entregará'] && (
              <div className="bg-darkBg/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  <div className="text-[11px] text-gray-400 uppercase font-semibold tracking-wide">Forma de entrega</div>
                </div>
                {esURL(g['Indicar como lo entregará']) ? (
                  <a 
                    href={g['Indicar como lo entregará']} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold hover:underline break-all"
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" /> 
                    <span className="truncate max-w-full">Ver certificado adjunto</span>
                  </a>
                ) : (
                  <div className="font-medium text-[15px] leading-tight text-white break-words">
                    {String(g['Indicar como lo entregará'])}
                  </div>
                )}
              </div>
            )}

            {g['Adjunto Certificado'] && esURL(g['Adjunto Certificado']) && (
              <div className="bg-darkBg/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 uppercase font-semibold mb-1.5">Certificado Adjunto</div>
                <a 
                  href={g['Adjunto Certificado']} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold hover:underline"
                >
                  <FileText className="w-4 h-4 flex-shrink-0" /> 
                  <span>Ver documento</span>
                </a>
              </div>
            )}

            <Field 
              label="Aceptación del reglamento" 
              value={formatearBooleano(g['Acepto el reglamento de gimnasia artística(compartido por Whatsapp) y estoy en conocimiento de todos los puntos citados. (Acepto)'])} 
            />
          </Section>

          <Section icon={Award} title="Detalles Deportivos" subtitle="Categoría, nivel y grupo">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Categoría" value={g.Categoria} />
              <Field label="Nivel" value={g.Nivel} />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Status" value={g.Status} />
              <Field label="Federado" value={g.Federados === 'TRUE' || g.Federados === true ? 'Sí' : 'No'} />
            </div>
            {/* ✅ "Sin grupo" en amarillo y más grande en la sección deportiva */}
            {grupoInfo.sinGrupo ? (
              <div className="bg-gold/10 border border-gold/30 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-gold" />
                  <div className="text-[11px] text-gold uppercase font-semibold tracking-wide">Grupo asignado</div>
                </div>
                <div className="font-bold text-base text-gold leading-tight">
                  {grupoInfo.nombre}
                </div>
              </div>
            ) : (
              <Field label="Grupo asignado" value={grupoInfo.nombre} icon={MapPin} />
            )}
            
            {profesoresCalculados && (
              <Field label="Profesor(es)" value={profesoresCalculados} icon={Users} />
            )}
          </Section>

          <div className="text-center pt-3 pb-5">
            <div className="text-xs text-gray-500">Registrado el {formatearFecha(g['Submitted at'])}</div>
          </div>
        </div>
      </div>
    </div>
  );
}