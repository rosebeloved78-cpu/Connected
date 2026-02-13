
import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export const InstallApp: React.FC<{ className?: string, mobile?: boolean }> = ({ className = "", mobile = false }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  if (mobile) {
    return (
        <button 
            onClick={handleInstallClick}
            className={`flex items-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl ${className}`}
        >
            <Download size={18} /> Install App
        </button>
    );
  }

  return (
    <button
      onClick={handleInstallClick}
      className={`flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-lg ${className}`}
    >
      <Download size={16} />
      <span>Get App</span>
    </button>
  );
};
