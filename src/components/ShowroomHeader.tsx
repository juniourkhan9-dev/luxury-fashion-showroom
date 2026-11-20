import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Sun, 
  Moon, 
  Volume2, 
  VolumeX, 
  Sliders, 
  X, 
  Trash2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Product, formatINR } from '../data/products';
import confetti from 'canvas-confetti';

interface BagItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

interface ShowroomHeaderProps {
  lightsOn: boolean;
  onToggleLights: () => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  quality: 'high' | 'medium' | 'low';
  onQualityChange: (q: 'high' | 'medium' | 'low') => void;
  onExitShowroom: () => void;
  bagItems: BagItem[];
  onRemoveBagItem: (index: number) => void;
  onClearBag: () => void;
  onPrevItem?: () => void;
  onNextItem?: () => void;
  activeItemTitle?: string;
}

export const ShowroomHeader: React.FC<ShowroomHeaderProps> = ({
  lightsOn,
  onToggleLights,
  isAudioMuted,
  onToggleAudio,
  quality,
  onQualityChange,
  onExitShowroom,
  bagItems,
  onRemoveBagItem,
  onClearBag,
  onPrevItem,
  onNextItem,
  activeItemTitle,
}) => {
  const [showBag, setShowBag] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  const totalBagAmount = bagItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleCheckout = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ec4f18', '#222328', '#ffffff']
    });
    setCheckoutComplete(true);
    setTimeout(() => {
      setCheckoutComplete(false);
      onClearBag();
      setShowBag(false);
    }, 2800);
  };

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-6 py-4 pointer-events-none">
        {/* Left: Quick Exit / Website Return */}
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            onClick={onExitShowroom}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white text-xs font-sans font-medium transition shadow-sm border border-white/15 flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
            title="Return to store entrance"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </button>
        </div>

        {/* Center: NIKE VIRTUAL STORE (Exact Match to Reference Video!) */}
        <div className="pointer-events-auto flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-tight text-lg text-white font-sans">NIKE</span>
            <svg className="w-5 h-3 fill-white" viewBox="0 0 24 12">
              <path d="M2.5 7.5C7.5 10 16 8 22 2C18 5 13 6.5 9 6C5 5.5 3.5 4.5 2.5 7.5Z" />
            </svg>
          </div>
          <span className="text-[9px] font-sans tracking-[0.22em] text-zinc-400 uppercase font-semibold">
            VIRTUAL STORE
          </span>
        </div>

        {/* Right Action Icons: Light switch, Audio, Cart, Quality */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Light Switch Toggle */}
          <button
            onClick={onToggleLights}
            className={`p-2 rounded-full border transition-all duration-300 shadow-sm backdrop-blur-md cursor-pointer ${
              lightsOn 
                ? 'bg-white/15 border-white/20 text-amber-400 hover:bg-white/25' 
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
            }`}
            title={lightsOn ? 'Studio Spotlight (Click for Dim Luxury)' : 'Dim Luxury (Click for Studio Spotlight)'}
          >
            {lightsOn ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleAudio}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white border border-white/15 transition shadow-sm backdrop-blur-md cursor-pointer"
            title={isAudioMuted ? 'Turn Sound ON' : 'Turn Sound OFF'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Shopping Bag Button */}
          <button
            onClick={() => setShowBag(true)}
            className="relative px-3.5 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-sans font-medium transition shadow-md border border-white/15 flex items-center gap-2 cursor-pointer backdrop-blur-md"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bag</span>
            {bagItems.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#ec4f18] text-white text-[10px] font-bold flex items-center justify-center">
                {bagItems.length}
              </span>
            )}
          </button>

          {/* Quality Settings */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white border border-white/15 transition shadow-sm backdrop-blur-md cursor-pointer"
              title="Graphics Quality"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {showSettings && (
              <div className="absolute right-0 top-11 w-44 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/15 shadow-2xl p-3 text-xs space-y-2 text-zinc-200">
                <div className="font-semibold text-zinc-400 text-[10px] uppercase tracking-wider">
                  Graphics Quality
                </div>
                {(['high', 'medium', 'low'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      onQualityChange(q);
                      setShowSettings(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                      quality === q
                        ? 'bg-white text-black font-semibold'
                        : 'hover:bg-white/10 text-zinc-300'
                    }`}
                  >
                    {q} Mode
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Floating Rail Navigation Quick Arrow Controls (Left / Right) */}
      {onPrevItem && onNextItem && (
        <div className="fixed top-1/2 inset-x-4 -translate-y-1/2 pointer-events-none flex justify-between z-20">
          <button
            onClick={onPrevItem}
            aria-label="Previous Garment along Rail"
            className="pointer-events-auto w-10 h-10 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white shadow-lg border border-white/15 flex items-center justify-center backdrop-blur-md transition active:scale-95 cursor-pointer"
            title="Previous Garment (Left Arrow)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onNextItem}
            aria-label="Next Garment along Rail"
            className="pointer-events-auto w-10 h-10 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white shadow-lg border border-white/15 flex items-center justify-center backdrop-blur-md transition active:scale-95 cursor-pointer"
            title="Next Garment (Right Arrow)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Shopping Bag Drawer / Slide-Over */}
      {showBag && (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-auto bg-black/60 backdrop-blur-sm">
          <aside className="w-full max-w-md h-full bg-[#131418] border-l border-white/10 shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-300 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold font-sans">Your Shopping Bag ({bagItems.length})</h2>
              </div>
              <button
                onClick={() => setShowBag(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {bagItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-2">
                  <ShoppingBag className="w-12 h-12 stroke-[1.2] text-zinc-600" />
                  <p className="text-sm font-medium text-zinc-300">Your bag is empty.</p>
                  <p className="text-xs text-zinc-500">Click on any garment or bag in the showroom to inspect and add to your bag.</p>
                </div>
              ) : (
                bagItems.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-3.5 rounded-xl border border-white/10 bg-zinc-900/90">
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-300">
                      {item.size}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs text-white truncate">{item.product.name}</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Color: {item.color}</p>
                      <p className="text-xs font-bold text-amber-400 mt-1">{formatINR(item.product.price)}</p>
                    </div>
                    <button
                      onClick={() => onRemoveBagItem(idx)}
                      className="text-zinc-500 hover:text-red-400 transition p-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {bagItems.length > 0 && (
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-zinc-300">Total</span>
                  <span className="text-base font-bold text-white">{formatINR(totalBagAmount)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={checkoutComplete}
                  className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs uppercase tracking-wider font-bold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {checkoutComplete ? 'Order Placed!' : 'Checkout Now'}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
};
