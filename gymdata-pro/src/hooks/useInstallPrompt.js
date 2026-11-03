import { useState, useEffect } from 'react';

export default function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.navigator.standalone; // iOS
      setIsInstalled(isStandalone || isFullscreen);
    };

    checkIfInstalled();

    // Escuchar evento de instalación disponible (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      
      // Mostrar banner después de 3 segundos (para no ser invasivo)
      const bannerShown = localStorage.getItem('installBannerShown');
      if (!bannerShown && !isInstalled) {
        setTimeout(() => {
          setShowBanner(true);
          localStorage.setItem('installBannerShown', 'true');
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar cuando se instala
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
      setIsInstallable(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Función para instalar (Android/Chrome)
  const handleInstall = async () => {
    if (!deferredPrompt) return false;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowBanner(false);
      return true;
    }
    return false;
  };

  // Cerrar banner
  const closeBanner = () => {
    setShowBanner(false);
    localStorage.setItem('installBannerDismissed', 'true');
  };

  return {
    isInstallable,
    isInstalled,
    showBanner,
    handleInstall,
    closeBanner,
    deferredPrompt
  };
}