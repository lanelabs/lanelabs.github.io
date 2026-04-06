/**
 * Pass 1 — Imposed gas shapes: carve sealed pockets into blocks[][] and
 * fill with gas. Also fills existing cave ceilings with gas.
 *
 * Every fill uses scanGasPoolShape -> isGasPoolContained -> direct GasLayer creation.
 * This guarantees gas only exists in ceiling-contained pools with exact bounds.
 */

import { BlockMaterial } from '../types';
import type { GasLayer } from '../gas/types';
import type { WaterLayer } from '../water/waterLayer';
import { VOLUME_PER_TILE } from '../gas/gasLayer';
import { scanGasPoolShape, isGasPoolContained } from '../gas/gasRecombine';
import { randomYInZone } from './depthZones';
import type { GasGenConfig, GasDensity } from './gasGen';

/** Check if carving air at (x, y) would break a water layer above. */
function supportsWater(x: number, y: number, waterLayers: WaterLayer[]): boolean {
  // A block at (x, y) supports water if there's a water layer at (x, y-1)
  // whose floor is this block.
  for (const l of waterLayers) {
    if (l.y === y - 1 && x >= l.left && x <= l.right && l.volume > 0) return true;
  }
  return false;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/**
 * Scan a region for ceiling-contained gas basins and fill them.
 * Inverted version of water's fillContainedBasins: scans top-down
 * for air tiles with solid ceilings.
 */
function fillContainedGasBasins(
  blocks: BlockMaterial[][], layers: GasLayer[],
  left: number, right: number, topY: number, bottomY: number,
  w: number, h: number, fillPct: number,
): void {
  const visited = new Set<number>();
  const key = (x: number, y: number) => y * w + x;

  // Scan top-down for air tiles with solid ceilings
  for (let y = Math.max(topY, 1); y <= Math.min(bottomY, h - 1); y++) {
    for (let x = Math.max(left, 0); x <= Math.min(right, w - 1); x++) {
      if (blocks[y][x] !== BlockMaterial.Air) continue;
      if (visited.has(key(x, y))) continue;

      const pool = scanGasPoolShape(x, y, blocks, w, h);
      if (!pool) continue;

      // Mark all tiles visited regardless of containment
      for (const pl of pool.layers) {
        for (let px = pl.left; px <= pl.right; px++) visited.add(key(px, pl.y));
      }

      if (!isGasPoolContained(pool, blocks, w, h)) continue;

      // Create layers directly with exact pool boundaries
      for (const pl of pool.layers) {
        const width = pl.right - pl.left + 1;
        const vol = Math.floor(width * VOLUME_PER_TILE * fillPct);
        if (vol > 0) {
          layers.push({ y: pl.y, left: pl.left, right: pl.right, volume: vol });
        }
      }
    }
  }
}

// --- Sealed Gas Pocket -------------------------------------------------------

function carveSealedGasPocket(
  cfg: GasGenConfig, zone: 'shallow' | 'midStone' | 'darkStone' | 'cavern',
  layers: GasLayer[],
): void {
  const { width, height, blocks, bounds, rng, waterLayers } = cfg;
  const cx = rng.nextInt(15, width - 16);
  const cy = randomYInZone(zone, cx, bounds, rng);
  if (cy < 0) return;

  // Size varies by depth — larger pockets deeper
  let halfW: number, halfH: number;
  switch (zone) {
    case 'shallow':   halfW = 2 + Math.floor(rng.next() * 3); halfH = 1 + Math.floor(rng.next() * 2); break;
    case 'midStone':  halfW = 2 + Math.floor(rng.next() * 5); halfH = 1 + Math.floor(rng.next() * 4); break;
    case 'darkStone': halfW = 3 + Math.floor(rng.next() * 6); halfH = 2 + Math.floor(rng.next() * 4); break;
    case 'cavern':    halfW = 4 + Math.floor(rng.next() * 7); halfH = 2 + Math.floor(rng.next() * 5); break;
  }

  const left = clamp(cx - halfW, 2, width - 3);
  const right = clamp(cx + halfW, 2, width - 3);
  const topY = clamp(cy - halfH, 1, height - 3);
  const bottomY = clamp(cy + halfH, topY + 2, height - 3);

  // Carve an elliptical cavity (same pattern as water's carveUndergroundLake)
  // Skip blocks that are floors for existing water layers.
  for (let y = topY; y <= bottomY; y++) {
    for (let x = left + 1; x < right; x++) {
      const nx = (x - cx) / halfW;
      const ny = (y - cy) / halfH;
      if (nx * nx + ny * ny < 0.85 && !supportsWater(x, y, waterLayers)) {
        blocks[y][x] = BlockMaterial.Air;
      }
    }
  }

  fillContainedGasBasins(blocks, layers, left + 1, right - 1, topY, bottomY, width, height, 1.0);
}

// --- Cave Ceiling Gas --------------------------------------------------------

function fillCaveCeilings(
  cfg: GasGenConfig, density: GasDensity, layers: GasLayer[],
): void {
  const { width, height, blocks, bounds, rng } = cfg;
  const visited = new Set<number>();
  const key = (x: number, y: number) => y * width + x;

  for (let x = 2; x < width - 2; x += 3) {
    for (let y = bounds.surfaceHeights[x]; y < height - 1; y += 3) {
      if (blocks[y][x] !== BlockMaterial.Air) continue;
      if (visited.has(key(x, y))) continue;

      // Must have solid ceiling
      if (y - 1 < 0 || blocks[y - 1][x] === BlockMaterial.Air) continue;

      const pool = scanGasPoolShape(x, y, blocks, width, height);
      if (!pool || pool.layers.length < 2) continue;
      if (!isGasPoolContained(pool, blocks, width, height)) continue;

      let tileCount = 0;
      for (const pl of pool.layers) {
        for (let px = pl.left; px <= pl.right; px++) {
          visited.add(key(px, pl.y));
          tileCount++;
        }
        if (tileCount > 2000) break;
      }
      if (tileCount > 2000) continue;

      // Determine zone-based fill probability
      const midX = Math.floor((pool.layers[0].left + pool.layers[0].right) / 2);
      const midY = pool.layers[0].y;
      let chance = density.caveCeilingGas_shallow;
      if (midY >= bounds.darkStoneBottom[midX]) chance = density.caveCeilingGas_cavern;
      else if (midY >= bounds.darkStoneTop[midX]) chance = density.caveCeilingGas_darkStone;
      else if (midY >= bounds.dirtBottom[midX]) chance = density.caveCeilingGas_midStone;

      if (rng.next() >= chance) continue;

      const fillPct = 0.5 + rng.next() * 0.5;
      for (const pl of pool.layers) {
        const w = pl.right - pl.left + 1;
        const vol = Math.floor(w * VOLUME_PER_TILE * fillPct);
        if (vol > 0) layers.push({ y: pl.y, left: pl.left, right: pl.right, volume: vol });
      }
    }
  }
}

// --- Orchestrator ------------------------------------------------------------

export function runImposedGasShapes(
  cfg: GasGenConfig, density: GasDensity, layers: GasLayer[],
): void {
  const { rng } = cfg;

  const zones: Array<'shallow' | 'midStone' | 'darkStone' | 'cavern'> = [
    'shallow', 'midStone', 'darkStone', 'cavern',
  ];
  const countKeys: Array<keyof GasDensity> = [
    'sealedPockets_shallow', 'sealedPockets_midStone',
    'sealedPockets_darkStone', 'sealedPockets_cavern',
  ];

  for (let i = 0; i < zones.length; i++) {
    const range = density[countKeys[i]] as [number, number];
    const count = rng.nextInt(range[0], range[1]);
    for (let j = 0; j < count; j++) {
      carveSealedGasPocket(cfg, zones[i], layers);
    }
  }

  fillCaveCeilings(cfg, density, layers);
}
