export interface ProductColor {
  name: string;
  hex: string;
  roughness?: number;
  metalness?: number;
}

export type GarmentType = 
  | 'polo'
  | 'track-jacket'
  | 'colorblock-hoodie'
  | 'neon-windrunner'
  | 'acg-puffer'
  | 'sky-hoodie'
  | 'mocha-fleece'
  | 'windrunner-lined'
  | 'forest-track'
  | 'backpack'
  | 'duffel'
  | 'crossbody'
  | 'waistpack'
  | 'cap'
  | 'sneaker'
  | 'oversized-tee'
  | 'denim-jeans'
  | 'sweatshirt';

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  price: number; // in INR
  category: 'Clothing' | 'Bags' | 'Caps' | 'Shoes';
  sectionName: string;
  garmentType: GarmentType;
  description: string;
  fabricDetails: {
    composition: string;
    weight: string;
    weave: string;
    treatment: string;
    care: string;
  };
  colors: ProductColor[];
  sizes: string[];
  badge?: string;
  sku: string;
  features: string[];
  railIndex?: number;
}

export const PRODUCTS: Product[] = [
  // -------------------------------------------------------------
  // THE 10 EXACT GARMENTS ON THE HANGING RAIL (Matches Reference Video)
  // -------------------------------------------------------------
  {
    id: 'prod-nike-polo',
    name: 'Nike Sportswear Club Pique Polo',
    subtitle: 'Classic Collar Off-White Pique Knit Shirt',
    price: 2495,
    category: 'Clothing',
    sectionName: 'WALL RAIL — POSITION 1',
    garmentType: 'polo',
    railIndex: 0,
    description: 'A timeless silhouette engineered in premium 260 GSM breathable cotton pique knit. Features a crisp ribbed fold-down collar, dual-button placket, reinforced side split hems, and tonal embroidered swoosh at the chest.',
    fabricDetails: {
      composition: '100% Organic Pique Cotton',
      weight: '260 GSM Heavy Pique',
      weave: 'Honeycomb Pique Knit',
      treatment: 'Mercerised Pre-Shrunk Finish',
      care: 'Machine Wash Cold, Hang Dry',
    },
    colors: [
      { name: 'Summit White', hex: '#f2f0ea' },
      { name: 'Heather Grey', hex: '#bcbec2' },
      { name: 'Anthracite', hex: '#222327' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    badge: 'CLASSIC',
    sku: 'NK-POLO-01',
    features: ['Crisp fold-down ribbed collar', 'Two-button placket with pearlized buttons', 'Side vent drop hem for mobility']
  },
  {
    id: 'prod-navy-track',
    name: 'Nike Sportswear Heritage Track Jacket',
    subtitle: 'Midnight Navy Lightweight Athletic Zip Top',
    price: 4995,
    category: 'Clothing',
    sectionName: 'WALL RAIL — POSITION 2',
    garmentType: 'track-jacket',
    railIndex: 1,
    description: 'Throwback track jacket inspired by archival athletic warmups. Smooth poly-knit fabric with full front silver zipper, ribbed stand collar, zippered hand pockets, and ribbed cuffs that seal in warmth.',
    fabricDetails: {
      composition: '100% Recycled Polyester Knit',
      weight: '280 GSM Poly Double Knit',
      weave: 'Smooth Technical Face with Brushed Interior',
      treatment: 'Dri-FIT Moisture Management',
      care: 'Machine Wash Cold Delicate',
    },
    colors: [
      { name: 'Midnight Navy', hex: '#2a3b58' },
      { name: 'Obsidian Black', hex: '#161922' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    sku: 'NK-TRK-NVY-02',
    features: ['Ribbed stand collar and cuffs', 'Full front metallic zipper', 'Secure zip hand pockets']
  },
  {
    id: 'prod-red-fleece',
    name: 'Nike Club Fleece Colorblock Hoodie',
    subtitle: 'University Red & Obsidian Heavyweight Fleece',
    price: 3995,
    category: 'Clothing',
    sectionName: 'WALL RAIL — POSITION 3',
    garmentType: 'colorblock-hoodie',
    railIndex: 2,
    description: 'Striking colorblocked pullover fleece featuring University Red on chest and hood contrasted with deep Obsidian side panels. Brushed-back fleece delivers cozy warmth, accompanied by a spacious kangaroo pocket.',
    fabricDetails: {
      composition: '80% Cotton, 20% Polyester',
      weight: '380 GSM Heavy French Terry',
      weave: 'Brushed Fleece Backing',
      treatment: 'Enzyme Softened',
      care: 'Machine Wash Inside Out',
    },
    colors: [
      { name: 'University Red / Black', hex: '#b71c26' },
      { name: 'Grey / Black', hex: '#4a4d53' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    badge: 'POPULAR',
    sku: 'NK-HOD-RED-03',
    features: ['Multi-panel structured hood', 'Front kangaroo pouch pocket', 'Ribbed cuffs and waistband']
  },
  {
    id: 'prod-neon-windrunner',
    name: 'Nike Sportswear Windrunner Neon',
    subtitle: 'Volt / Lime Lightweight Weather Shell',
    price: 4495,
    category: 'Clothing',
    sectionName: 'WALL RAIL — POSITION 4',
    garmentType: 'neon-windrunner',
    railIndex: 3,
    description: 'Electric Volt lime windbreaker crafted from featherlight taffeta ripstop nylon. Packs away easily and offers water-repellent coverage with breathable mesh back vent.',
    fabricDetails: {
      composition: '100% Ripstop Taffeta Nylon',
      weight: '120 GSM Featherweight Shell',
      weave: 'Diamond Micro-Ripstop',
      treatment: 'DWR Water-Repellent Coating',
      care: 'Cold Gentle Wash',
    },
    colors: [
      { name: 'Volt Neon Lime', hex: '#77e02a' },
      { name: 'Ghost Green', hex: '#a6f059' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    badge: 'HI-VIS',
    sku: 'NK-WND-NEO-04',
    features: ['Ultralight water-repellent shell', 'Mesh lining for breathability', 'Packable hood with bungee toggles']
  },
  {
    id: 'prod-blue-track',
    name: 'Nike Dri-FIT Academy Track Jacket',
    subtitle: 'Game Royal Athletic Warmup Jacket',
    price: 3695,
    category: 'Clothing',
    sectionName: 'WALL RAIL — POSITION 5',
    garmentType: 'track-jacket',
    railIndex: 4,
    description: 'High-performance royal blue athletic warmup layer equipped with Dri-FIT sweat-wicking technology. Engineered mesh chest stripes provide targeted ventilation during drills and street training.',
    fabricDetails: {
      composition: '100% Recycled Dri-FIT Polyester',
      weight: '240 GSM Athletic Mesh Interlock',
      weave: 'High-Tensile Warp Knit',
      treatment: 'Antimicrobial Dri-FIT Wicking',
      care: 'Machine Wash Warm',
    },
    colors: [
      { name: 'Game Royal', hex: '#264aa8' },
      { name: 'Binary Blue', hex: '#1c2e68' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    sku: 'NK-TRK-BLU-05',
    features: ['Sweat-wicking Dri-FIT yarn', 'Invisible thumb loops at cuffs', 'Slim contoured athlete cut']
  },
  {
    id: 'prod-acg-lava-flow',
    name: 'ACG Lava Flow Ultralight Down Jacket',
    subtitle: 'Bright Orange Quilted Baffle Packable Puffer',
    price: 12995,
    category: 'Clothing',
    sectionName: 'WALL RAIL — POSITION 6 (HERO ITEM)',
    garmentType: 'acg-puffer',
    railIndex: 5,
    description: 'The iconic hero piece from the All Conditions Gear line as featured in the reference video. Engineered with 800-fill power responsible goose down insulation encapsulated in undulating horizontal lava-flow baffles for optimum thermal efficiency with almost zero bulk.',
    fabricDetails: {
      composition: '100% Recycled Pertex Quantum Nylon Shell, 800FP Goose Down',
      weight: '22D Pertex Quantum Ripstop (95 GSM)',
      weave: 'Pertex Quantum Ultralight Weave',
      treatment: 'Fluorocarbon-Free Durable Water Repellent',
      care: 'Front-Loading Machine Wash Cold, Tumble Dry Low with Tennis Balls',
    },
    colors: [
      { name: 'Bright Orange ACG', hex: '#ec4f18' },
      { name: 'Cinder Cone Black', hex: '#1d1e22' },
      { name: 'Summit White', hex: '#e8eaec' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    badge: 'HERO PIECE',
    sku: 'NK-ACG-LAVA-06',
    features: [
      '800-fill power down insulation for extreme warmth-to-weight ratio',
      'Ergonomic multi-panel storm hood with cord locks',
      'Packs entirely into its own right-side interior pocket',
      'Triangular ACG silicone heritage badge at chest'
    ]
  },
  {
    id: 'prod-sky-hoodie',
    name: 'Nike Club Fleece Pullover Hoodie',
    subtitle: 'Sky Blue / Powder Blue Heavyweight Fleece',
    price: 3495,
    category: 'Clothing',
    sectionName: 'WALL RAIL — POSITION 7',
    garmentType: 'sky-hoodie',
    railIndex: 6,
    description: 'Super-soft everyday staple hoodie dipped in a tranquil powder sky blue hue. Knitted from ultra-cozy heavyweight fleece with brushed interior loops and a double-layered hood.',
    fabricDetails: {
      composition: '84% Combed Cotton, 16% Polyester Fleece',
      weight: '400 GSM Heavyweight Fleece',
      weave: 'Diagonal Looped French Terry',
      treatment: 'Garment Enzyme Washed',
      care: 'Machine Wash Cold, Hang Dry',
    },
    colors: [
      { name: 'Sky / Powder Blue', hex: '#97c7eb' },
      { name: 'Seafoam Mint', hex: '#b5dfd4' },
      { name: 'Bone White', hex: '#f0ede4' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    badge: 'COZY FIT',
    sku: 'NK-HOD-SKY-07',
    features: ['Double-layer crossover hood without drawstrings', 'Ribbed hem and cuffs with spandex retention', 'Roomy kangaroo pouch pocket']
  },
  {
    id: 'prod-mocha-fleece',
    name: 'Nike Sportswear Club Full-Zip Fleece',
    subtitle: 'Mocha Brown Minimalist Thermal Zip Jacket',
    price: 4295,
    category: 'Clothing',
    sectionName: 'WALL RAIL — POSITION 8',
    garmentType: 'mocha-fleece',
    railIndex: 7,
    description: 'Earthy mocha brown full-zip jacket that pairs versatile styling with cloud-soft thermal warmth. Features split kangaroo pockets, tone-on-tone embroidery, and dual metal zipper slider.',
    fabricDetails: {
      composition: '80% Cotton, 20% Polyester',
      weight: '360 GSM Thermal Fleece',
      weave: 'Brushed Back Knitted Fleece',
      treatment: 'Silicone Softener Wash',
      care: 'Machine Wash Cold',
    },
    colors: [
      { name: 'Mocha Brown', hex: '#8b5a3e' },
      { name: 'Dark Hazelnut', hex: '#5b3c2a' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    sku: 'NK-FLC-MCH-08',
    features: ['Split front kangaroo pockets', 'Full length smooth glide metal zipper', 'Reinforced neck tape for durability']
  },
  {
    id: 'prod-windrunner-lined',
    name: 'Nike Windrunner Lined Jacket',
    subtitle: 'Black & Volt Neon 26-Degree Chevron Windbreaker',
    price: 5995,
    category: 'Clothing',
    sectionName: 'WALL RAIL — POSITION 9 (KEY PRODUCT)',
    garmentType: 'windrunner-lined',
    railIndex: 8,
    description: 'The legendary running jacket that launched an apparel revolution in 1978, rendered in sharp black upper blocking with neon volt yellow chevron paneling. Fully lined with breathable mesh for all-day comfort.',
    fabricDetails: {
      composition: '100% Recycled Polyester Taffeta Shell & Mesh Lining',
      weight: '160 GSM Weatherproof Taffeta',
      weave: 'Dense Plain Weave with Diamond Ripstop Check',
      treatment: 'Durable Water Repellent (DWR)',
      care: 'Machine Wash Cold Delicate, Do Not Iron Print',
    },
    colors: [
      { name: 'Black & Neon Volt', hex: '#212328' },
      { name: 'Black & White', hex: '#16171a' },
      { name: 'Team Red & Navy', hex: '#871c24' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    badge: 'ICONIC 1978',
    sku: 'NK-WND-LIN-09',
    features: [
      'Original 26-degree chevron chest geometry',
      'Breathable all-over micro-mesh interior lining',
      'Back yoke vent promotes natural cooling airflow',
      'Embroidered Nike Futura logo with swoosh'
    ]
  },
  {
    id: 'prod-green-track',
    name: 'Nike Heritage Forest Track Jacket',
    subtitle: 'Deep Pine Green Warmup Top with White Accents',
    price: 4695,
    category: 'Clothing',
    sectionName: 'WALL RAIL — POSITION 10',
    garmentType: 'forest-track',
    railIndex: 9,
    description: 'Rich forest green athletic track top celebrating collegiate sports tradition. Made with smooth tricot fabric, retro stand collar, and clean white chest accent branding.',
    fabricDetails: {
      composition: '100% Warp-Knit Tricot Polyester',
      weight: '300 GSM Heavyweight Tricot',
      weave: 'Glossy Face Warp Knit',
      treatment: 'Quick-Dry Finish',
      care: 'Machine Wash Cold',
    },
    colors: [
      { name: 'Pine / Forest Green', hex: '#23523e' },
      { name: 'Dark Olive', hex: '#374232' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    sku: 'NK-TRK-GRN-10',
    features: ['Retro tall stand-up ribbed collar', 'Raglan cut sleeves for unrestricted movement', 'Full zip with custom swoosh zip pull']
  },

  // -------------------------------------------------------------
  // BAGS & ACCESSORIES (Matches Reference Video Frame 003 Cubby & Pegs)
  // -------------------------------------------------------------
  // WALL PEGS (Top hanging bags):
  {
    id: 'prod-bag-brown',
    name: 'Nike Heritage Crossbody Bag (Bronze)',
    subtitle: 'Compact Everyday Crossbody Travel Pouch',
    price: 1795,
    category: 'Bags',
    sectionName: 'BAGS DISPLAY — WALL PEG 1',
    garmentType: 'crossbody',
    description: 'Durable polyester crossbody bag in warm bronze brown with dual zippered compartments and adjustable clip-on strap.',
    fabricDetails: {
      composition: '100% Dense 600D Polyester',
      weight: '600D Cordura-Grade Poly',
      weave: 'Heavy Plain Weave',
      treatment: 'PU Water-Resistant Backing',
      care: 'Spot Clean with Damp Cloth',
    },
    colors: [{ name: 'Bronze Brown', hex: '#6b5443' }],
    sizes: ['ONE SIZE (4L)'],
    sku: 'NK-BAG-BRN-01',
    features: ['Adjustable shoulder strap', 'Dual zippered pockets', 'D-ring attachment clip']
  },
  {
    id: 'prod-bag-pink',
    name: 'Nike Futura 365 Crossbody Bag (Pink Foam)',
    subtitle: 'Vibrant Pastel Pink Crossbody Bag',
    price: 1995,
    category: 'Bags',
    sectionName: 'BAGS DISPLAY — WALL PEG 2',
    garmentType: 'crossbody',
    description: 'Clean aesthetic messenger pouch in vibrant pink foam with magnetic front snap flap and internal key leash.',
    fabricDetails: {
      composition: '100% Polyester',
      weight: '500D Twill',
      weave: 'Structured Twill',
      treatment: 'Stain Resistant',
      care: 'Spot Clean',
    },
    colors: [{ name: 'Pink Foam', hex: '#e887b8' }],
    sizes: ['ONE SIZE (3L)'],
    sku: 'NK-BAG-PNK-02',
    features: ['Magnetic snap closure', 'Pastel colorway', 'Interior slip card slot']
  },
  {
    id: 'prod-bag-mint',
    name: 'Nike Sportswear Essentials Hip Pack (Mint)',
    subtitle: 'Pale Mint Green Technical Pouch',
    price: 1895,
    category: 'Bags',
    sectionName: 'BAGS DISPLAY — WALL PEG 3',
    garmentType: 'crossbody',
    description: 'Refreshing pale mint crossbody hip pack with oversized front swoosh graphic and quick-release buckle.',
    fabricDetails: {
      composition: '100% Nylon',
      weight: '400D Ripstop',
      weave: 'Micro-Ripstop',
      treatment: 'Water Resistant',
      care: 'Spot Clean',
    },
    colors: [{ name: 'Pale Mint', hex: '#a8dfc8' }],
    sizes: ['ONE SIZE (5L)'],
    sku: 'NK-BAG-MNT-03',
    features: ['Quick-release buckle', 'Lightweight ripstop fabric', 'Oversized zipper pulls']
  },
  {
    id: 'prod-bag-charcoal',
    name: 'Nike Tech Crossbody Utility Bag (Anthracite)',
    subtitle: 'Tactical Anthracite Grey Utility Bag',
    price: 2295,
    category: 'Bags',
    sectionName: 'BAGS DISPLAY — WALL PEG 4',
    garmentType: 'crossbody',
    description: 'Military-inspired utility sling bag in matte anthracite grey with daisy chain webbing and reinforced zippers.',
    fabricDetails: {
      composition: '100% Cordura Ballistic Nylon',
      weight: '840D Ballistic',
      weave: 'Ballistic Canvas',
      treatment: 'Teflon Shield Repellent',
      care: 'Spot Clean',
    },
    colors: [{ name: 'Anthracite Charcoal', hex: '#3b3e45' }],
    sizes: ['ONE SIZE (6L)'],
    sku: 'NK-BAG-CHR-04',
    features: ['MOLLE daisy-chain webbing', 'Reinforced YKK zippers', 'Ergonomic sling angle']
  },

  // WOODEN CUBBY SHELF (Top row: 3 backpacks):
  {
    id: 'prod-bp-blue',
    name: 'Nike Brasilia 9.5 Training Backpack (Royal Blue)',
    subtitle: 'Spacious 24L Daily Training Backpack',
    price: 2795,
    category: 'Bags',
    sectionName: 'WOODEN SHELF — TOP CUBBY 1',
    garmentType: 'backpack',
    description: 'Iconic royal blue training backpack with prominent white swoosh. Features separate padded 15-inch laptop sleeve, water bottle mesh sides, and breathable padded air-mesh straps.',
    fabricDetails: {
      composition: '100% Recycled Polyester',
      weight: '600D Coated Canvas',
      weave: 'Heavy Basket Weave',
      treatment: 'Weather Coated Bottom Panel',
      care: 'Spot Clean Only',
    },
    colors: [{ name: 'Game Royal', hex: '#1c49b0' }],
    sizes: ['ONE SIZE (24L)'],
    sku: 'NK-BP-BLU-05',
    features: ['Padded 15" laptop sleeve', 'Dual mesh water bottle pockets', 'Water-resistant coated base']
  },
  {
    id: 'prod-bp-coral',
    name: 'Nike Elemental Backpack (Coral Orange)',
    subtitle: 'Vibrant Coral Crimson Everyday Rucksack',
    price: 2495,
    category: 'Bags',
    sectionName: 'WOODEN SHELF — TOP CUBBY 2',
    garmentType: 'backpack',
    description: 'Warm coral orange backpack with dual main compartments, removable pencil case pouch, and ergonomic padded shoulder harness.',
    fabricDetails: {
      composition: '100% Polyester',
      weight: '500D Poly Weave',
      weave: 'Plain Weave',
      treatment: 'Colorfast Dye',
      care: 'Spot Clean',
    },
    colors: [{ name: 'Coral Crimson', hex: '#eb5a3c' }],
    sizes: ['ONE SIZE (21L)'],
    sku: 'NK-BP-COR-06',
    features: ['Double-zip main compartment', 'Padded ergonomic harness', 'Contrast white brand logo']
  },
  {
    id: 'prod-bp-lime',
    name: 'Nike Hayward Futura Backpack (Volt / Lime)',
    subtitle: 'High-Visibility Volt Neon Athletic Pack',
    price: 2995,
    category: 'Bags',
    sectionName: 'WOODEN SHELF — TOP CUBBY 3',
    garmentType: 'backpack',
    description: 'Standout volt neon backpack with bungee cord front storage system, oversized Futura logo, and sternum stabilizer strap.',
    fabricDetails: {
      composition: '100% Heavy Duty Polyester',
      weight: '600D Poly',
      weave: 'Diamond Weave',
      treatment: 'Reflective Accents',
      care: 'Spot Clean',
    },
    colors: [{ name: 'Volt Lime Neon', hex: '#88e31b' }],
    sizes: ['ONE SIZE (26L)'],
    sku: 'NK-BP-LIME-07',
    features: ['Front bungee webbing system', 'Sternum chest buckle strap', 'Reflective hi-vis print']
  },

  // WOODEN CUBBY SHELF (Bottom row: 2 duffels + 1 waistpack):
  {
    id: 'prod-duffel-red',
    name: 'Nike Brasilia Small Duffel (University Red)',
    subtitle: 'Bold Red 41L Gym & Travel Duffel Bag',
    price: 2295,
    category: 'Bags',
    sectionName: 'WOODEN SHELF — BOTTOM CUBBY 1',
    garmentType: 'duffel',
    description: 'Classic University Red duffel bag with bold white swoosh on side. Features separate ventilated shoe compartment, padded shoulder strap, and coated water-resistant bottom.',
    fabricDetails: {
      composition: '100% Recycled Polyester 600D',
      weight: '600D Coated Poly',
      weave: 'Heavy Canvas Weave',
      treatment: 'Waterproof Base Tarp',
      care: 'Wipe with Damp Sponge',
    },
    colors: [{ name: 'University Red', hex: '#c81e28' }],
    sizes: ['SMALL (41L)'],
    sku: 'NK-DFL-RED-08',
    features: ['Ventilated side shoe compartment', 'Padded removable shoulder strap', 'Interior zip stash pocket']
  },
  {
    id: 'prod-duffel-white',
    name: 'Nike Gym Club Training Duffel (Summit White)',
    subtitle: 'Sleek Off-White Multi-Pocket Sport Duffel',
    price: 3295,
    category: 'Bags',
    sectionName: 'WOODEN SHELF — BOTTOM CUBBY 2',
    garmentType: 'duffel',
    description: 'Clean minimalist summit white sports duffel crafted with exterior snap accessory pockets, dual rolled top handles, and water-repellent shell.',
    fabricDetails: {
      composition: '100% Poly Canvas',
      weight: '450D Canvas',
      weave: 'Fine Textured Canvas',
      treatment: 'DWR Finish',
      care: 'Wipe Clean',
    },
    colors: [{ name: 'Summit White', hex: '#e8e7e3' }],
    sizes: ['MEDIUM (30L)'],
    sku: 'NK-DFL-WHT-09',
    features: ['Dual snap exterior organizer pockets', 'Rolled carry handles with padded wrap', 'End slip pockets']
  },
  {
    id: 'prod-waist-blue',
    name: 'Nike Heritage Waistpack (Royal Blue & Black)',
    subtitle: 'Ergonomic Two-Tone Running Waistpack',
    price: 1595,
    category: 'Bags',
    sectionName: 'WOODEN SHELF — BOTTOM CUBBY 3',
    garmentType: 'waistpack',
    description: 'Low-profile two-tone waistpack engineered with curved ergonomic fit, dual zippered pulls, and adjustable jacquard webbing strap.',
    fabricDetails: {
      composition: '100% Polyester 400D',
      weight: '400D Poly',
      weave: 'Ripstop Interlock',
      treatment: 'Moisture Barrier',
      care: 'Spot Clean',
    },
    colors: [{ name: 'Royal Blue / Black', hex: '#1c4296' }],
    sizes: ['ONE SIZE (3L)'],
    sku: 'NK-WST-BLU-10',
    features: ['Contoured ergonomic curve', 'Dual zipper pulls for easy access', 'Heavy duty click buckle']
  },

  // -------------------------------------------------------------
  // CAPS & FOOTWEAR (For Caps & Shoes views)
  // -------------------------------------------------------------
  {
    id: 'prod-cap-heritage',
    name: 'Nike Heritage86 Metal Swoosh Cap',
    subtitle: 'Matte Black 6-Panel Curved Brim Cap',
    price: 1295,
    category: 'Caps',
    sectionName: 'CAPS DISPLAY',
    garmentType: 'cap',
    description: 'Classic unstructured 6-panel silhouette featuring an embossed metallic silver swoosh medallion on front crown and adjustable back slider strap.',
    fabricDetails: {
      composition: '100% Recycled Polyester Twill',
      weight: '240 GSM Twill',
      weave: 'Chino Twill',
      treatment: 'Pre-Curved Bill',
      care: 'Hand Wash Cold',
    },
    colors: [
      { name: 'Onyx Black', hex: '#1a1b1e' },
      { name: 'Pure White', hex: '#ffffff' },
    ],
    sizes: ['ONE SIZE (ADJUSTABLE)'],
    sku: 'NK-CAP-H86-01',
    features: ['Embossed metal swoosh ingot', 'Embroidered eyelets for ventilation', 'Adjustable slide buckle strap']
  },
  {
    id: 'prod-shoe-airforce',
    name: "Nike Air Force 1 '07",
    subtitle: 'Iconic Triple White Low-Top Leather Sneaker',
    price: 8195,
    category: 'Shoes',
    sectionName: 'FOOTWEAR DISPLAY',
    garmentType: 'sneaker',
    description: 'The radiator of basketball sneaker culture. Crisp white stitched leather overlays, Nike Air encapsulation underfoot, perforated toe box, and solid rubber cupsole.',
    fabricDetails: {
      composition: 'Full-Grain Leather Upper, Encapsulated Air Sole, Non-Marking Rubber',
      weight: '420g per shoe',
      weave: 'Full-Grain Pebble Leather',
      treatment: 'Stain-Resistant Top Coat',
      care: 'Clean with Sneaker Brush and Mild Foam',
    },
    colors: [
      { name: 'Triple White', hex: '#f7f7f9' },
      { name: 'Black on Black', hex: '#18191c' },
    ],
    sizes: ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'],
    badge: 'LEGENDARY',
    sku: 'NK-AF1-07-WHT',
    features: ['Encapsulated Nike Air cushioning', 'Padded low-cut collar', 'Perforations on toe box for cooling']
  }
];

export const formatINR = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};
