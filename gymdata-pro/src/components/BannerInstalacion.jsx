import { X, Download, Smartphone } from 'lucide-react';

export default function BannerInstalacion({ onInstall, onClose, isIOS }) {
  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slideUp">
      <div className="bg-gradient-to-r from-gold/90 to-goldDark/90 backdrop-blur-lg rounded-2xl p-4 shadow-2xl border border-gold/50">
        <div className="flex items-start gap-3">
          {/* Ícono */}
          <div className="bg-darkBg/20 p-2 rounded-xl flex-shrink-0">
            {isIOS ? (
              <Smartphone className="w-6 h-6 text-darkBg" />
            ) : (
              <Download className="w-6 h-6 text-darkBg" />
            )}
          </div>

          {/* Texto */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-darkBg text-sm mb-1">
              {isIOS ? 'Agregar a pantalla de inicio' : 'Instalar GymData Pro'}
            </h3>
            <p className="text-xs text-darkBg/80 leading-tight">
              {isIOS 
                ? 'Toca Compartir → "Agregar a pantalla de inicio" para usar como app'
                : 'Instala la app para acceso rápido y uso sin navegador'}
            </p>
            
            {/* Botón de acción */}
            {!isIOS && (
              <button
                onClick={onInstall}
                className="mt-2 bg-darkBg text-gold text-xs font-bold px-4 py-2 rounded-lg hover:bg-darkCard transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar App
              </button>
            )}
          </div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-darkBg/20 transition flex-shrink-0"
          >
            <X className="w-4 h-4 text-darkBg" />
          </button>
        </div>
      </div>
    </div>
  );
}