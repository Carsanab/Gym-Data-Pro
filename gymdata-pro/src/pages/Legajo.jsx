import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { gimnastasAPI, gruposAPI } from '../services/api';
import { 
  Search, X, User, Phone, Heart, Shield, FileText, Award, 
  Loader2, Calendar, MapPin, Briefcase, AlertTriangle, 
  Stethoscope, Users, FileCheck
} from 'lucide-react';

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
    <div className="space-y-4 pb-4">
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

      <div className="space-y-2">
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
              <div className="flex flex-col items-end gap-1">
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  g.Status === 'Activo' 
                    ? 'bg-checkGreen/20 text-checkGreen' 
                    : 'bg-gymRed/20 text-gymRed'
                }`}>
                  {g.Status}
                </div>
                {(g['¿Presenta Alguna Condición Médica, Aspecto de Salud ó Cuidado Especial?'] === 'Si' || g['¿Es Alérgico?'] === 'Si') && (
                  <div className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-gymRed/20 text-gymRed flex items-center gap-0.5">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    ALERTA
                  </div>
                )}
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

// ============ COMPONENTE MODAL DE DETALLE ============
function DetalleLegajo({ gimnasta, nombreGrupo, onClose }) {
  const g = gimnasta;

  const Section = ({ icon: Icon, title, subtitle, color = 'text-gold', bgColor = 'bg-gold/5', borderColor = 'border-gold/20', children, alert = false }) => (
    <div className={`rounded-xl p-3 border ${alert ? 'bg-gymRed/5 border-gymRed/30' : `${bgColor} ${borderColor}`}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${alert ? 'bg-gymRed/20' : bgColor}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="flex-1">
          <h3 className={`text-xs font-bold uppercase ${color}`}>{title}</h3>
          {subtitle && <p className="text-[10px] text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-2 text-xs">
        {children}
      </div>
    </div>
  );

  const Field = ({ label, value, highlight, icon: Icon, mono }) => {
    if (value === undefined || value === null || value === '' || value === ' ') return null;
    return (
      <div className="bg-darkBg/50 rounded-lg p-2">
        <div className="flex items-center gap-1.5 mb-0.5">
          {Icon && <Icon className="w-3 h-3 text-gray-500" />}
          <div className="text-[10px] text-gray-500 uppercase font-semibold">{label}</div>
        </div>
        <div className={`font-medium text-[13px] leading-tight ${
          highlight ? 'text-gymRed font-bold' : 'text-white'
        } ${mono ? 'font-mono' : ''}`}>
          {String(value)}
        </div>
      </div>
    );
  };

  const AlertaMedica = ({ titulo, valor }) => (
    <div className="bg-gymRed/10 border border-gymRed/30 rounded-lg p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <AlertTriangle className="w-3.5 h-3.5 text-gymRed" />
        <div className="text-[10px] text-gymRed uppercase font-bold">{titulo}</div>
      </div>
      <div className="text-[13px] text-white font-semibold leading-tight">{String(valor)}</div>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-darkCard w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="sticky top-0 bg-gradient-to-r from-gold/20 via-darkCard to-darkCard border-b border-gold/20 p-4 flex items-start justify-between gap-2 z-10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-gray-500 font-mono">ID: {g['Submission ID']}</span>
            </div>
            <h2 className="font-bold text-lg leading-tight">{g['Nombre y Apellido']}</h2>
            <div className="flex items-center gap-2 flex-wrap mt-1.5">
              <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full font-semibold">
                {g.Categoria}
              </span>
              <span className="text-xs bg-darkBg text-gray-300 px-2 py-0.5 rounded-full">
                {g.Nivel}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                g.Status === 'Activo' 
                  ? 'bg-checkGreen/20 text-checkGreen' 
                  : 'bg-gymRed/20 text-gymRed'
              }`}>
                {g.Status}
              </span>
            </div>
            <div className="text-[11px] text-gold mt-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{nombreGrupo}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-darkBg/50 hover:bg-darkBg text-white flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="overflow-y-auto p-4 space-y-3">
          
          {/* SECCIÓN 1: DATOS DE LA GIMNASTA (Columnas D-G) */}
          <Section 
            icon={User} 
            title="Datos de la Gimnasta" 
            subtitle="Información personal"
            color="text-gold"
          >
            <div className="grid grid-cols-2 gap-2">
              <Field 
                label="Documento" 
                value={g['Documento']}
                icon={FileText}
                mono
              />
              <Field 
                label="Edad" 
                value={g['Edad que cumple este año'] ? `${g['Edad que cumple este año']} años` : null}
                icon={Calendar}
              />
            </div>
            <Field 
              label="Fecha de Nacimiento" 
              value={g['Fecha de Nacimiento']}
              icon={Calendar}
            />
          </Section>

          {/* SECCIÓN 2: DATOS DEL REPRESENTANTE (Columnas H-L) */}
          <Section 
            icon={Users} 
            title="Datos del Representante" 
            subtitle="Padre, madre o tutor"
            color="text-gold"
          >
            <Field 
              label="Nombre y Apellido" 
              value={g['Nombres y Apellido']}
              icon={User}
            />
            <Field 
              label="Profesión" 
              value={g['Profesión']}
              icon={Briefcase}
            />
            <Field 
              label="Domicilio" 
              value={g.Domicilio}
              icon={MapPin}
            />
            <div className="grid grid-cols-2 gap-2">
              <Field 
                label="Teléfono" 
                value={g.Teléfono}
                icon={Phone}
                mono
              />
              <Field 
                label="Días disponibles" 
                value={g['Días disponibles para asistir a la actividad']}
                icon={Calendar}
              />
            </div>
          </Section>

          {/* SECCIÓN 3: INFORMACIÓN DE SALUD (Columnas M-V) */}
          <Section 
            icon={Heart} 
            title="Información de Salud" 
            subtitle="Condiciones médicas y cobertura"
            color="text-gymRed"
            bgColor="bg-gymRed/5"
            borderColor="border-gymRed/20"
            alert={g['¿Presenta Alguna Condición Médica, Aspecto de Salud ó Cuidado Especial?'] === 'Si' || g['¿Es Alérgico?'] === 'Si'}
          >
            {g['¿Presenta Alguna Condición Médica, Aspecto de Salud ó Cuidado Especial?'] === 'Si' && (
              <AlertaMedica 
                titulo="Condición Médica Especial" 
                valor={g.Especificar}
              />
            )}
            {g['¿Es Alérgico?'] === 'Si' && (
              <AlertaMedica 
                titulo="Alergia" 
                valor={g['¿A qué es Alérgico?']}
              />
            )}

            <Field 
              label="¿Presenta condición médica?" 
              value={g['¿Presenta Alguna Condición Médica, Aspecto de Salud ó Cuidado Especial?']}
              icon={Stethoscope}
            />
            <Field 
              label="¿Padeció enfermedades/cirugías?" 
              value={g['¿A padecido enfermedades o intervenciones quirúrgicas?']}
              icon={Stethoscope}
            />
            <Field 
              label="Detalle de enfermedades/cirugías" 
              value={g['Enumere Enfermedades y/o Intervenciones Quirúrgicas que ha padecido']}
              icon={Stethoscope}
            />
            
            <div className="border-t border-gymRed/20 pt-2 mt-2">
              <div className="text-[10px] text-checkGreen uppercase font-bold mb-2 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Cobertura Médica
              </div>
              <Field 
                label="¿Posee cobertura?" 
                value={g['¿Posee Cobertura Médica?']}
              />
              <div className="grid grid-cols-2 gap-2">
                <Field 
                  label="Tipo" 
                  value={g['Tipo de Cobertura Médica']}
                />
                <Field 
                  label="Nº de Afiliado" 
                  value={g['Nº de Afiliado']}
                  mono
                />
              </div>
              <Field 
                label="Establecimientos preferidos" 
                value={g['En caso de accidente, si debiera ser traslado para su atención, mencionar establecimientos asistenciales preferidos en la zona.']}
                icon={MapPin}
              />
            </div>
          </Section>

          {/* SECCIÓN 4: AUTORIZADOS PARA RETIRAR (Columnas W-AB) */}
          <Section 
            icon={Phone} 
            title="Autorizados para Retirar" 
            subtitle="Contacto de emergencia"
            color="text-checkGreen"
            bgColor="bg-checkGreen/5"
            borderColor="border-checkGreen/20"
          >
            <div className="grid grid-cols-2 gap-2">
              <Field 
                label="Teléfono 1" 
                value={g['Teléfono 1']}
                icon={Phone}
                mono
              />
              <Field 
                label="Teléfono 2" 
                value={g['Teléfono 2']}
                icon={Phone}
                mono
              />
            </div>
            <Field 
              label="Nombre y Apellido" 
              value={g['Nombre y Apellido_2']}
              icon={User}
            />
            <div className="grid grid-cols-2 gap-2">
              <Field 
                label="Documento" 
                value={g['Documento_2']}
                icon={FileText}
                mono
              />
              <Field 
                label="Parentesco" 
                value={g.Parentesco}
              />
            </div>
          </Section>

          {/* SECCIÓN 5: OTRA INFORMACIÓN (Columnas AC-AH) */}
          <Section 
            icon={FileCheck} 
            title="Autorizaciones y Documentos" 
            subtitle="Certificados y reglamento"
            color="text-gold"
          >
            <Field 
              label="Autoriza retiro solo" 
              value={g['Autorizo a que mi hijo(a) baje y/o retirarse solo(a) del gimnasio.']}
            />
            <Field 
              label="Forma de entrega del certificado" 
              value={g['Indicar como lo entregará']}
            />
            
            {g['Adjunto Certificado'] && typeof g['Adjunto Certificado'] === 'string' && g['Adjunto Certificado'].startsWith('http') && (
              <div className="bg-darkBg/50 rounded-lg p-2">
                <div className="text-[10px] text-gray-500 uppercase font-semibold mb-1">
                  Certificado Médico Adjunto
                </div>
                <a 
                  href={g['Adjunto Certificado']}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-gold text-xs font-semibold hover:underline"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Ver documento
                </a>
              </div>
            )}
            
            <Field 
              label="Aceptación del reglamento" 
              value={g['Acepto el reglamento de gimnasia artística(compartido por Whatsapp) y estoy en conocimiento de todos los puntos citados. (Acepto)']}
            />
          </Section>

          {/* SECCIÓN 6: DETALLES DE GIMNASTA (Columnas AJ-AN) */}
          <Section 
            icon={Award} 
            title="Detalles Deportivos" 
            subtitle="Categoría, nivel y grupo"
            color="text-gold"
          >
            <div className="grid grid-cols-2 gap-2">
              <Field 
                label="Categoría" 
                value={g.Categoria}
              />
              <Field 
                label="Nivel" 
                value={g.Nivel}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field 
                label="Status" 
                value={g.Status}
              />
              <Field 
                label="Federado" 
                value={g.Federados === 'TRUE' || g.Federados === true ? 'Sí' : 'No'}
              />
            </div>
            <Field 
              label="Grupo asignado" 
              value={nombreGrupo}
              icon={MapPin}
            />
          </Section>

          <div className="text-center pt-2 pb-4">
            <div className="text-[10px] text-gray-600">
              Registrado el {g['Submitted at']}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}