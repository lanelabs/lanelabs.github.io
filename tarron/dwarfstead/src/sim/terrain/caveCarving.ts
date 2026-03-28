import { BlockMaterial } from '../types';
import { SeededRNG } from '../rng';
import { ValueNoise2D } from './Noise';

interface CaveLayerConfig {
  freqX: number;
  freqY: number;
  threshold: number;
}

const CAVE_LAYERS: CaveLayerConfig[] = [
  { freqX: 8,  freqY: 20, threshold: 0.72 },  // dirt: wide, flat
  { freqX: 16, freqY: 16, threshold: 0.70 },  // stone: round
  { freqX: 20, freqY: 20, threshold: 0.82 },  // granite: sparse
];

const BLEND_RADIUS = 12;

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function computeLayerWeights(
  y: number, b0: number, b1: number, radius: number,
): [number, number, number] {
  // Raw blend factors: 0 = fully above boundary, 1 = fully below
  const t0 = smoothstep((y - b0) / radius * 0.5 + 0.5);
  const t1 = smoothstep((y - b1) / radius * 0.5 + 0.5);
  // dirt weight fades out at b0, granite fades in at b1, stone is in between
  const wDirt = 1 - t0;
  const wGranite = t1;
  const wStone = t0 - t1;
  // Normalize (handles thin layers where blend zones overlap)
  const sum = wDirt + wStone + wGranite;
  if (sum < 0.001) return [0, 0, 1];
  return [wDirt / sum, wStone / sum, wGranite / sum];
}

/**
 * Carve caves with different character per geological layer,
 * blending noise across layer boundaries for smooth transitions.
 * Worm tunnels added afterward for connectivity.
 */
export function carveCaves(
  blocks: BlockMaterial[][], width: number, height: number,
  surfaceHeights: number[],
  dirtBottom: number[], stoneBottom: number[],
  surfaceBase: number,
  rng: SeededRNG,
): void {
  // Per-layer noise — normalize both axes by width to avoid vertical stretching
  const noises = CAVE_LAYERS.map(
    cfg => new ValueNoise2D(rng, cfg.freqX, Math.ceil(cfg.freqY * height / width)),
  );

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const depthBelowSurface = y - surfaceHeights[x];
      if (depthBelowSurface < 8) continue;
      const mat = blocks[y][x];
      if (mat === BlockMaterial.Air || mat === BlockMaterial.Bedrock || mat === BlockMaterial.DarkStone) continue;
      if (y >= height - 2) continue;

      const nx = x / width;
      const ny = y / width; // normalize y by width too — keeps noise isotropic

      const weights = computeLayerWeights(y, dirtBottom[x], stoneBottom[x], BLEND_RADIUS);
      let blendedVal = 0;
      let blendedThr = 0;
      for (let i = 0; i < 3; i++) {
        if (weights[i] < 0.001) continue;
        const cfg = CAVE_LAYERS[i];
        blendedVal += weights[i] * noises[i].sample(nx * cfg.freqX, ny * cfg.freqY);
        blendedThr += weights[i] * cfg.threshold;
      }

      if (blendedVal > blendedThr) {
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
          if (blocks[cy][wx] !== BlockMaterial.Bedrock && blocks[cy][wx] !== BlockMaterial.DarkStone) {
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
      wy = Math.max(minY, Math.min(maxY, wy));
      wx = Math.max(0, Math.min(width - 1, wx));
    }
  }
}
