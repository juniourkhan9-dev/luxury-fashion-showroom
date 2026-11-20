import React, { useState } from 'react';
import { WARDROBE_DATA } from '../data/wardrobeData';
import { X, ShoppingBag } from 'lucide-react';

export interface HangingGarmentItem {
  id: number;
  title: string;
  shortName: string;
  desc: string;
  price: string;
  priceNum: number;
}

export const HANGING_GARMENTS_LIST: HangingGarmentItem[] = [
  {
    id: 0,
    title: "VINTAGE WASHED HOODIE",
    shortName: "Hoodie",
    desc: "Faded Black • 480 GSM Heavy French Terry • Ribbed Trim",
    price: "$199.00",
    priceNum: 16499
  },
  {
    id: 1,
    title: "DOUBLE-BREASTED WOOL COAT",
    shortName: "Wool Coat",
    desc: "Midnight Navy • Tailored Italian Wool • Signature Horn Buttons",
    price: "$199.00",
    priceNum: 16499
  },
  {
    id: 2,
    title: "THANK GOD I'M AN ATHEIST HOODIE",
    shortName: "Hoodie",
    desc: "Heavyweight Slub Fleece • Signature Graphic Print",
    price: "$199.00",
    priceNum: 16499
  },
  {
    id: 3,
    title: "SAND FLEECE SWEATSHIRT",
    shortName: "Sweatshirt",
    desc: "Raw Natural Cotton • Minimalist Chest Logo • Ribbed Crewneck",
    price: "$199.00",
    priceNum: 16499
  },
  {
    id: 4,
    title: "FOREST GREEN HOODIE",
    shortName: "Hoodie",
    desc: "Deep Pine Dye • Dual Layer Hood • Heavyweight Ribbing",
    price: "$199.00",
    priceNum: 16499
  },
  {
    id: 5,
    title: "CLASSIC BLACK CREW TEE",
    shortName: "T-Shirt",
    desc: "Supima Cotton 240 GSM • High-Density Neckband",
    price: "$199.00",
    priceNum: 16499
  },
  {
    id: 6,
    title: "WASHED CHARCOAL HOODIE",
    shortName: "Hoodie",
    desc: "Sun-Bleached Pigment Wash • Relaxed Street Silhouette",
    price: "$199.00",
    priceNum: 16499
  },
  {
    id: 7,
    title: "ATHLETIC GREY HOODIE",
    shortName: "Hoodie",
    desc: "Minimalist Clean Front • Brushed Warm Interior",
    price: "$199.00",
    priceNum: 16499
  },
  {
    id: 8,
    title: "OATMEAL OVERSIZED SWEATSHIRT",
    shortName: "Sweatshirt",
    desc: "Soft Earth Tone • Custom Organic Terry Cotton",
    price: "$199.00",
    priceNum: 16499
  },
  {
    id: 9,
    title: "EMERALD HEAVY HOODIE",
    shortName: "Hoodie",
    desc: "Botanical Pigment Wash • Structured Warm Silhouette",
    price: "$199.00",
    priceNum: 16499
  }
];

interface HangingClothInteractiveRackProps {
  onAddToCart?: (item: HangingGarmentItem, size: string) => void;
}

export const HangingClothInteractiveRack: React.FC<HangingClothInteractiveRackProps> = ({
  onAddToCart,
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number>(2); // Default to item 2
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'front' | 'back'>('front');
  const [selectedSize, setSelectedSize] = useState<string>('S');
  const [addedAnimation, setAddedAnimation] = useState(false);

  const leftShiftDist = 55;
  const rightShiftDist = 55;

  const currentItem = HANGING_GARMENTS_LIST[activeIdx !== null ? activeIdx : selectedIdx];
  const modalItem = HANGING_GARMENTS_LIST[selectedIdx];
  const modalData = WARDROBE_DATA[`item_${selectedIdx}`];

  const handleClothClick = (idx: number) => {
    setSelectedIdx(idx);
    setModalTab('front');
    setModalOpen(true);
  };

  const handleAddToCartClick = () => {
    onAddToCart?.(modalItem, selectedSize);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      setModalOpen(false);
    }, 1200);
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center select-none pt-4 pb-2 z-20">
      {/* -----------------------------------------------------------------
          Main Wardrobe Rack Container (Exact code from Hanging Cloth Desktop app)
          ----------------------------------------------------------------- */}
      <div 
        className="relative w-full h-[390px] mx-auto overflow-visible"
        onMouseLeave={() => setActiveIdx(null)}
      >
        {/* Realistic Single Continuous Metallic Rod */}
        <div className="absolute top-[48px] left-0 right-0 h-[14px] z-10 pointer-events-none">
          {/* Left Mount */}
          <div 
            className="absolute top-[-16px] left-0 w-[22px] h-[44px] rounded-[3px] border border-[#737373] z-12 shadow-[0_4px_10px_rgba(0,0,0,0.22)]"
            style={{ background: 'linear-gradient(135deg, #dedede 0%, #adadad 50%, #7d7d7d 100%)' }}
          />
          {/* Metallic Rod Bar */}
          <div 
            className="absolute left-[12px] right-[12px] top-0 h-[12px] rounded-[6px] shadow-[0_8px_16px_rgba(0,0,0,0.12),inset_0_2px_2px_#fff]"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #dedede 25%, #8a8a8a 55%, #4e4e4e 85%, #333333 100%)'
            }}
          />
          {/* Right Mount */}
          <div 
            className="absolute top-[-16px] right-0 w-[22px] h-[44px] rounded-[3px] border border-[#737373] z-12 shadow-[0_4px_10px_rgba(0,0,0,0.22)]"
            style={{ background: 'linear-gradient(135deg, #dedede 0%, #adadad 50%, #7d7d7d 100%)' }}
          />
        </div>

        {/* 10 Hanging Clothes Track */}
        <div className="absolute top-[52px] left-[15px] right-[15px] h-[330px] flex justify-between items-start [perspective:1200px]">
          {HANGING_GARMENTS_LIST.map((garment, idx) => {
            const data = WARDROBE_DATA[`item_${idx}`];
            const isActive = activeIdx === idx;

            // Calculate exact smooth shift displacement
            let shiftX = 0;
            if (activeIdx !== null) {
              if (idx < activeIdx) {
                const distFactor = Math.max(0.6, 1 - (activeIdx - idx - 1) * 0.15);
                shiftX = -(leftShiftDist * distFactor);
              } else if (idx > activeIdx) {
                const distFactor = Math.max(0.6, 1 - (idx - activeIdx - 1) * 0.15);
                shiftX = rightShiftDist * distFactor;
              }
            }

            return (
              <div
                key={garment.id}
                onMouseEnter={() => {
                  setActiveIdx(idx);
                  setSelectedIdx(idx);
                }}
                onClick={() => handleClothClick(idx)}
                className={`relative w-[90px] h-[320px] flex justify-center items-start cursor-pointer transition-transform duration-[480ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
                  isActive ? 'z-50' : 'z-5'
                }`}
                style={{
                  transform: `translateX(${shiftX}px)`,
                }}
              >
                <div className="relative w-full h-full flex justify-center items-start">
                  {/* Side Face (Default View - Hanging sideways naturally) */}
                  <div
                    className="absolute top-0 left-1/2 pointer-events-none transition-all duration-[450ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
                    style={{
                      transform: isActive ? 'translateX(-50%) scale(0.95)' : 'translateX(-50%) scale(1)',
                      opacity: isActive ? 0 : 1,
                      zIndex: 2,
                    }}
                  >
                    <img
                      src={`data:image/png;base64,${data.side}`}
                      alt={garment.title}
                      className="block max-h-[265px] w-auto object-contain bg-transparent border-none shadow-none drop-shadow-[0_5px_7px_rgba(0,0,0,0.12)] pointer-events-none"
                    />
                  </div>

                  {/* Front Face (Revealed on Hover - Flips to face directly front!) */}
                  <div
                    className="absolute top-0 left-1/2 pointer-events-none transition-all duration-[480ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
                    style={{
                      transform: isActive ? 'translateX(-50%) scale(1.06)' : 'translateX(-50%) scale(0.92)',
                      opacity: isActive ? 1 : 0,
                      filter: isActive ? 'drop-shadow(0 20px 24px rgba(0,0,0,0.22))' : 'none',
                      zIndex: 3,
                    }}
                  >
                    <img
                      src={`data:image/png;base64,${data.front}`}
                      alt={garment.title}
                      className="block max-h-[270px] w-[180px] object-contain bg-transparent border-none shadow-none pointer-events-none"
                    />
                  </div>
                </div>

                {/* Ambient Floor Shadow under each garment */}
                <div
                  className="absolute bottom-[6px] left-1/2 -translate-x-1/2 rounded-full pointer-events-none transition-all duration-[450ms] ease-out"
                  style={{
                    width: isActive ? '125px' : '45px',
                    height: isActive ? '15px' : '9px',
                    background: isActive
                      ? 'radial-gradient(ellipse, rgba(0,0,0,0.28) 0%, transparent 70%)'
                      : 'radial-gradient(ellipse, rgba(0,0,0,0.18) 0%, transparent 70%)',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Info Bar Matching Hanging Cloth Reference */}
      <div className="w-full max-w-3xl bg-white/90 backdrop-blur-md border border-black/5 rounded-2xl px-6 py-3.5 flex items-center justify-between shadow-lg text-zinc-900 transition-all duration-300 mt-2">
        <div className="space-y-0.5">
          <h3 className="text-xs font-bold font-sans tracking-wide uppercase text-zinc-900">
            {currentItem.title}
          </h3>
          <p className="text-[11px] text-zinc-500 font-sans">
            {currentItem.desc}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-base font-extrabold font-sans text-zinc-900">
            {currentItem.price}
          </span>
          <button
            onClick={() => handleClothClick(activeIdx !== null ? activeIdx : selectedIdx)}
            className="px-4 py-2 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-bold font-sans uppercase tracking-wider transition shadow-md cursor-pointer"
          >
            View Details
          </button>
        </div>
      </div>

      {/* -----------------------------------------------------------------
          Product Details Modal (Exact match to Hanging Cloth Modal)
          ----------------------------------------------------------------- */}
      {modalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="relative bg-white w-full max-w-3xl min-h-[460px] rounded-3xl shadow-2xl p-8 sm:p-10 flex flex-col sm:flex-row gap-8 items-center font-sans animate-in zoom-in-95 duration-300 text-zinc-900">
            {/* Close Button Top Right */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-6 text-sm font-semibold text-zinc-400 hover:text-black transition cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Column: Big Product Image */}
            <div className="flex-1 flex items-center justify-center">
              <img
                src={`data:image/png;base64,${modalData.front}`}
                alt={modalItem.title}
                className="max-h-[340px] w-auto object-contain drop-shadow-[0_16px_22px_rgba(0,0,0,0.18)] transition-transform duration-300"
                style={{
                  transform: modalTab === 'back' ? 'scaleX(-1)' : 'scaleX(1)',
                }}
              />
            </div>

            {/* Right Column: Details & Size Controls */}
            <div className="flex-1 flex flex-col justify-center space-y-4 w-full">
              <div>
                <div className="text-xs font-mono text-zinc-400 tracking-wider font-semibold">
                  {String(selectedIdx + 1).padStart(2, '0')} / 10
                </div>
                <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight mt-1">
                  {modalItem.shortName}
                </h2>
                <div className="text-xl font-bold text-zinc-900 mt-1">
                  {modalItem.price}
                </div>
              </div>

              {/* Front / Back View Toggle Tabs */}
              <div className="flex gap-4 border-b border-zinc-100 pb-2">
                <button
                  onClick={() => setModalTab('front')}
                  className={`text-xs font-semibold pb-1 border-b-2 transition cursor-pointer ${
                    modalTab === 'front' ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-black'
                  }`}
                >
                  Front View
                </button>
                <button
                  onClick={() => setModalTab('back')}
                  className={`text-xs font-semibold pb-1 border-b-2 transition cursor-pointer ${
                    modalTab === 'back' ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-black'
                  }`}
                >
                  Back View
                </button>
              </div>

              {/* Size Selector */}
              <div>
                <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Select Size
                </div>
                <div className="flex gap-2.5">
                  {['S', 'M', 'L', 'XL'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border transition cursor-pointer ${
                        selectedSize === size
                          ? 'bg-black text-white border-black shadow-md'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:border-black'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCartClick}
                disabled={addedAnimation}
                className="w-full py-3.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {addedAnimation ? (
                  <span>✓ Added ({selectedSize}) to Bag!</span>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Bag</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-[11px] text-zinc-400 flex items-center justify-between border-t border-zinc-100">
                <span>{modalItem.title}</span>
                <span className="font-semibold text-zinc-700">In Stock</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
