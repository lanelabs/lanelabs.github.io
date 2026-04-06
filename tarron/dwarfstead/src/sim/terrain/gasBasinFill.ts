/**
 * Pass 2 — Opportunistic gas ceiling basin fill: scan existing caves for
 * ceiling-contained air pockets and randomly fill some with gas.
 *
 * Mirrors waterBasinFill.ts with inverted containment: checks ceiling (y-1)
 * instead of floor (y+1), and uses gas pool scanning.
 */

import { BlockMaterial } from '../types';
import type { GasLayer } from '../gas/types';
import { VOLUME_PER_TILE } from '../gas/gasLayer';
import { scanGasPoolShape, isGasPoolContained } from '../gas/gasRecombine';
import type { GasGenConfig, GasDensity } from './gasGen';

const MAX_BASIN_FLOOD_FILL = 2000;

export function fillGasBasins(
  cfg: GasGenConfig, density: GasDensity, layers: GasLayer[],
): void {
  const { width, height, blocks, bounds, rng } = cfg;
  const visited = new Set<number>();
  const key = (x: number, y: number) => y * width + x;

  interface Candidate {
    poolLayers: { y: number; left: number; right: number; capacity: number }[];
    totalCap: number;
    midY: number;
    midX: number;
  }
  const candidates: Candidate[] = [];

  for (let x = 1; x < width - 1; x += 2) {
    for (let y = cfg.surfaceY; y < height - 1; y += 2) {
      if (blocks[y][x] !== BlockMaterial.Air) continue;
      if (visited.has(key(x, y))) continue;

      // Must have solid ceiling (inverted from water's solid floor check)
      if (y - 1 < 0 || blocks[y - 1][x] === BlockMaterial.Air) continue;

      const pool = scanGasPoolShape(x, y, blocks, width, height);
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
      if (!isGasPoolContained(pool, blocks, width, height)) continue;

      const totalCap = pool.layers.reduce((s, l) => s + l.capacity, 0);
      if (totalCap < 3 * VOLUME_PER_TILE) continue;

      const midLayer = pool.layers[0];
      candidates.push({
        poolLayers: pool.layers,
        totalCap,
        midY: midLayer.y,
        midX: Math.floor((midLayer.left + midLayer.right) / 2),
      });
    }
  }

  // Shuffle candidates
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  // Fill candidates based on depth-weighted probability
  for (const c of candidates) {
    let chance = density.basinFillChance_shallow;
    if (c.midY >= bounds.darkStoneBottom[c.midX]) chance = density.basinFillChance_cavern;
    else if (c.midY >= bounds.darkStoneTop[c.midX]) chance = density.basinFillChance_darkStone;
    else if (c.midY >= bounds.dirtBottom[c.midX]) chance = density.basinFillChance_midStone;

    if (rng.next() >= chance) continue;

    const fillPct = 0.5 + rng.next() * 0.5;
    const quarters = Math.floor(c.totalCap * fillPct);
    fillPoolDirect(c.poolLayers, quarters, layers);
  }
}

/**
 * Fill a ceiling pool top-down by creating GasLayers directly.
 * `quarters` is the total volume to distribute across the pool's layers.
 * Pool layers are in top-first order (lowest y first).
 */
function fillPoolDirect(
  poolLayers: { y: number; left: number; right: number; capacity: number }[],
  quarters: number, layers: GasLayer[],
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
