import { BlockMaterial, type HiddenRoom } from '../types';
import { SeededRNG } from '../rng';
import { ValueNoise2D, fractalNoise1D, catmullRomSpline } from './Noise';

import { smoothSpikes, roundCliffs, widenExtrema, validateMinWidth, MIN_FEATURE_WIDTH } from './surfaceHelpers';
import { carveCaves, carveCavernLayer } from './caveCarving';
import { carveDarkStone } from './darkStoneCarving';
import { carveSpaghettiTunnels } from './tunnelCarving';
import { generateOreVeins } from './oreVeins';
import { generateStrata } from './strataGen';
import { carveFaultLines } from './faultLines';
import { carvePerlinWorms } from './perlinWorms';
import { caRoughen } from './caRoughen';
import { growFormations } from './formations';
import type { LayerBoundaries } from './depthZones';
import { generateWater } from './waterGen';
import type { WaterLayer } from '../water/waterLayer';
import type { GasLayer } from '../gas/types';
import { generateGas } from './gasGen';

export interface TerrainGrid {
  width: number;
  height: number;
  blocks: BlockMaterial[][];
  waterMass: number[][];
  strataTint: number[][];
  surfaceY: number;
  surfaceHeights: number[];
  rooms: HiddenRoom[];
  initialWaterVolume: WaterLayer[];
  initialGasVolume: GasLayer[];
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
    // Fade noise for DarkStone edge blending
    const fadeNoise = new ValueNoise2D(rng, 8, Math.ceil(8 * height / width));

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

    // Layer boundaries bundle for new terrain features
    const bounds: LayerBoundaries = {
      surfaceHeights, dirtBottom, darkStoneTop, darkStoneBottom, stoneBottom, height,
    };

    // Base terrain pass — block assignment (no inline ore; veins added later)
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
            const FADE_DEPTH = 6;
            const distFromTop = y - darkStoneTop[x];
            const distFromBottom = darkStoneBottom[x] - 1 - y;
            const distFromEdge = Math.min(distFromTop, distFromBottom);
            const isDark = distFromEdge >= FADE_DEPTH
              || fadeNoise.sample(x * 8 / width, y * 8 / width) < distFromEdge / FADE_DEPTH;
            row.push(isDark ? BlockMaterial.DarkStone : BlockMaterial.Stone);
          } else {
            row.push(BlockMaterial.Stone);
          }
        } else if (y < height - 2) {
          row.push(BlockMaterial.Granite);
        } else {
          row.push(BlockMaterial.Bedrock);
        }
      }
      blocks.push(row);
    }

    // Grass painting pass — before carving so tunnels/caves that breach the
    // surface naturally remove grass, creating visible openings
    for (let x = 0; x < width; x++) {
      const sy = surfaceHeights[x];
      if (sy >= 0 && sy < height && blocks[sy][x] === BlockMaterial.Dirt) {
        blocks[sy][x] = BlockMaterial.GrassyDirt;
      }
    }

    // Pre-carving features: ore veins, strata tint, fault lines
    generateOreVeins(blocks, width, height, bounds, rng);
    const strataTint = generateStrata(width, height, bounds, rng);
    carveFaultLines(blocks, width, height, bounds, rng);

    // Cave carving — small frequent pockets near surface, larger sparse caverns near darkstone
    carveCaves(blocks, width, height, surfaceHeights, darkStoneTop, surfaceBase, rng);

    // Cavern layer — dense large chambers below the DarkStone barrier
    carveCavernLayer(blocks, width, height, darkStoneBottom, stoneBottom, rng);

    // DarkStone internal carving — sparse pockets + rare tunnels through barrier
    carveDarkStone(blocks, width, height, darkStoneTop, darkStoneBottom, rng);

    // Spaghetti tunnels — thin directed strands that can pierce any layer
    carveSpaghettiTunnels(blocks, width, height, surfaceHeights, rng);

    // Perlin worms — variable-radius noise-directed tunnels
    carvePerlinWorms(blocks, width, height, bounds, rng);

    // CA roughening — erode cave edges for irregular walls
    caRoughen(blocks, width, height, bounds, rng);

    // Stalactites and stalagmites
    growFormations(blocks, width, height, bounds, rng);

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

    // Water body generation — 3-pass system (imposed shapes, basin fill, rainfall)
    const initialWaterVolume = generateWater({
      width, height, blocks, bounds, surfaceHeights, surfaceY: surfaceBase, rng,
    });

    // Gas pocket generation — 2-pass system (imposed pockets, ceiling basin fill)
    const initialGasVolume = generateGas({
      width, height, blocks, bounds, surfaceHeights, surfaceY: surfaceBase, rng,
      waterLayers: initialWaterVolume,
    });

    // Empty waterMass grid (water system removed — kept for save compatibility)
    const waterMass: number[][] = [];
    for (let y = 0; y < height; y++) waterMass.push(new Array(width).fill(0));

    return { width, height, blocks, waterMass, strataTint, surfaceY: surfaceBase, surfaceHeights, rooms, initialWaterVolume, initialGasVolume };
  }

  static fallbackSurfaceHeights(width: number, surfaceY: number): number[] {
    return new Array(width).fill(surfaceY);
  }

  static emptyWaterMass(width: number, height: number): number[][] {
    const grid: number[][] = [];
    for (let y = 0; y < height; y++) grid.push(new Array(width).fill(0));
    return grid;
  }

  static emptyStrataTint(width: number, height: number): number[][] {
    const grid: number[][] = [];
    for (let y = 0; y < height; y++) grid.push(new Array(width).fill(0));
    return grid;
  }
}
