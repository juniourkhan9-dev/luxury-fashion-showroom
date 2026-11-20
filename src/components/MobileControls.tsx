import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

interface MobileControlsProps {
  onMoveChange: (vec: THREE.Vector2) => void;
  onLookDelta: (dx: number, dy: number) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMoveChange,
  onLookDelta,
}) => {
  const joystickContainerRef = useRef<HTMLDivElement>(null);
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const [stickOffset, setStickOffset] = useState({ x: 0, y: 0 });

  // Right touch surface for looking around
  const lookTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Left Joystick Logic
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsJoystickActive(true);
    handleJoystickMove(e.touches[0]);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isJoystickActive) return;
    handleJoystickMove(e.touches[0]);
  };

  const handleJoystickMove = (touch: React.Touch) => {
    if (!joystickContainerRef.current) return;
    const rect = joystickContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const maxRadius = rect.width / 2;

    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const stickX = Math.cos(angle) * clampedDist;
    const stickY = Math.sin(angle) * clampedDist;

    setStickOffset({ x: stickX, y: stickY });

    // Normalize -1 to +1
    const normX = stickX / maxRadius;
    const normY = stickY / maxRadius;
    onMoveChange(new THREE.Vector2(normX, -normY));
  };

  const handleJoystickTouchEnd = () => {
    setIsJoystickActive(false);
    setStickOffset({ x: 0, y: 0 });
    onMoveChange(new THREE.Vector2(0, 0));
  };

  // Right Look Swipe Logic
  const handleLookTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    lookTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookTouchMove = (e: React.TouchEvent) => {
    if (!lookTouchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - lookTouchStartRef.current.x;
    const dy = touch.clientY - lookTouchStartRef.current.y;

    onLookDelta(dx * 1.5, dy * 1.5);
    lookTouchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookTouchEnd = () => {
    lookTouchStartRef.current = null;
  };

  return (
    <div className="md:hidden fixed inset-0 pointer-events-none z-30 select-none">
      {/* Left Touch Joystick (Walk WASD) */}
      <div className="absolute left-6 bottom-24 pointer-events-auto">
        <div
          ref={joystickContainerRef}
          onTouchStart={handleJoystickTouchStart}
          onTouchMove={handleJoystickTouchMove}
          onTouchEnd={handleJoystickTouchEnd}
          className="relative w-28 h-28 rounded-full border border-white/20 bg-black/40 backdrop-blur-md flex items-center justify-center shadow-xl active:border-[#d4af37]/60"
        >
          {/* Virtual Thumb Stick */}
          <div
            className="w-12 h-12 rounded-full bg-[#d4af37]/80 border border-white/30 shadow-lg transition-transform duration-75"
            style={{
              transform: `translate(${stickOffset.x}px, ${stickOffset.y}px)`,
            }}
          />
        </div>
        <p className="text-[9px] font-mono text-center text-zinc-400 mt-1 uppercase tracking-widest">
          WALK
        </p>
      </div>

      {/* Right Look Swipe Area */}
      <div
        onTouchStart={handleLookTouchStart}
        onTouchMove={handleLookTouchMove}
        onTouchEnd={handleLookTouchEnd}
        className="absolute right-0 top-20 bottom-24 w-1/2 pointer-events-auto flex items-end justify-end p-6"
      >
        <div className="px-3 py-1.5 rounded-full glass-panel-subtle text-[10px] font-mono text-zinc-400 border border-white/10 opacity-60">
          SWIPE TO LOOK
        </div>
      </div>
    </div>
  );
};
