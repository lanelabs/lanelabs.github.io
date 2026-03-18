import { BlockMaterial, type HiddenRoom } from '../types';
import { SeededRNG } from '../rng';
import { ValueNoise2D, fractalNoise1D } from './Noise';
import { carveDemoStructure } from './demoStructure';
import { smoothSpikes, roundCliffs, injectCliffs, widenExtrema, MIN_FEATURE_WIDTH } from './surfaceHelpers';
import { carveCaves } from './caveCarving';

export interface TerrainGrid {
  width: number;
  height: number;
  blocks: BlockMaterial[][];
  waterMass: number[][];
  surfaceY: number;
  surfaceHeights: number[];
  rooms: HiddenRoom[];
}

const SKY_HEIGHT = 24;
const MIN_SKY = 10;  // highest surface point sits this many rows from top

/**
 * Generates a 2D terrain grid from a seed.
 *
 * Layout (top to bottom):
 *   - Sky (air)
 *   - Surface line (varies with noise, hills/valleys)
 *   - Dirt layer — follows surface contour with ±8 noise deviation
 *   - Stone layer — follows surface contour with ±15 noise deviation
 *   - Granite / deep stone
 *   - Bedrock at the very bottom
 */
export class TerrainGenerator {
  static generate(seed: number, width: number, height: number): TerrainGrid {
    const rng = new SeededRNG(seed);
    // Ore noise — normalize both axes by width to prevent vertical stretching
    const oreNoise = new ValueNoise2D(rng, 10, Math.ceil(10 * height / width));

    // Randomize terrain character per world: rolling hills ↔ dramatic cliffs
    const amplitude = 10 + Math.floor(rng.next() * 21);      // 10–30
    const terraceThreshold = 0.4 + rng.next() * 0.35;        // 0.40–0.75 (lower = more cliffs)
    const baseStep = 4 + Math.floor(rng.next() * 5);         // 4–8

    // Macro shape — large-scale terrain profile applied before noise
    // 0=flat, 1=slope L→R, 2=slope R→L, 3=valley, 4=ridge
    const macroShape = Math.floor(rng.next() * 5);
    const macroStrength = 15 + Math.floor(rng.next() * 21);  // 15–35 blocks of total swing
    function macroOffset(x: number): number {
      const t = x / (width - 1); // 0..1 across map
      const half = macroStrength / 2;
      switch (macroShape) {
        case 1: return (t - 0.5) * macroStrength;
        case 2: return (0.5 - t) * macroStrength;
        case 3: return (Math.abs(t - 0.5) * 2) * half - half;
        case 4: return half - (Math.abs(t - 0.5) * 2) * half;
        default: return 0;
      }
    }

    // Pre-compute per-column surface heights using multi-octave fractal noise
    let surfaceBase = SKY_HEIGHT;
    const surfaceOffsets = fractalNoise1D(rng, width, {
      octaves: 3, baseFreq: 8, amplitude, persistence: 0.5,
    });

    // Optional terrace effect: quantize heights in some regions for cliffs/mesas
    const terraceMask = new ValueNoise2D(rng, 6, 1);
    const surfaceHeights: number[] = [];
    for (let x = 0; x < width; x++) {
      let offset = surfaceOffsets[x] + macroOffset(x);
      const maskVal = terraceMask.sample(x * 6 / width, 0);
      if (maskVal > terraceThreshold) {
        const step = maskVal > 0.9 ? baseStep + 4 + Math.floor(rng.next() * 5) : baseStep;
        offset = Math.round(offset / step) * step;
      }
      surfaceHeights.push(surfaceBase + Math.floor(offset));
    }

    // Clean up terrain profile
    smoothSpikes(surfaceHeights);
    widenExtrema(surfaceHeights, MIN_FEATURE_WIDTH);
    injectCliffs(surfaceHeights, rng);
    roundCliffs(surfaceHeights, MIN_FEATURE_WIDTH);

    // Shift entire surface so highest point is exactly MIN_SKY rows from top
    const minSurface = Math.min(...surfaceHeights);
    const shift = MIN_SKY - minSurface;
    for (let x = 0; x < width; x++) surfaceHeights[x] += shift;
    surfaceBase += shift;

    // Layer boundaries — follow surface contour with noise deviation
    const dirtLayerNoise = fractalNoise1D(rng, width, { octaves: 2, baseFreq: 4, amplitude: 8, persistence: 0.5 });
    const stoneLayerNoise = fractalNoise1D(rng, width, { octaves: 2, baseFreq: 3, amplitude: 15, persistence: 0.5 });
    const dirtBottom: number[] = [];
    const stoneBottom: number[] = [];
    for (let x = 0; x < width; x++) {
      dirtBottom[x] = surfaceHeights[x] + 20 + Math.floor(dirtLayerNoise[x]);
      const underground = height - surfaceHeights[x];
      stoneBottom[x] = surfaceHeights[x] + Math.floor(underground * 0.7) + Math.floor(stoneLayerNoise[x]);
    }

    // Base terrain pass — block assignment using layer boundaries
    const blocks: BlockMaterial[][] = [];
    for (let y = 0; y < height; y++) {
      const row: BlockMaterial[] = [];
      for (let x = 0; x < width; x++) {
        if (y < surfaceHeights[x]) {
          row.push(BlockMaterial.Air);
        } else if (y >= height - 1) {
          row.push(BlockMaterial.Bedrock);
        } else if (y < dirtBottom[x]) {
          row.push(BlockMaterial.Dirt);
        } else if (y < stoneBottom[x]) {
          const oreVal = oreNoise.sample(x * 10 / width, y * 10 / width);
          if (oreVal > 0.92) row.push(BlockMaterial.Gold);
          else if (oreVal > 0.85) row.push(BlockMaterial.Iron);
          else row.push(BlockMaterial.Stone);
        } else if (y < height - 2) {
          const oreVal = oreNoise.sample(x * 10 / width, y * 10 / width);
          if (oreVal > 0.9) row.push(BlockMaterial.Crystal);
          else row.push(BlockMaterial.Granite);
        } else {
          row.push(BlockMaterial.Bedrock);
        }
      }
      blocks.push(row);
    }

    // Cave carving — per-layer noise with different character per layer
    carveCaves(blocks, width, height, surfaceHeights, dirtBottom, stoneBottom, surfaceBase, rng);

    // Grass painting pass — topmost Dirt at each surface column becomes GrassyDirt
    for (let x = 0; x < width; x++) {
      const sy = surfaceHeights[x];
      if (sy >= 0 && sy < height && blocks[sy][x] === BlockMaterial.Dirt) {
        blocks[sy][x] = BlockMaterial.GrassyDirt;
      }
    }

    // Hidden rooms pass
    const rooms: HiddenRoom[] = [];
    const roomCount = 3 + Math.floor(rng.next() * 3);
    const roomTypes: Array<'cache' | 'lair' | 'ruin'> = ['cache', 'cache', 'lair', 'lair', 'ruin'];
    for (let i = 0; i < roomCount; i++) {
      const rw = 3 + Math.floor(rng.next() * 3);
      const rh = 3 + Math.floor(rng.next() * 2);
      const rx = 3 + Math.floor(rng.next() * (width - rw - 6));
      const minRoomY = surfaceBase + Math.floor((height - surfaceBase) * 0.25);
      const maxRoomY = height - rh - 3;
      if (minRoomY >= maxRoomY) continue;
      const ry = minRoomY + Math.floor(rng.next() * (maxRoomY - minRoomY));
      const type = roomTypes[i % roomTypes.length];
      rooms.push({ x: rx, y: ry, width: rw, height: rh, type });
      for (let dy = 0; dy < rh; dy++) {
        for (let dx = 0; dx < rw; dx++) {
          const bx = rx + dx, by = ry + dy;
          if (bx >= 0 && bx < width && by >= 0 && by < height - 1) {
            blocks[by][bx] = BlockMaterial.Air;
          }
        }
      }
      if (type === 'cache') {
        const oreMat = rng.next() > 0.5 ? BlockMaterial.Iron : BlockMaterial.Gold;
        for (let dx = -1; dx <= rw; dx++) {
          for (let dy = -1; dy <= rh; dy++) {
            if (dx >= 0 && dx < rw && dy >= 0 && dy < rh) continue;
            const bx = rx + dx, by = ry + dy;
            if (bx >= 0 && bx < width && by >= 0 && by < height - 1) {
              if (blocks[by][bx] !== BlockMaterial.Air && blocks[by][bx] !== BlockMaterial.Bedrock) {
                if (rng.next() > 0.5) blocks[by][bx] = oreMat;
              }
            }
          }
        }
      }
    }

    // Initialize waterMass grid
    const waterMass: number[][] = [];
    for (let y = 0; y < height; y++) waterMass.push(new Array(width).fill(0));

    // Fill pool-type rooms with water
    for (const room of rooms) {
      if (room.type === 'pool') {
        for (let dy = 0; dy < room.height; dy++) {
          for (let dx = 0; dx < room.width; dx++) {
            const px = room.x + dx, py = room.y + dy;
            if (px >= 0 && px < width && py >= 0 && py < height && blocks[py][px] === BlockMaterial.Air) {
              waterMass[py][px] = 5;
            }
          }
        }
      }
    }

    // Carve demo structure next to player spawn
    const spawnX = Math.floor(width / 2);
    carveDemoStructure(blocks, waterMass, spawnX, surfaceBase, width, height);

    return { width, height, blocks, waterMass, surfaceY: surfaceBase, surfaceHeights, rooms };
  }

  static fallbackSurfaceHeights(width: number, surfaceY: number): number[] {
    return new Array(width).fill(surfaceY);
  }

  static emptyWaterMass(width: number, height: number): number[][] {
    const grid: number[][] = [];
    for (let y = 0; y < height; y++) grid.push(new Array(width).fill(0));
    return grid;
  }
}
