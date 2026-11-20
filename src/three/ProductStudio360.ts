import * as THREE from 'three';
import { Product } from '../data/products';
import { createGarmentAssembly, brassHardwareMaterial } from './GarmentFactory';

export class ProductStudio360 {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private product: Product;
  private garmentGroup: THREE.Group | null = null;

  // Orbit controls state
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private spherical = new THREE.Spherical(2.2, Math.PI / 2, 0);
  private targetSpherical = new THREE.Spherical(2.2, Math.PI / 2, 0);
  private cameraTarget = new THREE.Vector3(0, 0, 0);

  // Turntable rotation
  public autoRotate = true;
  private autoRotateSpeed = 0.45;

  private clock = new THREE.Clock();
  private animationFrameId = 0;
  private isDisposed = false;

  constructor(container: HTMLElement, product: Product, initialColor?: string) {
    this.container = container;
    this.product = product;

    // 1. Studio Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0d11);

    // 2. Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 50);
    this.updateCameraPosition();

    // 3. High-Quality WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true, // for clean PNG snapshots
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Studio Lighting & Turntable Floor
    this.buildStudioEnvironment();

    // 5. Load the Actual 3D Garment
    this.loadGarment(initialColor);

    // 6. User Interactions
    this.setupListeners();

    // 7. Loop
    this.animate();
  }

  private buildStudioEnvironment() {
    // 1. Studio Soft Ambient
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);

    // 2. Main High-CRI Key Light
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 3.2);
    keyLight.position.set(2.5, 4.0, 3.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0004;
    this.scene.add(keyLight);

    // 3. Rim / Silhouette Backlight (Accentuates fabric edges)
    const rimLight = new THREE.DirectionalLight(0xd4af37, 2.5);
    rimLight.position.set(-3.0, 3.5, -3.5);
    this.scene.add(rimLight);

    // 4. Fill Light
    const fillLight = new THREE.DirectionalLight(0x8fa3bf, 1.2);
    fillLight.position.set(-2.5, 1.5, 2.5);
    this.scene.add(fillLight);

    // 5. Studio Pedestal / Turntable Disk
    const turntableGeom = new THREE.CylinderGeometry(1.0, 1.05, 0.04, 64);
    const turntableMat = new THREE.MeshStandardMaterial({
      color: 0x14151a,
      roughness: 0.35,
      metalness: 0.4,
    });
    const turntable = new THREE.Mesh(turntableGeom, turntableMat);
    turntable.position.set(0, -0.92, 0);
    turntable.receiveShadow = true;
    this.scene.add(turntable);

    // Brass outer ring
    const ringGeom = new THREE.TorusGeometry(1.02, 0.012, 16, 64);
    ringGeom.rotateX(Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeom, brassHardwareMaterial);
    ringMesh.position.set(0, -0.90, 0);
    this.scene.add(ringMesh);
  }

  public async loadGarment(colorHex?: string) {
    if (this.garmentGroup) {
      this.scene.remove(this.garmentGroup);
    }

    const assembly = await createGarmentAssembly(this.product, colorHex, true, true);
    // Center assembly at origin for ideal rotation
    assembly.position.set(0, 0.45, 0);
    this.garmentGroup = assembly;
    this.scene.add(assembly);
  }

  // Live Color Swatch updates inside the 360 viewer
  public async setColor(colorHex: string) {
    await this.loadGarment(colorHex);
  }

  // Camera Orbit Listeners
  private setupListeners() {
    const onMouseDown = (e: MouseEvent) => {
      this.isDragging = true;
      this.autoRotate = false; // stop auto-spin on manual user drag
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isDragging) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      const rotSpeed = 0.007;
      this.targetSpherical.theta -= deltaX * rotSpeed;
      this.targetSpherical.phi -= deltaY * rotSpeed;

      // Restrict pitch angle so camera does not flip upside-down
      this.targetSpherical.phi = Math.max(0.2, Math.min(Math.PI - 0.2, this.targetSpherical.phi));

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      this.isDragging = false;
    };

    // Zoom on wheel
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 1 + e.deltaY * 0.0012;
      this.targetSpherical.radius = Math.max(1.1, Math.min(4.2, this.targetSpherical.radius * zoomFactor));
    };

    // Touch Support for Mobile
    let prevTouchX = 0;
    let prevTouchY = 0;
    let initialTouchDist = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.autoRotate = false;
        prevTouchX = e.touches[0].clientX;
        prevTouchY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        initialTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && this.isDragging) {
        const deltaX = e.touches[0].clientX - prevTouchX;
        const deltaY = e.touches[0].clientY - prevTouchY;
        this.targetSpherical.theta -= deltaX * 0.008;
        this.targetSpherical.phi -= deltaY * 0.008;
        this.targetSpherical.phi = Math.max(0.2, Math.min(Math.PI - 0.2, this.targetSpherical.phi));
        prevTouchX = e.touches[0].clientX;
        prevTouchY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const ratio = initialTouchDist / dist;
        this.targetSpherical.radius = Math.max(1.1, Math.min(4.2, this.targetSpherical.radius * ratio));
        initialTouchDist = dist;
      }
    };

    const onTouchEnd = () => {
      this.isDragging = false;
    };

    this.container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    this.container.addEventListener('wheel', onWheel, { passive: false });

    this.container.addEventListener('touchstart', onTouchStart, { passive: true });
    this.container.addEventListener('touchmove', onTouchMove, { passive: true });
    this.container.addEventListener('touchend', onTouchEnd);

    // Resize
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

  // Camera Presets
  public setViewAngle(angle: 'front' | 'back' | 'left' | 'right' | 'top' | 'reset') {
    this.autoRotate = false;
    switch (angle) {
      case 'front':
        this.targetSpherical.theta = 0;
        this.targetSpherical.phi = Math.PI / 2;
        break;
      case 'back':
        this.targetSpherical.theta = Math.PI;
        this.targetSpherical.phi = Math.PI / 2;
        break;
      case 'left':
        this.targetSpherical.theta = Math.PI / 2;
        this.targetSpherical.phi = Math.PI / 2;
        break;
      case 'right':
        this.targetSpherical.theta = -Math.PI / 2;
        this.targetSpherical.phi = Math.PI / 2;
        break;
      case 'top':
        this.targetSpherical.theta = 0;
        this.targetSpherical.phi = Math.PI / 4.5;
        break;
      case 'reset':
        this.targetSpherical.theta = 0;
        this.targetSpherical.phi = Math.PI / 2;
        this.targetSpherical.radius = 2.2;
        this.autoRotate = true;
        break;
    }
  }

  // High-Res Snapshot
  public captureSnapshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  private updateCameraPosition() {
    this.camera.position.setFromSpherical(this.spherical);
    this.camera.position.add(this.cameraTarget);
    this.camera.lookAt(this.cameraTarget);
  }

  private animate = () => {
    if (this.isDisposed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const dt = this.clock.getDelta();

    // Auto rotate if enabled
    if (this.autoRotate && !this.isDragging) {
      this.targetSpherical.theta += this.autoRotateSpeed * dt;
    }

    // Smooth dampening towards target spherical coordinates
    this.spherical.theta = THREE.MathUtils.lerp(this.spherical.theta, this.targetSpherical.theta, 0.1);
    this.spherical.phi = THREE.MathUtils.lerp(this.spherical.phi, this.targetSpherical.phi, 0.1);
    this.spherical.radius = THREE.MathUtils.lerp(this.spherical.radius, this.targetSpherical.radius, 0.1);

    this.updateCameraPosition();
    this.renderer.render(this.scene, this.camera);
  };

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.animationFrameId);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
