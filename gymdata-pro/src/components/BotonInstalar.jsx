import { Download, Smartphone, X } from 'lucide-react';
import { useState } from 'react';

export default function BotonInstalar({ isInstallable, isInstalled, onInstall }) {
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Detectar si es iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Si ya está instalada, no mostrar nada
  if (isInstalled) return null;

  const handleClick = () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else if (isInstallable) {
      onInstall();
    } else {
      // Si no es instalable (ej: desktop), mostrar instrucciones
      setShowIOSInstructions(true);
    }
  };

  return (
    <>
      {/* Botón principal */}
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/30 text-gold text-xs font-semibold hover:bg-gold/20 transition"
        title="Descargar App"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Descargar App</span>
      </button>

      {/* Modal de instrucciones iOS */}
      {showIOSInstructions && (
        <div 
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
          onClick={() => setShowIOSInstructions(false)}
        >
          <div 
            className="bg-darkCard w-full max-w-sm rounded-2xl border border-gold/20 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-gold/20 to-transparent p-4 flex items-center justify-between border-b border-gold/20">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-gold" />
                <h3 className="font-bold text-gold">Instalar App</h3>
              </div>
              <button 
                onClick={() => setShowIOSInstructions(false)}
                className="p-1 rounded-lg hover:bg-darkBg text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-4 space-y-4">
              {isIOS ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                      <div>
                        <p className="text-sm text-white font-semibold">Abre el menú Compartir</p>
                        <p className="text-xs text-gray-400">Toca el ícono de compartir en Safari</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                      <div>
                        <p className="text-sm text-white font-semibold">"Agregar a pantalla de inicio"</p>
                        <p className="text-xs text-gray-400">Desplázate hacia abajo en el menú</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                      <div>
                        <p className="text-sm text-white font-semibold">Confirma el nombre</p>
                        <p className="text-xs text-gray-400">Toca "Agregar" en la esquina superior</p>
                      </div>
                    </div>
                  </div>

                  {/* Simulación visual del botón de compartir */}
                  <div className="bg-darkBg rounded-xl p-3 border border-gray-800">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold mb-2">Ícono de Compartir en Safari:</p>
                    <div className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span className="text-xs text-gray-400">Compartir</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <Smartphone className="w-12 h-12 text-gold mx-auto mb-3" />
                  <p className="text-sm text-gray-300 mb-2">
                    Para instalar la app, abre esta página en:
                  </p>
                  <ul className="text-xs text-gray-400 space-y-1 text-left">
                    <li>• <strong className="text-gold">Android:</strong> Chrome → Menú → "Agregar a pantalla principal"</li>
                    <li>• <strong className="text-gold">iOS:</strong> Safari → Compartir → "Agregar a pantalla de inicio"</li>
                    <li>• <strong className="text-gold">Desktop:</strong> Chrome/Edge → Ícono de instalación en la barra de direcciones</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}