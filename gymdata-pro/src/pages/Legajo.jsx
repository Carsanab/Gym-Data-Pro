import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { gimnastasAPI, gruposAPI } from '../services/api';
import { Search, X, User, Phone, Heart, Shield, FileText, Award, Loader2 } from 'lucide-react';

export default function Legajo() {
  const { user } = useAuth();
  const isAdmin = user?.Rol === 'Admin';
  const [gimnastas, setGimnastas] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([gimnastasAPI.getAll(), gruposAPI.getAll()])
      .then(([g, gr]) => {
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
        setGrupos(gr);
      })
      .finally(() => setLoading(false));
  }, [user, isAdmin]);

  const getNombreGrupo = (id) => {
    const g = grupos.find(gr => String(gr.IdGrupo) === String(id));
    return g ? g['Nombre Grupo'] : 'Sin grupo';
  };

  const filtrados = gimnastas.filter(g => {
    const matchNombre = g['Nombre y Apellido']?.toLowerCase().includes(busqueda.toLowerCase());
    const matchGrupo = !filtroGrupo || String(g.Grupo) === String(filtroGrupo);
    const matchStatus = !filtroStatus || g.Status === filtroStatus;
    return matchNombre && matchGrupo && matchStatus;
  });

  const gruposDelUsuario = (() => {
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
  })();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gold">Legajos</h2>
      <p className="text-xs text-gray-500">Ficha completa de cada gimnasta</p>

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

      <div className="space-y-2 pb-4">
        {filtrados.map(g => (
          <button
            key={g['Submission ID']}
            onClick={() => setSeleccionado(g)}
            className="w-full bg-darkCard border border-gray-800 rounded-xl p-3 text-left hover:border-gold/50 active:scale-[0.99] transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{g['Nombre y Apellido']}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {g.Categoria} · {g.Nivel} · {g.Status}
                </div>
                <div className="text-[10px] text-gray-600 mt-1 truncate">
                  {getNombreGrupo(g.Grupo)}
                </div>
              </div>
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                g.Status === 'Activo' 
                  ? 'bg-checkGreen/20 text-checkGreen' 
                  : 'bg-gymRed/20 text-gymRed'
              }`}>
                {g.Status}
              </div>
            </div>
          </button>
        ))}
        {filtrados.length === 0 && (
          <div className="text-center text-gray-500 py-8 text-sm">
            No se encontraron gimnastas
          </div>
        )}
      </div>

      {seleccionado && (
        <DetalleLegajo 
          gimnasta={seleccionado} 
          nombreGrupo={getNombreGrupo(seleccionado.Grupo)}
          onClose={() => setSeleccionado(null)} 
        />
      )}
    </div>
  );
}

function DetalleLegajo({ gimnasta, nombreGrupo, onClose }) {
  const g = gimnasta;

  const Section = ({ icon: Icon, title, color = 'text-gold', children }) => (
    <div className="bg-darkBg rounded-xl p-3 border border-gray-800">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <h3 className={`text-xs font-bold uppercase ${color}`}>{title}</h3>
      </div>
      <div className="space-y-1.5 text-xs">
        {children}
      </div>
    </div>
  );

  const Field = ({ label, value, highlight }) => (
    <div>
      <div className="text-[10px] text-gray-500 uppercase">{label}</div>
      <div className={`font-medium ${highlight ? 'text-gymRed' : 'text-white'}`}>
        {value || <span className="text-gray-600">—</span>}
      </div>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-darkCard w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-r from-gold/20 to-gymRed/10 border-b border-gold/20 p-4 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg leading-tight">{g['Nombre y Apellido']}</h2>
            <div className="text-xs text-gray-400 mt-1">
              {g.Categoria} · {g.Nivel} · {g.Status}
            </div>
            <div className="text-[10px] text-gold mt-1 truncate">
              📍 {nombreGrupo}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-darkBg/50 hover:bg-darkBg text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-3">
          <Section icon={User} title="Datos Personales">
            <Field label="Documento" value={g.Documento} />
            <Field label="Fecha de Nacimiento" value={g['Fecha de Nacimiento']} />
            <Field label="Edad" value={g['Edad que cumple este año'] ? `${g['Edad que cumple este año']} años` : null} />
            <Field label="Domicilio" value={g.Domicilio} />
            <Field label="Teléfono" value={g.Teléfono} />
            <Field label="Días disponibles" value={g['Días disponibles para asistir a la actividad']} />
          </Section>

          <Section icon={Heart} title="Salud" color="text-gymRed">
            <Field 
              label="Condición médica especial" 
              value={g['¿Presenta Alguna Condición Médica, Aspecto de Salud ó Cuidado Especial?']}
            />
            {g['¿Presenta Alguna Condición Médica, Aspecto de Salud ó Cuidado Especial?'] === 'Si' && (
              <Field label="Especificar" value={g.Especificar} highlight />
            )}
            <Field 
              label="Enfermedades / Cirugías" 
              value={g['Enumere Enfermedades y/o Intervenciones Quirúrgicas que ha padecido']}
            />
            <Field label="¿Es alérgico?" value={g['¿Es Alérgico?']} />
            {g['¿Es Alérgico?'] === 'Si' && (
              <Field label="A qué es alérgico" value={g['¿A qué es Alérgico?']} highlight />
            )}
          </Section>

          <Section icon={Shield} title="Cobertura Médica" color="text-checkGreen">
            <Field label="¿Posee cobertura?" value={g['¿Posee Cobertura Médica?']} />
            <Field label="Tipo" value={g['Tipo de Cobertura Médica']} />
            <Field label="Nº de Afiliado" value={g['Nº de Afiliado']} />
            <Field 
              label="Establecimientos preferidos" 
              value={g['En caso de accidente, si debiera ser traslado para su atención, mencionar establecimientos asistenciales preferidos en la zona.']}
            />
          </Section>

          <Section icon={User} title="Padre/Madre/Tutor Principal">
            <Field label="Nombre y Apellido" value={g['Nombres y Apellido']} />
            <Field label="Profesión" value={g['Profesión']} />
          </Section>

          <Section icon={Phone} title="Contacto de Emergencia">
            <Field label="Teléfono 1" value={g['Teléfono 1']} />
            <Field label="Teléfono 2" value={g['Teléfono 2']} />
            <Field label="Documento" value={g['Documento Nº']} />
            <Field label="Nombre" value={g['Nombre y Apellido']} />
            <Field label="Parentesco" value={g.Parentesco} />
          </Section>

          <Section icon={FileText} title="Autorizaciones y Documentos">
            <Field 
              label="Autoriza retiro solo" 
              value={g['Autorizo a que mi hijo(a) baje y/o retirarse solo(a) del gimnasio.']}
            />
            <Field label="Forma de entrega" value={g['Indicar como lo entregará']} />
            <Field label="Certificado médico" value={g['Adjunto Certificado']} />
            <Field 
              label="Reglamento" 
              value={g['Acepto el reglamento de gimnasia artística(compartido por Whatsapp) y estoy en conocimiento de todos los puntos citados. (Acepto)']}
            />
          </Section>

          <Section icon={Award} title="Datos Deportivos" color="text-gold">
            <Field label="Categoría" value={g.Categoria} />
            <Field label="Nivel" value={g.Nivel} />
            <Field label="Status" value={g.Status} />
            <Field label="Federado" value={g.Federados === 'TRUE' ? 'Sí' : 'No'} />
            <Field label="Grupo" value={nombreGrupo} />
          </Section>

          <div className="text-[10px] text-gray-600 text-center pt-2">
            Registrado el {g['Submitted at']} · ID: {g['Submission ID']}
          </div>
        </div>
      </div>
    </div>
  );
}