import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, RotateCcw, Palette, Eraser, Download, Star, Heart, Square, Circle } from 'lucide-react';

interface NailStudioProps {
  image: string;
  onClose: () => void;
}

type BrushShape = 'line' | 'circle' | 'square' | 'star' | 'heart';

export default function NailStudio({ image, onClose }: NailStudioProps) {
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#FF1493');
  const [brushSize, setBrushSize] = useState(15);
  const [mode, setMode] = useState<'brush' | 'eraser'>('brush');
  const [brushShape, setBrushShape] = useState<BrushShape>('line');

  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas || !bgImageRef.current) return;
    
    // Set drawing canvas resolution to match image
    const img = bgImageRef.current;
    const updateSize = () => {
      canvas.width = img.naturalWidth || 1280;
      canvas.height = img.naturalHeight || 720;
    };

    if (img.complete) {
      updateSize();
    } else {
      img.onload = updateSize;
    }
  }, [image]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    const clientX = ('touches' in e) ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = ('touches' in e) ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Scale factor to map client coords to internal canvas resolution
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    
    return { x, y };
  };

  const drawShape = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, shape: BrushShape) => {
    ctx.beginPath();
    switch (shape) {
      case 'circle':
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        break;
      case 'square':
        ctx.rect(x - size / 2, y - size / 2, size, size);
        break;
      case 'star': {
        const spikes = 5;
        const outerRadius = size / 2;
        const innerRadius = size / 4;
        let rot = (Math.PI / 2) * 3;
        let step = Math.PI / spikes;

        ctx.moveTo(x, y - outerRadius);
        for (let i = 0; i < spikes; i++) {
          ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius);
          rot += step;
          ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius);
          rot += step;
        }
        ctx.lineTo(x, y - outerRadius);
        break;
      }
      case 'heart': {
        const d = size / 2;
        ctx.moveTo(x, y + d / 4);
        ctx.bezierCurveTo(x, y, x - d, y, x - d, y + d / 2);
        ctx.bezierCurveTo(x - d, y + d, x, y + d * 1.25, x, y + d * 1.5);
        ctx.bezierCurveTo(x, y + d * 1.25, x + d, y + d, x + d, y + d / 2);
        ctx.bezierCurveTo(x + d, y, x, y, x, y + d / 4);
        break;
      }
    }
    ctx.fill();
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    setIsDrawing(true);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalCompositeOperation = mode === 'eraser' ? 'destination-out' : 'source-over';

    if (brushShape === 'line' || mode === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    } else {
      drawShape(ctx, coords.x, coords.y, brushSize, brushShape);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);

    if (brushShape === 'line' || mode === 'eraser') {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    } else {
      drawShape(ctx, coords.x, coords.y, brushSize, brushShape);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearDrawing = () => {
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const exportArt = () => {
    const dCanvas = drawingCanvasRef.current;
    const img = bgImageRef.current;
    if (!dCanvas || !img) return;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = dCanvas.width;
    outCanvas.height = dCanvas.height;
    const outCtx = outCanvas.getContext('2d');
    
    if (outCtx) {
      outCtx.drawImage(img, 0, 0, outCanvas.width, outCanvas.height);
      outCtx.drawImage(dCanvas, 0, 0);
      
      const link = document.createElement('a');
      link.download = `nail-art-${Date.now()}.png`;
      link.href = outCanvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col font-sans">
      {/* Absolute Overlay Buttons */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
        <button 
          onClick={onClose} 
          className="p-3 bg-black/40 backdrop-blur-xl border border-white/20 text-white rounded-full transition-all hover:scale-110 active:scale-95"
        >
          <X size={24} />
        </button>
      </div>

      <div className="absolute top-6 right-6 z-20 flex gap-3">
        <button 
          onClick={clearDrawing} 
          className="flex items-center gap-2 px-5 py-2.5 bg-black/40 backdrop-blur-xl border border-white/20 text-white rounded-full text-xs font-bold hover:bg-black/60 transition-colors"
        >
          <RotateCcw size={16} />
          <span>지우기</span>
        </button>
        <button 
          onClick={exportArt} 
          className="flex items-center gap-2 px-8 py-2.5 bg-white text-black rounded-full text-sm font-black shadow-2xl hover:bg-neutral-200 transition-colors"
        >
          <Download size={18} />
          <span>완성!</span>
        </button>
      </div>

      {/* Viewport - Fullscreen Photo + Drawing Overlay */}
      <div className="flex-1 relative bg-zinc-950 flex items-center justify-center overflow-hidden">
        <div className="relative max-w-full max-h-full">
          <img 
            ref={bgImageRef}
            src={image} 
            alt="Base"
            className="max-w-full max-h-[calc(100vh-140px)] object-contain select-none shadow-2xl"
          />
          <canvas
            ref={drawingCanvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
          />
        </div>
      </div>

      {/* Tool Dock */}
      <div className="px-8 py-8 bg-white border-t border-black/5 flex flex-col gap-8 shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.1)]">
        <div className="max-w-6xl mx-auto w-full flex flex-wrap items-center justify-between gap-x-12 gap-y-6">
          
          {/* Main Modes */}
          <div className="flex bg-neutral-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => setMode('brush')}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl transition-all text-sm font-black ${mode === 'brush' ? 'bg-black text-white shadow-lg' : 'text-black/40 hover:text-black'}`}
            >
              <Palette size={18} />
              <span>그리기</span>
            </button>
            <button 
              onClick={() => { setMode('eraser'); setBrushShape('line'); }}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl transition-all text-sm font-black ${mode === 'eraser' ? 'bg-black text-white shadow-lg' : 'text-black/40 hover:text-black'}`}
            >
              <Eraser size={18} />
              <span>지우개</span>
            </button>
          </div>

          {/* Shapes / Brush Style */}
          {mode === 'brush' && (
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-black tracking-widest text-black/20">STYLE</span>
              <div className="flex gap-2 p-1.5 bg-neutral-100 rounded-2xl">
                {[
                  { id: 'line', icon: <div className="w-4 h-0.5 bg-current rounded-full" /> },
                  { id: 'circle', icon: <Circle size={16} fill="currentColor" /> },
                  { id: 'square', icon: <Square size={16} fill="currentColor" /> },
                  { id: 'star', icon: <Star size={16} fill="currentColor" /> },
                  { id: 'heart', icon: <Heart size={16} fill="currentColor" /> }
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setBrushShape(s.id as BrushShape)}
                    className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${brushShape === s.id ? 'bg-white text-black shadow-sm' : 'text-black/30 hover:text-black'}`}
                  >
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {mode === 'brush' && (
            <div className="flex items-center gap-3">
              <div className="flex gap-2.5">
                {['#FF1493', '#FF4500', '#FFD700', '#32CD32', '#00CED1', '#4169E1', '#8A2BE2', '#000000', '#FFFFFF'].map(c => (
                  <button
                    key={c}
                    onClick={() => { setColor(c); setMode('brush'); }}
                    className={`w-8 h-8 rounded-full border border-black/5 transition-transform hover:scale-125 active:scale-90 ${color === c ? 'ring-2 ring-black ring-offset-2' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <div className="relative w-8 h-8 group">
                  <input 
                    type="color" 
                    value={color} 
                    onChange={(e) => { setColor(e.target.value); setMode('brush'); }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-rose-400 via-fuchsia-500 to-indigo-500 border border-black/5 group-hover:scale-125 transition-transform" />
                </div>
              </div>
            </div>
          )}

          {/* Size Slider */}
          <div className="flex items-center gap-5 min-w-[240px] flex-1 max-w-sm">
             <span className="text-[11px] font-black tracking-widest text-black/20">SIZE</span>
             <input 
              type="range" min="1" max="150" value={brushSize} 
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="flex-1 accent-black h-1 bg-black/10 rounded-full appearance-none cursor-pointer"
            />
            <span className="text-[12px] font-black w-8 text-right tabular-nums">{brushSize}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
