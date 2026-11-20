import React, { useEffect, useRef, useState } from 'react';
import { Product, formatINR } from '../data/products';
import { ProductStudio360 } from '../three/ProductStudio360';
import { 
  X, 
  RotateCw, 
  Camera, 
  Maximize2, 
  Compass, 
  Eye, 
  Layers, 
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';

interface InspectionModal360Props {
  product: Product | null;
  initialColorHex?: string;
  onClose: () => void;
}

export const InspectionModal360: React.FC<InspectionModal360Props> = ({
  product,
  initialColorHex,
  onClose,
}) => {
  if (!product) return null;

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const studioRef = useRef<ProductStudio360 | null>(null);

  const [selectedColor, setSelectedColor] = useState(
    product.colors.find((c) => c.hex === initialColorHex) || product.colors[0]
  );
  const [activeAngle, setActiveAngle] = useState<'front' | 'back' | 'left' | 'right' | 'top'>('front');
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [showSpecs, setShowSpecs] = useState(true);
  const [snapshotTaken, setSnapshotTaken] = useState(false);

  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const studio = new ProductStudio360(canvasContainerRef.current, product, selectedColor.hex);
    studioRef.current = studio;

    return () => {
      studio.dispose();
      studioRef.current = null;
    };
  }, [product]);

  // Handle color swatch change
  const handleColorChange = (color: typeof product.colors[0]) => {
    setSelectedColor(color);
    studioRef.current?.setColor(color.hex);
  };

  // View angle preset
  const handleSetAngle = (angle: 'front' | 'back' | 'left' | 'right' | 'top') => {
    setActiveAngle(angle);
    setIsAutoRotating(false);
    studioRef.current?.setViewAngle(angle);
  };

  const handleToggleAutoRotate = () => {
    const next = !isAutoRotating;
    setIsAutoRotating(next);
    if (studioRef.current) {
      studioRef.current.autoRotate = next;
    }
  };

  const handleReset = () => {
    setIsAutoRotating(true);
    setActiveAngle('front');
    studioRef.current?.setViewAngle('reset');
  };

  const handleCaptureSnapshot = () => {
    if (!studioRef.current) return;
    const dataUrl = studioRef.current.captureSnapshot();
    const link = document.createElement('a');
    link.download = `${product.id}-360-view.png`;
    link.href = dataUrl;
    link.click();
    setSnapshotTaken(true);
    setTimeout(() => setSnapshotTaken(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
      {/* 3D Studio Canvas Viewport */}
      <div ref={canvasContainerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Header Overlay */}
      <header className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-6 py-5 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <div className="pointer-events-auto space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest text-[#d4af37] uppercase">
              360° ATELIER INSPECTION STUDIO
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-xs text-zinc-300 font-serif-luxury text-base tracking-wide">
              {product.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-light text-[#d4af37]">
              {formatINR(product.price)}
            </span>
            <span className="text-xs text-zinc-400">
              Colorway: <strong className="text-white">{selectedColor.name}</strong>
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            onClick={handleCaptureSnapshot}
            className="px-3 py-2 text-xs font-mono tracking-wider rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition flex items-center gap-2 backdrop-blur-md"
            title="Download high-resolution render"
          >
            <Camera className="w-4 h-4 text-[#d4af37]" />
            <span>{snapshotTaken ? 'SAVED' : 'SNAPSHOT'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/15 border border-white/10 transition backdrop-blur-md"
            aria-label="Return to showroom"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Left Bottom: Camera Presets & Control Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3 pointer-events-auto">
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl glass-panel shadow-2xl border border-white/15">
          <button
            onClick={() => handleSetAngle('front')}
            className={`px-3 py-1.5 text-xs font-mono rounded-xl transition ${
              activeAngle === 'front' && !isAutoRotating
                ? 'bg-[#d4af37] text-black font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            FRONT
          </button>
          <button
            onClick={() => handleSetAngle('left')}
            className={`px-3 py-1.5 text-xs font-mono rounded-xl transition ${
              activeAngle === 'left' && !isAutoRotating
                ? 'bg-[#d4af37] text-black font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            LEFT PROFILE
          </button>
          <button
            onClick={() => handleSetAngle('back')}
            className={`px-3 py-1.5 text-xs font-mono rounded-xl transition ${
              activeAngle === 'back' && !isAutoRotating
                ? 'bg-[#d4af37] text-black font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            REAR
          </button>
          <button
            onClick={() => handleSetAngle('right')}
            className={`px-3 py-1.5 text-xs font-mono rounded-xl transition ${
              activeAngle === 'right' && !isAutoRotating
                ? 'bg-[#d4af37] text-black font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            RIGHT PROFILE
          </button>
          <button
            onClick={() => handleSetAngle('top')}
            className={`px-3 py-1.5 text-xs font-mono rounded-xl transition ${
              activeAngle === 'top' && !isAutoRotating
                ? 'bg-[#d4af37] text-black font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            TOP DOWN
          </button>

          <div className="w-[1px] h-5 bg-white/15 mx-1" />

          {/* Auto rotate toggle */}
          <button
            onClick={handleToggleAutoRotate}
            className={`px-3 py-1.5 text-xs font-mono rounded-xl flex items-center gap-1.5 transition ${
              isAutoRotating
                ? 'bg-white/15 text-[#d4af37] border border-[#d4af37]/40'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
            AUTO 360°
          </button>

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="px-2.5 py-1.5 text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition"
            title="Reset default view"
          >
            RESET
          </button>
        </div>

        <p className="text-[11px] font-mono text-zinc-400 tracking-wider flex items-center gap-2">
          <span>DRAG TO ORBIT 360°</span>
          <span>•</span>
          <span>SCROLL TO ZOOM IN CLOSE FOR FABRIC WEAVE</span>
        </p>
      </div>

      {/* Left Side: Live Colorway Selector */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3 p-3 rounded-2xl glass-panel border border-white/10 pointer-events-auto shadow-2xl">
        <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest writing-vertical rotate-180 mb-1">
          SWATCHES
        </span>
        {product.colors.map((c) => (
          <button
            key={c.name}
            onClick={() => handleColorChange(c)}
            className={`relative w-7 h-7 rounded-full transition-all duration-200 ${
              selectedColor.name === c.name
                ? 'ring-2 ring-[#d4af37] ring-offset-2 ring-offset-black scale-110 shadow-lg'
                : 'opacity-70 hover:opacity-100 hover:scale-105'
            }`}
            style={{ backgroundColor: c.hex }}
            title={c.name}
          />
        ))}
      </div>

      {/* Right Side: Fabric Specifications Drawer Overlay */}
      <div className="absolute right-6 top-24 z-20 pointer-events-auto hidden md:block">
        <div className="w-80 rounded-2xl glass-panel border border-white/10 p-5 space-y-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#d4af37] flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              Fabric Specifications
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">100% AUTHENTIC</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-zinc-500 block text-[11px]">Material Composition</span>
              <span className="text-zinc-200 font-medium">{product.fabricDetails.composition}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">Fabric Weight / Density</span>
              <span className="text-[#d4af37] font-mono font-medium">{product.fabricDetails.weight}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">Weave & Construction</span>
              <span className="text-zinc-200 font-medium">{product.fabricDetails.weave}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">Wash Treatment</span>
              <span className="text-zinc-200 font-medium">{product.fabricDetails.treatment}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[11px]">Garment Care</span>
              <span className="text-zinc-400 font-light">{product.fabricDetails.care}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <button
              onClick={onClose}
              className="w-full py-2.5 px-3 text-xs font-mono tracking-wider rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition text-center"
            >
              RETURN TO SHOWROOM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
