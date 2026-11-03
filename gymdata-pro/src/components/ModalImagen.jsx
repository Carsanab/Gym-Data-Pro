import { X, ZoomIn } from 'lucide-react';
import { getImagenUsuario } from '../utils/imagenes.jsx';

export default function ModalImagen({ nombreUsuario, onClose }) {
  if (!nombreUsuario) return null;
  
  const imagen = getImagenUsuario(nombreUsuario);

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      {/* Botón cerrar */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-darkCard/80 text-white hover:bg-darkCard transition z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Contenedor de imagen */}
      <div 
        className="relative max-w-3xl max-h-[90vh] w-full flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        {/* Nombre del usuario */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gold">{nombreUsuario}</h3>
          <p className="text-xs text-gray-400 mt-1">Foto de perfil</p>
        </div>

        {/* Imagen grande */}
        <div className="relative group">
          <img
            src={imagen}
            alt={nombreUsuario}
            className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border-4 border-gold/30"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/entrenadores/default.jpg';
            }}
          />
          
          {/* Overlay con ícono de zoom al hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100">
            <ZoomIn className="w-12 h-12 text-white drop-shadow-lg" />
          </div>
        </div>

        {/* Instrucción */}
        <p className="text-xs text-gray-500 mt-4">
          Haz clic fuera de la imagen o en la ✕ para cerrar
        </p>
      </div>
    </div>
  );
}