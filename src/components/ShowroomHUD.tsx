import React from 'react';
import { Product, formatINR } from '../data/products';
import { Sparkles, ArrowRight } from 'lucide-react';

interface ShowroomHUDProps {
  hoveredProduct: Product | null;
  activeSectionTitle?: string;
}

export const ShowroomHUD: React.FC<ShowroomHUDProps> = ({
  hoveredProduct,
  activeSectionTitle,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-6">
      {/* Top Center: Current Section Banner */}
      <div className="self-center mt-14 text-center">
        {activeSectionTitle && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel-subtle text-[11px] font-mono tracking-[0.25em] text-[#d4af37] uppercase border border-[#d4af37]/30 shadow-lg animate-in fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
            <span>{activeSectionTitle}</span>
          </div>
        )}
      </div>

      {/* Center Subtle Boutique Reticle / Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
        <div
          className={`w-3 h-3 rounded-full border border-white/40 transition-all duration-300 ${
            hoveredProduct ? 'scale-150 border-[#d4af37] bg-[#d4af37]/20 shadow-lg' : 'opacity-40'
          }`}
        />
      </div>

      {/* Hover Garment Info Card Overlay */}
      <div className="self-center mb-24 transition-all duration-300">
        {hoveredProduct && (
          <div className="px-5 py-3 rounded-2xl glass-panel border border-[#d4af37]/50 shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-200">
            <div className="w-2.5 h-10 rounded-full bg-[#d4af37]" />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{hoveredProduct.name}</span>
                <span className="text-[10px] font-mono text-zinc-400">({hoveredProduct.subtitle})</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-[#d4af37] font-semibold">{formatINR(hoveredProduct.price)}</span>
                <span className="text-zinc-500">•</span>
                <span className="text-[11px] text-zinc-300 flex items-center gap-1 font-mono uppercase tracking-wider">
                  Click to inspect garment <ArrowRight className="w-3 h-3 text-[#d4af37]" />
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
