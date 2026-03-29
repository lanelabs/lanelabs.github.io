import { BlockMaterial } from '../types';
import { SeededRNG } from '../rng';
import { ValueNoise2D } from './Noise';
import { getDepthZone, type DepthZone, type LayerBoundaries } from './depthZones';

interface OreConfig {
  material: BlockMaterial;
  seedThreshold: number;
  lengthRange: [number, number];
  thickness: number;
  shape: 'horizontal' | 'diagonal' | 'branching';
  zones: DepthZone[];
}

const ORE_CONFIGS: OreConfig[] = [
  {
    material: BlockMaterial.Iron,
    seedThreshold: 0.88,
    lengthRange: [6, 15],
    thickness: 2,
    shape: 'horizontal',
    zones: ['shallow', 'midStone'],
  },
  {
    material: BlockMaterial.Gold,
    seedThreshold: 0.93,
    lengthRange: [4, 10],
    thickness: 1,
    shape: 'diagonal',
    zones: ['midStone', 'darkStone'],
  },
  {
    material: BlockMaterial.Crystal,
    seedThreshold: 0.91,
    lengthRange: [3, 8],
    thickness: 1,
    shape: 'branching',
    zones: ['cavern', 'deep'],
  },
];

// Directions for walk bias per shape
const DIRS = [
  { dx: 1, dy: 0 }, { dx: -1, dy: 0 },  // horizontal
  { dx: 0, dy: 1 }, { dx: 0, dy: -1 },  // vertical
  { dx: 1, dy: 1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, // diagonal
];

function walkVein(
  blocks: BlockMaterial[][], width: number, height: number,
  sx: number, sy: number, material: BlockMaterial,
  length: number, thickness: number, shape: OreConfig['shape'],
  rng: SeededRNG,
): void {
  let x = sx, y = sy;
  // Pick a primary direction
  let dir = shape === 'horizontal'
    ? (rng.next() > 0.5 ? 0 : 1) // left/right
    : shape === 'diagonal'
      ? (4 + Math.floor(rng.next() * 4)) // diagonal dirs
      : Math.floor(rng.next() * 8);

  for (let step = 0; step < length; step++) {
    // Place ore at current position with thickness
    for (let dy = 0; dy < thickness; dy++) {
      for (let dx = 0; dx < thickness; dx++) {
        const px = x + dx, py = y + dy;
        if (px < 0 || px >= width || py < 0 || py >= height) continue;
        const mat = blocks[py][px];
        if (mat === BlockMaterial.Air || mat === BlockMaterial.Bedrock ||
            mat === BlockMaterial.DarkStone || mat === BlockMaterial.GrassyDirt) continue;
        blocks[py][px] = material;
      }
    }

    // Choose next direction based on shape bias
    const r = rng.next();
    if (shape === 'horizontal') {
      // 60% same direction, 20% reverse, 20% vertical drift
      if (r < 0.6) { /* same dir */ }
      else if (r < 0.8) dir = dir === 0 ? 1 : 0;
      else dir = rng.next() > 0.5 ? 2 : 3;
    } else if (shape === 'diagonal') {
      // 50% same, 25% adjacent diagonal, 25% drift
      if (r < 0.5) { /* same */ }
      else if (r < 0.75) dir = 4 + Math.floor(rng.next() * 4);
      else dir = Math.floor(rng.next() * 4);
    } else {
      // Branching: 40% same, 30% any, 15% fork
      if (r < 0.4) { /* same */ }
      else if (r < 0.7) dir = Math.floor(rng.next() * 8);
      else if (r < 0.85 && step > 2) {
        // Fork: recursively spawn a short branch
        const forkLen = Math.max(2, Math.floor((length - step) * 0.5));
        walkVein(blocks, width, height, x, y, material, forkLen, thickness, 'branching', rng);
        dir = Math.floor(rng.next() * 8);
      } else {
        dir = Math.floor(rng.next() * 8);
      }
    }

    const d = DIRS[dir % DIRS.length];
    x += d.dx;
    y += d.dy;
    if (x < 0 || x >= width || y < 0 || y >= height) break;
  }
}

/**
 * Replace scattered single-block ores with vein-shaped deposits.
 * Clears existing ore first, then generates veins per ore type.
 */
export function generateOreVeins(
  blocks: BlockMaterial[][], width: number, height: number,
  bounds: LayerBoundaries, rng: SeededRNG,
): void {
  // Clear existing scattered ore back to base material
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const mat = blocks[y][x];
      if (mat === BlockMaterial.Iron || mat === BlockMaterial.Gold || mat === BlockMaterial.Crystal) {
        const { zone } = getDepthZone(x, y, bounds);
        blocks[y][x] = (zone === 'cavern' || zone === 'deep')
          ? BlockMaterial.Granite : BlockMaterial.Stone;
      }
    }
  }

  // Seed noise per ore type
  for (const cfg of ORE_CONFIGS) {
    const seedNoise = new ValueNoise2D(rng, 12, Math.ceil(12 * height / width));
    // Scan for seed points
    for (let y = 0; y < height; y += 3) {
      for (let x = 0; x < width; x += 3) {
        const { zone } = getDepthZone(x, y, bounds);
        if (!cfg.zones.includes(zone)) continue;
        const mat = blocks[y][x];
        if (mat === BlockMaterial.Air || mat === BlockMaterial.Bedrock || mat === BlockMaterial.DarkStone) continue;

        const sv = seedNoise.sample(x * 12 / width, y * 12 / width);
        if (sv < cfg.seedThreshold) continue;

        const length = cfg.lengthRange[0] + Math.floor(rng.next() * (cfg.lengthRange[1] - cfg.lengthRange[0] + 1));
        walkVein(blocks, width, height, x, y, cfg.material, length, cfg.thickness, cfg.shape, rng);
      }
    }
  }
}
