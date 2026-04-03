/**
 * Pass 2 — Opportunistic basin fill: scan existing caves for natural enclosed
 * basins and randomly flood some.
 *
 * Pass 3 — Historical rainfall: spawn water at random surface points and
 * instantly simulate downhill settling into basins.
 *
 * All fills create WaterLayers directly with exact pool boundaries —
 * never uses addWater (which auto-expands to the full air run).
 */

import { BlockMaterial } from '../types';
import type { WaterLayer } from '../water/waterLayer';
import { VOLUME_PER_TILE, findLayer } from '../water/waterLayer';
import { scanPoolShape, isPoolContained } from '../water/recombine';
import type { PoolLayer } from '../water/poolScan';
import type { WaterGenConfig, ArchetypeDensity } from './waterGen';

const MAX_BASIN_FLOOD_FILL = 2000;

/**
 * Fill a contained pool bottom-up by creating WaterLayers directly.
 * `quarters` is the total volume to distribute across the pool's layers.
 */
function fillPoolDirect(
  poolLayers: PoolLayer[], quarters: number, layers: WaterLayer[],
): void {
  let remaining = quarters;
  for (const pl of poolLayers) {
    if (remaining <= 0) break;
    const cap = pl.capacity;
    const vol = Math.min(remaining, cap);
    if (vol > 0) {
      layers.push({ y: pl.y, left: pl.left, right: pl.right, volume: vol });
      remaining -= vol;
    }
  }
}

// ─── Pass 2: Opportunistic Basin Fill ───────────────────────────────────

export function fillBasins(
  cfg: WaterGenConfig, density: ArchetypeDensity, layers: WaterLayer[],
): void {
  const { width, height, blocks, rng } = cfg;
  const visited = new Set<number>();
  const key = (x: number, y: number) => y * width + x;

  interface Candidate { poolLayers: PoolLayer[]; totalCap: number }
  const candidates: Candidate[] = [];

  for (let x = 1; x < width - 1; x += 2) {
    for (let y = cfg.surfaceY; y < height - 1; y += 2) {
      if (blocks[y][x] !== BlockMaterial.Air) continue;
      if (y + 1 >= height || blocks[y + 1][x] === BlockMaterial.Air) continue;
      if (visited.has(key(x, y))) continue;

      const pool = scanPoolShape(x, y, blocks, width, height);
      if (!pool) continue;

      let tileCount = 0;
      for (const pl of pool.layers) {
        for (let px = pl.left; px <= pl.right; px++) {
          visited.add(key(px, pl.y));
          tileCount++;
        }
        if (tileCount > MAX_BASIN_FLOOD_FILL) break;
      }
      if (tileCount > MAX_BASIN_FLOOD_FILL) continue;
      if (!isPoolContained(pool, blocks, width, height)) continue;

      const totalCap = pool.layers.reduce((s, l) => s + l.capacity, 0);
      if (totalCap < 3 * VOLUME_PER_TILE) continue;

      candidates.push({ poolLayers: pool.layers, totalCap });
    }
  }

  // Shuffle and fill first N * basinFillFraction
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const fillCount = Math.floor(candidates.length * density.basinFillFraction);
  for (let i = 0; i < fillCount; i++) {
    const c = candidates[i];
    const fillPct = 0.5 + rng.next() * 0.5;
    const quarters = Math.floor(c.totalCap * fillPct);
    fillPoolDirect(c.poolLayers, quarters, layers);
  }
}

// ─── Pass 3: Historical Rainfall ────────────────────────────────────────

const MAX_RAIN_STEPS = 200;

export function settleRainfall(
  cfg: WaterGenConfig, density: ArchetypeDensity, layers: WaterLayer[],
): void {
  const { width, height, blocks, surfaceHeights, rng } = cfg;
  const droplets = density.rainfallDroplets;

  for (let d = 0; d < droplets; d++) {
    const startX = rng.nextInt(1, width - 2);
    let x = startX;
    let y = surfaceHeights[x];

    for (let step = 0; step < MAX_RAIN_STEPS; step++) {
      if (x < 0 || x >= width || y < 0 || y >= height) break;

      if (blocks[y][x] !== BlockMaterial.Air) {
        let found = false;
        for (let checkY = y - 1; checkY >= Math.max(0, y - 5); checkY--) {
          if (blocks[checkY][x] === BlockMaterial.Air) {
            y = checkY; found = true; break;
          }
        }
        if (!found) break;
      }

      // Can fall?
      if (y + 1 < height && blocks[y + 1][x] === BlockMaterial.Air && !findLayer(layers, x, y + 1)) {
        y++; continue;
      }

      // Scan L/R for lower air
      let moved = false;
      const dirs = rng.next() > 0.5 ? [-1, 1] : [1, -1];
      for (const dx of dirs) {
        const nx = x + dx;
        if (nx < 0 || nx >= width) continue;
        if (blocks[y][nx] !== BlockMaterial.Air) continue;
        if (y + 1 < height && blocks[y + 1][nx] === BlockMaterial.Air
            && !findLayer(layers, nx, y + 1)) {
          x = nx; moved = true; break;
        }
      }
      if (moved) continue;

      // Settled — find the contained pool at this position and deposit
      const pool = scanPoolShape(x, y, blocks, width, height);
      if (pool && isPoolContained(pool, blocks, width, height)) {
        // Find the bottom-most layer that has this x and deposit there
        for (const pl of pool.layers) {
          if (x >= pl.left && x <= pl.right) {
            // Check if a layer already exists here, add to it
            const existing = layers.find(
              l => l.y === pl.y && l.left === pl.left && l.right === pl.right,
            );
            if (existing) {
              const cap = (pl.right - pl.left + 1) * VOLUME_PER_TILE;
              existing.volume = Math.min(existing.volume + VOLUME_PER_TILE, cap);
            } else {
              layers.push({
                y: pl.y, left: pl.left, right: pl.right, volume: VOLUME_PER_TILE,
              });
            }
            break;
          }
        }
      }
      break;
    }
  }
}
