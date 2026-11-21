import * as THREE from 'three';
import { gsap } from 'gsap';
import { PRODUCTS, Product } from '../data/products';
import { 
  createGarmentAssembly, 
  hangerWoodMaterial, 
  silverHookMaterial, 
  gunmetalHardwareMaterial 
} from './GarmentFactory';
import { HANGING_GARMENTS_LIST } from '../data/hangingWardrobeData';
import { WARDROBE_DATA } from '../data/wardrobeData';

export interface ShowroomCallbacks {
  onProductSelect: (product: Product) => void;
  onProductHover: (product: Product | null) => void;
  onActiveGarmentChange?: (product: Product | null) => void;
  onFpsUpdate?: (fps: number) => void;
  onPointerLockChange?: (locked: boolean) => void;
  onLightsToggle?: (lightsOn: boolean) => void;
}

interface RailGarmentEntry {
  product: Product;
  group: THREE.Group;
  initialX: number;
  initialY: number;
  initialZ: number;
  currentX: number;
  targetX: number;
  prevVx: number;
  angleZ: number;
  angVel: number;
  currentY: number;
  targetY: number;
  currentZ: number;
  targetZ: number;
  targetRotationY: number;
  currentRotationY: number;
  currentScale: number;
  targetScale: number;
  titleMesh?: THREE.Mesh;
  sideMesh?: THREE.Mesh;
  frontMesh?: THREE.Mesh;
  currentOpacitySide: number;
  targetOpacitySide: number;
  currentOpacityFront: number;
  targetOpacityFront: number;
}

export interface DenimCubbyItem {
  id: string;
  name: string;
  subname: string;
  fit: string;
  price: string;
  foldedImg: string;
  unfoldedImg: string;
  unfoldedAspect: number;
  cubbyRow: number; // 0 (bottom), 1 (middle), 2 (top)
  cubbyCol: number; // -1 (left), 0 (center), 1 (right)
  slot: number; // -1 (left), 0 (middle), 1 (right)
  shelfRestY?: number;
  stackMesh?: THREE.Group;
  originPos: THREE.Vector3;
  originQuat: THREE.Quaternion;
}

export function generateDenimRackItems(): DenimCubbyItem[] {
  const items: DenimCubbyItem[] = [];
  const colTemplates = [
    {
      col: -1, // Left column
      name: 'NIKE LAB 14.5oz RAW SELVEDGE',
      subname: 'JAPANESE KURABO WEAVE',
      fit: 'Classic Straight Leg • Rigid Selvedge',
      price: '$220',
      foldedImg: './denim/folded_raw_indigo_single.png',
      foldedAspect: 480 / 291,
      unfoldedImg: './denim/unfold_raw_indigo.png',
      unfoldedAspect: 436 / 856,
    },
    {
      col: 0, // Center column
      name: '90s VINTAGE STONE BLEACH',
      subname: 'ACID STONEWASH ARCHIVE',
      fit: 'Loose Fit Skate Cut • Light Bleach Fade',
      price: '$195',
      foldedImg: './denim/folded_ice_bleach_single.png',
      foldedAspect: 480 / 324,
      unfoldedImg: './denim/unfold_stone_bleach.png',
      unfoldedAspect: 685 / 1057,
    },
    {
      col: 1, // Right column
      name: 'OBSIDIAN BLACK SELVEDGE',
      subname: 'OVERDYED SULFUR BLACK',
      fit: 'Relaxed Tapered • 13oz Double-Dyed',
      price: '$210',
      foldedImg: './denim/folded_obsidian_black_single.png',
      foldedAspect: 480 / 293,
      unfoldedImg: './denim/unfold_obsidian_black.png',
      unfoldedAspect: 677 / 1061,
    },
  ];

  // Populate all 3 rows (top, middle, bottom) across all 3 columns = 9 compartments total
  for (let r = 0; r < 3; r++) {
    colTemplates.forEach((tmpl) => {
      items.push({
        id: `denim-r${r}-c${tmpl.col}`,
        cubbyRow: r,
        cubbyCol: tmpl.col,
        slot: 0,
        ...tmpl,
        originPos: new THREE.Vector3(),
        originQuat: new THREE.Quaternion(),
      });
    });
  }

  return items;
}

export const DENIM_ITEMS: DenimCubbyItem[] = generateDenimRackItems();

export class ShowroomScene {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public interactiveMeshes: THREE.Object3D[] = [];

  // Movement & Navigation
  public isLocked = false;
  public moveForward = false;
  public moveBackward = false;
  public moveLeft = false;
  public moveRight = false;
  private velocity = new THREE.Vector3();

  // Slower, Gentle, Luxury-Paced Navigation (Addresses user feedback directly)
  private walkSpeed = 1.4; // Calm, slow and relaxed
  private eyeHeight = 1.70;

  // Camera Rotation & Damping
  private euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private targetEuler = new THREE.Euler(0, 0, 0, 'YXZ');

  // Fast Travel / Section Transition State
  private isTransitioning = false;
  private transitionStartPos = new THREE.Vector3();
  private transitionTargetPos = new THREE.Vector3();
  private transitionStartLook = new THREE.Vector3();
  private transitionTargetLook = new THREE.Vector3();
  private transitionProgress = 0;

  // Interaction
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private hoveredProduct: Product | null = null;
  public activeRailGarment: Product | null = null;
  private callbacks: ShowroomCallbacks;

  // Rail Garments tracking
  private railGarments: RailGarmentEntry[] = [];
  public currentRailIndex = 5; // Default focused on ACG Lava Flow Puffer (Hero piece!)

  // Lighting State
  public lightsOn = true;
  private ambientLight!: THREE.AmbientLight;
  private dirLight!: THREE.DirectionalLight;
  private railSpotlights: THREE.SpotLight[] = [];
  private shelfSpotlights: THREE.SpotLight[] = [];
  private ringPointLights: THREE.PointLight[] = [];
  private ringEmissiveMaterials: THREE.MeshStandardMaterial[] = [];

  // Interactive Corner Night Lamp
  public isNightLampOn = true;
  private nightLampLight: THREE.PointLight | null = null;
  private nightLampShadeMat: THREE.MeshStandardMaterial | null = null;
  private nightLampBulbMat: THREE.MeshBasicMaterial | null = null;
  private nightLampFloorGlowMat: THREE.MeshBasicMaterial | null = null;
  private nightLampPullChain: THREE.Group | null = null;

  // Denim Cupboard & Unfolding Animation
  public isDenimUnfolded = false;
  private activeUnfoldedDenim: DenimCubbyItem | null = null;
  private activeUnfoldedGroup: THREE.Group | null = null;
  private activeDenimOriginPos = new THREE.Vector3();
  private activeDenimOriginQuat = new THREE.Quaternion();
  private denimAnimationTimeline: gsap.core.Timeline | null = null;
  private denimHUDElement: HTMLElement | null = null;
  private hoveredDenimItem: DenimCubbyItem | null = null;

  // Animation Loop
  private clock = new THREE.Clock();
  private animationFrameId = 0;
  private frameCount = 0;
  private lastFpsTime = performance.now();
  private isDisposed = false;

  constructor(container: HTMLElement, callbacks: ShowroomCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Scene & Warm Luxury Architectural Environment (Brightened Contemporary Dark Mode)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x282b35);
    this.scene.fog = new THREE.FogExp2(0x282b35, 0.009);

    // 2. Camera setup: Facing the long horizontal clothing rail
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    // Position directly in front of the clothing rail
    this.camera.position.set(0.35, this.eyeHeight, 3.8);
    this.euler.set(0, 0, 0, 'YXZ');
    this.targetEuler.set(0, 0, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(this.euler);

    // 3. WebGL Renderer with High Dynamic Color & Clean Shadows
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.48;

    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    // 4. Build Environment
    this.buildLighting();
    this.buildShowroomRoom();
    this.buildCeilingRingLights();
    this.buildClothingRail();
    this.buildWallArtGallery();
    this.buildWoodenCubbyAndBags();
    this.buildWoodenDenimCupboard();
    this.buildCornerNightLamp();
    // (Pedestals removed as requested)

    // 5. Setup Listeners & Start Loop
    this.setupEventListeners();
    this.animate();
  }

  // -----------------------------------------------------------------
  // Studio Lighting (Clean, Warm, Soft Drop Shadows on Wall and Floor)
  // -----------------------------------------------------------------
  private buildLighting() {
    // Warm, inviting gallery ambient light (eliminates gloominess!)
    this.ambientLight = new THREE.AmbientLight(0x787e92, 2.25);
    this.scene.add(this.ambientLight);

    // Main Studio Key Light casting gentle defined shadows
    this.dirLight = new THREE.DirectionalLight(0xfffaee, 2.15);
    this.dirLight.position.set(0, 6.0, 5.5);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 25;
    this.dirLight.shadow.camera.left = -8;
    this.dirLight.shadow.camera.right = 8;
    this.dirLight.shadow.camera.top = 6;
    this.dirLight.shadow.camera.bottom = -2;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // Rail Spotlights focused on garments against wall
    [-2.5, 0, 2.5].forEach((sx) => {
      const spot = new THREE.SpotLight(0xfffaee, 2.8, 14, Math.PI / 4, 0.5);
      spot.position.set(sx, 4.2, 2.8);
      spot.target.position.set(sx, 1.8, 0);
      this.scene.add(spot);
      this.scene.add(spot.target);
      this.railSpotlights.push(spot);
    });
  }

  // -----------------------------------------------------------------
  // Suspended Architectural Halo / Ring Pendant Lights
  // -----------------------------------------------------------------
  private buildCeilingRingLights() {
    const ceilingY = 5.2;

    const ringConfigs = [
      // 1. Center Grand Double Halo Chandelier (Hero rings over central showroom aisle)
      { x: 0, y: 4.30, z: 2.4, radius: 1.65, tube: 0.035, lightColor: 0xfff6e4, lightIntensity: 3.2, distance: 11.5, wires: 4 },
      { x: 0, y: 4.45, z: 2.4, radius: 1.05, tube: 0.030, lightColor: 0xfffaee, lightIntensity: 2.6, distance: 10.0, wires: 3 },

      // 2. Left Wing Halo (above bags / museum art walkway)
      { x: -3.4, y: 4.30, z: 2.8, radius: 1.20, tube: 0.032, lightColor: 0xfff6e4, lightIntensity: 2.8, distance: 10.5, wires: 4 },

      // 3. Right Wing Halo (in front of the Denim Archive area)
      { x: 3.4, y: 4.30, z: 2.8, radius: 1.20, tube: 0.032, lightColor: 0xfff6e4, lightIntensity: 2.8, distance: 10.5, wires: 4 },

      // 4. Forward Rail Halo (suspended right above the clothing rail)
      { x: 0, y: 4.40, z: 0.8, radius: 1.15, tube: 0.030, lightColor: 0xfffaee, lightIntensity: 2.8, distance: 10.5, wires: 4 },
    ];

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1f2128,
      metalness: 0.85,
      roughness: 0.25,
    });

    const wireMat = new THREE.MeshStandardMaterial({
      color: 0x8a8d9b,
      metalness: 0.9,
      roughness: 0.3,
    });

    ringConfigs.forEach((cfg) => {
      const ringGroup = new THREE.Group();
      ringGroup.position.set(cfg.x, cfg.y, cfg.z);

      // A. Outer Metal Casing / Ring Trim
      const outerGeom = new THREE.TorusGeometry(cfg.radius, cfg.tube * 1.25, 16, 64);
      outerGeom.rotateX(Math.PI / 2);
      const outerMesh = new THREE.Mesh(outerGeom, metalMat);
      ringGroup.add(outerMesh);

      // B. Glowing Circular LED Diffuser Band
      const ledMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: new THREE.Color(cfg.lightColor),
        emissiveIntensity: 3.8,
        roughness: 0.1,
      });
      this.ringEmissiveMaterials.push(ledMat);

      const ledGeom = new THREE.TorusGeometry(cfg.radius, cfg.tube, 20, 64);
      ledGeom.rotateX(Math.PI / 2);
      const ledMesh = new THREE.Mesh(ledGeom, ledMat);
      ringGroup.add(ledMesh);

      // C. Thin Aircraft Suspension Cables running up to Ceiling
      const wireLen = ceilingY - cfg.y;
      for (let i = 0; i < cfg.wires; i++) {
        const theta = (i * 2 * Math.PI) / cfg.wires;
        const wx = Math.cos(theta) * cfg.radius;
        const wz = Math.sin(theta) * cfg.radius;

        const wireGeom = new THREE.CylinderGeometry(0.0035, 0.0035, wireLen, 8);
        const wireMesh = new THREE.Mesh(wireGeom, wireMat);
        wireMesh.position.set(wx, wireLen / 2, wz);
        ringGroup.add(wireMesh);

        // Ceiling canopy rosette
        const canopyGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.015, 12);
        const canopyMesh = new THREE.Mesh(canopyGeom, metalMat);
        canopyMesh.position.set(wx, wireLen - 0.007, wz);
        ringGroup.add(canopyMesh);
      }

      // D. Physical PointLight Illuminating the Room from Center of Ring
      const pLight = new THREE.PointLight(cfg.lightColor, cfg.lightIntensity, cfg.distance, 1.4);
      pLight.position.set(0, -0.05, 0);
      pLight.userData.baseIntensity = cfg.lightIntensity;
      ringGroup.add(pLight);
      this.ringPointLights.push(pLight);

      this.scene.add(ringGroup);
    });
  }

  // -----------------------------------------------------------------
  // Studio Architectural Room & Wall Branding (Cozy, Proportional Luxury Boutique)
  // -----------------------------------------------------------------
  private buildShowroomRoom() {
    const roomWidth = 14;  // Scaled down to feel intimate and cozy
    const roomHeight = 5.2; // Realistic ceiling height
    const roomDepth = 13;   // Closer, proportionate depth

    // 1. Studio Main Wall (Lighter Warm Architectural Stone Slate)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x4a4f5d,
      roughness: 0.76,
      metalness: 0.04,
    });

    const mainWallGeom = new THREE.PlaneGeometry(roomWidth, roomHeight);
    const mainWall = new THREE.Mesh(mainWallGeom, wallMat);
    mainWall.position.set(0, roomHeight / 2, -0.05);
    mainWall.receiveShadow = true;
    this.scene.add(mainWall);

    // 2. Polished Studio Floor (Luminous reflective architectural slate with soft sheen)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x343844,
      roughness: 0.22,
      metalness: 0.24,
    });
    const floorGeom = new THREE.PlaneGeometry(roomWidth, roomDepth);
    floorGeom.rotateX(-Math.PI / 2);
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.position.set(0, 0, roomDepth / 2 - 1.5);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Elegant architectural grid lines on floor
    const gridHelper = new THREE.GridHelper(roomWidth, 14, 0x5a6074, 0x3d4352);
    gridHelper.position.set(0, 0.002, roomDepth / 2 - 1.5);
    this.scene.add(gridHelper);

    // 3. Side Walls (for Bags and Shoes displays)
    // Left Wall: Bags Section (Closer to center, snug fit)
    const leftWallGeom = new THREE.PlaneGeometry(roomDepth, roomHeight);
    leftWallGeom.rotateY(Math.PI / 2);
    const leftWall = new THREE.Mesh(leftWallGeom, wallMat);
    leftWall.position.set(-roomWidth / 2, roomHeight / 2, roomDepth / 2 - 1.5);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    // Right Wall: Caps and Footwear Section
    const rightWallGeom = new THREE.PlaneGeometry(roomDepth, roomHeight);
    rightWallGeom.rotateY(-Math.PI / 2);
    const rightWall = new THREE.Mesh(rightWallGeom, wallMat);
    rightWall.position.set(roomWidth / 2, roomHeight / 2, roomDepth / 2 - 1.5);
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);

    // 4. Back Wall (Fully enclosing the showroom space)
    const backWallGeom = new THREE.PlaneGeometry(roomWidth, roomHeight);
    backWallGeom.rotateY(Math.PI);
    const backWall = new THREE.Mesh(backWallGeom, wallMat);
    backWall.position.set(0, roomHeight / 2, roomDepth - 1.5);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // 5. Ceiling (Acoustic Matte Slate Ceiling)
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x363945,
      roughness: 0.85,
      metalness: 0.02,
    });
    const ceilingGeom = new THREE.PlaneGeometry(roomWidth, roomDepth);
    ceilingGeom.rotateX(Math.PI / 2);
    const ceiling = new THREE.Mesh(ceilingGeom, ceilingMat);
    ceiling.position.set(0, roomHeight, roomDepth / 2 - 1.5);
    this.scene.add(ceiling);

    // 6. Large 3D Embossed NIKE Branding with Swoosh on Main Wall
    // (Exact match to reference video frames frame_008.jpg, frame_012.jpg, frame_016.jpg!)
    this.buildWallBrandLogo(0, "VIRTUAL STORE");
  }

  // 3D NIKE with Swoosh on wall above the rail
  private buildWallBrandLogo(posX = 0, subtitle = "VIRTUAL STORE") {
    const brandCanvas = document.createElement('canvas');
    brandCanvas.width = 1024;
    brandCanvas.height = 256;
    const ctx = brandCanvas.getContext('2d')!;

    ctx.clearRect(0, 0, 1024, 256);

    // Bold NIKE typography (Platinum white on dark wall)
    ctx.fillStyle = '#f0f1f5';
    ctx.font = 'bold 110px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('NIKE', 140, 155);

    // Nike Swoosh (Platinum white on dark wall)
    ctx.beginPath();
    ctx.moveTo(480, 130);
    ctx.bezierCurveTo(580, 160, 720, 140, 840, 50);
    ctx.bezierCurveTo(760, 95, 680, 115, 600, 105);
    ctx.bezierCurveTo(530, 95, 495, 80, 480, 130);
    ctx.closePath();
    ctx.fillStyle = '#f0f1f5';
    ctx.fill();

    const logoTexture = new THREE.CanvasTexture(brandCanvas);
    logoTexture.anisotropy = 8;

    const logoGeom = new THREE.PlaneGeometry(3.6, 0.90);
    const logoMat = new THREE.MeshBasicMaterial({
      map: logoTexture,
      transparent: true,
    });
    const logoMesh = new THREE.Mesh(logoGeom, logoMat);
    logoMesh.position.set(posX, 3.45, 0.01);
    this.scene.add(logoMesh);
  }

  // -----------------------------------------------------------------
  // Wall Art Gallery Painting Frames (In Left & Right Empty Spaces flanking the Rail)
  // -----------------------------------------------------------------
  private buildWallArtGallery() {
    const frameWidth = 1.18;
    const frameHeight = 1.62;
    const frameDepth = 0.045;
    const frameY = 2.22; // Centered at eye level flanking the clothing rail
    const frameZ = 0.01;

    // Dark luxury museum frame moulding material
    const frameBorderMat = new THREE.MeshStandardMaterial({
      color: 0x1a1b1e,
      roughness: 0.35,
      metalness: 0.70,
    });

    const paintings = [
      {
        posX: -5.45, // In the empty wall space to the left of the rail
        isDark: true,
        title: 'AIR ARCHIVE',
        subtitle: 'INNOVATION & DESIGN • BEAVERTON OR',
        code: 'PROTOTYPE SERIES 01'
      },
      {
        posX: 5.45,  // In the empty wall space to the right of the rail
        isDark: true,
        title: 'JUST DO IT.',
        subtitle: 'ALL CONDITIONS GEAR • EST. 1972',
        code: 'ACG EXPLORATION UNIT'
      }
    ];

    paintings.forEach((cfg) => {
      const artGroup = new THREE.Group();
      artGroup.position.set(cfg.posX, frameY, frameZ);

      // 1. Picture Frame Moulding (Outer beveled box border)
      const borderThickness = 0.042;
      const bMat = frameBorderMat;

      // Top bar
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(frameWidth, borderThickness, frameDepth), bMat);
      topBar.position.set(0, frameHeight / 2 - borderThickness / 2, frameDepth / 2);
      artGroup.add(topBar);

      // Bottom bar
      const botBar = new THREE.Mesh(new THREE.BoxGeometry(frameWidth, borderThickness, frameDepth), bMat);
      botBar.position.set(0, -frameHeight / 2 + borderThickness / 2, frameDepth / 2);
      artGroup.add(botBar);

      // Left bar
      const leftBar = new THREE.Mesh(new THREE.BoxGeometry(borderThickness, frameHeight - borderThickness * 2, frameDepth), bMat);
      leftBar.position.set(-frameWidth / 2 + borderThickness / 2, 0, frameDepth / 2);
      artGroup.add(leftBar);

      // Right bar
      const rightBar = new THREE.Mesh(new THREE.BoxGeometry(borderThickness, frameHeight - borderThickness * 2, frameDepth), bMat);
      rightBar.position.set(frameWidth / 2 - borderThickness / 2, 0, frameDepth / 2);
      artGroup.add(rightBar);

      // Backing board
      const backBoard = new THREE.Mesh(
        new THREE.PlaneGeometry(frameWidth - 0.01, frameHeight - 0.01),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
      );
      backBoard.position.set(0, 0, 0.002);
      artGroup.add(backBoard);

      // 2. High-Resolution Museum Art Canvas
      const artCanvas = document.createElement('canvas');
      artCanvas.width = 1024;
      artCanvas.height = 1400;
      const ctx = artCanvas.getContext('2d')!;

      if (!cfg.isDark) {
        // Luxury Gallery Light Edition
        ctx.fillStyle = '#f5f3ec';
        ctx.fillRect(0, 0, 1024, 1400);

        // Passepartout inner mat
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 3;
        ctx.strokeRect(60, 60, 904, 1280);

        // Minimalist Bauhaus art composition
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(512, 480, 210, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f5f3ec';
        ctx.beginPath();
        ctx.arc(512, 480, 145, 0, Math.PI * 2);
        ctx.fill();

        // Minimalist Nike Swoosh
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.moveTo(390, 485);
        ctx.bezierCurveTo(460, 520, 580, 500, 655, 415);
        ctx.bezierCurveTo(595, 455, 530, 470, 470, 460);
        ctx.bezierCurveTo(425, 455, 405, 440, 390, 485);
        ctx.closePath();
        ctx.fill();

        // Fine typographic layout
        ctx.fillStyle = '#111111';
        ctx.font = '800 56px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(cfg.title, 512, 850);

        ctx.fillStyle = '#777777';
        ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(cfg.subtitle, 512, 915);

        ctx.fillStyle = '#999999';
        ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('COLLECTION 01 • PROTOTYPE STUDIO • ARCHIVE 2026', 512, 975);

        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(340, 1030);
        ctx.lineTo(684, 1030);
        ctx.stroke();

        ctx.fillStyle = '#888888';
        ctx.font = '500 17px monospace';
        ctx.fillText(cfg.code, 512, 1085);
      } else {
        // Luxury Gallery Dark Edition
        ctx.fillStyle = '#141518';
        ctx.fillRect(0, 0, 1024, 1400);

        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 3;
        ctx.strokeRect(60, 60, 904, 1280);

        // Graphic: Warm Sunset Gradient Circle
        const grad = ctx.createLinearGradient(200, 200, 800, 800);
        grad.addColorStop(0, '#e85d04');
        grad.addColorStop(0.5, '#f48c06');
        grad.addColorStop(1, '#ffba08');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(512, 485, 200, 0, Math.PI * 2);
        ctx.fill();

        // Dark concentric cutout
        ctx.fillStyle = '#141518';
        ctx.beginPath();
        ctx.arc(512, 485, 120, 0, Math.PI * 2);
        ctx.fill();

        // Typography
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 66px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(cfg.title, 512, 850);

        ctx.fillStyle = '#b0b2b8';
        ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(cfg.subtitle, 512, 915);

        ctx.fillStyle = '#72747a';
        ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('ALL CONDITIONS GEAR • BUILT FOR PLANET EARTH', 512, 975);

        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(340, 1030);
        ctx.lineTo(684, 1030);
        ctx.stroke();

        ctx.fillStyle = '#8b8e94';
        ctx.font = '500 17px monospace';
        ctx.fillText(cfg.code, 512, 1085);
      }

      const canvasTex = new THREE.CanvasTexture(artCanvas);
      canvasTex.anisotropy = 8;

      const artMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(frameWidth - 0.08, frameHeight - 0.08),
        new THREE.MeshStandardMaterial({
          map: canvasTex,
          roughness: 0.35,
          metalness: 0.05,
        })
      );
      artMesh.position.set(0, 0, frameDepth * 0.4);
      artGroup.add(artMesh);

      // Soft wall shadow behind frame
      const frameShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(frameWidth + 0.08, frameHeight + 0.08),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
        })
      );
      frameShadow.position.set(0.015, -0.015, -0.002);
      artGroup.add(frameShadow);

      this.scene.add(artGroup);
    });
  }

  // -----------------------------------------------------------------
  // CLOTHING SECTION: One Single Continuous Hanging Metallic Rail in One Line
  // (Full-wall horizontal continuous CylinderGeometry rod with all garments in 1 line)
  // -----------------------------------------------------------------
  private async buildClothingRail() {
    const railLength = 8.5; // Luxury wardrobe rail
    const railY = 2.18;
    const railZ = 0.32;

    // 1. One Single Continuous Horizontal Metallic Hanging Rail (CylinderGeometry)
    const rodGeom = new THREE.CylinderGeometry(0.015, 0.015, railLength, 32);
    rodGeom.rotateZ(Math.PI / 2);
    const rodMat = new THREE.MeshStandardMaterial({
      color: 0x888b94,
      roughness: 0.25,
      metalness: 0.85,
    });
    const railRod = new THREE.Mesh(rodGeom, rodMat);
    railRod.position.set(0, railY, railZ);
    railRod.castShadow = true;
    this.scene.add(railRod);

    // Spherical Metallic Finials / End-Caps on both ends of the rail (as requested: "Add Left Side")
    [-railLength / 2, railLength / 2].forEach((endX) => {
      // Sleek collar sleeve connecting rod to ball
      const collarGeom = new THREE.CylinderGeometry(0.022, 0.022, 0.03, 24);
      collarGeom.rotateZ(Math.PI / 2);
      const collar = new THREE.Mesh(collarGeom, rodMat);
      collar.position.set(endX, railY, railZ);
      this.scene.add(collar);

      // Spherical end-cap ball
      const ballGeom = new THREE.SphereGeometry(0.042, 32, 32);
      const ball = new THREE.Mesh(ballGeom, rodMat);
      const offset = endX < 0 ? -0.035 : 0.035;
      ball.position.set(endX + offset, railY, railZ);
      ball.castShadow = true;
      this.scene.add(ball);
    });

    // Wall Standoff Brackets evenly spaced along the continuous rail
    const bracketXPositions = [-3.6, -1.8, 0, 1.8, 3.6];
    bracketXPositions.forEach((bx) => {
      const bGeom = new THREE.CylinderGeometry(0.012, 0.012, railZ + 0.05, 16);
      bGeom.rotateX(Math.PI / 2);
      const bMesh = new THREE.Mesh(bGeom, rodMat);
      bMesh.position.set(bx, railY, (railZ - 0.05) / 2);
      this.scene.add(bMesh);

      // Wall mounting disc
      const discGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.01, 16);
      discGeom.rotateX(Math.PI / 2);
      const disc = new THREE.Mesh(discGeom, rodMat);
      disc.position.set(bx, railY, 0.005);
      this.scene.add(disc);
    });

    // Curated Collection of 10 Real Boutique Hanging Garments (with $199 tags)
    const GARMENT_ITEMS = [
      {
        id: 0,
        title: "VINTAGE WASHED HOODIE",
        shortName: "Hoodie",
        desc: "Faded Black • 480 GSM Heavy French Terry • Ribbed Trim",
        price: 16499,
        sideAspect: 0.29,
        frontAspect: 0.75,
      },
      {
        id: 1,
        title: "DOUBLE-BREASTED WOOL COAT",
        shortName: "Wool Coat",
        desc: "Midnight Navy • Tailored Italian Wool • Signature Horn Buttons",
        price: 24999,
        sideAspect: 0.36,
        frontAspect: 0.63,
      },
      {
        id: 2,
        title: "THANK GOD I'M AN ATHEIST HOODIE",
        shortName: "Hoodie",
        desc: "Light Heather Grey • Signature Graphic Print • Brushed Slub Fleece",
        price: 16499,
        sideAspect: 0.31,
        frontAspect: 0.75,
      },
      {
        id: 3,
        title: "SAND FLEECE SWEATSHIRT",
        shortName: "Sweatshirt",
        desc: "Raw Natural Sand Cotton • Minimalist Chest Logo • Ribbed Crewneck",
        price: 14499,
        sideAspect: 0.26,
        frontAspect: 0.63,
      },
      {
        id: 4,
        title: "FOREST GREEN HOODIE",
        shortName: "Hoodie",
        desc: "Deep Pine Green Dye • Dual Layer Hood • Heavyweight Ribbing",
        price: 16499,
        sideAspect: 0.34,
        frontAspect: 0.75,
      },
      {
        id: 5,
        title: "CLASSIC BLACK CREW TEE",
        shortName: "T-Shirt",
        desc: "Supima Cotton 240 GSM • High-Density Neckband • Straight Hem",
        price: 6499,
        sideAspect: 0.26,
        frontAspect: 0.75,
      },
      {
        id: 6,
        title: "WASHED CHARCOAL HOODIE",
        shortName: "Hoodie",
        desc: "Sun-Bleached Pigment Wash • Relaxed Street Silhouette",
        price: 16499,
        sideAspect: 0.29,
        frontAspect: 0.75,
      },
      {
        id: 7,
        title: "ATHLETIC GREY HOODIE",
        shortName: "Hoodie",
        desc: "Athletic Heather Grey • Brushed Warm Interior • Signature Graphic",
        price: 16499,
        sideAspect: 0.31,
        frontAspect: 0.75,
      },
      {
        id: 9,
        title: "EMERALD HEAVY HOODIE",
        shortName: "Hoodie",
        desc: "Botanical Pigment Wash • Structured Warm Silhouette",
        price: 16499,
        sideAspect: 0.34,
        frontAspect: 0.75,
      },
    ];

    const textureLoader = new THREE.TextureLoader();
    const totalGarments = GARMENT_ITEMS.length;
    const garmentSpacing = 0.58; // In side view, clothes hang compactly along the rail (Image 2)
    const startX = -((totalGarments - 1) * garmentSpacing) / 2;
    const clothHeight = 0.98;

    for (let i = 0; i < totalGarments; i++) {
      const item = GARMENT_ITEMS[i];
      const product: Product = {
        id: `hanging-png-${i}`,
        name: item.title,
        subtitle: item.desc,
        price: item.price,
        category: 'Clothing',
        sectionName: `WALL RAIL — POSITION ${i + 1}`,
        garmentType: 'colorblock-hoodie',
        description: item.desc,
        fabricDetails: {
          composition: '100% French Terry Cotton',
          weight: '480 GSM Heavyweight',
          weave: 'Loopback Terry Weave',
          treatment: 'Pigment Washed',
          care: 'Machine Wash Cold',
        },
        colors: [{ name: 'Original', hex: '#222222' }],
        sizes: ['S', 'M', 'L', 'XL'],
        sku: `HNG-0${i}`,
        features: ['Real fabric texture', 'Ribbed cuffs & hem', 'Custom fit drape'],
        railIndex: i,
      };

      const gx = startX + i * garmentSpacing;
      const gy = railY;
      const gz = railZ;

      // Group holding this garment
      const garmentGroup = new THREE.Group();
      garmentGroup.position.set(gx, gy, gz);

      // Load side and front PNG textures (exact cutouts with $199 tags)
      const sideTex = textureLoader.load(`./hanging_cloth/item_${item.id}_side.png`);
      const frontTex = textureLoader.load(`./hanging_cloth/item_${item.id}_front.png`);
      sideTex.colorSpace = THREE.SRGBColorSpace;
      frontTex.colorSpace = THREE.SRGBColorSpace;
      sideTex.generateMipmaps = true;
      frontTex.generateMipmaps = true;
      sideTex.minFilter = THREE.LinearMipmapLinearFilter;
      frontTex.minFilter = THREE.LinearMipmapLinearFilter;

      // 1. Side view mesh (DEFAULT: Hanging sideways along rail, opacity: 1)
      const sideWidth = clothHeight * item.sideAspect;
      const sidePlaneGeom = new THREE.PlaneGeometry(sideWidth, clothHeight);
      const sideMat = new THREE.MeshBasicMaterial({
        map: sideTex,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        alphaTest: 0.05,
        opacity: 1.0,
      });
      const sideMesh = new THREE.Mesh(sidePlaneGeom, sideMat);
      sideMesh.position.set(0, -clothHeight / 2 - 0.02, 0);
      sideMesh.rotation.y = 0; // Flat to camera so user sees side view profile
      garmentGroup.add(sideMesh);

      // 2. Front view mesh (REVEALED ON HOVER: Flips to face front, opacity: 0)
      const frontWidth = clothHeight * item.frontAspect;
      const frontPlaneGeom = new THREE.PlaneGeometry(frontWidth, clothHeight);
      const frontMat = new THREE.MeshBasicMaterial({
        map: frontTex,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        alphaTest: 0.05,
        opacity: 0.0,
      });
      const frontMesh = new THREE.Mesh(frontPlaneGeom, frontMat);
      frontMesh.position.set(0, -clothHeight / 2 - 0.02, 0.01);
      frontMesh.rotation.y = 0;
      garmentGroup.add(frontMesh);

      // Soft ambient floor shadow beneath garment
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 128;
      shadowCanvas.height = 128;
      const sCtx = shadowCanvas.getContext('2d')!;
      const grad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 60);
      grad.addColorStop(0, 'rgba(0,0,0,0.30)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0.12)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
      const shadowTex = new THREE.CanvasTexture(shadowCanvas);

      const shadowGeom = new THREE.PlaneGeometry(0.50, 0.22);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
      });
      const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.set(0, -railY + 0.02, 0);
      garmentGroup.add(shadowMesh);

      // Hitbox for mouse raycasting
      const hitBoxGeom = new THREE.BoxGeometry(0.50, clothHeight + 0.15, 0.35);
      const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitBoxMesh = new THREE.Mesh(hitBoxGeom, hitBoxMat);
      hitBoxMesh.position.set(0, -clothHeight / 2 - 0.02, 0);
      hitBoxMesh.userData = { isHitBox: true, product };
      garmentGroup.add(hitBoxMesh);
      this.interactiveMeshes.push(hitBoxMesh);

      // Subtitle Text Label underneath garment attached directly to group
      const titleMesh = this.createGarmentSubtitleLabel(product, 0, -clothHeight - 0.14, 0.03);
      titleMesh.visible = false;
      garmentGroup.add(titleMesh);

      this.scene.add(garmentGroup);

      this.railGarments.push({
        product,
        group: garmentGroup,
        initialX: gx,
        initialY: gy,
        initialZ: gz,
        currentX: gx,
        targetX: gx,
        prevVx: 0,
        angleZ: 0,
        angVel: 0,
        currentY: gy,
        targetY: gy,
        currentZ: gz,
        targetZ: gz,
        targetRotationY: 0,
        currentRotationY: 0,
        currentScale: 1.0,
        targetScale: 1.0,
        titleMesh,
        sideMesh,
        frontMesh,
        currentOpacitySide: 1.0,
        targetOpacitySide: 1.0,
        currentOpacityFront: 0.0,
        targetOpacityFront: 0.0,
      });
    }

    if (this.railGarments[this.currentRailIndex]) {
      this.activeRailGarment = this.railGarments[this.currentRailIndex].product;
      this.callbacks.onActiveGarmentChange?.(this.activeRailGarment);
    }
  }

  // Subtitle Label below Garment
  private createGarmentSubtitleLabel(product: Product, x: number, y: number, z: number): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 140;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 1024, 140);
    // Draw rounded background pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.beginPath();
    ctx.roundRect(160, 15, 704, 110, 55);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Text: Name & Price
    ctx.fillStyle = '#111111';
    ctx.font = '700 36px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(product.name, 512, 60);

    ctx.fillStyle = '#666666';
    ctx.font = '500 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('$199.00 • Click to Inspect', 512, 100);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;

    const geom = new THREE.PlaneGeometry(1.4, 0.20);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    mesh.userData = { isHitBox: true, product };
    this.interactiveMeshes.push(mesh);
    return mesh;
  }

  // -----------------------------------------------------------------
  // Focus / Select Garment along the Horizontal Rail
  // (Rotates selected garment forward, updates subtitle, glides smoothly)
  // -----------------------------------------------------------------
  public focusRailGarment(index: number) {
    if (index < 0 || index >= this.railGarments.length) return;
    this.currentRailIndex = index;
    const entry = this.railGarments[index];
    this.activeRailGarment = entry.product;
    this.callbacks.onActiveGarmentChange?.(entry.product);

    this.apply3DHoverSimulation(index);

    // Smoothly glide camera horizontally to center in front of the selected garment
    this.travelToSpot(
      [entry.initialX, this.eyeHeight, 3.6],
      [entry.initialX, 1.8, 0]
    );
  }

  public nextRailGarment() {
    const nextIdx = (this.currentRailIndex + 1) % this.railGarments.length;
    this.focusRailGarment(nextIdx);
  }

  public prevRailGarment() {
    const prevIdx = (this.currentRailIndex - 1 + this.railGarments.length) % this.railGarments.length;
    this.focusRailGarment(prevIdx);
  }

  // -----------------------------------------------------------------
  // BAGS & STORE SECTION (Exact match to Reference Video frame_003.jpg):
  // 6-Cubby Wooden Shelf with 6 Bags + 4 Wall Pegs with Hanging Bags!
  // -----------------------------------------------------------------
  private async buildWoodenCubbyAndBags() {
    const shelfGroup = new THREE.Group();
    // Position on Left Wall (X = -6.75) aligned snugly with the new room width (14m)
    shelfGroup.position.set(-6.75, 0, 4.2);
    shelfGroup.rotation.y = Math.PI / 2;

    // 1. Natural Light Birch / Blonde Wood Material
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xdec8a5, // Natural birch wood
      roughness: 0.55,
      metalness: 0.05,
    });

    const shelfW = 2.8;
    const shelfH = 1.45;
    const shelfD = 0.50;
    const thickness = 0.04;

    // Outer Frame
    // Top & Bottom planks
    [-shelfH / 2 + 0.05, shelfH / 2 + 0.05].forEach((py) => {
      const plankGeom = new THREE.BoxGeometry(shelfW, thickness, shelfD);
      const plank = new THREE.Mesh(plankGeom, woodMat);
      plank.position.set(0, py + 0.72, 0);
      plank.castShadow = true;
      plank.receiveShadow = true;
      shelfGroup.add(plank);
    });

    // Left & Right sides
    [-shelfW / 2, shelfW / 2].forEach((px) => {
      const sideGeom = new THREE.BoxGeometry(thickness, shelfH, shelfD);
      const side = new THREE.Mesh(sideGeom, woodMat);
      side.position.set(px, 0.72 + 0.05, 0);
      side.castShadow = true;
      side.receiveShadow = true;
      shelfGroup.add(side);
    });

    // Horizontal middle divider (creates 2 rows)
    const midPlankGeom = new THREE.BoxGeometry(shelfW - 0.08, thickness, shelfD);
    const midPlank = new THREE.Mesh(midPlankGeom, woodMat);
    midPlank.position.set(0, 0.77, 0);
    shelfGroup.add(midPlank);

    // Two Vertical dividers (creates 3 columns -> 6 equal cubbies total!)
    const colWidth = (shelfW - 0.12) / 3;
    [-colWidth / 2, colWidth / 2].forEach((vx) => {
      const vGeom = new THREE.BoxGeometry(thickness, shelfH, shelfD);
      const vDivider = new THREE.Mesh(vGeom, woodMat);
      vDivider.position.set(vx, 0.77, 0);
      vDivider.castShadow = true;
      shelfGroup.add(vDivider);
    });

    // 2. Put the 6 Bags inside the 6 Cubbies (Matching frame_003.jpg!)
    // Top Row: Royal Blue Backpack, Coral Backpack, Neon Lime Backpack
    // Bottom Row: Red Duffel, White Duffel, Blue Waistpack
    const cubbyBagIds = [
      { id: 'prod-bp-blue', col: -1, row: 1 },
      { id: 'prod-bp-coral', col: 0, row: 1 },
      { id: 'prod-bp-lime', col: 1, row: 1 },
      { id: 'prod-duffel-red', col: -1, row: 0 },
      { id: 'prod-duffel-white', col: 0, row: 0 },
      { id: 'prod-waist-blue', col: 1, row: 0 },
    ];

    for (const item of cubbyBagIds) {
      const prod = PRODUCTS.find((p) => p.id === item.id);
      if (!prod) continue;

      const bagAssembly = await createGarmentAssembly(prod, undefined, false);
      const bx = item.col * colWidth;
      const by = item.row === 1 ? 1.05 : 0.45;
      bagAssembly.position.set(bx, by, 0.05);

      shelfGroup.add(bagAssembly);

      bagAssembly.traverse((child) => {
        if (child.userData && child.userData.isHitBox) {
          this.interactiveMeshes.push(child);
        }
      });
    }

    // 3. Four Wall Pegs Above the Shelf with 4 Hanging Bags (Matching frame_003.jpg!)
    // Brown, Pink, Mint, Charcoal crossbody bags
    const hangingBagIds = [
      { id: 'prod-bag-brown', x: -1.05 },
      { id: 'prod-bag-pink', x: -0.35 },
      { id: 'prod-bag-mint', x: 0.35 },
      { id: 'prod-bag-charcoal', x: 1.05 },
    ];

    for (const hBag of hangingBagIds) {
      const prod = PRODUCTS.find((p) => p.id === hBag.id);
      if (!prod) continue;

      // Peg protruding from wall
      const pegGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.22, 16);
      pegGeom.rotateX(Math.PI / 2);
      const peg = new THREE.Mesh(pegGeom, woodMat);
      peg.position.set(hBag.x, 2.35, -0.15);
      peg.castShadow = true;
      shelfGroup.add(peg);

      // Hanging Crossbody Bag
      const bagAssembly = await createGarmentAssembly(prod, undefined, false);
      bagAssembly.position.set(hBag.x, 2.35, -0.05);
      shelfGroup.add(bagAssembly);

      bagAssembly.traverse((child) => {
        if (child.userData && child.userData.isHitBox) {
          this.interactiveMeshes.push(child);
        }
      });
    }

    this.scene.add(shelfGroup);
  }

  // -----------------------------------------------------------------
  // WOODEN DENIM CUPBOARD (On Right Wall)
  // Exact 3 rows × 3 columns = 9 Cubbies Rack matching User Reference Image
  // Each cubby features 3 folded denim stacks side-by-side (Raw Indigo, Light Bleach, Black Twill)
  // Clicking any jeans item initiates smooth flight towards the camera and vertical unfold animation!
  // -----------------------------------------------------------------
  private async buildWoodenDenimCupboard() {
    const cupboardGroup = new THREE.Group();
    // Position snugly against the right wall (X = 6.75, Z = 5.0) facing the interior
    cupboardGroup.position.set(6.75, 0, 5.0);
    cupboardGroup.rotation.y = -Math.PI / 2;

    const textureLoader = new THREE.TextureLoader();

    // 1. Clean natural blonde birch wood matching the user's reference image
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xded0b6, // Natural light blonde birch / oak
      roughness: 0.55,
      metalness: 0.03,
    });

    const innerWoodMat = new THREE.MeshStandardMaterial({
      color: 0xd6c6aa,
      roughness: 0.58,
      metalness: 0.02,
    });

    const cupboardW = 3.35;
    const cupboardH = 2.45;
    const cupboardD = 0.58;
    const thickness = 0.045;
    const plinthH = 0.06;

    // Plinth baseboard (from y = 0 to y = 0.06)
    const plinthGeom = new THREE.BoxGeometry(cupboardW, plinthH, cupboardD);
    const plinth = new THREE.Mesh(plinthGeom, innerWoodMat);
    plinth.position.set(0, plinthH / 2, 0);
    plinth.receiveShadow = true;
    cupboardGroup.add(plinth);

    // Bottom floor plank (from y = 0.06 to y = 0.105)
    const bottomPlank = new THREE.Mesh(new THREE.BoxGeometry(cupboardW, thickness, cupboardD), woodMat);
    bottomPlank.position.set(0, plinthH + thickness / 2, 0);
    bottomPlank.receiveShadow = true;
    cupboardGroup.add(bottomPlank);

    // Top crown plank (from y = 2.405 to y = 2.45) - clean flush top, no dark header!
    const topPlank = new THREE.Mesh(new THREE.BoxGeometry(cupboardW, thickness, cupboardD), woodMat);
    topPlank.position.set(0, cupboardH - thickness / 2, 0);
    topPlank.castShadow = true;
    cupboardGroup.add(topPlank);

    const bottomSurfaceY = plinthH + thickness; // 0.105m
    const topCeilingY = cupboardH - thickness; // 2.405m
    const innerH = topCeilingY - bottomSurfaceY; // 2.30m

    // Left and Right outer vertical side panels
    const sideGeom = new THREE.BoxGeometry(thickness, innerH, cupboardD);
    [-cupboardW / 2 + thickness / 2, cupboardW / 2 - thickness / 2].forEach((px) => {
      const side = new THREE.Mesh(sideGeom, woodMat);
      side.position.set(px, bottomSurfaceY + innerH / 2, 0);
      side.castShadow = true;
      side.receiveShadow = true;
      cupboardGroup.add(side);
    });

    // Backboard panel (closes back against wall)
    const backGeom = new THREE.BoxGeometry(cupboardW - thickness * 2, innerH, 0.025);
    const backPanel = new THREE.Mesh(backGeom, innerWoodMat);
    backPanel.position.set(0, bottomSurfaceY + innerH / 2, -cupboardD / 2 + 0.015);
    backPanel.receiveShadow = true;
    cupboardGroup.add(backPanel);

    // 2. Three Equal Rows: 2 horizontal dividing shelves
    const rowH = (innerH - 2 * thickness) / 3; // ~0.736m per row
    const shelf1_plankY = bottomSurfaceY + rowH + thickness / 2; // ~0.8635m
    const shelf1_surface = shelf1_plankY + thickness / 2; // ~0.886m
    const shelf2_plankY = shelf1_surface + rowH + thickness / 2; // ~1.6445m
    const shelf2_surface = shelf2_plankY + thickness / 2; // ~1.667m

    [shelf1_plankY, shelf2_plankY].forEach((sy) => {
      const midPlank = new THREE.Mesh(
        new THREE.BoxGeometry(cupboardW - thickness * 2, thickness, cupboardD - 0.02),
        woodMat
      );
      midPlank.position.set(0, sy, 0);
      midPlank.receiveShadow = true;
      cupboardGroup.add(midPlank);
    });

    // 3. Three Equal Columns: 2 vertical dividing partitions
    const colWidth = (cupboardW - 4 * thickness) / 3; // ~1.05m per column
    [-colWidth / 2 - thickness / 2, colWidth / 2 + thickness / 2].forEach((vx) => {
      const vGeom = new THREE.BoxGeometry(thickness, innerH, cupboardD - 0.02);
      const vDivider = new THREE.Mesh(vGeom, woodMat);
      vDivider.position.set(vx, bottomSurfaceY + innerH / 2, 0);
      vDivider.castShadow = true;
      vDivider.receiveShadow = true;
      cupboardGroup.add(vDivider);
    });

    // Warm ceiling spotlight directed at the entire rack (balanced intensity so textures stay crisp & clear)
    const cupboardSpot = new THREE.SpotLight(0xfffaec, 1.45, 10, Math.PI / 3.6, 0.5);
    cupboardSpot.position.set(5.0, 4.2, 5.0);
    cupboardSpot.target.position.set(6.75, 1.25, 5.0);
    cupboardSpot.castShadow = true;
    cupboardSpot.shadow.bias = -0.001;
    this.scene.add(cupboardSpot);
    this.scene.add(cupboardSpot.target);
    this.shelfSpotlights.push(cupboardSpot);

    // 4. In each of the 9 cubbies: Recessed ceiling LED panel & soft warm downlight
    for (let r = 0; r < 3; r++) {
      const cubbyCeilingY = r === 0 ? shelf1_plankY - thickness / 2 : r === 1 ? shelf2_plankY - thickness / 2 : topCeilingY;
      for (let c = -1; c <= 1; c++) {
        const colX = c * (colWidth + thickness);

        // Recessed rectangular white LED light panel matching reference image
        const panelGeom = new THREE.BoxGeometry(0.72, 0.015, 0.22);
        const panelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const panel = new THREE.Mesh(panelGeom, panelMat);
        panel.position.set(colX, cubbyCeilingY - 0.008, 0.05);
        cupboardGroup.add(panel);

        const cubbyLight = new THREE.PointLight(0xfff6ea, 0.50, 2.0, 1.2);
        cubbyLight.position.set(colX, cubbyCeilingY - 0.05, 0.12);
        cupboardGroup.add(cubbyLight);
      }
    }

    // 5. Populate the 3 Featured Denim Items (One distinct, centered folded product per cubby across the middle eye-level shelf, exactly matching user reference Image 2)
    for (const item of DENIM_ITEMS) {
      const colX = item.cubbyCol * (colWidth + thickness);
      const shelfSurfaceY = item.cubbyRow === 0 ? bottomSurfaceY : item.cubbyRow === 1 ? shelf1_surface : shelf2_surface;

      item.shelfRestY = shelfSurfaceY;

      // Group for this individual folded denim stack
      const stackGroup = new THREE.Group();
      stackGroup.position.set(colX, shelfSurfaceY, 0.05);

      // Soft contact shadow under the folded jeans
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 128;
      shadowCanvas.height = 128;
      const sctx = shadowCanvas.getContext('2d');
      if (sctx) {
        const grad = sctx.createRadialGradient(64, 64, 15, 64, 64, 60);
        grad.addColorStop(0, 'rgba(0,0,0,0.48)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        sctx.fillStyle = grad;
        sctx.fillRect(0, 0, 128, 128);
      }
      const shadowTex = new THREE.CanvasTexture(shadowCanvas);
      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.58, 0.36),
        new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
      );
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.set(0, 0.002, -0.04);
      stackGroup.add(shadowPlane);

      // Authentic Folded Denim Texture (Transparent PNG directly from reference Image 2)
      const foldedTex = textureLoader.load(item.foldedImg);
      foldedTex.colorSpace = THREE.SRGBColorSpace;
      foldedTex.anisotropy = 16;
      foldedTex.generateMipmaps = true;
      foldedTex.minFilter = THREE.LinearMipmapLinearFilter;
      foldedTex.magFilter = THREE.LinearFilter;

      const foldedPlaneW = 0.54;
      const foldedPlaneH = foldedPlaneW / (item.foldedAspect || 1.62);

      // Gently curved presentation plane to give organic cloth depth
      const foldedGeom = new THREE.PlaneGeometry(foldedPlaneW, foldedPlaneH, 16, 8);
      const pAttr = foldedGeom.attributes.position;
      for (let i = 0; i < pAttr.count; i++) {
        const x = pAttr.getX(i);
        const z = -Math.pow(x / (foldedPlaneW / 2), 2) * 0.032;
        pAttr.setZ(i, z);
      }
      foldedGeom.computeVertexNormals();

      const foldedMat = new THREE.MeshStandardMaterial({
        map: foldedTex,
        transparent: true,
        alphaTest: 0.02,
        roughness: 0.65,
        metalness: 0.0,
        side: THREE.DoubleSide,
      });

      const foldedMesh = new THREE.Mesh(foldedGeom, foldedMat);
      foldedMesh.position.set(0, foldedPlaneH / 2 + 0.008, -0.02);
      foldedMesh.rotation.x = 0.10; // ~6° forward tilt facing camera cleanly
      foldedMesh.castShadow = true;
      stackGroup.add(foldedMesh);

      // Dark rectangular shelf-edge label plaque mounted on front rim of wooden shelf (centered under this item)
      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 440;
      labelCanvas.height = 76;
      const lctx = labelCanvas.getContext('2d');
      if (lctx) {
        lctx.fillStyle = '#1c1d22';
        lctx.fillRect(0, 0, 440, 76);
        lctx.strokeStyle = '#c5a059';
        lctx.lineWidth = 3;
        lctx.strokeRect(4, 4, 432, 68);

        lctx.fillStyle = '#ffffff';
        lctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
        lctx.textAlign = 'center';
        const displayTitle = item.cubbyCol === -1 ? 'RAW INDIGO SELVEDGE' : item.cubbyCol === 0 ? 'STONE BLEACH LOOSE' : 'OBSIDIAN BLACK TWILL';
        lctx.fillText(displayTitle, 220, 36);

        lctx.fillStyle = '#c5a059';
        lctx.font = '600 16px monospace';
        lctx.fillText(`${item.price} • JAPAN ARCHIVE`, 220, 60);
      }
      const labelTex = new THREE.CanvasTexture(labelCanvas);
      labelTex.anisotropy = 16;
      const labelPlate = new THREE.Mesh(
        new THREE.PlaneGeometry(0.30, 0.032),
        new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.25, metalness: 0.2 })
      );
      labelPlate.position.set(colX, shelfSurfaceY - thickness / 2, cupboardD / 2 + 0.003);
      cupboardGroup.add(labelPlate);

      // Save stack reference on item
      item.stackMesh = stackGroup;
      cupboardGroup.add(stackGroup);

      // Invisible Raycast HitBox for this individual product
      const hitGeom = new THREE.BoxGeometry(0.65, rowH * 0.85, cupboardD * 0.92);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitBox = new THREE.Mesh(hitGeom, hitMat);
      hitBox.position.set(colX, shelfSurfaceY + rowH * 0.42, 0.02);
      hitBox.userData = {
        isDenimCubby: true,
        denimItem: item,
      };
      cupboardGroup.add(hitBox);
      this.interactiveMeshes.push(hitBox);
    }

    this.scene.add(cupboardGroup);
  }

  // -----------------------------------------------------------------
  // UNROLL & UNFOLD DENIM ANIMATION ("samne khul kar aayega, samne aake ekdam khulega")
  // -----------------------------------------------------------------
  private unfoldDenimItem(item: DenimCubbyItem) {
    if (this.isDenimUnfolded) {
      this.foldBackDenim();
      return;
    }

    if (!item.stackMesh) return;

    this.isDenimUnfolded = true;
    this.activeUnfoldedDenim = item;

    // Get current world position & rotation of folded shelf stack
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    item.stackMesh.getWorldPosition(worldPos);
    item.stackMesh.getWorldQuaternion(worldQuat);

    this.activeDenimOriginPos.copy(worldPos);
    this.activeDenimOriginQuat.copy(worldQuat);

    // Hide on-shelf stack so it physically "leaves" the shelf
    item.stackMesh.visible = false;

    // Create active flight group in world scene
    const unfoldGroup = new THREE.Group();
    unfoldGroup.position.copy(worldPos);
    unfoldGroup.quaternion.copy(worldQuat);
    this.scene.add(unfoldGroup);
    this.activeUnfoldedGroup = unfoldGroup;

    const textureLoader = new THREE.TextureLoader();

    // 1. Folded sprite mesh (starts visible, cross-fades out in mid-flight)
    const flightW = 0.45;
    const flightH = flightW / (item.foldedAspect || 1.62);
    const foldedTex = textureLoader.load(item.foldedImg);
    foldedTex.colorSpace = THREE.SRGBColorSpace;
    const foldedMat = new THREE.MeshStandardMaterial({
      map: foldedTex,
      transparent: true,
      opacity: 1.0,
      roughness: 0.65,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    });
    const foldedMesh = new THREE.Mesh(new THREE.PlaneGeometry(flightW, flightH), foldedMat);
    foldedMesh.rotation.x = -Math.PI / 2 + 0.92;
    foldedMesh.renderOrder = 9998;
    unfoldGroup.add(foldedMesh);

    // 2. Unfolded full-length jeans mesh (starts collapsed/invisible, unrolls down vertically)
    const unfoldedTex = textureLoader.load(item.unfoldedImg);
    unfoldedTex.colorSpace = THREE.SRGBColorSpace;
    const unfoldedMat = new THREE.MeshStandardMaterial({
      map: unfoldedTex,
      transparent: true,
      opacity: 0.0,
      roughness: 0.65,
      side: THREE.DoubleSide,
      depthTest: false,  // Eliminates clipping through background shelves or walls
      depthWrite: false, // Ensures clean alpha compositing
    });

    // Proportional, scaled-down size so the ENTIRE jeans (waistband to bottom hems) fits completely in frame
    const fullHeight = 0.65;
    const fullWidth = fullHeight * item.unfoldedAspect;

    // Segmented plane with organic fabric wave & curvature
    const unfoldedGeom = new THREE.PlaneGeometry(fullWidth, fullHeight, 16, 28);
    const pos = unfoldedGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      // Realistic garment drape: subtle waistband arch and soft knee forward wave
      const z = Math.sin((y / fullHeight) * Math.PI) * 0.025 - (y / fullHeight) * 0.008;
      pos.setZ(i, z);
    }
    unfoldedGeom.computeVertexNormals();
    // Top waistband pivot (so vertical scaling unrolls from waist downwards!)
    unfoldedGeom.translate(0, -fullHeight / 2, 0);

    const unfoldedMesh = new THREE.Mesh(unfoldedGeom, unfoldedMat);
    unfoldedMesh.position.set(0, fullHeight / 2, 0.01);
    unfoldedMesh.scale.set(0.85, 0.12, 1);
    unfoldedMesh.renderOrder = 9999;
    unfoldGroup.renderOrder = 9999;
    unfoldGroup.add(unfoldedMesh);

    // 3. Calculate target position right in front of camera (1.05m away, perfectly framed without top/bottom cropping)
    const camPos = this.camera.position.clone();
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);

    const targetDist = 1.05;
    const targetPos = camPos.clone().add(camDir.clone().multiplyScalar(targetDist));
    targetPos.y = this.camera.position.y; // Centered vertically in viewport

    // Shift jeans towards the left-center of the screen so the right-side product drawer never overlaps
    const rightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    targetPos.sub(rightVec.clone().multiplyScalar(0.28));

    const targetQuat = this.camera.quaternion.clone();

    // 4. GSAP Timeline: Glide towards camera -> Mid-flight explosive unroll!
    if (this.denimAnimationTimeline) {
      this.denimAnimationTimeline.kill();
    }
    const tl = gsap.timeline();
    this.denimAnimationTimeline = tl;

    // Phase 1: Glide towards camera
    tl.to(unfoldGroup.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 0.72,
      ease: 'power2.out',
    }, 0);

    tl.to(unfoldGroup.quaternion, {
      x: targetQuat.x,
      y: targetQuat.y,
      z: targetQuat.z,
      w: targetQuat.w,
      duration: 0.72,
      ease: 'power2.out',
    }, 0);

    // Phase 2: Unfold in front of viewer ("samne aake ekdam khulega")
    tl.to(foldedMat, {
      opacity: 0,
      duration: 0.26,
      ease: 'power1.inOut',
    }, 0.30);

    tl.to(unfoldedMat, {
      opacity: 1,
      duration: 0.32,
      ease: 'power1.inOut',
    }, 0.30);

    tl.to(unfoldedMesh.scale, {
      y: 1.0,
      duration: 0.70,
      ease: 'back.out(1.4)',
    }, 0.30);

    tl.to(unfoldedMesh.scale, {
      x: 1.0,
      duration: 0.48,
      ease: 'power2.out',
    }, 0.30);

    tl.fromTo(unfoldedMesh.rotation, { x: 0.25 }, { x: 0, duration: 0.55, ease: 'power2.out' }, 0.30);

    tl.call(() => {
      this.showDenimHUD(item);
    }, undefined, 0.65);
  }

  // -----------------------------------------------------------------
  // FOLD & RETURN TO CUPBOARD SHELF
  // -----------------------------------------------------------------
  public foldBackDenim() {
    if (!this.isDenimUnfolded || !this.activeUnfoldedGroup || !this.activeUnfoldedDenim) return;
    this.isDenimUnfolded = false;
    this.hideDenimHUD();

    if (this.denimAnimationTimeline) {
      this.denimAnimationTimeline.kill();
    }
    const tl = gsap.timeline();
    this.denimAnimationTimeline = tl;

    const group = this.activeUnfoldedGroup;
    const item = this.activeUnfoldedDenim;
    const foldedMesh = group.children[0] as THREE.Mesh;
    const foldedMat = foldedMesh.material as THREE.MeshStandardMaterial;
    const unfoldedMesh = group.children[1] as THREE.Mesh;
    const unfoldedMat = unfoldedMesh.material as THREE.MeshStandardMaterial;

    // 1. Fold back down vertically
    tl.to(unfoldedMesh.scale, {
      y: 0.12,
      duration: 0.28,
      ease: 'power2.in',
    }, 0);

    tl.to(unfoldedMat, {
      opacity: 0,
      duration: 0.20,
      ease: 'power1.inOut',
    }, 0.08);

    tl.to(foldedMat, {
      opacity: 1,
      duration: 0.22,
      ease: 'power1.inOut',
    }, 0.10);

    // 2. Flight back straight to its exact cubby compartment in the wooden cupboard
    tl.to(group.position, {
      x: this.activeDenimOriginPos.x,
      y: this.activeDenimOriginPos.y,
      z: this.activeDenimOriginPos.z,
      duration: 0.60,
      ease: 'power2.inOut',
    }, 0.10);

    tl.to(group.quaternion, {
      x: this.activeDenimOriginQuat.x,
      y: this.activeDenimOriginQuat.y,
      z: this.activeDenimOriginQuat.z,
      w: this.activeDenimOriginQuat.w,
      duration: 0.60,
      ease: 'power2.inOut',
      onComplete: () => {
        if (item.stackMesh) item.stackMesh.visible = true;
        this.scene.remove(group);
        this.activeUnfoldedGroup = null;
        this.activeUnfoldedDenim = null;
      },
    }, 0.10);
  }

  private setDenimCubbyHover(item: DenimCubbyItem) {
    if (this.hoveredDenimItem?.id === item.id) return;
    this.clearDenimCubbyHover();
    this.hoveredDenimItem = item;
    if (item.stackMesh && !this.isDenimUnfolded && item.shelfRestY !== undefined) {
      gsap.to(item.stackMesh.position, {
        y: item.shelfRestY + 0.04,
        duration: 0.25,
        ease: 'power2.out',
      });
      gsap.to(item.stackMesh.scale, {
        x: 1.04,
        y: 1.04,
        z: 1.04,
        duration: 0.25,
        ease: 'power2.out',
      });
    }
  }

  private clearDenimCubbyHover() {
    if (!this.hoveredDenimItem) return;
    const item = this.hoveredDenimItem;
    this.hoveredDenimItem = null;
    if (item.stackMesh && !this.isDenimUnfolded && item.shelfRestY !== undefined) {
      gsap.to(item.stackMesh.position, {
        y: item.shelfRestY,
        duration: 0.25,
        ease: 'power2.out',
      });
      gsap.to(item.stackMesh.scale, {
        x: 1.0,
        y: 1.0,
        z: 1.0,
        duration: 0.25,
        ease: 'power2.out',
      });
    }
  }

  private showDenimHUD(item: DenimCubbyItem) {
    this.hideDenimHUD();

    const hud = document.createElement('div');
    hud.className =
      'fixed top-0 right-0 h-full w-[350px] max-w-[85vw] z-50 bg-zinc-950/95 text-white backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col justify-between p-5 select-none animate-in slide-in-from-right duration-300 pointer-events-auto overflow-y-auto';
    hud.innerHTML = `
      <div class="flex flex-col">
        <!-- Top Bar -->
        <div class="flex items-center justify-between pb-3 border-b border-white/10">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span class="text-[10px] font-mono tracking-widest uppercase text-zinc-400">DENIM ARCHIVE LAB</span>
          </div>
          <button id="close-denim-btn" class="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer">
            ✕
          </button>
        </div>

        <!-- Product Title & Info -->
        <div class="mt-4 flex flex-col gap-1 text-left">
          <span class="text-[10px] font-mono tracking-widest text-amber-400/90 uppercase">${item.subname}</span>
          <h2 class="text-lg font-bold font-sans tracking-wide leading-snug text-white">${item.name}</h2>
          <div class="mt-1 text-xl font-bold font-mono text-amber-300">${item.price}</div>
        </div>

        <!-- Size Options -->
        <div class="mt-3.5 flex flex-col gap-1.5 text-left">
          <span class="text-[10px] font-mono text-zinc-400 tracking-wider">SELECT WAIST SIZE</span>
          <div class="flex items-center gap-2" id="size-options-container">
            <button class="px-2.5 py-1 text-xs rounded border border-white/20 bg-white/5 hover:bg-white/15 text-zinc-300 cursor-pointer transition-all">28</button>
            <button class="px-2.5 py-1 text-xs rounded border border-amber-400 bg-amber-400/10 text-amber-300 font-bold cursor-pointer transition-all">30</button>
            <button class="px-2.5 py-1 text-xs rounded border border-white/20 bg-white/5 hover:bg-white/15 text-zinc-300 cursor-pointer transition-all">32</button>
            <button class="px-2.5 py-1 text-xs rounded border border-white/20 bg-white/5 hover:bg-white/15 text-zinc-300 cursor-pointer transition-all">34</button>
            <button class="px-2.5 py-1 text-xs rounded border border-white/20 bg-white/5 hover:bg-white/15 text-zinc-300 cursor-pointer transition-all">36</button>
          </div>
        </div>

        <!-- Divider -->
        <div class="my-3.5 h-[1px] bg-gradient-to-r from-white/15 to-transparent"></div>

        <!-- Specifications List -->
        <div class="flex flex-col gap-2 text-xs text-zinc-300 font-sans text-left">
          <div class="flex justify-between py-1 border-b border-white/5">
            <span class="text-zinc-500 font-mono text-[11px]">FIT / CUT</span>
            <span class="font-medium text-white text-[11px]">${item.fit}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-white/5">
            <span class="text-zinc-500 font-mono text-[11px]">FABRIC WEAVE</span>
            <span class="font-medium text-white text-[11px]">Japanese Kurabo Selvedge</span>
          </div>
          <div class="flex justify-between py-1 border-b border-white/5">
            <span class="text-zinc-500 font-mono text-[11px]">LOOM CRAFT</span>
            <span class="font-medium text-white text-[11px]">Vintage Toyoda Shuttle Loom</span>
          </div>
          <div class="flex justify-between py-1 border-b border-white/5">
            <span class="text-zinc-500 font-mono text-[11px]">HARDWARE</span>
            <span class="font-medium text-white text-[11px]">Copper Rivets & Leather Patch</span>
          </div>
          <div class="flex justify-between py-1 border-b border-white/5">
            <span class="text-zinc-500 font-mono text-[11px]">STATUS</span>
            <span class="font-medium text-emerald-400 text-[11px] flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Tokyo & Oregon Vault In-Stock
            </span>
          </div>
        </div>
      </div>

      <!-- Action Buttons (Positioned comfortably inside drawer with bottom margin) -->
      <div class="pt-3 border-t border-white/10 flex flex-col gap-2 mt-4 pb-2">
        <button id="add-to-wardrobe-btn" class="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-zinc-950 font-bold text-xs font-mono tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 cursor-pointer">
          <span>ADD TO WARDROBE • ${item.price}</span>
        </button>
        <button id="fold-return-btn" class="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white/90 font-medium text-xs font-sans tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/10">
          <span>FOLD & RETURN TO SHELF</span>
          <span class="text-zinc-400 text-xs">✕</span>
        </button>
      </div>
    `;

    // Size selection handler
    hud.querySelectorAll('#size-options-container button').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        hud.querySelectorAll('#size-options-container button').forEach((b) => {
          b.className = 'px-2.5 py-1 text-xs rounded border border-white/20 bg-white/5 hover:bg-white/15 text-zinc-300 cursor-pointer transition-all';
        });
        (btn as HTMLButtonElement).className = 'px-2.5 py-1 text-xs rounded border border-amber-400 bg-amber-400/10 text-amber-300 font-bold cursor-pointer transition-all';
      });
    });

    hud.querySelector('#close-denim-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.foldBackDenim();
    });

    hud.querySelector('#fold-return-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.foldBackDenim();
    });

    hud.querySelector('#add-to-wardrobe-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      // Visual feedback on adding to bag
      const btn = hud.querySelector('#add-to-wardrobe-btn') as HTMLButtonElement;
      if (btn) {
        btn.innerHTML = '<span>✓ ADDED TO WARDROBE</span>';
        btn.classList.remove('bg-amber-400', 'hover:bg-amber-300');
        btn.classList.add('bg-emerald-500', 'text-white');
        setTimeout(() => {
          this.foldBackDenim();
        }, 900);
      }
    });

    document.body.appendChild(hud);
    this.denimHUDElement = hud;
  }

  private hideDenimHUD() {
    if (this.denimHUDElement) {
      this.denimHUDElement.remove();
      this.denimHUDElement = null;
    }
  }

  // -----------------------------------------------------------------
  // Interactive Luxury Corner Floor Night Lamp (Near Denim Shelf)
  // -----------------------------------------------------------------
  private buildCornerNightLamp() {
    const lampGroup = new THREE.Group();
    // Positioned in the corner to the left of the denim cupboard
    lampGroup.position.set(6.05, 0, 1.95);

    // 1. Heavy Luxury Metallic Weighted Base
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1f1f23,
      metalness: 0.85,
      roughness: 0.28,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Elegant brushed warm champagne brass
      metalness: 0.88,
      roughness: 0.32,
    });

    // Circular weighted base
    const baseGeom = new THREE.CylinderGeometry(0.22, 0.24, 0.045, 32);
    const baseMesh = new THREE.Mesh(baseGeom, baseMat);
    baseMesh.position.y = 0.0225;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    lampGroup.add(baseMesh);

    // Brass accent ring around base
    const baseRingGeom = new THREE.TorusGeometry(0.22, 0.012, 16, 32);
    baseRingGeom.rotateX(Math.PI / 2);
    const baseRing = new THREE.Mesh(baseRingGeom, brassMat);
    baseRing.position.y = 0.045;
    lampGroup.add(baseRing);

    // 2. Slender Architectural Stem / Pole
    const stemGeom = new THREE.CylinderGeometry(0.014, 0.014, 1.48, 24);
    const stemMesh = new THREE.Mesh(stemGeom, baseMat);
    stemMesh.position.y = 0.045 + 1.48 / 2;
    stemMesh.castShadow = true;
    lampGroup.add(stemMesh);

    // Brass collars on stem (lower, middle, upper)
    const collarGeom = new THREE.CylinderGeometry(0.022, 0.022, 0.035, 20);
    const collar1 = new THREE.Mesh(collarGeom, brassMat);
    collar1.position.y = 0.14;
    lampGroup.add(collar1);

    const collar2 = new THREE.Mesh(collarGeom, brassMat);
    collar2.position.y = 0.88;
    lampGroup.add(collar2);

    const collar3 = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.02, 0.06, 20), brassMat);
    collar3.position.y = 1.51;
    lampGroup.add(collar3);

    // 3. Socket & Light Bulb
    this.nightLampBulbMat = new THREE.MeshBasicMaterial({
      color: 0xfff3e0,
    });
    const bulbGeom = new THREE.SphereGeometry(0.05, 20, 20);
    const bulbMesh = new THREE.Mesh(bulbGeom, this.nightLampBulbMat);
    bulbMesh.position.y = 1.62;
    lampGroup.add(bulbMesh);

    // 4. Elegant Translucent Lampshade (Tapered Cylinder)
    this.nightLampShadeMat = new THREE.MeshStandardMaterial({
      color: 0xf3e5d0,
      emissive: 0xff9922,
      emissiveIntensity: 2.4,
      roughness: 0.60,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const shadeGeom = new THREE.CylinderGeometry(0.18, 0.25, 0.36, 36, 1, true);
    const shadeMesh = new THREE.Mesh(shadeGeom, this.nightLampShadeMat);
    shadeMesh.position.y = 1.66;
    shadeMesh.castShadow = false;
    lampGroup.add(shadeMesh);

    // Brass trim rings at top and bottom of lampshade
    const shadeTopRingGeom = new THREE.TorusGeometry(0.18, 0.008, 12, 36);
    shadeTopRingGeom.rotateX(Math.PI / 2);
    const shadeTopRing = new THREE.Mesh(shadeTopRingGeom, brassMat);
    shadeTopRing.position.y = 1.66 + 0.18;
    lampGroup.add(shadeTopRing);

    const shadeBotRingGeom = new THREE.TorusGeometry(0.25, 0.008, 12, 36);
    shadeBotRingGeom.rotateX(Math.PI / 2);
    const shadeBotRing = new THREE.Mesh(shadeBotRingGeom, brassMat);
    shadeBotRing.position.y = 1.66 - 0.18;
    lampGroup.add(shadeBotRing);

    // Decorative top finial
    const finialGeom = new THREE.SphereGeometry(0.022, 16, 16);
    const finialMesh = new THREE.Mesh(finialGeom, brassMat);
    finialMesh.position.y = 1.66 + 0.20;
    lampGroup.add(finialMesh);

    // 5. Delicate Interactive Pull Chain
    const chainGroup = new THREE.Group();
    chainGroup.position.set(0.08, 1.50, 0);
    const chainCordGeom = new THREE.CylinderGeometry(0.0025, 0.0025, 0.22, 8);
    const chainCord = new THREE.Mesh(chainCordGeom, brassMat);
    chainCord.position.y = -0.11;
    chainGroup.add(chainCord);

    const fobGeom = new THREE.ConeGeometry(0.012, 0.035, 12);
    fobGeom.rotateX(Math.PI);
    const fobMesh = new THREE.Mesh(fobGeom, brassMat);
    fobMesh.position.y = -0.23;
    chainGroup.add(fobMesh);
    this.nightLampPullChain = chainGroup;
    lampGroup.add(chainGroup);

    // 6. Point Light Source (Warm 2700K Glow)
    this.nightLampLight = new THREE.PointLight(0xffa834, 3.2, 8.0, 1.4);
    this.nightLampLight.position.set(0, 1.62, 0);
    this.nightLampLight.castShadow = true;
    this.nightLampLight.shadow.bias = -0.002;
    this.nightLampLight.shadow.mapSize.width = 512;
    this.nightLampLight.shadow.mapSize.height = 512;
    lampGroup.add(this.nightLampLight);

    // 7. Ambient Floor Light Pool (Warm Radial Falloff on Floor)
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 256;
    glowCanvas.height = 256;
    const gctx = glowCanvas.getContext('2d')!;
    const grad = gctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255, 185, 95, 0.65)');
    grad.addColorStop(0.35, 'rgba(255, 170, 75, 0.32)');
    grad.addColorStop(0.7, 'rgba(255, 150, 50, 0.09)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 256, 256);

    const glowTex = new THREE.CanvasTexture(glowCanvas);
    this.nightLampFloorGlowMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      transparent: true,
      opacity: 0.70,
      depthWrite: false,
    });
    const floorGlowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 2.8),
      this.nightLampFloorGlowMat
    );
    floorGlowMesh.rotation.x = -Math.PI / 2;
    floorGlowMesh.position.y = 0.003;
    lampGroup.add(floorGlowMesh);

    // 8. Hit Box for Click & Hover Interaction (Generous invisible cylinder around lamp)
    const hitBoxGeom = new THREE.CylinderGeometry(0.38, 0.38, 1.95, 16);
    const hitBoxMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const hitBox = new THREE.Mesh(hitBoxGeom, hitBoxMat);
    hitBox.position.y = 1.95 / 2;
    hitBox.userData = { isNightLamp: true };
    lampGroup.add(hitBox);
    this.interactiveMeshes.push(hitBox);

    this.scene.add(lampGroup);
  }

  public toggleNightLamp() {
    this.isNightLampOn = !this.isNightLampOn;
    const targetLightIntensity = this.isNightLampOn ? 3.2 : 0;
    const targetEmissive = this.isNightLampOn ? 2.4 : 0.03;
    const targetGlowOpacity = this.isNightLampOn ? 0.70 : 0;

    if (this.nightLampLight) {
      gsap.to(this.nightLampLight, {
        intensity: targetLightIntensity,
        duration: 0.35,
        ease: 'power2.out',
      });
    }

    if (this.nightLampShadeMat) {
      gsap.to(this.nightLampShadeMat, {
        emissiveIntensity: targetEmissive,
        duration: 0.35,
        ease: 'power2.out',
      });
      this.nightLampShadeMat.color.setHex(this.isNightLampOn ? 0xf3e5d0 : 0x4a453f);
    }

    if (this.nightLampBulbMat) {
      this.nightLampBulbMat.color.setHex(this.isNightLampOn ? 0xfff3e0 : 0x222222);
    }

    if (this.nightLampFloorGlowMat) {
      gsap.to(this.nightLampFloorGlowMat, {
        opacity: targetGlowOpacity,
        duration: 0.35,
        ease: 'power2.out',
      });
    }

    // Pull chain tactile wobble animation
    if (this.nightLampPullChain) {
      gsap.killTweensOf(this.nightLampPullChain.rotation);
      gsap.timeline()
        .to(this.nightLampPullChain.position, { y: 1.46, duration: 0.1, ease: 'power1.out' })
        .to(this.nightLampPullChain.position, { y: 1.50, duration: 0.25, ease: 'bounce.out' });
      gsap.fromTo(
        this.nightLampPullChain.rotation,
        { z: 0.22 },
        { z: 0, duration: 0.65, ease: 'elastic.out(1, 0.4)' }
      );
    }

    // Tactile acoustic switch click
    this.playSwitchSound();
  }

  private playSwitchSound() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(this.isNightLampOn ? 920 : 540, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(this.isNightLampOn ? 1400 : 280, ctx.currentTime + 0.035);

      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio context restricted or unavailable
    }
  }

  // -----------------------------------------------------------------
  // CAPS & FOOTWEAR DISPLAYS (On Right Wall)
  // -----------------------------------------------------------------
  private async buildCapsAndShoesDisplays() {
    const displayGroup = new THREE.Group();
    displayGroup.position.set(7.5, 0, 5.0);
    displayGroup.rotation.y = -Math.PI / 2;

    // Minimalist gallery pedestals for caps and sneakers
    const capProd = PRODUCTS.find((p) => p.id === 'prod-cap-heritage');
    if (capProd) {
      const pedestalGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.95, 24);
      const pedMat = new THREE.MeshStandardMaterial({ color: 0x222328, roughness: 0.4 });
      const ped = new THREE.Mesh(pedestalGeom, pedMat);
      ped.position.set(-1.0, 0.475, 0);
      ped.castShadow = true;
      ped.receiveShadow = true;
      displayGroup.add(ped);

      const capAssembly = await createGarmentAssembly(capProd, undefined, false);
      capAssembly.position.set(-1.0, 1.0, 0);
      displayGroup.add(capAssembly);

      capAssembly.traverse((child) => {
        if (child.userData && child.userData.isHitBox) {
          this.interactiveMeshes.push(child);
        }
      });
    }

    const shoeProd = PRODUCTS.find((p) => p.id === 'prod-shoe-airforce');
    if (shoeProd) {
      const pedestalGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.95, 24);
      const pedMat = new THREE.MeshStandardMaterial({ color: 0x222328, roughness: 0.4 });
      const ped = new THREE.Mesh(pedestalGeom, pedMat);
      ped.position.set(1.0, 0.475, 0);
      ped.castShadow = true;
      ped.receiveShadow = true;
      displayGroup.add(ped);

      const shoeAssembly = await createGarmentAssembly(shoeProd, undefined, false);
      shoeAssembly.position.set(1.0, 0.98, 0);
      displayGroup.add(shoeAssembly);

      shoeAssembly.traverse((child) => {
        if (child.userData && child.userData.isHitBox) {
          this.interactiveMeshes.push(child);
        }
      });
    }

    this.scene.add(displayGroup);
  }

  // -----------------------------------------------------------------
  // Input Handling: Safe, Controlled, Gentle Luxury Movement
  // -----------------------------------------------------------------
  private setupEventListeners() {
    const isNavigationKey = (key: string, code: string) => {
      return (
        code === 'KeyW' || code === 'KeyS' || code === 'KeyA' || code === 'KeyD' ||
        code === 'ArrowUp' || code === 'ArrowDown' || code === 'ArrowLeft' || code === 'ArrowRight' ||
        key.toLowerCase() === 'w' || key.toLowerCase() === 's' || key.toLowerCase() === 'a' || key.toLowerCase() === 'd'
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        this.exitPointerLock();
        return;
      }

      if (isNavigationKey(e.key, e.code)) {
        e.preventDefault();
      }

      const key = e.key.toLowerCase();
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || key === 'w') {
        this.moveForward = true;
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown' || key === 's') {
        this.moveBackward = true;
      }
      if (e.code === 'KeyA' || key === 'a') {
        this.moveLeft = true;
      }
      if (e.code === 'KeyD' || key === 'd') {
        this.moveRight = true;
      }
      if (e.code === 'ArrowLeft') {
        this.prevRailGarment();
      }
      if (e.code === 'ArrowRight') {
        this.nextRailGarment();
      }
      if (e.code === 'KeyL' || key === 'l') {
        this.toggleLights();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || key === 'w') {
        this.moveForward = false;
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown' || key === 's') {
        this.moveBackward = false;
      }
      if (e.code === 'KeyA' || key === 'a') {
        this.moveLeft = false;
      }
      if (e.code === 'KeyD' || key === 'd') {
        this.moveRight = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Mouse Wheel: Gentle, Controlled Forward & Backward Gliding
    // (Reduced impulse to 0.40 for relaxed, slow glide requested by user)
    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('aside, .overflow-y-auto, .glass-panel')) {
        return;
      }

      e.preventDefault();
      const cameraLookDir = new THREE.Vector3();
      this.camera.getWorldDirection(cameraLookDir);
      cameraLookDir.y = 0;
      cameraLookDir.normalize();

      // Gentle, luxury speed impulse
      const moveImpulse = -Math.sign(e.deltaY) * 0.40;
      this.velocity.addScaledVector(cameraLookDir, moveImpulse);
    };

    this.container.addEventListener('wheel', onWheel, { passive: false });

    // Pointer Lock Listeners
    const onPointerLockChange = () => {
      const isCurrentlyLocked = document.pointerLockElement === this.renderer.domElement;
      this.isLocked = isCurrentlyLocked;
      this.callbacks.onPointerLockChange?.(isCurrentlyLocked);
    };

    const onPointerLockError = () => {
      this.isLocked = false;
      this.callbacks.onPointerLockChange?.(false);
    };

    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('pointerlockerror', onPointerLockError);

    // Drag-to-Look Mouse Controls
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let startPointerX = 0;
    let startPointerY = 0;
    let hasDragged = false;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, nav, header, aside, .glass-panel')) {
        return;
      }

      if (e.button === 0) {
        isMouseDown = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
        startPointerX = e.clientX;
        startPointerY = e.clientY;
        hasDragged = false;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (this.isLocked) {
        const movementX = e.movementX || 0;
        const movementY = e.movementY || 0;
        this.rotateCamera(movementX, movementY);
      } else if (isMouseDown) {
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
        if (Math.hypot(e.clientX - startPointerX, e.clientY - startPointerY) > 5) {
          hasDragged = true;
        }
        this.rotateCamera(dx, dy);
      }

      this.checkRaycastHover();
    };

    const onPointerUp = () => {
      isMouseDown = false;
    };

    // Canvas Click: Garment or Bag selection
    const onCanvasClick = (e: MouseEvent) => {
      // If user was dragging to rotate camera, ignore click!
      if (hasDragged) {
        hasDragged = false;
        return;
      }

      const target = e.target as HTMLElement;
      if (target.closest('button, nav, header, aside, .glass-panel')) {
        return;
      }

      // If a denim item is currently unfolded in front of camera, any canvas click folds it back!
      if (this.isDenimUnfolded) {
        this.foldBackDenim();
        return;
      }

      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;

        // Check if user clicked the corner night lamp!
        if (hit.userData && hit.userData.isNightLamp) {
          this.toggleNightLamp();
          return;
        }

        // Check if user clicked a denim cubby compartment!
        if (hit.userData && hit.userData.isDenimCubby && hit.userData.denimItem) {
          this.unfoldDenimItem(hit.userData.denimItem);
          return;
        }

        if (hit.userData && hit.userData.product) {
          const product = hit.userData.product as Product;

          // For clothing rail garments: focus/flip on rail only, DO NOT auto-open drawer!
          if (product.category === 'Clothing' && product.railIndex !== undefined) {
            this.focusRailGarment(product.railIndex);
            return;
          }
        }
      }
    };

    this.container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    this.container.addEventListener('click', onCanvasClick);

    const onResize = () => {
      if (this.isDisposed) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
  }

  public requestPointerLock() {
    try {
      this.renderer.domElement.requestPointerLock();
    } catch (err) {
      console.warn('requestPointerLock error:', err);
    }
  }

  public exitPointerLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    this.isLocked = false;
    this.callbacks.onPointerLockChange?.(false);
  }

  public rotateCamera(deltaX: number, deltaY: number) {
    if (this.isTransitioning) return;
    const sensitivity = 0.0018;
    this.targetEuler.y -= deltaX * sensitivity;
    this.targetEuler.x -= deltaY * sensitivity;
    this.targetEuler.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.targetEuler.x));
  }

  public toggleLights(forcedState?: boolean) {
    this.lightsOn = forcedState !== undefined ? forcedState : !this.lightsOn;
    const targetIntensity = this.lightsOn ? 2.25 : 0.85;
    this.ambientLight.intensity = targetIntensity;
    this.dirLight.intensity = this.lightsOn ? 2.15 : 0.75;
    this.railSpotlights.forEach((sp) => {
      sp.intensity = this.lightsOn ? 2.8 : 0.9;
    });
    this.shelfSpotlights.forEach((sp) => {
      sp.intensity = this.lightsOn ? 2.2 : 0.7;
    });
    this.ringPointLights.forEach((pl) => {
      const base = (pl.userData.baseIntensity as number) || 2.8;
      pl.intensity = this.lightsOn ? base : 0.7;
    });
    this.ringEmissiveMaterials.forEach((mat) => {
      mat.emissiveIntensity = this.lightsOn ? 3.8 : 1.0;
    });
    this.callbacks.onLightsToggle?.(this.lightsOn);
  }

  // Smooth Travel to a Camera Spot (e.g. Clothing Rail, Bags Shelf, Caps, Shoes)
  public travelToSpot(cameraPos: [number, number, number], cameraTarget: [number, number, number]) {
    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.transitionStartPos.copy(this.camera.position);
    this.transitionTargetPos.set(cameraPos[0], cameraPos[1], cameraPos[2]);

    const targetDir = new THREE.Vector3(
      cameraTarget[0] - cameraPos[0],
      cameraTarget[1] - cameraPos[1],
      cameraTarget[2] - cameraPos[2]
    ).normalize();

    this.transitionStartLook.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.transitionTargetLook.copy(targetDir);
  }

  private checkRaycastHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;

      // Night lamp hover feedback
      if (hit.userData && hit.userData.isNightLamp) {
        this.container.style.cursor = 'pointer';
        this.clearDenimCubbyHover();
        if (this.hoveredProduct) {
          this.hoveredProduct = null;
          this.callbacks.onProductHover(null);
          this.reset3DHoverSimulation();
        }
        return;
      }

      // Denim cubby hover feedback
      if (hit.userData && hit.userData.isDenimCubby && hit.userData.denimItem) {
        this.container.style.cursor = 'pointer';
        this.setDenimCubbyHover(hit.userData.denimItem);
        if (this.hoveredProduct) {
          this.hoveredProduct = null;
          this.callbacks.onProductHover(null);
          this.reset3DHoverSimulation();
        }
        return;
      } else {
        this.clearDenimCubbyHover();
      }

      const product = hit.userData.product as Product;

      if (product && this.hoveredProduct?.id !== product.id) {
        this.hoveredProduct = product;
        this.container.style.cursor = 'pointer';
        this.callbacks.onProductHover(product);

        // Apply Hanging Cloth shifting & flipping simulation to 3D rail garments!
        if (product.category === 'Clothing' && product.railIndex !== undefined) {
          this.apply3DHoverSimulation(product.railIndex);
        }
      }
    } else {
      this.clearDenimCubbyHover();
      if (this.hoveredProduct) {
        this.hoveredProduct = null;
        this.container.style.cursor = 'default';
        this.callbacks.onProductHover(null);
        this.reset3DHoverSimulation();
      }
    }
  }

  // 3D Hanging Cloth Shift & Flip Simulation with Fluid Inertial Motion
  private apply3DHoverSimulation(activeIdx: number) {
    const shiftDist = 0.42; // Generous space for front-facing cloth

    this.railGarments.forEach((entry, i) => {
      if (i === activeIdx) {
        // FLIP TO FRONT VIEW!
        entry.targetOpacityFront = 1.0;
        entry.targetOpacitySide = 0.0;
        entry.targetScale = 1.09;
        entry.targetZ = entry.initialZ + 0.18;
        entry.targetY = entry.initialY + 0.025;
        entry.targetX = entry.initialX;
        if (entry.titleMesh) entry.titleMesh.visible = true;
      } else {
        // STAY IN SIDE VIEW & SLIDE ASIDE TO SIDES
        entry.targetOpacityFront = 0.0;
        entry.targetOpacitySide = 1.0;
        entry.targetScale = 1.0;
        entry.targetZ = entry.initialZ;
        entry.targetY = entry.initialY;

        // Smooth decaying ripple displacement: closest clothes move the most
        if (i < activeIdx) {
          const distFactor = Math.pow(0.80, activeIdx - i - 1);
          entry.targetX = entry.initialX - (shiftDist * distFactor);
        } else {
          const distFactor = Math.pow(0.80, i - activeIdx - 1);
          entry.targetX = entry.initialX + (shiftDist * distFactor);
        }
        if (entry.titleMesh) entry.titleMesh.visible = false;
      }
    });
  }

  private reset3DHoverSimulation() {
    this.railGarments.forEach((entry) => {
      // Return ALL items to default side view & original spacing
      entry.targetX = entry.initialX;
      entry.targetY = entry.initialY;
      entry.targetZ = entry.initialZ;
      entry.targetScale = 1.0;
      entry.targetOpacityFront = 0.0;
      entry.targetOpacitySide = 1.0;
      if (entry.titleMesh) entry.titleMesh.visible = false;
    });
  }

  // -----------------------------------------------------------------
  // Smooth Physics Movement: Slower, Gentle, Controlled Luxury Pace
  // -----------------------------------------------------------------
  private updateMovement(dt: number) {
    // 1. Smooth Camera Look Lerp
    this.euler.y = THREE.MathUtils.lerp(this.euler.y, this.targetEuler.y, Math.min(1, dt * 14));
    this.euler.x = THREE.MathUtils.lerp(this.euler.x, this.targetEuler.x, Math.min(1, dt * 14));
    this.camera.quaternion.setFromEuler(this.euler);

    // 2. Exact Forward & Right Horizontal Vectors
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3(-forward.z, 0, forward.x).normalize();

    // 3. Gentle Acceleration (slower and comfortable)
    const accel = this.walkSpeed * 5.0;

    if (this.moveForward) {
      this.velocity.addScaledVector(forward, accel * dt);
    }
    if (this.moveBackward) {
      this.velocity.addScaledVector(forward, -accel * dt);
    }
    if (this.moveRight) {
      this.velocity.addScaledVector(right, accel * dt);
    }
    if (this.moveLeft) {
      this.velocity.addScaledVector(right, -accel * dt);
    }

    // 4. Smooth Damping (decay velocity smoothly without sliding)
    const damping = Math.pow(0.008, dt);
    this.velocity.x *= damping;
    this.velocity.z *= damping;

    // 5. Apply Movement
    this.camera.position.addScaledVector(this.velocity, dt);

    // Showroom Boundaries (Prevent walking outside the boutique room)
    const minX = -5.8;
    const maxX = 5.8;
    const minZ = 1.0;
    const maxZ = 7.5;

    this.camera.position.x = Math.max(minX, Math.min(maxX, this.camera.position.x));
    this.camera.position.z = Math.max(minZ, Math.min(maxZ, this.camera.position.z));
    this.camera.position.y = this.eyeHeight;
  }

  // -----------------------------------------------------------------
  // Main Animation Loop
  // -----------------------------------------------------------------
  private animate = () => {
    if (this.isDisposed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const dt = Math.min(this.clock.getDelta(), 0.1);

    // 1. Camera Fast Travel Animation
    if (this.isTransitioning) {
      this.transitionProgress += dt * 1.8;
      const t = Math.min(1, this.transitionProgress);
      // Smooth cubic ease out
      const ease = 1 - Math.pow(1 - t, 3);

      this.camera.position.lerpVectors(this.transitionStartPos, this.transitionTargetPos, ease);

      const currentLook = new THREE.Vector3().lerpVectors(
        this.transitionStartLook,
        this.transitionTargetLook,
        ease
      ).normalize();

      const lookTarget = this.camera.position.clone().add(currentLook);
      this.camera.lookAt(lookTarget);

      if (t >= 1) {
        this.isTransitioning = false;
        this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
        this.targetEuler.copy(this.euler);
      }
    } else {
      this.updateMovement(dt);
    }

    // 2. Animate Rail Garments with Fluid Inertia & Pendulum Sway Physics
    const clampedDt = Math.min(0.04, Math.max(0.005, dt));
    const xSpringFactor = 1 - Math.pow(0.89, clampedDt * 60);
    const zSpringFactor = 1 - Math.pow(0.85, clampedDt * 60);
    const fadeFactor = 1 - Math.pow(0.80, clampedDt * 60);

    this.railGarments.forEach((entry) => {
      // 1. Horizontal Motion & Velocity Calculation
      const prevX = entry.currentX;
      entry.currentX += (entry.targetX - entry.currentX) * xSpringFactor;
      entry.group.position.x = entry.currentX;

      const vx = (entry.currentX - prevX) / clampedDt;
      const ax = (vx - entry.prevVx) / clampedDt;
      entry.prevVx = vx;

      // 2. Realistic Pendulum Swing (Cloth lags behind sliding hook, then sways back)
      const inertiaTorque = -ax * 0.038;
      const restoringTorque = -entry.angleZ * 22.0;

      entry.angVel += (inertiaTorque + restoringTorque) * clampedDt;
      // Air + fabric damping (velvety soft decay)
      entry.angVel *= Math.pow(0.86, clampedDt * 60);
      entry.angleZ += entry.angVel * clampedDt;

      // Clamp sway angle to natural boutique limit (+/- 7.5 degrees)
      entry.angleZ = THREE.MathUtils.clamp(entry.angleZ, -0.13, 0.13);
      entry.group.rotation.z = entry.angleZ;

      // 3. Elevation & Forward Step (+Z, +Y)
      entry.currentY += (entry.targetY - entry.currentY) * zSpringFactor;
      entry.group.position.y = entry.currentY;

      entry.currentZ += (entry.targetZ - entry.currentZ) * zSpringFactor;
      entry.group.position.z = entry.currentZ;

      // 4. Scale Lerp
      entry.currentScale += (entry.targetScale - entry.currentScale) * zSpringFactor;
      entry.group.scale.setScalar(entry.currentScale);

      // 5. Silky Cross-fade between side profile and front view
      if (entry.sideMesh) {
        entry.currentOpacitySide += (entry.targetOpacitySide - entry.currentOpacitySide) * fadeFactor;
        (entry.sideMesh.material as THREE.MeshBasicMaterial).opacity = entry.currentOpacitySide;
      }
      if (entry.frontMesh) {
        entry.currentOpacityFront += (entry.targetOpacityFront - entry.currentOpacityFront) * fadeFactor;
        (entry.frontMesh.material as THREE.MeshBasicMaterial).opacity = entry.currentOpacityFront;
      }
    });

    // Subtle idle floating motion when denim is unfolded in front of camera
    if (this.isDenimUnfolded && this.activeUnfoldedGroup && (!this.denimAnimationTimeline || !this.denimAnimationTimeline.isActive())) {
      this.activeUnfoldedGroup.position.y += Math.sin(time * 2.2) * 0.0006;
    }

    // 3. Render
    this.renderer.render(this.scene, this.camera);

    // 4. Measure FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 500) {
      const measuredFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
      this.callbacks.onFpsUpdate?.(measuredFps);
      this.frameCount = 0;
      this.lastFpsTime = now;
    }
  };

  public setQuality(quality: 'high' | 'medium' | 'low') {
    if (quality === 'low') {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
    } else if (quality === 'medium') {
      this.renderer.setPixelRatio(1.25);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
    } else {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
  }

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.animationFrameId);
    this.hideDenimHUD();
    if (this.denimAnimationTimeline) {
      this.denimAnimationTimeline.kill();
    }
    this.exitPointerLock();
    this.renderer.dispose();
  }
}
