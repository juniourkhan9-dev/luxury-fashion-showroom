import React, { useEffect, useRef, useState } from 'react';
import { ShowroomScene } from './three/ShowroomScene';
import { Product, PRODUCTS } from './data/products';
import { ShowroomHeader } from './components/ShowroomHeader';
import { ShowroomControlMenu } from './components/ShowroomControlMenu';
import { ShowroomHUD } from './components/ShowroomHUD';
import { ProductDrawer } from './components/ProductDrawer';
import { InspectionModal360 } from './components/InspectionModal360';
import { NavigationDock, STORE_SECTIONS, StoreSectionTab } from './components/NavigationDock';
import { WalkController } from './components/WalkController';
import { 
  HangingClothInteractiveRack, 
  HangingGarmentItem 
} from './components/HangingClothInteractiveRack';
import { 
  Sparkles, 
  ArrowRight, 
  Eye, 
  Footprints, 
  ShieldCheck, 
  Lightbulb, 
  Unlock, 
  Info,
  Check,
  X
} from 'lucide-react';

interface BagItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

export function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ShowroomScene | null>(null);

  // Application State
  const [hasEntered, setHasEntered] = useState(true);
  const [fps, setFps] = useState(60);
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');

  // Pointer lock state tracking
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  // Lighting state
  const [lightsOn, setLightsOn] = useState(true);

  // Audio state
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  // Help / Info Modal state
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Navigation Spot & Product Selection
  const [activeTab, setActiveTab] = useState<StoreSectionTab>('Clothing');
  const [hoveredProduct, setHoveredProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeRailGarment, setActiveRailGarment] = useState<Product | null>(null);

  // 360 Studio Inspection State
  const [inspectionProduct, setInspectionProduct] = useState<Product | null>(null);
  const [inspectionColorHex, setInspectionColorHex] = useState<string | undefined>(undefined);

  // Bag State
  const [bagItems, setBagItems] = useState<BagItem[]>([]);

  // Web Audio Ambient Sound Player
  useEffect(() => {
    let ctx: AudioContext | null = null;
    let osc1: OscillatorNode | null = null;
    let osc2: OscillatorNode | null = null;
    let gainNode: GainNode | null = null;

    if (!isAudioMuted) {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioCtx(ctx);

      gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.012, ctx.currentTime);
      gainNode.connect(ctx.destination);

      osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(110, ctx.currentTime);
      osc1.connect(gainNode);
      osc1.start();

      osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(164.81, ctx.currentTime);
      osc2.connect(gainNode);
      osc2.start();
    } else {
      if (audioCtx) {
        audioCtx.close();
        setAudioCtx(null);
      }
    }

    return () => {
      if (ctx && ctx.state !== 'closed') {
        ctx.close();
      }
    };
  }, [isAudioMuted]);

  // Initialize 3D Showroom Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const showroom = new ShowroomScene(containerRef.current, {
      onProductSelect: (prod) => {
        showroom.exitPointerLock();
        setSelectedProduct(prod);
      },
      onProductHover: (prod) => {
        setHoveredProduct(prod);
      },
      onActiveGarmentChange: (prod) => {
        setActiveRailGarment(prod);
      },
      onFpsUpdate: (measuredFps) => {
        setFps(measuredFps);
      },
      onPointerLockChange: (locked) => {
        setIsPointerLocked(locked);
      },
      onLightsToggle: (newLightsOn) => {
        setLightsOn(newLightsOn);
      },
    });

    sceneRef.current = showroom;

    return () => {
      showroom.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Pointer Lock Toggle
  const handleTogglePointerLock = () => {
    if (!sceneRef.current) return;
    if (isPointerLocked) {
      sceneRef.current.exitPointerLock();
    } else {
      sceneRef.current.requestPointerLock();
    }
  };

  // Light Switch Toggle
  const handleToggleLights = () => {
    if (!sceneRef.current) return;
    sceneRef.current.toggleLights();
  };

  // Quality switch handler
  const handleQualityChange = (q: 'high' | 'medium' | 'low') => {
    setQuality(q);
    sceneRef.current?.setQuality(q);
  };

  // Section Tab Selection handler (Store / Clothing / Caps / Bags / Shoes)
  const handleSelectTab = (tab: StoreSectionTab) => {
    setActiveTab(tab);
    const targetSpot = STORE_SECTIONS.find((s) => s.id === tab);
    if (targetSpot && sceneRef.current) {
      sceneRef.current.travelToSpot(targetSpot.cameraPos, targetSpot.cameraTarget);
    }
  };

  // Open 360 Inspection
  const handleOpen360 = (prod: Product, colorHex: string) => {
    sceneRef.current?.exitPointerLock();
    setInspectionProduct(prod);
    setInspectionColorHex(colorHex);
  };

  // Exit Showroom back to welcome overlay
  const handleExitShowroom = () => {
    sceneRef.current?.exitPointerLock();
    setHasEntered(false);
  };

  // On-screen walk controller handlers
  const handleStartMove = (dir: 'forward' | 'backward' | 'left' | 'right') => {
    if (!sceneRef.current) return;
    if (dir === 'forward') sceneRef.current.moveForward = true;
    if (dir === 'backward') sceneRef.current.moveBackward = true;
    if (dir === 'left') sceneRef.current.moveLeft = true;
    if (dir === 'right') sceneRef.current.moveRight = true;
  };

  const handleStopMove = (dir: 'forward' | 'backward' | 'left' | 'right') => {
    if (!sceneRef.current) return;
    if (dir === 'forward') sceneRef.current.moveForward = false;
    if (dir === 'backward') sceneRef.current.moveBackward = false;
    if (dir === 'left') sceneRef.current.moveLeft = false;
    if (dir === 'right') sceneRef.current.moveRight = false;
  };

  // Add to Bag
  const handleAddToBag = (product: Product, size: string, color: string) => {
    setBagItems((prev) => {
      const existing = prev.find(
        (i) => i.product.id === product.id && i.size === size && i.color === color
      );
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, size, color, quantity: 1 }];
    });
  };

  // Add to Bag from the Hanging Cloth Simulation
  const handleHangingClothAddToCart = (item: HangingGarmentItem, size: string) => {
    const dummyProduct: Product = {
      id: `hanging-${item.id}`,
      name: item.title,
      subtitle: item.desc,
      price: item.priceNum,
      category: 'Clothing',
      sectionName: 'WALL CLOTHING RAIL',
      garmentType: 'colorblock-hoodie',
      description: item.desc,
      fabricDetails: {
        composition: '100% Heavy French Terry Cotton',
        weight: '480 GSM Heavyweight Fleece',
        weave: 'Loopback Terry',
        treatment: 'Vintage Washed',
        care: 'Machine Wash Cold',
      },
      colors: [{ name: 'Default', hex: '#222222' }],
      sizes: ['S', 'M', 'L', 'XL'],
      sku: `HNG-0${item.id}`,
      features: ['Ribbed cuffs and hem', 'Reinforced seams', 'Hanging collection']
    };
    handleAddToBag(dummyProduct, size, 'Original');
  };

  const handleRemoveBagItem = (index: number) => {
    setBagItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearBag = () => {
    setBagItems([]);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1c1e26] text-white select-none">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* NIKE Virtual Store Header */}
      <ShowroomHeader
        lightsOn={lightsOn}
        onToggleLights={handleToggleLights}
        isAudioMuted={isAudioMuted}
        onToggleAudio={() => setIsAudioMuted(!isAudioMuted)}
        quality={quality}
        onQualityChange={handleQualityChange}
        onExitShowroom={handleExitShowroom}
        bagItems={bagItems}
        onRemoveBagItem={handleRemoveBagItem}
        onClearBag={handleClearBag}
      />

      {/* Navigation Dock removed as requested */}

      {/* Product Details Drawer (For other 3D items: Bags, Shoes, Caps) */}
      <ProductDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onOpen360={handleOpen360}
        onAddToBag={handleAddToBag}
      />

      {/* 360-Degree Studio Inspection Modal */}
      {inspectionProduct && (
        <InspectionModal360
          product={inspectionProduct}
          initialColorHex={inspectionColorHex}
          onClose={() => setInspectionProduct(null)}
        />
      )}

      {/* Info Modal ('i' Button or Help) */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-6 animate-in fade-in">
          <div className="bg-[#16171c] border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base font-sans text-white">Store Experience Guide</h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-zinc-400">
              <div>
                <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <Footprints className="w-4 h-4 text-amber-400" />
                  Navigation & Walking Speed
                </h4>
                <p>
                  Use <strong className="text-zinc-200">W / S</strong> or your <strong className="text-zinc-200">Mouse Wheel</strong> for gentle forward and backward walking. Use <strong className="text-zinc-200">A / D</strong> to step sideways. Walking speed is tuned for calm, luxury browsing.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-amber-400" />
                  360° Mouse Look & Cursor Release
                </h4>
                <p>
                  Click and drag anywhere on screen to look around. Press <strong className="text-zinc-200">ESC</strong> anytime to release the cursor. Your mouse is never trapped.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Real Hanging Clothes Simulation
                </h4>
                <p>
                  Clothes hang realistically on the metallic rail. Move your mouse over any garment to watch it <strong className="text-zinc-200">flip to the front</strong>, while neighboring clothes <strong className="text-zinc-200">smoothly shift left and right</strong>! Click on any garment to open the full view with size selection and Add to Bag.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  Studio Lighting Switch
                </h4>
                <p>
                  Toggle between pristine studio gallery lighting and moody dim evening lighting with the light switch in the top header.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase tracking-wider transition shadow-md cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
