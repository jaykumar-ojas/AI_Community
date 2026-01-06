import { useState, useEffect } from 'react';
import { useNotification } from "../ContextProvider/NotificationContext";

export default function PromoBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    // Check if promo has been seen
    const promoSeen = localStorage.getItem('promoSeen');
    if (!promoSeen) {
      setIsVisible(true);
    }
    setIsMounted(true);
  }, []);

  const closeBanner = () => {
    setIsVisible(false);
    localStorage.setItem('promoSeen', 'true');
  };

  const copyCode = () => {
    navigator.clipboard.writeText('INITIAL300');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const claimCredits = () => {
    localStorage.setItem('promoSeen', 'true');
    showNotification('Promo code INITIALUSER300 copied.click on coin Icon and claim your 300 free credits!');
    copyCode();
    setIsVisible(false);
  };

  if (!isMounted || !isVisible) return null;

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(120%); }
          to { transform: translateX(-50%) translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        body {
          background: #050814;
          min-height: 200vh;
        }
      `}</style>

      {/* Banner */}
      <div className="fixed bottom-6 left-1/2 w-full max-w-3xl px-4 z-50 animate-slide-up">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border border-white/15 shadow-2xl"
             style={{
               background: 'rgba(255, 255, 255, 0.08)',
               backdropFilter: 'blur(18px)',
               WebkitBackdropFilter: 'blur(18px)'
             }}>
          
          {/* Left Section */}
          <div className="flex flex-col gap-1.5">
            <div className="text-base font-bold text-white">
              🎁 Claim 300 Free Credits
            </div>
            <div className="text-sm text-gray-300">
              Use the promo code below to start creating on Pixxelmind
            </div>
            
            {/* Code Box */}
            <div className="mt-1 inline-flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl border border-dashed border-white/25 text-sm"
                 style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
              <span className="font-bold tracking-wider text-white">INITIALUSER300</span>
              <button 
                onClick={copyCode}
                className="text-xs text-orange-300 hover:text-orange-400 bg-transparent border-0 cursor-pointer transition-colors"
              >
                {isCopied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between">
            <button 
              onClick={claimCredits}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-black border-0 cursor-pointer transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #ff7a18, #ffb347)' }}
            >
              Claim Now
            </button>
            <button 
              onClick={closeBanner}
              className="text-xl text-gray-400 hover:text-white bg-transparent border-0 cursor-pointer px-2 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </>
  );
}