import { BlockMaterial, type HiddenRoom } from '../types';
import { SeededRNG } from '../rng';
import { ValueNoise2D, fractalNoise1D } from './Noise';
import { carveDemoStructure } from './demoStructure';

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
const MIN_FEATURE_WIDTH = 3;

/** Remove thin spikes/dips: any column that differs from both neighbors gets averaged. */
function smoothSpikes(heights: number[]): void {
  const len = heights.length;
  const snap = heights.slice();
  for (let x = 1; x < len - 1; x++) {
    const l = snap[x - 1], c = snap[x], r = snap[x + 1];
    // Spike: column sticks up (lower Y) or dips down (higher Y) vs both neighbors
    const isSpike = (c < l && c < r) || (c > l && c > r);
    if (isSpike) {
      heights[x] = Math.round((l + r) / 2);
    }
  }
}

/** Smooth sharp cliff edges with gradual transitions. */
function roundCliffs(heights: number[], minWidth: number): void {
  const snap = heights.slice(); // detect cliffs from original values
  const len = heights.length;

  for (let x = 0; x < len - 1; x++) {
    const diff = snap[x + 1] - snap[x];
    const absDiff = Math.abs(diff);
    if (absDiff <= 1) continue;

    const desiredRadius = absDiff <= 3 ? 1 : Math.min(3, Math.floor(absDiff / 2));

    // Left flat run length (columns at snap[x] extending left from x)
    let leftRun = 1;
    while (x - leftRun >= 0 && snap[x - leftRun] === snap[x]) leftRun++;
    // Right flat run length (columns at snap[x+1] extending right from x+1)
    let rightRun = 1;
    while (x + 1 + rightRun < len && snap[x + 1 + rightRun] === snap[x + 1]) rightRun++;

    // Always allow at least 1 block of rounding; only reserve (minWidth-1) for the flat
    const leftBudget = Math.max(1, leftRun - (minWidth - 1));
    const rightBudget = Math.max(1, rightRun - (minWidth - 1));
    const leftRadius = Math.min(desiredRadius, leftBudget);
    const rightRadius = Math.min(desiredRadius, rightBudget);

    const lo = Math.min(snap[x], snap[x + 1]);
    const hi = Math.max(snap[x], snap[x + 1]);
    const sign = diff > 0 ? 1 : -1; // direction of height change

    // Left-side rounding: adjust heights[x - i] toward the cliff
    for (let i = 0; i < leftRadius; i++) {
      const col = x - i;
      const step = (leftRadius - i) * sign;
      heights[col] = Math.max(lo, Math.min(hi, heights[col] + step));
    }

    // Right-side rounding: adjust heights[x+1 + i] toward the cliff
    for (let i = 0; i < rightRadius; i++) {
      const col = x + 1 + i;
      const step = (rightRadius - i) * -sign;
      heights[col] = Math.max(lo, Math.min(hi, heights[col] + step));
    }
  }
}

/**
 * Inject hard cliff features by shifting one side of the terrain down.
 * Each cliff creates exactly one sheer face — the natural terrain texture
 * is preserved on both sides, just at different elevations.
 */
function injectCliffs(heights: number[], rng: SeededRNG): void {
  const len = heights.length;
  // 0–3 cliffs, weighted: 15% none, 40% one, 30% two, 15% three
  const r = rng.next();
  const count = r < 0.15 ? 0 : r < 0.55 ? 1 : r < 0.85 ? 2 : 3;
  if (count === 0) return;

  // Collect cliff positions spread across the map
  const usable = len * 0.7;
  const margin = len * 0.15;
  const zoneWidth = usable / count;
  const cliffs: { x: number; drop: number }[] = [];

  for (let c = 0; c < count; c++) {
    const zoneStart = margin + c * zoneWidth;
    const cliffX = Math.floor(zoneStart + rng.next() * zoneWidth);
    if (cliffX < 1 || cliffX >= len - 1) continue;
    const drop = 8 + Math.floor(rng.next() * 18); // 8–25 blocks
    cliffs.push({ x: cliffX, drop });
  }
  cliffs.sort((a, b) => a.x - b.x);

  // Apply: shift all columns right of each cliff down by `drop`
  // Process right-to-left so shifts don't compound unexpectedly
  for (let i = cliffs.length - 1; i >= 0; i--) {
    const { x, drop } = cliffs[i];
    for (let col = x + 1; col < len; col++) {
      heights[col] += drop;
    }
  }
}

/** Widen any peak or canyon narrower than `minWidth` columns. */
function widenExtrema(heights: number[], minWidth: number): void {
  const len = heights.length;
  for (let pass = 0; pass < 3; pass++) {
    // Find runs of equal height, check if the run is a local extremum
    let x = 0;
    while (x < len) {
      const h = heights[x];
      const lo = x;
      while (x < len && heights[x] === h) x++;
      const hi = x - 1; // inclusive end of run
      const w = hi - lo + 1;
      if (w >= minWidth) continue;
      const leftH = lo > 0 ? heights[lo - 1] : h;
      const rightH = hi < len - 1 ? heights[hi + 1] : h;
      // Peak: run is lower Y (higher ground) than both neighbors
      // Canyon: run is higher Y (lower ground) than both neighbors
      const isPeak = h < leftH && h < rightH;
      const isCanyon = h > leftH && h > rightH;
      if (!isPeak && !isCanyon) continue;
      const need = minWidth - w;
      const addL = Math.ceil(need / 2);
      const addR = need - addL;
      for (let i = 1; i <= addL && lo - i >= 0; i++) heights[lo - i] = h;
      for (let i = 1; i <= addR && hi + i < len; i++) heights[hi + i] = h;
    }
  }
}

/**
 * Generates a 2D terrain grid from a seed.
 *
 * Layout (top to bottom):
 *   - Sky (air) — fixed 20 blocks
 *   - Surface line (varies with noise, hills/valleys)
 *   - Dirt layer (with grass on top)
 *   - Stone layer (with ore veins, caves, and tunnels)
 *   - Granite / deep stone
 *   - Bedrock at the very bottom
 *
 * Hidden rooms are carved into the terrain:
 *   - Resource caches (extra ore)
 *   - Creature lairs
 *   - Ruins
 */
export class TerrainGenerator {
  static generate(seed: number, width: number, height: number): TerrainGrid {
    const rng = new SeededRNG(seed);
    const oreNoise = new ValueNoise2D(rng, 10, 10);
    const caveNoise = new ValueNoise2D(rng, 16, 16);
    const tunnelNoise = new ValueNoise2D(rng, 24, 24);

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
      // Center offsets around 0 so shapes swing from -strength/2 to +strength/2
      const half = macroStrength / 2;
      switch (macroShape) {
        case 1: return (t - 0.5) * macroStrength;                       // high ground L → low ground R
        case 2: return (0.5 - t) * macroStrength;                       // low ground L → high ground R
        case 3: return (Math.abs(t - 0.5) * 2) * half - half;           // valley (edges high, center low)
        case 4: return half - (Math.abs(t - 0.5) * 2) * half;           // ridge (center high, edges low)
        default: return 0;                                               // flat baseline
      }
    }

    // Pre-compute per-column surface heights using multi-octave fractal noise
    let surfaceBase = SKY_HEIGHT;
    const surfaceOffsets = fractalNoise1D(rng, width, {
      octaves: 3,
      baseFreq: 8,
      amplitude,
      persistence: 0.5,
    });

    // Optional terrace effect: quantize heights in some regions for cliffs/mesas
    const terraceMask = new ValueNoise2D(rng, 6, 1);
    const surfaceHeights: number[] = [];
    for (let x = 0; x < width; x++) {
      let offset = surfaceOffsets[x] + macroOffset(x);
      const maskVal = terraceMask.sample(x * 6 / width, 0);
      if (maskVal > terraceThreshold) {
        // Rare massive cliffs when mask is very high
        const step = maskVal > 0.9 ? baseStep + 4 + Math.floor(rng.next() * 5) : baseStep;
        offset = Math.round(offset / step) * step;
      }
      surfaceHeights.push(surfaceBase + Math.floor(offset));
    }

    // Clean up terrain profile: remove spikes, enforce min widths, inject cliffs, round edges
    smoothSpikes(surfaceHeights);
    widenExtrema(surfaceHeights, MIN_FEATURE_WIDTH);
    injectCliffs(surfaceHeights, rng);
    roundCliffs(surfaceHeights, MIN_FEATURE_WIDTH);

    // Shift entire surface so highest point is exactly MIN_SKY rows from top
    const minSurface = Math.min(...surfaceHeights);
    const shift = MIN_SKY - minSurface;
    for (let x = 0; x < width; x++) surfaceHeights[x] += shift;
    surfaceBase += shift;

    // Base terrain pass
    const blocks: BlockMaterial[][] = [];
    for (let y = 0; y < height; y++) {
      const row: BlockMaterial[] = [];
      for (let x = 0; x < width; x++) {
        const surfaceY = surfaceHeights[x];

        if (y < surfaceY) {
          row.push(BlockMaterial.Air);
        } else if (y >= height - 1) {
          row.push(BlockMaterial.Bedrock);
        } else {
          const depth = y - surfaceY;
          const depthRatio = depth / (height - surfaceY);

          if (depthRatio < 0.2) {
            row.push(BlockMaterial.Dirt);
          } else if (depthRatio < 0.7) {
            const oreVal = oreNoise.sample(x * 10 / width, y * 10 / height);
            if (oreVal > 0.85) {
              row.push(BlockMaterial.Iron);
            } else if (oreVal > 0.92) {
              row.push(BlockMaterial.Gold);
            } else {
              row.push(BlockMaterial.Stone);
            }
          } else if (depthRatio < 0.95) {
            const oreVal = oreNoise.sample(x * 10 / width, y * 10 / height);
            if (oreVal > 0.9) {
              row.push(BlockMaterial.Crystal);
            } else {
              row.push(BlockMaterial.Granite);
            }
          } else {
            row.push(BlockMaterial.Bedrock);
          }
        }
      }
      blocks.push(row);
    }

    // Cave carving pass — only 8+ blocks below surface
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const depthBelowSurface = y - surfaceHeights[x];
        if (depthBelowSurface < 8) continue;
        const mat = blocks[y][x];
        if (mat === BlockMaterial.Air || mat === BlockMaterial.Bedrock) continue;
        const val = caveNoise.sample(x * 16 / width, y * 16 / height);
        if (val > 0.72) {
          blocks[y][x] = BlockMaterial.Air;
        }
      }
    }

    // Tunnel carving pass — only 4+ blocks below surface
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const depthBelowSurface = y - surfaceHeights[x];
        if (depthBelowSurface < 4) continue;
        const mat = blocks[y][x];
        if (mat === BlockMaterial.Air || mat === BlockMaterial.Bedrock) continue;
        const val = tunnelNoise.sample(x * 24 / width, y * 24 / height);
        if (val > 0.78) {
          blocks[y][x] = BlockMaterial.Air;
        }
      }
    }

    // Worm tunnel pass — drunkard's walk to carve narrow connecting passages
    const wormCount = 4 + Math.floor(rng.next() * 3); // 4-6 worms
    for (let w = 0; w < wormCount; w++) {
      const steps = 40 + Math.floor(rng.next() * 40); // 40-79 steps
      const tunnelH = 1 + Math.floor(rng.next() * 3); // 1-3 blocks tall
      let wx = Math.floor(rng.next() * width);
      const minY = surfaceBase + 6;
      const maxY = height - 3 - tunnelH;
      if (minY >= maxY) continue;
      let wy = minY + Math.floor(rng.next() * (maxY - minY));
      for (let s = 0; s < steps; s++) {
        for (let th = 0; th < tunnelH; th++) {
          const cy = wy + th;
          if (wx >= 0 && wx < width && cy >= 0 && cy < height - 1) {
            if (blocks[cy][wx] !== BlockMaterial.Bedrock) {
              blocks[cy][wx] = BlockMaterial.Air;
            }
          }
        }
        // 70% horizontal, 30% vertical — creates long connecting passages
        const r = rng.next();
        if (r < 0.35) wx += 1;
        else if (r < 0.7) wx -= 1;
        else if (r < 0.85) wy += 1;
        else wy -= 1;
        // Clamp to underground region
        wy = Math.max(minY, Math.min(maxY, wy));
        wx = Math.max(0, Math.min(width - 1, wx));
      }
    }

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
    const roomTypes: Array<'cache' | 'lair' | 'ruin'> = [
      'cache', 'cache', 'lair', 'lair', 'ruin',
    ];

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
          const bx = rx + dx;
          const by = ry + dy;
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
            const bx = rx + dx;
            const by = ry + dy;
            if (bx >= 0 && bx < width && by >= 0 && by < height - 1) {
              if (blocks[by][bx] !== BlockMaterial.Air
                && blocks[by][bx] !== BlockMaterial.Bedrock) {
                if (rng.next() > 0.5) {
                  blocks[by][bx] = oreMat;
                }
              }
            }
          }
        }
      }
    }

    // Initialize waterMass grid (all zeros — water is placed by demo structure / pools)
    const waterMass: number[][] = [];
    for (let y = 0; y < height; y++) {
      waterMass.push(new Array(width).fill(0));
    }

    // Fill pool-type rooms with water
    for (const room of rooms) {
      if (room.type === 'pool') {
        for (let dy = 0; dy < room.height; dy++) {
          for (let dx = 0; dx < room.width; dx++) {
            const px = room.x + dx;
            const py = room.y + dy;
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
    for (let y = 0; y < height; y++) {
      grid.push(new Array(width).fill(0));
    }
    return grid;
  }
}
