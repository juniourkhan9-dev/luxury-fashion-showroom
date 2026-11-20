import React from 'react';
import { 
  Lightbulb, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Maximize, 
  Unlock, 
  Compass, 
  Sparkles,
  Sliders
} from 'lucide-react';

interface ShowroomControlMenuProps {
  isPointerLocked: boolean;
  lightsOn: boolean;
  isAudioMuted: boolean;
  fps: number;
  quality: 'high' | 'medium' | 'low';
  onTogglePointerLock: () => void;
  onToggleLights: () => void;
  onToggleAudio: () => void;
  onOpenHelp: () => void;
  onOpenQualitySettings: () => void;
}

export const ShowroomControlMenu: React.FC<ShowroomControlMenuProps> = ({
  isPointerLocked,
  lightsOn,
  isAudioMuted,
  fps,
  quality,
  onTogglePointerLock,
  onToggleLights,
  onToggleAudio,
  onOpenHelp,
  onOpenQualitySettings,
}) => {
  return (
    <>
      {/* Floating Active Pointer Lock Banner (prominently visible when mouse is locked) */}
      {isPointerLocked && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in fade-in slide-in-from-top-2">
          <button
            onClick={onTogglePointerLock}
            className="px-5 py-2.5 rounded-full bg-[#d4af37] text-black font-mono text-xs font-bold tracking-wider uppercase shadow-2xl flex items-center gap-2 hover:bg-[#e6ca65] active:scale-95 transition border-2 border-black"
          >
            <Unlock className="w-4 h-4" />
            <span>PRESS ESC OR CLICK TO UNLOCK MOUSE</span>
          </button>
        </div>
      )}

      {/* Floating Luxury Control Menu Bar */}
      <nav 
        aria-label="Showroom Controls"
        className="fixed top-20 left-6 z-40 pointer-events-auto flex items-center gap-2 p-1.5 rounded-2xl glass-panel shadow-2xl border border-white/10 backdrop-blur-xl"
      >
        {/* 1. Immersive Look / Unlock Mouse Toggle */}
        <button
          onClick={onTogglePointerLock}
          className={`px-3 py-2 rounded-xl text-xs font-mono tracking-wider uppercase transition flex items-center gap-2 ${
            isPointerLocked
              ? 'bg-[#d4af37] text-black font-bold shadow-md'
              : 'text-zinc-300 hover:text-white hover:bg-white/10 border border-white/5'
          }`}
          title={isPointerLocked ? 'Click or press ESC to unlock mouse' : 'Enable full 360° mouse look (Press ESC anytime to exit)'}
        >
          {isPointerLocked ? (
            <>
              <Unlock className="w-3.5 h-3.5" />
              <span>UNLOCK MOUSE</span>
            </>
          ) : (
            <>
              <Maximize className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="hidden sm:inline">IMMERSIVE LOOK</span>
            </>
          )}
        </button>

        {/* 2. Real Lighting Switch Button */}
        <button
          onClick={onToggleLights}
          className={`px-3 py-2 rounded-xl text-xs font-mono tracking-wider uppercase transition flex items-center gap-2 ${
            lightsOn
              ? 'bg-white/10 text-white border border-[#d4af37]/50'
              : 'bg-black/40 text-zinc-400 hover:text-white border border-white/5'
          }`}
          title="Toggle showroom spotlights and ceiling lighting"
        >
          <Lightbulb className={`w-3.5 h-3.5 ${lightsOn ? 'text-[#d4af37] drop-shadow-[0_0_8px_#d4af37]' : 'text-zinc-500'}`} />
          <span className="flex items-center gap-1.5">
            <span>LIGHTS</span>
            <span className={`w-2 h-2 rounded-full ${lightsOn ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'}`} />
          </span>
        </button>

        {/* 3. Audio Toggle */}
        <button
          onClick={onToggleAudio}
          className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition"
          title={isAudioMuted ? 'Turn on ambient sound' : 'Mute sound'}
          aria-label="Toggle sound"
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-[#d4af37]" />}
        </button>

        {/* 4. Help & Keyboard Controls Guide */}
        <button
          onClick={onOpenHelp}
          className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition"
          title="Navigation instructions & controls"
          aria-label="Show help"
        >
          <HelpCircle className="w-4 h-4 text-zinc-300" />
        </button>

        {/* 5. Measured FPS Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/30 border border-white/5 text-[10px] font-mono text-zinc-400">
          <span className={`w-1.5 h-1.5 rounded-full ${fps >= 50 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span>{fps} FPS</span>
        </div>
      </nav>
    </>
  );
};
