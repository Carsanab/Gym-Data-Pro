// src/utils/imagenes.js
// Mapeo de nombres de usuario a rutas de imágenes en /public/entrenadores/

export const IMAGENES_ENTRENADORES = {
  'PROFE ANITA': '/entrenadores/Anita.jpg',
  'PROFE CONSTANZA': '/entrenadores/Coti.jpg',
  'PROFE JULI': '/entrenadores/Juli.jpg',
  'PROFE MACA': '/entrenadores/Maca.jpg',
  'PROFE MALE L.': '/entrenadores/Male L.jpg',
  'PROFE MALE O.': '/entrenadores/Male O.jpg',
  'PROFE MATI': '/entrenadores/Mati.jpg',
  'PROFE MELI': '/entrenadores/Meli.jpg',
  'PROFE VANE': '/entrenadores/Vane.jpg',
  'PROFE VICHU': '/entrenadores/Vichu.jpg',
  'PROFE OVA': '/entrenadores/Ova.jpg',
  'PROFE LUISINA': '/entrenadores/Luisina.png',
  'CARLOS SANABRIA': '/entrenadores/Carlos.jpeg',
};

// Función helper para obtener la imagen de un usuario
export const getImagenUsuario = (nombreUsuario) => {
  return IMAGENES_ENTRENADORES[nombreUsuario] || '/entrenadores/default.jpg';
};

// Componente reutilizable de Avatar
export const Avatar = ({ nombreUsuario, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };

  const imagen = getImagenUsuario(nombreUsuario);
  const inicial = nombreUsuario?.[0] || 'U';

  return (
    <img
      src={imagen}
      alt={nombreUsuario}
      className={`${sizes[size]} rounded-full object-cover border-2 border-gold/40 flex-shrink-0 bg-darkCard ${className}`}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = '/entrenadores/default.jpg';
      }}
    />
  );
};