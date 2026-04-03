/**
 * Pass 1 — Imposed water shapes: carve custom geometry into blocks[][] and
 * fill with WaterLayers. Handles oceans, lakes, ponds, underground lakes,
 * aquifer bands, cavern lakes, submerged passages, flooded caves/tunnels,
 * and darkstone pockets.
 *
 * Every fill uses scanPoolShape → isPoolContained → direct WaterLayer creation.
 * This guarantees water only exists in fully-enclosed basins with exact bounds.
 */

import { BlockMaterial } from '../types';
import type { WaterLayer } from '../water/waterLayer';
import { VOLUME_PER_TILE } from '../water/waterLayer';
import { scanPoolShape, isPoolContained } from '../water/recombine';
import { ValueNoise2D } from './Noise';
import { randomYInZone } from './depthZones';
import type { WaterGenConfig, ArchetypeDensity } from './waterGen';

/** Clamp value to [min, max]. */
function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/**
 * Scan a carved region for contained basins and fill them.
 * Finds air tiles on solid floors, flood-fills each basin, checks containment,
 * then creates WaterLayers with exact pool boundaries.
 */
function fillContainedBasins(
  blocks: BlockMaterial[][], layers: WaterLayer[],
  left: number, right: number, topY: number, bottomY: number,
  w: number, h: number, fillPct: number,
): void {
  const visited = new Set<number>();
  const key = (x: number, y: number) => y * w + x;

  // Scan bottom-up for air tiles on solid floors — good starting points
  for (let y = Math.min(bottomY, h - 2); y >= Math.max(topY, 0); y--) {
    for (let x = Math.max(left, 0); x <= Math.min(right, w - 1); x++) {
      if (blocks[y][x] !== BlockMaterial.Air) continue;
      if (visited.has(key(x, y))) continue;

      const pool = scanPoolShape(x, y, blocks, w, h);
      if (!pool) continue;

      // Mark all tiles visited regardless of containment
      for (const pl of pool.layers) {
        for (let px = pl.left; px <= pl.right; px++) visited.add(key(px, pl.y));
      }

      if (!isPoolContained(pool, blocks, w, h)) continue;

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

// ─── Ocean ──────────────────────────────────────────────────────────────

function carveOcean(cfg: WaterGenConfig, layers: WaterLayer[]): void {
  const { width, height, blocks, surfaceHeights, rng } = cfg;
  const fromLeft = rng.next() > 0.5;
  const oceanWidth = Math.floor(width * (0.3 + rng.next() * 0.5));
  const startX = fromLeft ? 0 : width - oceanWidth;
  const endX = fromLeft ? oceanWidth - 1 : width - 1;
  const baseDepth = 8 + Math.floor(rng.next() * 13); // 8-20
  const floorNoise = new ValueNoise2D(rng, 12, 1);

  let minSurf = height;
  for (let x = startX; x <= endX; x++) {
    const surfY = surfaceHeights[x];
    if (surfY < minSurf) minSurf = surfY;
    const noiseVal = (floorNoise.sample((x - startX) / oceanWidth * 12, 0) - 0.5) * 4;
    const floorY = clamp(surfY + baseDepth + Math.floor(noiseVal), surfY + 4, height - 3);

    // Don't carve the very edge columns (shore walls)
    if (x === startX || x === endX) continue;

    for (let y = surfY; y < floorY; y++) {
      if (y >= 0 && y < height) blocks[y][x] = BlockMaterial.Air;
    }
  }

  fillContainedBasins(blocks, layers, startX, endX, minSurf, height - 2, width, height, 1.0);
}

// ─── Lake ───────────────────────────────────────────────────────────────

function carveLake(cfg: WaterGenConfig, layers: WaterLayer[]): void {
  const { width, height, blocks, surfaceHeights, rng } = cfg;

  const candidates: number[] = [];
  for (let x = 5; x < width - 5; x++) {
    const h0 = surfaceHeights[x];
    const hL = surfaceHeights[x - 3];
    const hR = surfaceHeights[x + 3];
    if (hL >= h0 + 3 && hR >= h0 + 3) candidates.push(x);
  }
  if (candidates.length === 0) return;

  const cx = rng.pick(candidates);
  const halfW = 7 + Math.floor(rng.next() * 13);
  const depth = 3 + Math.floor(rng.next() * 8);
  const left = clamp(cx - halfW, 1, width - 2);
  const right = clamp(cx + halfW, 1, width - 2);
  const surfY = surfaceHeights[cx];
  const bottomY = clamp(surfY + depth, surfY + 2, height - 3);
  const edgeNoise = new ValueNoise2D(rng, 8, 4);

  for (let x = left; x <= right; x++) {
    const t = (x - left) / (right - left);
    const edgeFade = Math.min(t, 1 - t) * 4;
    const noiseOff = (edgeNoise.sample(t * 8, 0.5) - 0.5) * 3;
    const localDepth = Math.max(1, Math.floor(depth * Math.min(1, edgeFade) + noiseOff));
    const localBottom = clamp(surfY + localDepth, surfY + 1, bottomY);

    for (let y = surfY; y < localBottom; y++) {
      if (y >= 0 && y < height) blocks[y][x] = BlockMaterial.Air;
    }
  }

  // 20% chance: thin floor at center → breach risk
  if (rng.next() < 0.2) {
    const by = bottomY;
    if (by + 1 < height && blocks[by][cx] !== BlockMaterial.Air) {
      blocks[by][cx] = BlockMaterial.Air;
    }
  }

  fillContainedBasins(blocks, layers, left, right, surfY, bottomY, width, height, 1.0);
}

// ─── Pond ───────────────────────────────────────────────────────────────

function carvePond(cfg: WaterGenConfig, layers: WaterLayer[]): void {
  const { width, height, blocks, surfaceHeights, rng } = cfg;

  const candidates: number[] = [];
  for (let x = 3; x < width - 3; x++) {
    if (surfaceHeights[x] > surfaceHeights[x - 1] && surfaceHeights[x] > surfaceHeights[x + 1]) continue;
    const avg = (surfaceHeights[x - 2] + surfaceHeights[x + 2]) / 2;
    if (surfaceHeights[x] >= avg - 1) continue;
    candidates.push(x);
  }
  if (candidates.length === 0) {
    candidates.push(rng.nextInt(5, width - 6));
  }

  const cx = rng.pick(candidates);
  const halfW = 2 + Math.floor(rng.next() * 4);
  const depth = 1 + Math.floor(rng.next() * 2);
  const left = clamp(cx - halfW, 1, width - 2);
  const right = clamp(cx + halfW, 1, width - 2);
  const surfY = surfaceHeights[cx];

  for (let x = left; x <= right; x++) {
    for (let dy = 0; dy < depth; dy++) {
      const y = surfY + dy;
      if (y >= 0 && y < height) blocks[y][x] = BlockMaterial.Air;
    }
  }

  fillContainedBasins(blocks, layers, left, right, surfY, surfY + depth - 1, width, height, 1.0);
}

// ─── Underground Lake ───────────────────────────────────────────────────

function carveUndergroundLake(cfg: WaterGenConfig, layers: WaterLayer[]): void {
  const { width, height, blocks, bounds, rng } = cfg;
  const cx = rng.nextInt(15, width - 16);
  const cy = randomYInZone('midStone', cx, bounds, rng);
  if (cy < 0) return;

  const halfW = 5 + Math.floor(rng.next() * 8);
  const halfH = 2 + Math.floor(rng.next() * 5);
  const left = clamp(cx - halfW, 2, width - 3);
  const right = clamp(cx + halfW, 2, width - 3);
  const topY = clamp(cy - halfH, 1, height - 3);
  const bottomY = clamp(cy + halfH, topY + 2, height - 3);

  for (let y = topY; y <= bottomY; y++) {
    for (let x = left + 1; x < right; x++) {
      const nx = (x - cx) / halfW;
      const ny = (y - cy) / halfH;
      if (nx * nx + ny * ny < 0.85) {
        blocks[y][x] = BlockMaterial.Air;
      }
    }
  }

  fillContainedBasins(blocks, layers, left + 1, right - 1, topY, bottomY, width, height, 1.0);
}

// ─── Aquifer Band ───────────────────────────────────────────────────────

function carveAquiferBand(cfg: WaterGenConfig, layers: WaterLayer[]): void {
  const { width, height, blocks, bounds, rng } = cfg;
  const midX = Math.floor(width / 2);
  const baseY = randomYInZone('shallow', midX, bounds, rng);
  if (baseY < 0) return;

  const thickness = 4 + Math.floor(rng.next() * 3);
  const noise = new ValueNoise2D(rng, 24, 8);

  for (let x = 1; x < width - 1; x++) {
    for (let dy = 0; dy < thickness; dy++) {
      const y = baseY + dy;
      if (y < 0 || y >= height - 1) continue;
      const nv = noise.sample(x * 24 / width, dy * 8 / thickness);
      if (nv > 0.4) {
        blocks[y][x] = BlockMaterial.Air;
      }
    }
  }

  fillContainedBasins(blocks, layers, 1, width - 2, baseY, baseY + thickness - 1, width, height, 1.0);
}

// ─── Cavern Lake ────────────────────────────────────────────────────────

function carveCavernLake(cfg: WaterGenConfig, layers: WaterLayer[]): void {
  const { width, height, blocks, bounds, rng } = cfg;

  const candidates: { x: number; y: number; w: number }[] = [];
  for (let x = 2; x < width - 10; x++) {
    const y = randomYInZone('cavern', x, bounds, rng);
    if (y < 0) continue;

    let floorY = -1;
    for (let sy = y; sy < height - 2; sy++) {
      if (blocks[sy][x] !== BlockMaterial.Air && sy > 0 && blocks[sy - 1][x] === BlockMaterial.Air) {
        floorY = sy; break;
      }
    }
    if (floorY < 0) continue;

    let fw = 1;
    while (x + fw < width && blocks[floorY][x + fw] !== BlockMaterial.Air
           && blocks[floorY - 1][x + fw] === BlockMaterial.Air) {
      fw++;
    }
    if (fw >= 8) candidates.push({ x, y: floorY, w: fw });
  }

  if (candidates.length === 0) return;
  const pick = rng.pick(candidates);

  // Don't carve — just fill existing air basin above the floor
  fillContainedBasins(blocks, layers, pick.x, pick.x + pick.w - 1,
    pick.y - 15, pick.y - 1, width, height, 1.0);
}

// ─── Submerged Passage ──────────────────────────────────────────────────

function carveSubmergedPassage(cfg: WaterGenConfig, layers: WaterLayer[]): void {
  const { width, height, blocks, bounds, rng } = cfg;
  const startX = rng.nextInt(10, width - 30);
  const startY = randomYInZone('cavern', startX, bounds, rng);
  if (startY < 0) return;

  const tunnelH = 2 + Math.floor(rng.next() * 2);
  const length = 15 + Math.floor(rng.next() * 16);

  let cx = startX, cy = startY;
  let minX = startX, maxX = startX, minY = startY, maxY = startY;
  for (let step = 0; step < length; step++) {
    for (let dy = 0; dy < tunnelH; dy++) {
      const y = cy + dy;
      if (y >= 0 && y < height - 1 && cx >= 1 && cx < width - 1) {
        blocks[y][cx] = BlockMaterial.Air;
      }
    }
    const r = rng.next();
    if (r < 0.7) cx += rng.next() > 0.5 ? 1 : -1;
    else if (r < 0.85) cy++;
    else cy--;
    cx = clamp(cx, 1, width - 2);
    cy = clamp(cy, 1, height - 3);
    if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
    if (cy < minY) minY = cy; if (cy + tunnelH - 1 > maxY) maxY = cy + tunnelH - 1;
  }

  fillContainedBasins(blocks, layers, minX, maxX, minY, maxY, width, height, 1.0);
}

// ─── Flooded Caves ──────────────────────────────────────────────────────

function floodShallowCaves(
  cfg: WaterGenConfig, density: ArchetypeDensity, layers: WaterLayer[],
): void {
  const { width, height, blocks, bounds, rng } = cfg;
  const visited = new Set<number>();
  const key = (x: number, y: number) => y * width + x;

  for (let x = 2; x < width - 2; x += 3) {
    const y = randomYInZone('shallow', x, bounds, rng);
    if (y < 0) continue;
    if (blocks[y][x] !== BlockMaterial.Air) continue;
    if (y + 1 >= height || blocks[y + 1][x] === BlockMaterial.Air) continue;
    if (visited.has(key(x, y))) continue;

    const pool = scanPoolShape(x, y, blocks, width, height);
    if (!pool || pool.layers.length < 3) continue;
    if (!isPoolContained(pool, blocks, width, height)) continue;

    for (const pl of pool.layers) {
      for (let px = pl.left; px <= pl.right; px++) visited.add(key(px, pl.y));
    }

    if (rng.next() >= density.shallowCaveFloodPct) continue;

    const fillPct = 0.5 + rng.next() * 0.5;
    for (const pl of pool.layers) {
      const w = pl.right - pl.left + 1;
      const vol = Math.floor(w * VOLUME_PER_TILE * fillPct);
      if (vol > 0) layers.push({ y: pl.y, left: pl.left, right: pl.right, volume: vol });
    }
  }
}

// ─── Flooded Tunnels ────────────────────────────────────────────────────

function floodTunnelSegments(
  cfg: WaterGenConfig, density: ArchetypeDensity, layers: WaterLayer[],
): void {
  if (density.tunnelFloodPct <= 0) return;
  const { width, height, blocks, bounds, rng } = cfg;
  const visited = new Set<number>();
  const key = (x: number, y: number) => y * width + x;

  for (let y = bounds.dirtBottom[Math.floor(width / 2)]; y < height - 2; y += 2) {
    for (let x = 1; x < width - 1; x++) {
      if (blocks[y][x] !== BlockMaterial.Air) continue;
      if (visited.has(key(x, y))) continue;

      // Check for a solid floor
      if (y + 1 >= height || blocks[y + 1][x] === BlockMaterial.Air) continue;

      const pool = scanPoolShape(x, y, blocks, width, height);
      if (!pool) continue;

      for (const pl of pool.layers) {
        for (let px = pl.left; px <= pl.right; px++) visited.add(key(px, pl.y));
      }

      // Only narrow tunnels (capacity ≤ 18 tiles)
      const totalTiles = pool.layers.reduce((s, l) => s + (l.right - l.left + 1), 0);
      if (totalTiles > 18 || totalTiles < 2) continue;
      if (!isPoolContained(pool, blocks, width, height)) continue;
      if (rng.next() >= density.tunnelFloodPct) continue;

      for (const pl of pool.layers) {
        const w = pl.right - pl.left + 1;
        layers.push({ y: pl.y, left: pl.left, right: pl.right, volume: w * VOLUME_PER_TILE });
      }
    }
  }
}

// ─── DarkStone Pockets ──────────────────────────────────────────────────

function fillDarkStonePockets(
  cfg: WaterGenConfig, density: ArchetypeDensity, layers: WaterLayer[],
): void {
  if (density.darkStoneAquiferPct <= 0) return;
  const { width, height, blocks, bounds, rng } = cfg;
  const visited = new Set<number>();
  const key = (x: number, y: number) => y * width + x;

  for (let x = 2; x < width - 2; x += 4) {
    for (let y = bounds.darkStoneTop[x]; y < bounds.darkStoneBottom[x]; y++) {
      if (blocks[y][x] !== BlockMaterial.Air) continue;
      if (visited.has(key(x, y))) continue;

      const pool = scanPoolShape(x, y, blocks, width, height);
      if (!pool) continue;
      if (!isPoolContained(pool, blocks, width, height)) continue;

      for (const pl of pool.layers) {
        for (let px = pl.left; px <= pl.right; px++) visited.add(key(px, pl.y));
      }

      if (rng.next() >= density.darkStoneAquiferPct) continue;

      for (const pl of pool.layers) {
        const w = pl.right - pl.left + 1;
        layers.push({ y: pl.y, left: pl.left, right: pl.right, volume: w * VOLUME_PER_TILE });
      }
    }
  }
}

// ─── Orchestrator ───────────────────────────────────────────────────────

export function runImposedShapes(
  cfg: WaterGenConfig, density: ArchetypeDensity, layers: WaterLayer[],
): void {
  const { rng } = cfg;

  if (rng.next() < density.oceanChance) carveOcean(cfg, layers);

  const lakeCount = rng.nextInt(density.lakeCount[0], density.lakeCount[1]);
  for (let i = 0; i < lakeCount; i++) carveLake(cfg, layers);

  const pondCount = rng.nextInt(density.pondCount[0], density.pondCount[1]);
  for (let i = 0; i < pondCount; i++) carvePond(cfg, layers);

  const ugCount = rng.nextInt(density.undergroundLakes[0], density.undergroundLakes[1]);
  for (let i = 0; i < ugCount; i++) carveUndergroundLake(cfg, layers);

  const aqCount = rng.nextInt(density.aquiferBands[0], density.aquiferBands[1]);
  for (let i = 0; i < aqCount; i++) carveAquiferBand(cfg, layers);

  const clCount = rng.nextInt(density.cavernLakes[0], density.cavernLakes[1]);
  for (let i = 0; i < clCount; i++) carveCavernLake(cfg, layers);

  const spCount = rng.nextInt(density.submergedPassages[0], density.submergedPassages[1]);
  for (let i = 0; i < spCount; i++) carveSubmergedPassage(cfg, layers);

  floodShallowCaves(cfg, density, layers);
  floodTunnelSegments(cfg, density, layers);
  fillDarkStonePockets(cfg, density, layers);
}
