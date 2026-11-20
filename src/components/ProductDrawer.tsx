import React, { useState } from 'react';
import { Product, formatINR } from '../data/products';
import { X, RotateCcw, ShoppingBag, Check, ShieldCheck, Sparkles, Layers, Scissors, Info } from 'lucide-react';

interface ProductDrawerProps {
  product: Product | null;
  onClose: () => void;
  onOpen360: (product: Product, selectedColorHex: string) => void;
  onAddToBag: (product: Product, size: string, color: string) => void;
}

export const ProductDrawer: React.FC<ProductDrawerProps> = ({
  product,
  onClose,
  onOpen360,
  onAddToBag,
}) => {
  if (!product) return null;

  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[1] || product.sizes[0]);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const handleAdd = () => {
    onAddToBag(product, selectedSize, selectedColor.name);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md pointer-events-auto flex flex-col glass-panel shadow-2xl border-l border-white/10 transition-transform duration-500 ease-out animate-in slide-in-from-right">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#0d0e12]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono tracking-widest text-[#d4af37] uppercase">
            {product.sectionName}
          </span>
          {product.badge && (
            <span className="px-2 py-0.5 text-[9px] font-semibold tracking-wider text-black bg-[#d4af37] rounded-full">
              {product.badge}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition"
          aria-label="Close product details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable details */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Title & Price */}
        <div>
          <h2 className="text-2xl font-serif-luxury font-medium tracking-tight text-white">
            {product.name}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">{product.subtitle}</p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-light text-[#d4af37] tracking-tight">
              {formatINR(product.price)}
            </span>
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-mono">
              SKU: {product.sku}
            </span>
          </div>
        </div>

        {/* 360 Inspection CTA Button Banner */}
        <div className="relative group overflow-hidden rounded-xl border border-[#d4af37]/30 bg-gradient-to-r from-[#17181f] to-[#121318] p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#d4af37] tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                Interactive 3D Studio
              </div>
              <p className="text-xs text-zinc-400 max-w-[220px]">
                Inspect fabric weave, drape, 360° front & rear angles in high resolution.
              </p>
            </div>
            <button
              onClick={() => onOpen360(product, selectedColor.hex)}
              className="px-3.5 py-2.5 text-xs font-medium tracking-wider text-black bg-gradient-to-r from-[#d4af37] to-[#e6ca65] rounded-lg hover:brightness-110 active:scale-95 transition flex items-center gap-1.5 shadow-md font-display-luxury"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              360° VIEW
            </button>
          </div>
        </div>

        {/* Colorways */}
        <div className="space-y-2.5">
          <label className="text-xs font-mono uppercase tracking-widest text-zinc-400 flex items-center justify-between">
            <span>Colorway</span>
            <span className="text-zinc-200 font-sans font-medium">{selectedColor.name}</span>
          </label>
          <div className="flex items-center gap-3">
            {product.colors.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedColor(c)}
                className={`relative w-8 h-8 rounded-full transition-all duration-200 ${
                  selectedColor.name === c.name
                    ? 'ring-2 ring-[#d4af37] ring-offset-2 ring-offset-[#08080a] scale-110'
                    : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div className="space-y-2.5">
          <label className="text-xs font-mono uppercase tracking-widest text-zinc-400 flex items-center justify-between">
            <span>Available Sizes</span>
            <span className="text-[11px] text-[#d4af37] underline cursor-pointer hover:opacity-80">
              Size & Fit Guide
            </span>
          </label>
          <div className="grid grid-cols-6 gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className={`py-2 text-xs font-mono font-medium rounded-lg border transition ${
                  selectedSize === s
                    ? 'border-[#d4af37] bg-[#d4af37]/15 text-[#d4af37]'
                    : 'border-white/10 text-zinc-400 hover:border-white/20 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2 text-sm text-zinc-300 leading-relaxed font-light">
          <p>{product.description}</p>
        </div>

        {/* Fabric Breakdown Card */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#d4af37] flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" />
            Fabric & Atelier Specifications
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-zinc-500 block">Composition</span>
              <span className="text-zinc-300 font-medium">{product.fabricDetails.composition}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Fabric Weight</span>
              <span className="text-zinc-300 font-medium">{product.fabricDetails.weight}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Weave / Knit</span>
              <span className="text-zinc-300 font-medium">{product.fabricDetails.weave}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Treatment</span>
              <span className="text-zinc-300 font-medium">{product.fabricDetails.treatment}</span>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-zinc-500" />
            Architectural Construction
          </h4>
          <ul className="space-y-1.5 text-xs text-zinc-400">
            {product.features.map((feat, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] mt-1.5 shrink-0" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer / Add to Bag */}
      <div className="p-5 border-t border-white/10 bg-[#0d0e12] space-y-2">
        <button
          onClick={handleAdd}
          className={`w-full py-3.5 px-4 rounded-xl font-medium text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
            addedAnimation
              ? 'bg-emerald-600 text-white'
              : 'bg-[#d4af37] text-black hover:bg-[#e2bd46] active:scale-[0.99] font-display-luxury'
          }`}
        >
          {addedAnimation ? (
            <>
              <Check className="w-4 h-4" />
              Added to Wardrobe
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              Add to Wardrobe • {formatINR(product.price)}
            </>
          )}
        </button>
        <p className="text-[10px] text-center text-zinc-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-[#d4af37]" />
          Complimentary Luxury Shipping & 14-Day Returns Across India
        </p>
      </div>
    </div>
  );
};
