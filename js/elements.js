// Element type constants
export const EMPTY = 0;
export const SAND = 1;
export const WATER = 2;
export const STONE = 3;
export const FIRE = 4;
export const OIL = 5;
export const STEAM = 6;
export const WOOD = 7;
export const GUNPOWDER = 8;
export const ICE = 9;
export const LAVA = 10;
export const METAL = 11;
export const ACID = 12;
export const PLANT = 13;
export const SALT = 14;
export const SMOKE = 15;
export const GLASS = 16;
export const ASH = 17;
export const SALTWATER = 18;

// Behavior categories
export const BEHAVIOR = {
  NONE: 'none',       // Empty
  POWDER: 'powder',   // Falls, piles, slides
  LIQUID: 'liquid',   // Flows sideways, density-based
  GAS: 'gas',         // Rises, disperses
  SOLID: 'solid',     // Static unless acted on
  FIRE: 'fire',       // Special: burns, spreads, dies
  ORGANIC: 'organic', // Grows, burns
};

// Element metadata
export const ELEMENTS = {
  [EMPTY]:     { name: 'Empty',     behavior: BEHAVIOR.NONE,    color: [0, 0, 0],       density: 0 },
  [SAND]:      { name: 'Sand',      behavior: BEHAVIOR.POWDER,  color: [194, 178, 128],  density: 1500 },
  [WATER]:     { name: 'Water',     behavior: BEHAVIOR.LIQUID,  color: [28, 119, 195],   density: 1000 },
  [STONE]:     { name: 'Stone',     behavior: BEHAVIOR.SOLID,   color: [136, 140, 141],  density: 2500 },
  [FIRE]:      { name: 'Fire',      behavior: BEHAVIOR.FIRE,    color: [226, 88, 34],    density: 0,    lifetime: 30 },
  [OIL]:       { name: 'Oil',       behavior: BEHAVIOR.LIQUID,  color: [64, 48, 28],     density: 800 },
  [STEAM]:     { name: 'Steam',     behavior: BEHAVIOR.GAS,     color: [200, 200, 220],  density: 1,    lifetime: 200 },
  [WOOD]:      { name: 'Wood',      behavior: BEHAVIOR.SOLID,   color: [120, 81, 45],    density: 600 },
  [GUNPOWDER]: { name: 'Gunpowder', behavior: BEHAVIOR.POWDER,  color: [80, 80, 80],     density: 1700 },
  [ICE]:       { name: 'Ice',       behavior: BEHAVIOR.SOLID,   color: [150, 210, 240],  density: 900 },
  [LAVA]:      { name: 'Lava',      behavior: BEHAVIOR.LIQUID,  color: [207, 47, 14],    density: 3000 },
  [METAL]:     { name: 'Metal',     behavior: BEHAVIOR.SOLID,   color: [160, 170, 180],  density: 7800 },
  [ACID]:      { name: 'Acid',      behavior: BEHAVIOR.LIQUID,  color: [130, 255, 50],   density: 1200 },
  [PLANT]:     { name: 'Plant',     behavior: BEHAVIOR.ORGANIC, color: [34, 139, 34],    density: 500 },
  [SALT]:      { name: 'Salt',      behavior: BEHAVIOR.POWDER,  color: [230, 230, 230],  density: 2200 },
  [SMOKE]:     { name: 'Smoke',     behavior: BEHAVIOR.GAS,     color: [100, 100, 100],  density: 1,    lifetime: 150 },
  [GLASS]:     { name: 'Glass',     behavior: BEHAVIOR.SOLID,   color: [200, 220, 255],  density: 2500 },
  [ASH]:       { name: 'Ash',       behavior: BEHAVIOR.POWDER,  color: [150, 150, 150],  density: 600 },
  [SALTWATER]: { name: 'Saltwater', behavior: BEHAVIOR.LIQUID,  color: [40, 130, 180],   density: 1025 },
};

// Palette: elements the player can select (excludes byproducts like Ash, Saltwater)
export const PALETTE = [
  SAND, WATER, STONE, FIRE, OIL, STEAM, WOOD,
  GUNPOWDER, ICE, LAVA, METAL, ACID, PLANT, SALT, GLASS, SMOKE,
];
