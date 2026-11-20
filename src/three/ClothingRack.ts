import * as THREE from 'three';
import { Product } from '../data/products';
import { createGarmentAssembly, brassHardwareMaterial, gunmetalHardwareMaterial } from './GarmentFactory';

export interface ClothingRackOptions {
  railLength?: number;
  railHeight?: number;
  spacing?: number;
  style?: 'brass' | 'gunmetal';
  sectionTitle?: string;
}

export class ClothingRack {
  public group: THREE.Group;
  public garmentGroups: THREE.Group[] = [];
  public railHeight: number;
  private options: ClothingRackOptions;
  private swayClocks: number[] = [];

  constructor(options: ClothingRackOptions = {}) {
    this.options = {
      railLength: options.railLength || 3.8,
      railHeight: options.railHeight || 1.95,
      spacing: options.spacing || 0.54,
      style: options.style || 'brass',
      sectionTitle: options.sectionTitle || '',
    };
    this.railHeight = this.options.railHeight!;
    this.group = new THREE.Group();
    this.buildRackStructure();
  }

  private buildRackStructure() {
    const L = this.options.railLength!;
    const H = this.options.railHeight!;
    const R = 0.02; // 40mm diameter luxury rail
    const mat = this.options.style === 'brass' ? brassHardwareMaterial : gunmetalHardwareMaterial;

    // 1. Long horizontal hanging rail (where hangers sit)
    const railGeom = new THREE.CylinderGeometry(R, R, L, 32);
    railGeom.rotateZ(Math.PI / 2);
    const railMesh = new THREE.Mesh(railGeom, mat);
    railMesh.position.set(0, H, 0);
    railMesh.castShadow = true;
    this.group.add(railMesh);

    // Turned brass decorative end finials
    [-L / 2, L / 2].forEach((x, idx) => {
      const finialGeom = new THREE.CylinderGeometry(R * 1.35, R * 1.35, 0.04, 24);
      finialGeom.rotateZ(Math.PI / 2);
      const finialMesh = new THREE.Mesh(finialGeom, mat);
      finialMesh.position.set(x + (idx === 0 ? -0.02 : 0.02), H, 0);
      this.group.add(finialMesh);

      const capGeom = new THREE.SphereGeometry(R * 1.1, 16, 16);
      const capMesh = new THREE.Mesh(capGeom, mat);
      capMesh.position.set(x + (idx === 0 ? -0.04 : 0.04), H, 0);
      this.group.add(capMesh);
    });

    // 2. Vertical support stanchions on both ends
    const legXOffset = L / 2 - 0.12;
    [-legXOffset, legXOffset].forEach((x) => {
      // Main vertical pillar
      const legGeom = new THREE.CylinderGeometry(R, R, H - 0.08, 24);
      const legMesh = new THREE.Mesh(legGeom, mat);
      legMesh.position.set(x, (H - 0.08) / 2 + 0.08, 0);
      legMesh.castShadow = true;
      this.group.add(legMesh);

      // Top corner elbow joint collar
      const collarGeom = new THREE.CylinderGeometry(R * 1.3, R * 1.3, 0.06, 24);
      const collarMesh = new THREE.Mesh(collarGeom, mat);
      collarMesh.position.set(x, H, 0);
      this.group.add(collarMesh);

      // Bottom weighted luxury outrigger foot / base
      const footGeom = new THREE.BoxGeometry(0.06, 0.04, 0.58);
      const footMesh = new THREE.Mesh(footGeom, mat);
      footMesh.position.set(x, 0.02, 0);
      footMesh.castShadow = true;
      this.group.add(footMesh);

      // Foot leveling caps in brass
      [-0.26, 0.26].forEach((fz) => {
        const discGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.012, 16);
        const discMesh = new THREE.Mesh(discGeom, brassHardwareMaterial);
        discMesh.position.set(x, 0.006, fz);
        this.group.add(discMesh);
      });
    });

    // 3. Lower stability crossbar near floor
    const lowBarGeom = new THREE.CylinderGeometry(R * 0.75, R * 0.75, legXOffset * 2, 24);
    lowBarGeom.rotateZ(Math.PI / 2);
    const lowBarMesh = new THREE.Mesh(lowBarGeom, mat);
    lowBarMesh.position.set(0, 0.18, 0);
    this.group.add(lowBarMesh);

    // 4. Luxury Floating Section Title Signage above the rack
    if (this.options.sectionTitle) {
      const signGroup = this.createSectionSignage(this.options.sectionTitle, H + 0.35);
      this.group.add(signGroup);
    }
  }

  private createSectionSignage(title: string, yPos: number): THREE.Group {
    const signGroup = new THREE.Group();

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;

    // Transparent canvas with crisp illuminated golden lettering
    ctx.clearRect(0, 0, 1024, 160);

    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 44px "Syncopate", sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '10px';
    ctx.fillText(title.toUpperCase(), 512, 90);

    // Subtle underline
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(320, 115);
    ctx.lineTo(704, 115);
    ctx.stroke();

    const signTexture = new THREE.CanvasTexture(canvas);
    signTexture.anisotropy = 8;

    const signGeom = new THREE.PlaneGeometry(1.6, 0.25);
    const signMat = new THREE.MeshBasicMaterial({
      map: signTexture,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const signMesh = new THREE.Mesh(signGeom, signMat);
    signMesh.position.set(0, yPos, 0);
    signGroup.add(signMesh);

    // Small brass hanging wire to rack
    [-0.55, 0.55].forEach((wx) => {
      const wireCurve = new THREE.LineCurve3(
        new THREE.Vector3(wx, yPos - 0.08, 0),
        new THREE.Vector3(wx, this.railHeight + 0.03, 0)
      );
      const wireGeom = new THREE.TubeGeometry(wireCurve, 4, 0.0015, 6, false);
      const wireMesh = new THREE.Mesh(wireGeom, brassHardwareMaterial);
      signGroup.add(wireMesh);
    });

    return signGroup;
  }

  // Populate rack with garments
  public async loadGarments(products: Product[]): Promise<void> {
    const count = products.length;
    if (count === 0) return;

    const spacing = this.options.spacing!;
    const totalSpan = (count - 1) * spacing;
    const startX = -totalSpan / 2;
    const railY = this.railHeight;

    for (let i = 0; i < count; i++) {
      const product = products[i];
      const garment = await createGarmentAssembly(product, undefined, true, true);

      // Placement along the horizontal rod
      const posX = startX + i * spacing;
      // Slight natural variation in hanging angle (-0.03 to 0.03 rad)
      const naturalAngle = (Math.sin(i * 1.7) * 0.04);

      garment.position.set(posX, railY, 0);
      garment.rotation.set(0, naturalAngle, 0);

      this.group.add(garment);
      this.garmentGroups.push(garment);
      this.swayClocks.push(Math.random() * Math.PI * 2);
    }
  }

  // Subtle physics micro-sway update loop (gentle ambient store airflow)
  public update(time: number, dt: number) {
    for (let i = 0; i < this.garmentGroups.length; i++) {
      const garment = this.garmentGroups[i];
      if (!garment) continue;

      // Organic subtle sway frequency and amplitude
      const phase = this.swayClocks[i];
      const swayZ = Math.sin(time * 0.9 + phase) * 0.015;
      const swayY = Math.cos(time * 0.7 + phase) * 0.008;

      // Apply to rotation without overriding mouse focus
      garment.rotation.z = swayZ;
      garment.rotation.y = (Math.sin(i * 1.7) * 0.04) + swayY;
    }
  }
}
