import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useHandTracking } from './hooks/useHandTracking';
import ControlPanel from './components/ControlPanel';
import NailCanvas from './components/NailCanvas';
import NailStudio from './components/NailStudio';
import { NailDesign } from './constants';
import { Loader2, Zap, RefreshCw } from 'lucide-react';

export default function App() {
  const { videoRef, results, isLoaded, error } = useHandTracking();
  const [design, setDesign] = useState<NailDesign>({
    color: '#D4B59E',
    baseColor: '#f3cfc6',
    shape: 'almond',
    texture: 'glossy',
    art: 'none',
    length: 1.0,
    widthScale: 1.0,
    anchorOffset: 0.0,
    sizeScale: 1.0,
    parts: [],
    individualFingers: {},
    useIndividual: false,
  });

  const [studioImage, setStudioImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const startSnapshotTimer = () => {
    if (countdown !== null) return;
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      triggerCapture();
      setCountdown(null);
    }
  }, [countdown]);

  const triggerCapture = () => {
    if (!videoRef.current) return;
    
    // Capture the current feed including nails
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw mirrored video for selfie mode
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // 2. Overlay nails from the AR canvas
      const mainCanvas = document.querySelector('canvas');
      if (mainCanvas) {
        // Draw the AR canvas scaled to match the video capture resolution
        ctx.drawImage(mainCanvas, 0, 0, mainCanvas.width, mainCanvas.height, 0, 0, canvas.width, canvas.height);
      }
      
      setStudioImage(canvas.toDataURL('image/png'));
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#f5f2ed] overflow-hidden">
      {/* Main Viewport */}
      <main className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {/* Loading Overlay */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8 text-center gap-6"
            >
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                <Zap size={40} className="text-red-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-white font-serif text-2xl italic">카메라 접근 권한이 필요합니다</h2>
                <p className="text-white/60 text-sm max-w-xs leading-relaxed">
                  가상 네일 서비스를 이용하시려면 브라우저 설정에서 카메라 권한을 허용해 주세요.
                </p>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-full text-sm font-bold hover:bg-neutral-200 transition-colors"
              >
                <RefreshCw size={16} />
                <span>다시 시도하기</span>
              </button>
            </motion.div>
          )}

          {!isLoaded && !error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-[#f5f2ed] flex flex-col items-center justify-center gap-6"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 border border-black/5 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                    <Loader2 size={24} className="text-[#f5f2ed] animate-spin" />
                  </div>
                </div>
              </div>
              <div className="text-center space-y-1">
                <h1 className="font-serif text-2xl italic tracking-tight">시스템 초기화 중</h1>
                <p className="text-[10px] font-mono tracking-widest opacity-40 uppercase">손동작 추적 엔진을 보정하고 있습니다...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover grayscale-[0.2] contrast-[1.1] -scale-x-100"
          autoPlay
          playsInline
          muted
        />

        {/* Countdown Overlay */}
        <AnimatePresence>
          {countdown !== null && countdown > 0 && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              key="countdown"
              className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
            >
              <span className="text-[120px] font-black text-white drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                {countdown}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AR Overlay */}
        <NailCanvas 
          results={results} 
          design={design} 
          videoRef={videoRef} 
        />

      </main>

      {/* Control Sidebar */}
      <aside className="w-full md:w-[400px] h-full z-40 relative">
        <ControlPanel 
          design={design} 
          onUpdate={(updates) => setDesign(prev => ({ ...prev, ...updates }))}
          onSnapshot={startSnapshotTimer}
        />
      </aside>

      {/* Nail Art Studio Modal */}
      <AnimatePresence>
        {studioImage && (
          <NailStudio 
            image={studioImage} 
            onClose={() => setStudioImage(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
