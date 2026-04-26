import { motion } from 'motion/react';
import { COLORS, NAIL_SHAPES, PARTS, TEXTURES, ARTS, NailDesign } from '../constants';
import { Pipette, Shapes, Sparkles, Camera as CameraIcon, Upload, Wand2, Ruler, Loader2, MousePointer2 } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { generateNailDesign, extractDesignFromImage } from '../services/geminiService';

interface ControlPanelProps {
  design: NailDesign;
  onUpdate: (updates: Partial<NailDesign>) => void;
  onSnapshot: () => void;
}

export default function ControlPanel({ design, onUpdate, onSnapshot }: ControlPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'fitting'>('design');
  const [colorTab, setColorTab] = useState<'base' | 'tip'>('tip');
  const [selectedFinger, setSelectedFinger] = useState<number>(0); // 0: thumb, 1: index, etc.
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fingerNames = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];

  const updateFingerColor = (color: string) => {
    const updatedFingers = { ...design.individualFingers };
    const current = updatedFingers[selectedFinger] || {
      color: design.color,
      baseColor: design.baseColor,
      parts: [],
      length: design.length,
      widthScale: design.widthScale,
      anchorOffset: design.anchorOffset,
      sizeScale: design.sizeScale,
    };

    updatedFingers[selectedFinger] = {
      ...current,
      [colorTab === 'base' ? 'baseColor' : 'color']: color,
    };
    onUpdate({ individualFingers: updatedFingers });
  };

  const updateFingerSize = (key: 'length' | 'widthScale' | 'anchorOffset' | 'sizeScale', value: number) => {
    const updatedFingers = { ...design.individualFingers };
    const current = updatedFingers[selectedFinger] || {
      color: design.color,
      baseColor: design.baseColor,
      parts: [],
      length: 1.0,
      widthScale: 1.0,
      anchorOffset: 0,
      sizeScale: 1.0,
    };

    updatedFingers[selectedFinger] = {
      ...current,
      [key]: value
    };
    onUpdate({ individualFingers: updatedFingers });
  };

  const handleAIDesign = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const updates = await generateNailDesign(prompt);
      onUpdate(updates);
      setPrompt("");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setIsGenerating(true);
        try {
          const updates = await extractDesignFromImage(base64);
          onUpdate(updates);
        } finally {
          setIsGenerating(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/95 backdrop-blur-xl border-l border-black/10 overflow-hidden">
      {/* Tab Switcher */}
      <div className="flex border-b border-black/5 shrink-0">
        <button 
          onClick={() => setActiveTab('design')}
          className={`flex-1 py-4 text-[10px] uppercase tracking-widest font-bold transition-all ${
            activeTab === 'design' ? 'bg-black text-white' : 'bg-transparent text-black/40 hover:text-black'
          }`}
        >
          스튜디오
        </button>
        <button 
          onClick={() => setActiveTab('fitting')}
          className={`flex-1 py-4 text-[10px] uppercase tracking-widest font-bold transition-all ${
            activeTab === 'fitting' ? 'bg-black text-white' : 'bg-transparent text-black/40 hover:text-black'
          }`}
        >
          기능 정렬
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
        {activeTab === 'design' ? (
          <>
            {/* Header */}
            <div className="flex justify-between items-end mb-4">
              <div className="space-y-1">
              </div>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 bg-black/5 rounded-full hover:bg-black/10 transition-colors"
              >
                <Upload size={16} />
              </motion.button>
              <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileUpload} />
            </div>

            {/* AI Prompt Section */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold opacity-40">
                <Wand2 size={12} className="text-purple-600" />
                <span>AI 디자인 추천</span>
              </div>
              <div className="flex gap-2">
                <input 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="원하는 스타일을 설명하세요..."
                  className="flex-1 bg-black/5 px-4 py-2.5 text-xs outline-none border border-transparent focus:border-black/10 rounded-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleAIDesign()}
                />
                <button 
                  disabled={isGenerating}
                  onClick={handleAIDesign}
                  className="px-4 bg-black text-white disabled:opacity-50 rounded-sm"
                >
                  {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                </button>
              </div>
            </section>

            {/* Shape Selection */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold opacity-40">
                <Shapes size={12} />
                <span>네일 모양</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {NAIL_SHAPES.map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => onUpdate({ shape: shape.id })}
                    className={`py-3 text-[10px] uppercase font-black tracking-tight border rounded-sm transition-all ${
                      design.shape === shape.id ? 'bg-black text-white border-black' : 'bg-transparent border-black/10 hover:border-black/30'
                    }`}
                  >
                    {shape.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Mode Switcher */}
            <section className="space-y-4 p-4 bg-black/[0.03] rounded-sm border border-black/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">손가락별 개별 색상</span>
                <button 
                  onClick={() => onUpdate({ useIndividual: !design.useIndividual })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${design.useIndividual ? 'bg-black' : 'bg-black/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${design.useIndividual ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              {design.useIndividual && (
                <div className="space-y-4 pt-2 border-t border-black/5">
                  <div className="flex gap-1 overflow-x-auto no-scrollbar">
                    {fingerNames.map((name, i) => {
                      const korNames = ['엄지', '검지', '중지', '약지', '소지'];
                      return (
                        <button
                          key={name}
                          onClick={() => setSelectedFinger(i)}
                          className={`px-3 py-1.5 text-[8px] uppercase tracking-tighter rounded-full border shrink-0 transition-all ${
                            selectedFinger === i ? 'bg-black text-white border-black' : 'bg-white text-black/40 border-black/5'
                          }`}
                        >
                          {korNames[i]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Color Selection */}
            <section className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold opacity-40">
                  <div className="flex items-center gap-2">
                    <Pipette size={12} />
                    <span>{design.useIndividual ? `${['엄지', '검지', '중지', '약지', '소지'][selectedFinger]} 색상` : '전체 색상'}</span>
                  </div>
                  <input 
                    type="color" 
                    value={
                      design.useIndividual 
                        ? (colorTab === 'base' ? (design.individualFingers[selectedFinger]?.baseColor || design.baseColor) : (design.individualFingers[selectedFinger]?.color || design.color)) 
                        : (colorTab === 'base' ? design.baseColor : design.color)
                    } 
                    onChange={(e) => {
                      if (design.useIndividual) {
                        updateFingerColor(e.target.value);
                      } else {
                        onUpdate({ [colorTab === 'base' ? 'baseColor' : 'color']: e.target.value });
                      }
                    }} 
                    className="w-5 h-5 rounded-full overflow-hidden border-none p-0 cursor-pointer" 
                  />
                </div>

                {design.art === 'french' && (
                  <div className="flex p-0.5 bg-black/5 rounded-sm">
                    <button 
                      onClick={() => setColorTab('base')}
                      className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-tighter transition-all ${colorTab === 'base' ? 'bg-white shadow-sm' : 'opacity-40'}`}
                    >
                      바탕 색상 (Base)
                    </button>
                    <button 
                      onClick={() => setColorTab('tip')}
                      className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-tighter transition-all ${colorTab === 'tip' ? 'bg-white shadow-sm' : 'opacity-40'}`}
                    >
                      프렌치 색상 (Tip)
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-9 gap-1.5">
                {COLORS.map((color) => {
                  let active = false;
                  if (design.useIndividual) {
                    active = colorTab === 'base' 
                      ? (design.individualFingers[selectedFinger]?.baseColor === color)
                      : (design.individualFingers[selectedFinger]?.color === color);
                  } else {
                    active = colorTab === 'base' ? design.baseColor === color : design.color === color;
                  }
                  
                  return (
                    <button
                      key={color}
                      onClick={() => {
                        if (design.useIndividual) {
                          updateFingerColor(color);
                        } else {
                          onUpdate({ [colorTab === 'base' ? 'baseColor' : 'color']: color });
                        }
                      }}
                      className={`w-full aspect-square rounded-full border border-black/5 transition-transform hover:scale-110 active:scale-95 ${
                        active ? 'ring-1 ring-black ring-offset-1' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  );
                })}
              </div>
            </section>

            {/* Design & Finish Section */}
            <section className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold opacity-40">
                  <Sparkles size={12} />
                  <span>텍스처 및 마감</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {TEXTURES.map((tex) => (
                    <button
                      key={tex.id}
                      onClick={() => onUpdate({ texture: tex.id })}
                      className={`py-3 px-2 flex flex-col items-center gap-1.5 border rounded-sm transition-all ${
                        design.texture === tex.id ? 'bg-black text-white border-black' : 'bg-transparent border-black/10 hover:border-black/30'
                      }`}
                    >
                      <span className="text-xl">{tex.icon}</span>
                      <span className="text-[10px] uppercase font-black tracking-tight text-center leading-none">{tex.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold opacity-40">
                  <Wand2 size={12} />
                  <span>아트 디자인</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ARTS.map((art) => (
                    <button
                      key={art.id}
                      onClick={() => onUpdate({ art: art.id })}
                      className={`py-3 px-2 flex flex-col items-center gap-1.5 border rounded-sm transition-all ${
                        design.art === art.id ? 'bg-black text-white border-black' : 'bg-transparent border-black/10 hover:border-black/30'
                      }`}
                    >
                      <span className="text-xl">{art.icon}</span>
                      <span className="text-[10px] uppercase font-black tracking-tight text-center leading-none">{art.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Decorations */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold opacity-40">
                <Sparkles size={12} />
                <span>장식 (파츠)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PARTS.map((part) => {
                  const active = design.parts.includes(part.id);
                  return (
                    <button
                      key={part.id}
                      onClick={() => {
                        const newParts = active ? design.parts.filter(p => p !== part.id) : [...design.parts, part.id];
                        onUpdate({ parts: newParts });
                      }}
                      className={`px-4 py-2.5 rounded-full border text-[9px] uppercase font-black flex items-center gap-2 transition-all ${
                        active ? 'bg-black text-white border-black' : 'bg-white text-black border-black/10 hover:bg-black/5'
                      }`}
                    >
                      <span className="text-xs">{part.icon}</span>
                      <span>{part.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <div className="space-y-10">
            <div className="space-y-2">
              <h3 className="font-serif text-xl italic tracking-tight text-black/80">정렬 및 보정</h3>
              <p className="text-[9px] text-black/40 font-mono uppercase tracking-[0.2em]">AR 렌즈 정밀 보정</p>
            </div>

            <section className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">
                  <div className="flex items-center gap-2"><Ruler size={10} /><span>전체 크기</span></div>
                  <span>{(design.sizeScale * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="0.5" max="2.0" step="0.01" 
                  value={design.sizeScale} 
                  onChange={(e) => onUpdate({ sizeScale: parseFloat(e.target.value) })}
                  className="w-full accent-black h-1 bg-black/10 rounded-full appearance-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">
                  <div className="flex items-center gap-2"><Ruler size={10} /><span>길이 연장</span></div>
                  <span>{(design.length).toFixed(1)}x</span>
                </div>
                <input 
                  type="range" min="0.5" max="2.5" step="0.05" 
                  value={design.length} 
                  onChange={(e) => onUpdate({ length: parseFloat(e.target.value) })}
                  className="w-full accent-black h-1 bg-black/10 rounded-full appearance-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">
                  <div className="flex items-center gap-2"><Shapes size={10} /><span>너비 조절</span></div>
                  <span>{(design.widthScale * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="0.5" max="2.0" step="0.01" 
                  value={design.widthScale} 
                  onChange={(e) => onUpdate({ widthScale: parseFloat(e.target.value) })}
                  className="w-full accent-black h-1 bg-black/10 rounded-full appearance-none"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[9px] uppercase font-bold tracking-[0.2em] opacity-40">
                  <div className="flex items-center gap-2"><MousePointer2 size={10} /><span>수직 위치</span></div>
                  <span>{(design.anchorOffset * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="-0.5" max="1.0" step="0.01" 
                  value={design.anchorOffset} 
                  onChange={(e) => onUpdate({ anchorOffset: parseFloat(e.target.value) })}
                  className="w-full accent-black h-1 bg-black/10 rounded-full appearance-none"
                />
              </div>
            </section>

            {/* Individual Adjustment Section (Moved from Design tab) */}
            <section className="space-y-4 p-4 bg-black/[0.03] rounded-sm border border-black/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">손톱별 개별 크기 조절</span>
                <button 
                  onClick={() => onUpdate({ useIndividual: !design.useIndividual })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${design.useIndividual ? 'bg-black' : 'bg-black/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${design.useIndividual ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              {design.useIndividual && (
                <div className="space-y-6 pt-4 border-t border-black/5">
                  <div className="flex gap-1 overflow-x-auto no-scrollbar">
                    {fingerNames.map((name, i) => {
                      const korNames = ['엄지', '검지', '중지', '약지', '소지'];
                      return (
                        <button
                          key={name}
                          onClick={() => setSelectedFinger(i)}
                          className={`px-3 py-1.5 text-[8px] uppercase tracking-tighter rounded-full border shrink-0 transition-all ${
                            selectedFinger === i ? 'bg-black text-white border-black' : 'bg-white text-black/40 border-black/5'
                          }`}
                        >
                          {korNames[i]}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-2">
                       <div className="flex justify-between text-[8px] uppercase font-bold tracking-widest opacity-40">
                         <span>개별 전체 크기</span>
                         <span>{((design.individualFingers[selectedFinger]?.sizeScale ?? design.sizeScale) * 100).toFixed(0)}%</span>
                       </div>
                       <input 
                        type="range" min="0.5" max="2.0" step="0.01" 
                        value={design.individualFingers[selectedFinger]?.sizeScale ?? design.sizeScale} 
                        onChange={(e) => updateFingerSize('sizeScale', parseFloat(e.target.value))}
                        className="w-full accent-black h-1 bg-black/10 rounded-full appearance-none"
                      />
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[8px] uppercase font-bold tracking-widest opacity-40">
                         <span>개별 길이</span>
                         <span>{(design.individualFingers[selectedFinger]?.length ?? design.length).toFixed(1)}x</span>
                       </div>
                       <input 
                        type="range" min="0.5" max="2.5" step="0.05" 
                        value={design.individualFingers[selectedFinger]?.length ?? design.length} 
                        onChange={(e) => updateFingerSize('length', parseFloat(e.target.value))}
                        className="w-full accent-black h-1 bg-black/10 rounded-full appearance-none"
                      />
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[8px] uppercase font-bold tracking-widest opacity-40">
                         <span>개별 너비</span>
                         <span>{((design.individualFingers[selectedFinger]?.widthScale ?? design.widthScale) * 100).toFixed(0)}%</span>
                       </div>
                       <input 
                        type="range" min="0.5" max="2.0" step="0.01" 
                        value={design.individualFingers[selectedFinger]?.widthScale ?? design.widthScale} 
                        onChange={(e) => updateFingerSize('widthScale', parseFloat(e.target.value))}
                        className="w-full accent-black h-1 bg-black/10 rounded-full appearance-none"
                      />
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[8px] uppercase font-bold tracking-widest opacity-40">
                         <span>개별 수직 위치</span>
                         <span>{((design.individualFingers[selectedFinger]?.anchorOffset ?? design.anchorOffset) * 100).toFixed(0)}%</span>
                       </div>
                       <input 
                        type="range" min="-0.5" max="1.0" step="0.01" 
                        value={design.individualFingers[selectedFinger]?.anchorOffset ?? design.anchorOffset} 
                        onChange={(e) => updateFingerSize('anchorOffset', parseFloat(e.target.value))}
                        className="w-full accent-black h-1 bg-black/10 rounded-full appearance-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="p-4 bg-black/[0.03] rounded-sm border border-black/5 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider opacity-40">
                <Wand2 size={12} />
                <span>팁</span>
              </div>
              <p className="text-[9px] leading-relaxed opacity-40 font-medium">
                뿌리 오프셋을 조절하여 실제 손톱 뿌리에 맞추세요. 길이는 위쪽으로만 연장됩니다.
              </p>
            </section>
          </div>
        )}
      </div>

      {/* Snapshot Action - REDUCED SIZE */}
      <div className="p-6 border-t border-black/5 bg-white shrink-0">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onSnapshot}
          className="w-full py-3 bg-black text-white flex items-center justify-center gap-2 rounded-sm shadow-lg transition-shadow"
        >
          <CameraIcon size={14} />
          <span className="text-[10px] uppercase tracking-[0.4em] font-black">사진 촬영 및 꾸미기 시작</span>
        </motion.button>
      </div>
    </div>
  );
}
