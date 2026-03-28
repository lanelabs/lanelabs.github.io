import { BlockMaterial, type HiddenRoom } from '../types';
import { SeededRNG } from '../rng';
import { ValueNoise2D, fractalNoise1D, catmullRomSpline } from './Noise';
import { carveDemoStructure } from './demoStructure';
import { smoothSpikes, roundCliffs, widenExtrema, validateMinWidth, MIN_FEATURE_WIDTH } from './surfaceHelpers';
import { carveCaves } from './caveCarving';
import { carveDarkStone } from './darkStoneCarving';

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

    // Macro shape — spline-based terrain profile applied before noise
    const macroForms: number[][] = [
      [0.5, 0.48, 0.52, 0.50, 0.49],           // Plains
      [0.3, 0.35, 0.5, 0.65, 0.7],             // Hillside
      [0.3, 0.4, 0.8, 0.7, 0.3],               // Mountain Peak
      [0.7, 0.5, 0.3, 0.5, 0.7],               // Valley
      [0.3, 0.3, 0.7, 0.7, 0.7, 0.3, 0.3],    // Mesa
      [0.3, 0.3, 0.3, 0.7, 0.7, 0.7],          // Cliffside
      [0.2, 0.2, 0.4, 0.4, 0.6, 0.6, 0.8],    // Terraced
      [0.3, 0.6, 0.3, 0.7, 0.4, 0.6, 0.3],    // Rolling Hills
    ];
    const macroStrength = 15 + Math.floor(rng.next() * 21);  // 15–35 blocks of total swing
    const formIndex = Math.floor(rng.next() * macroForms.length);
    // Randomize control points slightly per seed
    const controlPoints = macroForms[formIndex].map(
      p => p + (rng.next() - 0.5) * 0.15
    );

    // Cliff offsets — baked into the macro so cleanup passes see them
    const cliffR = rng.next();
    const cliffCount = cliffR < 0.15 ? 0 : cliffR < 0.55 ? 1 : cliffR < 0.85 ? 2 : 3;
    const cliffs: { x: number; drop: number; dropRight: boolean }[] = [];
    if (cliffCount > 0) {
      const usable = width * 0.7;
      const margin = width * 0.15;
      const zoneW = usable / cliffCount;
      for (let c = 0; c < cliffCount; c++) {
        const zoneStart = margin + c * zoneW;
        const cx = Math.floor(zoneStart + rng.next() * zoneW);
        if (cx < 1 || cx >= width - 1) continue;
        const drop = 8 + Math.floor(rng.next() * 18); // 8–25 blocks
        cliffs.push({ x: cx, drop, dropRight: rng.next() > 0.5 });
      }
    }

    function macroOffset(x: number): number {
      const t = x / (width - 1);
      let offset = (catmullRomSpline(controlPoints, t) - 0.5) * macroStrength;
      for (const cliff of cliffs) {
        if (cliff.dropRight ? x > cliff.x : x < cliff.x) offset += cliff.drop;
      }
      return offset;
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

    // Clean up terrain profile until no narrow features remain (max 5 iterations)
    const MAX_CLEANUP = 5;
    for (let iter = 0; iter < MAX_CLEANUP; iter++) {
      smoothSpikes(surfaceHeights);
      widenExtrema(surfaceHeights, MIN_FEATURE_WIDTH);
      if (iter === 0) roundCliffs(surfaceHeights); // rounding only on first pass
      const violations = validateMinWidth(surfaceHeights, MIN_FEATURE_WIDTH, height);
      if (violations.length === 0) break;
      if (iter === MAX_CLEANUP - 1) {
        console.warn(`[TerrainGen] ${violations.length} min-width violations after ${MAX_CLEANUP} passes`);
      }
    }

    // Shift entire surface so highest point is exactly MIN_SKY rows from top
    const minSurface = Math.min(...surfaceHeights);
    const shift = MIN_SKY - minSurface;
    for (let x = 0; x < width; x++) surfaceHeights[x] += shift;
    surfaceBase += shift;

    // Smoothed baseline for layer boundaries — prevents exposed rock at cliffs
    const smoothRadius = 12;
    const smoothBase: number[] = [];
    for (let x = 0; x < width; x++) {
      let sum = 0, count = 0;
      for (let dx = -smoothRadius; dx <= smoothRadius; dx++) {
        const sx = x + dx;
        if (sx >= 0 && sx < width) { sum += surfaceHeights[sx]; count++; }
      }
      smoothBase[x] = Math.floor(sum / count);
    }

    // Layer boundaries — follow smoothed baseline with noise deviation
    const dirtLayerNoise = fractalNoise1D(rng, width, { octaves: 2, baseFreq: 4, amplitude: 8, persistence: 0.5 });
    const stoneLayerNoise = fractalNoise1D(rng, width, { octaves: 2, baseFreq: 3, amplitude: 15, persistence: 0.5 });
    const dirtBottom: number[] = [];
    const stoneBottom: number[] = [];
    for (let x = 0; x < width; x++) {
      dirtBottom[x] = smoothBase[x] + 20 + Math.floor(dirtLayerNoise[x]);
      const underground = height - smoothBase[x];
      stoneBottom[x] = smoothBase[x] + Math.floor(underground * 0.7) + Math.floor(stoneLayerNoise[x]);
    }

    // DarkStone barrier — sits at ~50% through the stone layer
    const darkStoneThicknessNoise = fractalNoise1D(rng, width, {
      octaves: 2, baseFreq: 5, amplitude: 5, persistence: 0.5,
    });
    const darkStoneTop: number[] = [];
    const darkStoneBottom: number[] = [];
    for (let x = 0; x < width; x++) {
      const stoneMid = Math.floor((dirtBottom[x] + stoneBottom[x]) / 2);
      const thickness = 15 + Math.floor(darkStoneThicknessNoise[x]); // 10-20 range
      darkStoneTop[x] = stoneMid - Math.floor(thickness / 2);
      darkStoneBottom[x] = darkStoneTop[x] + thickness;
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
          if (y >= darkStoneTop[x] && y < darkStoneBottom[x]) {
            row.push(BlockMaterial.DarkStone);
          } else {
            const oreVal = oreNoise.sample(x * 10 / width, y * 10 / width);
            if (oreVal > 0.92) row.push(BlockMaterial.Gold);
            else if (oreVal > 0.85) row.push(BlockMaterial.Iron);
            else row.push(BlockMaterial.Stone);
          }
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

    // DarkStone internal carving — sparse pockets + rare tunnels through barrier
    carveDarkStone(blocks, width, height, darkStoneTop, darkStoneBottom, rng);

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
