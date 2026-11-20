import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Compass } from 'lucide-react';

interface WalkControllerProps {
  onStartMove: (direction: 'forward' | 'backward' | 'left' | 'right') => void;
  onStopMove: (direction: 'forward' | 'backward' | 'left' | 'right') => void;
}

export const WalkController: React.FC<WalkControllerProps> = ({
  onStartMove,
  onStopMove,
}) => {
  return (
    <div className="fixed bottom-24 left-6 z-30 pointer-events-auto select-none">
      <div className="p-3 rounded-2xl glass-panel border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-1 text-[9px] font-mono tracking-widest text-[#d4af37] uppercase mb-0.5">
          <Compass className="w-3 h-3 text-[#d4af37]" />
          <span>WALK CONTROLS</span>
        </div>

        {/* Forward (Aage) Button */}
        <button
          onMouseDown={() => onStartMove('forward')}
          onMouseUp={() => onStopMove('forward')}
          onMouseLeave={() => onStopMove('forward')}
          onTouchStart={(e) => { e.preventDefault(); onStartMove('forward'); }}
          onTouchEnd={(e) => { e.preventDefault(); onStopMove('forward'); }}
          className="w-12 h-10 rounded-xl bg-white/10 hover:bg-[#d4af37] hover:text-black active:scale-95 text-zinc-300 transition flex flex-col items-center justify-center border border-white/10 group cursor-pointer shadow-md"
          title="Walk Forward (W / Arrow Up / Wheel Up)"
        >
          <ChevronUp className="w-5 h-5 group-hover:scale-110 transition" />
          <span className="text-[7px] font-bold font-mono tracking-wider">AAGE</span>
        </button>

        {/* Left / Right / Backward Row */}
        <div className="flex items-center gap-1.5">
          {/* Strafe Left */}
          <button
            onMouseDown={() => onStartMove('left')}
            onMouseUp={() => onStopMove('left')}
            onMouseLeave={() => onStopMove('left')}
            onTouchStart={(e) => { e.preventDefault(); onStartMove('left'); }}
            onTouchEnd={(e) => { e.preventDefault(); onStopMove('left'); }}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#d4af37] hover:text-black active:scale-95 text-zinc-300 transition flex items-center justify-center border border-white/10 cursor-pointer shadow-md"
            title="Strafe Left (A / Arrow Left)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Backward (Piche) Button */}
          <button
            onMouseDown={() => onStartMove('backward')}
            onMouseUp={() => onStopMove('backward')}
            onMouseLeave={() => onStopMove('backward')}
            onTouchStart={(e) => { e.preventDefault(); onStartMove('backward'); }}
            onTouchEnd={(e) => { e.preventDefault(); onStopMove('backward'); }}
            className="w-12 h-10 rounded-xl bg-white/10 hover:bg-[#d4af37] hover:text-black active:scale-95 text-zinc-300 transition flex flex-col items-center justify-center border border-white/10 group cursor-pointer shadow-md"
            title="Walk Backward (S / Arrow Down / Wheel Down)"
          >
            <span className="text-[7px] font-bold font-mono tracking-wider">PICHE</span>
            <ChevronDown className="w-5 h-5 group-hover:scale-110 transition" />
          </button>

          {/* Strafe Right */}
          <button
            onMouseDown={() => onStartMove('right')}
            onMouseUp={() => onStopMove('right')}
            onMouseLeave={() => onStopMove('right')}
            onTouchStart={(e) => { e.preventDefault(); onStartMove('right'); }}
            onTouchEnd={(e) => { e.preventDefault(); onStopMove('right'); }}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#d4af37] hover:text-black active:scale-95 text-zinc-300 transition flex items-center justify-center border border-white/10 cursor-pointer shadow-md"
            title="Strafe Right (D / Arrow Right)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="text-[8px] font-mono text-zinc-400 tracking-wider text-center mt-0.5">
          W / S • MOUSE WHEEL
        </div>
      </div>
    </div>
  );
};
