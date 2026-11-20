import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Product, GarmentType } from '../data/products';

// Global cache for loaded GLTF models
const gltfLoader = new GLTFLoader();
const modelCache = new Map<string, THREE.Group>();

export function preloadModel(url: string): Promise<THREE.Group> {
  if (modelCache.has(url)) {
    return Promise.resolve(modelCache.get(url)!.clone());
  }
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => {
        modelCache.set(url, gltf.scene);
        resolve(gltf.scene.clone());
      },
      undefined,
      (err) => {
        console.warn(`Could not load GLB at ${url}, falling back to procedural model:`, err);
        reject(err);
      }
    );
  });
}

// Fabric micro-texture canvas generator for subtle realistic weave bump
function createFabricBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);
  
  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;
  
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const idx = (y * 256 + x) * 4;
      const pattern = ((x % 4 === 0 ? 15 : -10) + (y % 4 === 0 ? 15 : -10) + (Math.random() * 12 - 6));
      const val = Math.max(0, Math.min(255, 128 + pattern));
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  return texture;
}

const fabricBumpTexture = createFabricBumpTexture();

// Nike Swoosh Decal Texture Generator
function createSwooshTexture(color = '#ffffff'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 128);
  ctx.fillStyle = color;
  ctx.beginPath();
  // Classic Nike Swoosh bezier curve
  ctx.moveTo(35, 78);
  ctx.bezierCurveTo(95, 108, 185, 92, 235, 28);
  ctx.bezierCurveTo(192, 58, 142, 70, 95, 62);
  ctx.bezierCurveTo(62, 56, 44, 46, 35, 78);
  ctx.closePath();
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

const whiteSwooshTexture = createSwooshTexture('#ffffff');
const blackSwooshTexture = createSwooshTexture('#111111');

// Shared Materials for Hangers and Hardware
// Light Natural Beech / Blonde Wood (Matches Reference Video!)
export const hangerWoodMaterial = new THREE.MeshStandardMaterial({
  color: 0xd9b98e, // Warm blonde/beech wood
  roughness: 0.55,
  metalness: 0.05,
});

export const silverHookMaterial = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  roughness: 0.2,
  metalness: 0.9,
});

export const brassHardwareMaterial = new THREE.MeshStandardMaterial({
  color: 0xd4af37,
  roughness: 0.25,
  metalness: 0.85,
});

export const gunmetalHardwareMaterial = new THREE.MeshStandardMaterial({
  color: 0x2e3036,
  roughness: 0.3,
  metalness: 0.85,
});

// -------------------------------------------------------------
// Realistic Light Wood Garment Hanger (Hook loops over horizontal rail)
// -------------------------------------------------------------
export function createHanger(width = 0.48): THREE.Group {
  const hangerGroup = new THREE.Group();
  hangerGroup.name = 'Hanger';

  // 1. Curved Silver Metal Hook (Apex at Y = +0.022 looping over horizontal rail)
  const hookCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.065, 0),
    new THREE.Vector3(0, -0.015, 0),
    new THREE.Vector3(0, 0.012, 0.005),
    new THREE.Vector3(0, 0.0225, 0.0),      // Apex resting on rail
    new THREE.Vector3(0, 0.021, -0.015),    // Curves over rear of rod
    new THREE.Vector3(0, 0.008, -0.0235),
    new THREE.Vector3(0, -0.014, -0.0235),
    new THREE.Vector3(0, -0.022, -0.017),   // Outward lip
  ]);
  const hookGeom = new THREE.TubeGeometry(hookCurve, 24, 0.0035, 10, false);
  const hookMesh = new THREE.Mesh(hookGeom, silverHookMaterial);
  hookMesh.castShadow = true;
  hangerGroup.add(hookMesh);

  // 2. Triangular Beech Wood Arms
  const hw = width / 2;
  const leftArmCurve = new THREE.LineCurve3(
    new THREE.Vector3(0, -0.065, 0),
    new THREE.Vector3(-hw, -0.155, 0)
  );
  const rightArmCurve = new THREE.LineCurve3(
    new THREE.Vector3(0, -0.065, 0),
    new THREE.Vector3(hw, -0.155, 0)
  );

  const leftGeom = new THREE.TubeGeometry(leftArmCurve, 8, 0.014, 12, false);
  leftGeom.scale(1, 0.7, 1);
  const leftArm = new THREE.Mesh(leftGeom, hangerWoodMaterial);
  leftArm.castShadow = true;
  hangerGroup.add(leftArm);

  const rightGeom = new THREE.TubeGeometry(rightArmCurve, 8, 0.014, 12, false);
  rightGeom.scale(1, 0.7, 1);
  const rightArm = new THREE.Mesh(rightGeom, hangerWoodMaterial);
  rightArm.castShadow = true;
  hangerGroup.add(rightArm);

  // Central neck block
  const neckGeom = new THREE.CylinderGeometry(0.016, 0.018, 0.035, 16);
  const neckMesh = new THREE.Mesh(neckGeom, hangerWoodMaterial);
  neckMesh.position.set(0, -0.065, 0);
  hangerGroup.add(neckMesh);

  return hangerGroup;
}

function createFabricMaterial(colorHex: string, roughness = 0.85, metalness = 0.03): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: roughness,
    metalness: metalness,
    bumpMap: fabricBumpTexture,
    bumpScale: 0.0008,
    side: THREE.DoubleSide,
  });
}

// -------------------------------------------------------------
// 1. POLO SHIRT (Position 1: White Pique Polo)
// -------------------------------------------------------------
export function createPoloTeeMesh(colorHex = '#f2f0ea'): THREE.Group {
  const group = new THREE.Group();
  const mat = createFabricMaterial(colorHex, 0.92, 0.02);

  const bodyShape = new THREE.Shape();
  const hw = 0.25;
  const length = 0.72;

  bodyShape.moveTo(-0.10, 0);
  bodyShape.lineTo(0.10, 0);
  bodyShape.lineTo(hw, -0.06);
  bodyShape.lineTo(hw, -0.22);
  bodyShape.lineTo(hw * 0.98, -length);
  bodyShape.lineTo(-hw * 0.98, -length);
  bodyShape.lineTo(-hw, -0.22);
  bodyShape.lineTo(-hw, -0.06);
  bodyShape.closePath();

  const torsoGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.10,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.012,
    bevelSegments: 4,
  });
  torsoGeom.center();

  // Subtle natural folds
  const pos = torsoGeom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const x = pos.getX(i);
    if (y < -0.1) {
      pos.setZ(i, pos.getZ(i) + Math.sin(x * 12) * 0.006 * (-y / length));
    }
  }
  torsoGeom.computeVertexNormals();

  const torsoMesh = new THREE.Mesh(torsoGeom, mat);
  torsoMesh.position.set(0, -0.40, 0);
  torsoMesh.castShadow = true;
  group.add(torsoMesh);

  // Folded Polo Collar
  const collarShape = new THREE.Shape();
  collarShape.moveTo(-0.11, 0);
  collarShape.lineTo(0.11, 0);
  collarShape.lineTo(0.14, -0.065);
  collarShape.lineTo(0.04, -0.09);
  collarShape.lineTo(-0.04, -0.09);
  collarShape.lineTo(-0.14, -0.065);
  collarShape.closePath();
  const collarGeom = new THREE.ExtrudeGeometry(collarShape, { depth: 0.04, bevelEnabled: false });
  collarGeom.center();
  const collarMesh = new THREE.Mesh(collarGeom, mat);
  collarMesh.position.set(0, -0.065, 0.055);
  collarMesh.rotation.x = 0.25;
  group.add(collarMesh);

  // Button placket
  const placketGeom = new THREE.BoxGeometry(0.026, 0.14, 0.005);
  const placketMesh = new THREE.Mesh(placketGeom, mat);
  placketMesh.position.set(0, -0.14, 0.055);
  group.add(placketMesh);

  // Short Sleeves
  [-1, 1].forEach((dir) => {
    const sleeveGeom = new THREE.CylinderGeometry(0.09, 0.095, 0.24, 16, 1, true);
    sleeveGeom.rotateZ(dir * (Math.PI / 3.6));
    const sleeveMesh = new THREE.Mesh(sleeveGeom, mat);
    sleeveMesh.position.set(dir * 0.30, -0.16, 0);
    sleeveMesh.castShadow = true;
    group.add(sleeveMesh);
  });

  return group;
}

// -------------------------------------------------------------
// 2. ATHLETIC TRACK JACKET (Navy Blue & Royal Blue)
// -------------------------------------------------------------
export function createTrackJacketMesh(colorHex: string, accentHex = '#ffffff'): THREE.Group {
  const group = new THREE.Group();
  const mainMat = createFabricMaterial(colorHex, 0.65, 0.08);

  const bodyShape = new THREE.Shape();
  const hw = 0.27;
  const length = 0.74;

  bodyShape.moveTo(-0.11, 0);
  bodyShape.lineTo(0.11, 0);
  bodyShape.lineTo(hw + 0.02, -0.07);
  bodyShape.lineTo(hw, -0.24);
  bodyShape.lineTo(hw * 0.95, -length + 0.06);
  bodyShape.lineTo(hw * 0.88, -length);
  bodyShape.lineTo(-hw * 0.88, -length);
  bodyShape.lineTo(-hw * 0.95, -length + 0.06);
  bodyShape.lineTo(-hw, -0.24);
  bodyShape.lineTo(-hw - 0.02, -0.07);
  bodyShape.closePath();

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.014,
    bevelSegments: 4,
  });
  bodyGeom.center();
  const bodyMesh = new THREE.Mesh(bodyGeom, mainMat);
  bodyMesh.position.set(0, -0.40, 0);
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // Metallic front zipper
  const zipGeom = new THREE.BoxGeometry(0.010, 0.70, 0.008);
  const zipMesh = new THREE.Mesh(zipGeom, silverHookMaterial);
  zipMesh.position.set(0, -0.39, 0.072);
  group.add(zipMesh);

  // Stand-up ribbed athletic collar
  const collarGeom = new THREE.CylinderGeometry(0.10, 0.11, 0.065, 24, 1, true);
  const collarMesh = new THREE.Mesh(collarGeom, mainMat);
  collarMesh.position.set(0, -0.04, 0);
  group.add(collarMesh);

  // Athletic Sleeves
  [-1, 1].forEach((dir) => {
    const sleeveGeom = new THREE.CylinderGeometry(0.11, 0.08, 0.60, 16);
    sleeveGeom.rotateZ(dir * (Math.PI / 4.4));
    const sleeveMesh = new THREE.Mesh(sleeveGeom, mainMat);
    sleeveMesh.position.set(dir * 0.38, -0.34, 0);
    sleeveMesh.castShadow = true;
    group.add(sleeveMesh);
  });

  return group;
}

// -------------------------------------------------------------
// 3. COLORBLOCK HOODIE (Position 3: Red & Black)
// -------------------------------------------------------------
export function createColorblockHoodieMesh(bodyColor = '#b71c26', contrastColor = '#1a1b1f'): THREE.Group {
  const group = new THREE.Group();
  const redMat = createFabricMaterial(bodyColor, 0.90, 0.02);
  const blackMat = createFabricMaterial(contrastColor, 0.90, 0.02);

  const hw = 0.28;
  const length = 0.75;

  // Center Red Torso
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-hw * 0.65, 0);
  bodyShape.lineTo(hw * 0.65, 0);
  bodyShape.lineTo(hw * 0.65, -length);
  bodyShape.lineTo(-hw * 0.65, -length);
  bodyShape.closePath();

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, { depth: 0.13, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.012, bevelSegments: 3 });
  bodyGeom.center();
  const bodyMesh = new THREE.Mesh(bodyGeom, redMat);
  bodyMesh.position.set(0, -0.41, 0);
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // Black Side Panels
  [-1, 1].forEach((dir) => {
    const sideGeom = new THREE.BoxGeometry(0.10, length, 0.12);
    const sideMesh = new THREE.Mesh(sideGeom, blackMat);
    sideMesh.position.set(dir * 0.22, -0.41, 0);
    group.add(sideMesh);
  });

  // Black Hanging Hood at back
  const hoodCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.05, -0.02),
    new THREE.Vector3(0, 0.08, -0.06),
    new THREE.Vector3(0, 0.04, -0.16),
    new THREE.Vector3(0, -0.16, -0.14),
  ]);
  const hoodGeom = new THREE.TubeGeometry(hoodCurve, 16, 0.11, 12, false);
  hoodGeom.scale(1.1, 1, 0.7);
  const hoodMesh = new THREE.Mesh(hoodGeom, blackMat);
  hoodMesh.castShadow = true;
  group.add(hoodMesh);

  // Kangaroo pocket in front
  const pocketGeom = new THREE.BoxGeometry(0.28, 0.18, 0.02);
  const pocketMesh = new THREE.Mesh(pocketGeom, redMat);
  pocketMesh.position.set(0, -0.52, 0.075);
  group.add(pocketMesh);

  // Sleeves (Red/Black)
  [-1, 1].forEach((dir) => {
    const sleeveGeom = new THREE.CylinderGeometry(0.11, 0.075, 0.58, 16);
    sleeveGeom.rotateZ(dir * (Math.PI / 4.2));
    const sleeveMesh = new THREE.Mesh(sleeveGeom, blackMat);
    sleeveMesh.position.set(dir * 0.38, -0.34, 0);
    sleeveMesh.castShadow = true;
    group.add(sleeveMesh);
  });

  return group;
}

// -------------------------------------------------------------
// 4. NEON WINDRUNNER (Position 4: Volt Lime)
// -------------------------------------------------------------
export function createNeonWindrunnerMesh(neonColor = '#77e02a'): THREE.Group {
  const group = new THREE.Group();
  const mat = createFabricMaterial(neonColor, 0.60, 0.12);

  const hw = 0.26;
  const length = 0.73;

  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-0.10, 0);
  bodyShape.lineTo(0.10, 0);
  bodyShape.lineTo(hw + 0.02, -0.07);
  bodyShape.lineTo(hw, -0.24);
  bodyShape.lineTo(hw * 0.90, -length);
  bodyShape.lineTo(-hw * 0.90, -length);
  bodyShape.lineTo(-hw, -0.24);
  bodyShape.lineTo(-hw - 0.02, -0.07);
  bodyShape.closePath();

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, { depth: 0.11, bevelEnabled: true, bevelThickness: 0.016, bevelSize: 0.012, bevelSegments: 3 });
  bodyGeom.center();
  const bodyMesh = new THREE.Mesh(bodyGeom, mat);
  bodyMesh.position.set(0, -0.40, 0);
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // Black zipper
  const zipGeom = new THREE.BoxGeometry(0.008, 0.68, 0.006);
  const zipMesh = new THREE.Mesh(zipGeom, gunmetalHardwareMaterial);
  zipMesh.position.set(0, -0.40, 0.065);
  group.add(zipMesh);

  // Lightweight hood
  const hoodGeom = new THREE.SphereGeometry(0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.7);
  const hoodMesh = new THREE.Mesh(hoodGeom, mat);
  hoodMesh.position.set(0, 0.01, -0.08);
  hoodMesh.rotation.x = -0.5;
  group.add(hoodMesh);

  [-1, 1].forEach((dir) => {
    const sleeveGeom = new THREE.CylinderGeometry(0.10, 0.075, 0.58, 16);
    sleeveGeom.rotateZ(dir * (Math.PI / 4.4));
    const sleeveMesh = new THREE.Mesh(sleeveGeom, mat);
    sleeveMesh.position.set(dir * 0.36, -0.34, 0);
    sleeveMesh.castShadow = true;
    group.add(sleeveMesh);
  });

  return group;
}

// -------------------------------------------------------------
// 5. ACG LAVA FLOW ULTRALIGHT DOWN JACKET (Position 6: Bright Orange Quilted Puffer)
// -------------------------------------------------------------
export function createACGPufferMesh(colorHex = '#ec4f18'): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.58,
    metalness: 0.10,
    side: THREE.DoubleSide,
  });

  const hw = 0.28;
  const length = 0.74;

  // Undulating Horizontal Baffles
  const baffleCount = 10;
  const baffleHeight = length / baffleCount;

  for (let b = 0; b < baffleCount; b++) {
    const by = -0.08 - b * baffleHeight;
    const baffleGeom = new THREE.CylinderGeometry(hw * 0.98, hw * 0.98, baffleHeight * 0.88, 24);
    baffleGeom.scale(1, 1, 0.46);
    const baffleMesh = new THREE.Mesh(baffleGeom, mat);
    baffleMesh.position.set(0, by, 0);
    baffleMesh.castShadow = true;
    group.add(baffleMesh);

    // Deep baffle indentation line
    const seamGeom = new THREE.TorusGeometry(hw * 0.95, 0.005, 8, 24);
    seamGeom.scale(1, 0.46, 1);
    seamGeom.rotateX(Math.PI / 2);
    const seamMesh = new THREE.Mesh(seamGeom, new THREE.MeshStandardMaterial({ color: 0xaa3008, roughness: 0.8 }));
    seamMesh.position.set(0, by - baffleHeight * 0.44, 0);
    group.add(seamMesh);
  }

  // Metallic front center zipper
  const zipGeom = new THREE.BoxGeometry(0.010, length, 0.008);
  const zipMesh = new THREE.Mesh(zipGeom, gunmetalHardwareMaterial);
  zipMesh.position.set(0, -0.42, 0.135);
  group.add(zipMesh);

  // Puffer Hood
  const hoodGeom = new THREE.SphereGeometry(0.14, 16, 16);
  hoodGeom.scale(1, 1.1, 0.75);
  const hoodMesh = new THREE.Mesh(hoodGeom, mat);
  hoodMesh.position.set(0, 0.02, -0.09);
  hoodMesh.castShadow = true;
  group.add(hoodMesh);

  // Quilted Puffer Sleeves
  [-1, 1].forEach((dir) => {
    for (let sb = 0; sb < 6; sb++) {
      const slDist = 0.10 + sb * 0.09;
      const sBaffleGeom = new THREE.CylinderGeometry(0.095, 0.09, 0.08, 16);
      sBaffleGeom.rotateZ(dir * (Math.PI / 4.4));
      const sMesh = new THREE.Mesh(sBaffleGeom, mat);
      sMesh.position.set(dir * (0.18 + slDist * 0.55), -0.15 - slDist * 0.72, 0);
      sMesh.castShadow = true;
      group.add(sMesh);
    }
  });

  return group;
}

// -------------------------------------------------------------
// 6. SKY BLUE HOODIE (Position 7)
// -------------------------------------------------------------
export function createSkyHoodieMesh(colorHex = '#97c7eb'): THREE.Group {
  const group = new THREE.Group();
  const mat = createFabricMaterial(colorHex, 0.92, 0.02);

  const hw = 0.27;
  const length = 0.73;

  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-0.11, 0);
  bodyShape.lineTo(0.11, 0);
  bodyShape.lineTo(hw + 0.02, -0.07);
  bodyShape.lineTo(hw, -0.24);
  bodyShape.lineTo(hw * 0.92, -length);
  bodyShape.lineTo(-hw * 0.92, -length);
  bodyShape.lineTo(-hw, -0.24);
  bodyShape.lineTo(-hw - 0.02, -0.07);
  bodyShape.closePath();

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.014, bevelSegments: 3 });
  bodyGeom.center();
  const bodyMesh = new THREE.Mesh(bodyGeom, mat);
  bodyMesh.position.set(0, -0.40, 0);
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // Soft hanging hood
  const hoodCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.04, -0.02),
    new THREE.Vector3(0, 0.07, -0.07),
    new THREE.Vector3(0, 0.02, -0.15),
    new THREE.Vector3(0, -0.15, -0.13),
  ]);
  const hoodGeom = new THREE.TubeGeometry(hoodCurve, 16, 0.10, 12, false);
  hoodGeom.scale(1.15, 1, 0.7);
  const hoodMesh = new THREE.Mesh(hoodGeom, mat);
  hoodMesh.castShadow = true;
  group.add(hoodMesh);

  // Kangaroo pouch
  const pocketGeom = new THREE.BoxGeometry(0.26, 0.16, 0.02);
  const pocketMesh = new THREE.Mesh(pocketGeom, mat);
  pocketMesh.position.set(0, -0.52, 0.07);
  group.add(pocketMesh);

  [-1, 1].forEach((dir) => {
    const sleeveGeom = new THREE.CylinderGeometry(0.11, 0.075, 0.58, 16);
    sleeveGeom.rotateZ(dir * (Math.PI / 4.2));
    const sleeveMesh = new THREE.Mesh(sleeveGeom, mat);
    sleeveMesh.position.set(dir * 0.38, -0.34, 0);
    sleeveMesh.castShadow = true;
    group.add(sleeveMesh);
  });

  return group;
}

// -------------------------------------------------------------
// 7. MOCHA FULL-ZIP FLEECE (Position 8)
// -------------------------------------------------------------
export function createMochaZipMesh(colorHex = '#8b5a3e'): THREE.Group {
  const group = new THREE.Group();
  const mat = createFabricMaterial(colorHex, 0.90, 0.02);

  const hw = 0.26;
  const length = 0.72;

  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-0.11, 0);
  bodyShape.lineTo(0.11, 0);
  bodyShape.lineTo(hw + 0.02, -0.07);
  bodyShape.lineTo(hw, -0.24);
  bodyShape.lineTo(hw * 0.90, -length);
  bodyShape.lineTo(-hw * 0.90, -length);
  bodyShape.lineTo(-hw, -0.24);
  bodyShape.lineTo(-hw - 0.02, -0.07);
  bodyShape.closePath();

  const bodyGeom = new THREE.ExtrudeGeometry(bodyShape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.016, bevelSize: 0.012, bevelSegments: 3 });
  bodyGeom.center();
  const bodyMesh = new THREE.Mesh(bodyGeom, mat);
  bodyMesh.position.set(0, -0.40, 0);
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // Silver full zipper
  const zipGeom = new THREE.BoxGeometry(0.010, 0.68, 0.008);
  const zipMesh = new THREE.Mesh(zipGeom, silverHookMaterial);
  zipMesh.position.set(0, -0.40, 0.072);
  group.add(zipMesh);

  // Hood
  const hoodGeom = new THREE.SphereGeometry(0.12, 16, 16);
  hoodGeom.scale(1, 1.05, 0.7);
  const hoodMesh = new THREE.Mesh(hoodGeom, mat);
  hoodMesh.position.set(0, 0.01, -0.08);
  group.add(hoodMesh);

  [-1, 1].forEach((dir) => {
    const sleeveGeom = new THREE.CylinderGeometry(0.10, 0.075, 0.58, 16);
    sleeveGeom.rotateZ(dir * (Math.PI / 4.4));
    const sleeveMesh = new THREE.Mesh(sleeveGeom, mat);
    sleeveMesh.position.set(dir * 0.36, -0.34, 0);
    sleeveMesh.castShadow = true;
    group.add(sleeveMesh);
  });

  return group;
}

// -------------------------------------------------------------
// 8. NIKE WINDRUNNER LINED JACKET (Position 9: Black & Neon Volt Chevron)
// -------------------------------------------------------------
export function createWindrunnerChevronMesh(): THREE.Group {
  const group = new THREE.Group();
  const blackMat = createFabricMaterial('#1d1f24', 0.65, 0.08);
  const neonMat = createFabricMaterial('#7cee2a', 0.65, 0.10);

  const hw = 0.27;
  const length = 0.74;

  // Upper Black Chest & Shoulders
  const topShape = new THREE.Shape();
  topShape.moveTo(-0.11, 0);
  topShape.lineTo(0.11, 0);
  topShape.lineTo(hw + 0.02, -0.07);
  topShape.lineTo(hw, -0.26);
  topShape.lineTo(0, -0.38); // Iconic 26-degree chevron apex!
  topShape.lineTo(-hw, -0.26);
  topShape.lineTo(-hw - 0.02, -0.07);
  topShape.closePath();

  const topGeom = new THREE.ExtrudeGeometry(topShape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.016, bevelSize: 0.012, bevelSegments: 3 });
  topGeom.center();
  const topMesh = new THREE.Mesh(topGeom, blackMat);
  topMesh.position.set(0, -0.19, 0);
  topMesh.castShadow = true;
  group.add(topMesh);

  // Lower Neon Volt Torso
  const bottomShape = new THREE.Shape();
  bottomShape.moveTo(0, -0.38);
  bottomShape.lineTo(hw, -0.26);
  bottomShape.lineTo(hw * 0.90, -length);
  bottomShape.lineTo(-hw * 0.90, -length);
  bottomShape.lineTo(-hw, -0.26);
  bottomShape.closePath();

  const bottomGeom = new THREE.ExtrudeGeometry(bottomShape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.016, bevelSize: 0.012, bevelSegments: 3 });
  bottomGeom.center();
  const bottomMesh = new THREE.Mesh(bottomGeom, neonMat);
  bottomMesh.position.set(0, -0.52, 0);
  bottomMesh.castShadow = true;
  group.add(bottomMesh);

  // Black Zip
  const zipGeom = new THREE.BoxGeometry(0.010, 0.70, 0.008);
  const zipMesh = new THREE.Mesh(zipGeom, gunmetalHardwareMaterial);
  zipMesh.position.set(0, -0.40, 0.072);
  group.add(zipMesh);

  // Black Hood
  const hoodGeom = new THREE.SphereGeometry(0.13, 16, 16);
  hoodGeom.scale(1, 1.05, 0.7);
  const hoodMesh = new THREE.Mesh(hoodGeom, blackMat);
  hoodMesh.position.set(0, 0.02, -0.08);
  group.add(hoodMesh);

  // Sleeves (Black upper, Neon lower)
  [-1, 1].forEach((dir) => {
    const sleeveGeom = new THREE.CylinderGeometry(0.11, 0.08, 0.58, 16);
    sleeveGeom.rotateZ(dir * (Math.PI / 4.4));
    const sleeveMesh = new THREE.Mesh(sleeveGeom, blackMat);
    sleeveMesh.position.set(dir * 0.38, -0.34, 0);
    sleeveMesh.castShadow = true;
    group.add(sleeveMesh);
  });

  return group;
}

// -------------------------------------------------------------
// 9. FOREST GREEN TRACK JACKET (Position 10)
// -------------------------------------------------------------
export function createForestTrackMesh(colorHex = '#23523e'): THREE.Group {
  return createTrackJacketMesh(colorHex, '#ffffff');
}

// -------------------------------------------------------------
// 10. BACKPACK (Bags shelf & cubbies)
// -------------------------------------------------------------
export function createBackpackMesh(colorHex: string): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.75,
    metalness: 0.05,
  });

  // Main Rounded Backpack Body
  const bodyGeom = new THREE.BoxGeometry(0.32, 0.44, 0.20);
  // Round top corners
  const pos = bodyGeom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const x = pos.getX(i);
    if (y > 0.1) {
      pos.setX(i, x * (1 - (y - 0.1) * 0.4));
    }
  }
  bodyGeom.computeVertexNormals();
  const bodyMesh = new THREE.Mesh(bodyGeom, mat);
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // Front Utility Pocket
  const pocketGeom = new THREE.BoxGeometry(0.26, 0.22, 0.08);
  const pocketMesh = new THREE.Mesh(pocketGeom, mat);
  pocketMesh.position.set(0, -0.08, 0.12);
  pocketMesh.castShadow = true;
  group.add(pocketMesh);

  // White Nike Swoosh Decal on front pocket
  const swooshPlaneGeom = new THREE.PlaneGeometry(0.14, 0.07);
  const swooshPlaneMat = new THREE.MeshBasicMaterial({
    map: whiteSwooshTexture,
    transparent: true,
  });
  const swooshPlane = new THREE.Mesh(swooshPlaneGeom, swooshPlaneMat);
  swooshPlane.position.set(0, -0.08, 0.165);
  group.add(swooshPlane);

  // Padded shoulder straps at back
  [-0.08, 0.08].forEach((sx) => {
    const strapCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx, 0.18, -0.10),
      new THREE.Vector3(sx * 1.3, 0.02, -0.18),
      new THREE.Vector3(sx, -0.18, -0.10),
    ]);
    const strapGeom = new THREE.TubeGeometry(strapCurve, 16, 0.02, 8, false);
    const strapMat = new THREE.MeshStandardMaterial({ color: 0x1a1b1e, roughness: 0.85 });
    const strapMesh = new THREE.Mesh(strapGeom, strapMat);
    group.add(strapMesh);
  });

  // Top carry handle
  const handleCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.06, 0.22, -0.02),
    new THREE.Vector3(0, 0.28, -0.02),
    new THREE.Vector3(0.06, 0.22, -0.02),
  ]);
  const handleGeom = new THREE.TubeGeometry(handleCurve, 12, 0.01, 8, false);
  const handleMesh = new THREE.Mesh(handleGeom, new THREE.MeshStandardMaterial({ color: 0x111111 }));
  group.add(handleMesh);

  return group;
}

// -------------------------------------------------------------
// 11. DUFFEL BAG (Bags shelf)
// -------------------------------------------------------------
export function createDuffelMesh(colorHex: string): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.75,
    metalness: 0.05,
  });

  // Cylindrical / rounded barrel duffel body
  const bodyGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.54, 24);
  bodyGeom.rotateZ(Math.PI / 2);
  const bodyMesh = new THREE.Mesh(bodyGeom, mat);
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // Swoosh on front
  const swooshGeom = new THREE.PlaneGeometry(0.22, 0.11);
  const swooshMat = new THREE.MeshBasicMaterial({
    map: whiteSwooshTexture,
    transparent: true,
  });
  const swooshMesh = new THREE.Mesh(swooshGeom, swooshMat);
  swooshMesh.position.set(0, 0, 0.185);
  group.add(swooshMesh);

  // Top carry straps (arched handles)
  [-0.14, 0.14].forEach((hx) => {
    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(hx, 0.05, 0.12),
      new THREE.Vector3(hx, 0.28, 0),
      new THREE.Vector3(hx, 0.05, -0.12),
    ]);
    const handleGeom = new THREE.TubeGeometry(handleCurve, 16, 0.012, 8, false);
    const handleMesh = new THREE.Mesh(handleGeom, new THREE.MeshStandardMaterial({ color: 0x111111 }));
    group.add(handleMesh);
  });

  return group;
}

// -------------------------------------------------------------
// 12. CROSSBODY BAG (Hanging on Wall Pegs)
// -------------------------------------------------------------
export function createCrossbodyMesh(colorHex: string): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.70,
    metalness: 0.05,
  });

  // Rectangular pouch
  const pouchGeom = new THREE.BoxGeometry(0.18, 0.24, 0.07);
  const pouchMesh = new THREE.Mesh(pouchGeom, mat);
  pouchMesh.position.set(0, -0.42, 0);
  pouchMesh.castShadow = true;
  group.add(pouchMesh);

  // Hanging shoulder strap looping over the wall peg at (0, 0, 0)
  const strapCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, -0.32, 0),
    new THREE.Vector3(-0.06, -0.15, 0.02),
    new THREE.Vector3(0, 0, 0.01),          // Looping over peg apex
    new THREE.Vector3(0.06, -0.15, 0.02),
    new THREE.Vector3(0.08, -0.32, 0),
  ]);
  const strapGeom = new THREE.TubeGeometry(strapCurve, 20, 0.008, 8, false);
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.8 });
  const strapMesh = new THREE.Mesh(strapGeom, strapMat);
  group.add(strapMesh);

  return group;
}

// -------------------------------------------------------------
// 13. WAISTPACK
// -------------------------------------------------------------
export function createWaistpackMesh(colorHex: string): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.70,
    metalness: 0.05,
  });

  const packGeom = new THREE.BoxGeometry(0.32, 0.14, 0.12);
  const packMesh = new THREE.Mesh(packGeom, mat);
  packMesh.castShadow = true;
  group.add(packMesh);

  // Strap
  const strapGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.03, 24, 1, true);
  strapGeom.rotateZ(Math.PI / 2);
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
  const strapMesh = new THREE.Mesh(strapGeom, strapMat);
  group.add(strapMesh);

  return group;
}

// -------------------------------------------------------------
// 14. BASEBALL CAP & SNEAKER (Caps & Shoes views)
// -------------------------------------------------------------
export function createCapMesh(colorHex = '#1a1b1e'): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorHex), roughness: 0.75 });

  // Dome crown
  const crownGeom = new THREE.SphereGeometry(0.12, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const crownMesh = new THREE.Mesh(crownGeom, mat);
  group.add(crownMesh);

  // Curved visor bill
  const visorGeom = new THREE.BoxGeometry(0.16, 0.006, 0.12);
  visorGeom.rotateX(0.2);
  const visorMesh = new THREE.Mesh(visorGeom, mat);
  visorMesh.position.set(0, 0.01, 0.12);
  group.add(visorMesh);

  return group;
}

export function createSneakerMesh(colorHex = '#f7f7f9'): THREE.Group {
  const group = new THREE.Group();
  const upperMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorHex), roughness: 0.5 });
  const soleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

  // Outsole
  const soleGeom = new THREE.BoxGeometry(0.12, 0.04, 0.32);
  const soleMesh = new THREE.Mesh(soleGeom, soleMat);
  soleMesh.position.y = 0.02;
  soleMesh.castShadow = true;
  group.add(soleMesh);

  // Upper
  const upperGeom = new THREE.BoxGeometry(0.11, 0.08, 0.28);
  const upperMesh = new THREE.Mesh(upperGeom, upperMat);
  upperMesh.position.set(0, 0.07, -0.01);
  upperMesh.castShadow = true;
  group.add(upperMesh);

  // Padded collar
  const collarGeom = new THREE.CylinderGeometry(0.045, 0.05, 0.04, 16);
  const collarMesh = new THREE.Mesh(collarGeom, upperMat);
  collarMesh.position.set(0, 0.12, -0.06);
  group.add(collarMesh);

  return group;
}

// -------------------------------------------------------------
// MASTER ASSEMBLY BUILDER
// -------------------------------------------------------------
export async function createGarmentAssembly(
  product: Product,
  overrideColor?: string,
  withHanger = true
): Promise<THREE.Group> {
  const container = new THREE.Group();
  container.name = `Item_${product.id}`;
  container.userData = { productId: product.id, product };

  const colorHex = overrideColor || product.colors[0].hex;

  let modelGroup: THREE.Group;

  switch (product.garmentType) {
    case 'polo':
      modelGroup = createPoloTeeMesh(colorHex);
      break;
    case 'track-jacket':
      modelGroup = createTrackJacketMesh(colorHex);
      break;
    case 'colorblock-hoodie':
      modelGroup = createColorblockHoodieMesh(colorHex, '#1a1b1f');
      break;
    case 'neon-windrunner':
      modelGroup = createNeonWindrunnerMesh(colorHex);
      break;
    case 'acg-puffer':
      modelGroup = createACGPufferMesh(colorHex);
      break;
    case 'sky-hoodie':
      modelGroup = createSkyHoodieMesh(colorHex);
      break;
    case 'mocha-fleece':
      modelGroup = createMochaZipMesh(colorHex);
      break;
    case 'windrunner-lined':
      modelGroup = createWindrunnerChevronMesh();
      break;
    case 'forest-track':
      modelGroup = createForestTrackMesh(colorHex);
      break;
    case 'backpack':
      modelGroup = createBackpackMesh(colorHex);
      break;
    case 'duffel':
      modelGroup = createDuffelMesh(colorHex);
      break;
    case 'crossbody':
      modelGroup = createCrossbodyMesh(colorHex);
      break;
    case 'waistpack':
      modelGroup = createWaistpackMesh(colorHex);
      break;
    case 'cap':
      modelGroup = createCapMesh(colorHex);
      break;
    case 'sneaker':
      modelGroup = createSneakerMesh(colorHex);
      break;
    default:
      modelGroup = createPoloTeeMesh(colorHex);
      break;
  }

  container.add(modelGroup);

  // Add Wooden Hanger if requested (for clothing on rails)
  if (withHanger && !['backpack', 'duffel', 'crossbody', 'waistpack', 'cap', 'sneaker'].includes(product.garmentType)) {
    const hanger = createHanger(0.48);
    container.add(hanger);
  }

  // Invisible Click Hitbox for reliable raycasting
  const hitBoxGeom = new THREE.BoxGeometry(0.65, 0.95, 0.35);
  const hitBoxMat = new THREE.MeshBasicMaterial({
    visible: false,
    wireframe: false,
  });
  const hitBoxMesh = new THREE.Mesh(hitBoxGeom, hitBoxMat);
  hitBoxMesh.position.set(0, -0.42, 0);
  hitBoxMesh.userData = { isHitBox: true, product };
  container.add(hitBoxMesh);

  return container;
}
