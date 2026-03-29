import { BlockMaterial } from '../types';
import { SeededRNG } from '../rng';
import { ValueNoise2D, warpedSample } from './Noise';

// Shallow caves: high-freq (small), peppered frequently near surface
const SHALLOW = { freqX: 24, freqY: 28, thrNear: 0.66, thrFar: 0.82 };
// Deep caves: low-freq (large), spread apart near darkstone
const DEEP = { freqX: 8, freqY: 14, thrNear: 0.85, thrFar: 0.76 };

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

/**
 * Carve caves with depth-dependent character:
 * - Near surface (dirt / top stone): small, frequent pockets (high-freq noise, low threshold)
 * - Near DarkStone (deep stone): larger, sparser caverns (low-freq noise, high threshold)
 * Smooth transition via depth ratio from surface to darkstone top.
 */
export function carveCaves(
  blocks: BlockMaterial[][], width: number, height: number,
  surfaceHeights: number[],
  darkStoneTop: number[],
  surfaceBase: number,
  rng: SeededRNG,
): void {
  const shallowNoise = new ValueNoise2D(rng, SHALLOW.freqX, Math.ceil(SHALLOW.freqY * height / width));
  const deepNoise = new ValueNoise2D(rng, DEEP.freqX, Math.ceil(DEEP.freqY * height / width));
  // Warp fields for domain warping — 2 per population
  const swx = new ValueNoise2D(rng, 6, Math.ceil(6 * height / width));
  const swy = new ValueNoise2D(rng, 6, Math.ceil(6 * height / width));
  const dwx = new ValueNoise2D(rng, 4, Math.ceil(4 * height / width));
  const dwy = new ValueNoise2D(rng, 4, Math.ceil(4 * height / width));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const depthBelowSurface = y - surfaceHeights[x];
      if (depthBelowSurface < 2) continue;
      const mat = blocks[y][x];
      if (mat === BlockMaterial.Air || mat === BlockMaterial.Bedrock || mat === BlockMaterial.DarkStone) continue;
      if (y >= height - 2) continue;

      // Depth ratio: 0 at surface, 1 at darkstone top
      const depthRange = darkStoneTop[x] - surfaceHeights[x];
      const t = depthRange > 0 ? smoothstep((y - surfaceHeights[x]) / depthRange) : 0.5;

      const nx = x / width;
      const ny = y / width;

      // Warp strength interpolates by depth: 0.8 near surface, 2.5 near darkstone
      const warpStr = 0.8 + t * 1.7;

      // Shallow noise with domain warping
      const sv = warpedSample(shallowNoise, nx * SHALLOW.freqX, ny * SHALLOW.freqY, swx, swy, warpStr);
      const sThr = SHALLOW.thrNear + t * (SHALLOW.thrFar - SHALLOW.thrNear);

      // Deep noise with domain warping
      const dv = warpedSample(deepNoise, nx * DEEP.freqX, ny * DEEP.freqY, dwx, dwy, warpStr);
      const dThr = DEEP.thrNear + t * (DEEP.thrFar - DEEP.thrNear);

      if (sv > sThr || dv > dThr) {
        blocks[y][x] = BlockMaterial.Air;
      }
    }
  }
}

/**
 * Carve a cavern layer below the DarkStone barrier.
 * Two independent noise patterns unioned (carve if EITHER is high) so
 * their different shapes overlap into a dense network of chambers.
 * A detail noise erodes edges for irregular walls and pillars.
 * Band is capped to 30 blocks thick.
 */
const CAVERN_FADE = 8;
const MAX_BAND = 30;

export function carveCavernLayer(
  blocks: BlockMaterial[][], width: number, height: number,
  darkStoneBottom: number[], stoneBottom: number[],
  rng: SeededRNG,
): void {
  // Three noise fields at different scales — their union gives lots of space
  // with interesting overlapping shapes at multiple sizes
  const bigNoise = new ValueNoise2D(rng, 8, Math.ceil(8 * height / width));
  const midNoise = new ValueNoise2D(rng, 14, Math.ceil(14 * height / width));
  const smallNoise = new ValueNoise2D(rng, 20, Math.ceil(20 * height / width));
  // Detail noise erodes edges for irregular walls
  const detailNoise = new ValueNoise2D(rng, 24, Math.ceil(24 * height / width));
  // Warp fields for organic cavern shapes
  const cwx = new ValueNoise2D(rng, 5, Math.ceil(5 * height / width));
  const cwy = new ValueNoise2D(rng, 5, Math.ceil(5 * height / width));
  const CAVERN_WARP = 3.0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const mat = blocks[y][x];
      if (mat === BlockMaterial.Air || mat === BlockMaterial.Bedrock) continue;
      if (y >= height - 2) continue;

      const top = darkStoneBottom[x];
      const bot = Math.min(stoneBottom[x], top + MAX_BAND);
      if (top >= bot || y < top || y >= bot) continue;

      const distFromTop = y - top;
      const distFromBot = bot - 1 - y;
      const edgeDist = Math.min(distFromTop, distFromBot);
      const fade = edgeDist >= CAVERN_FADE ? 1 : smoothstep(edgeDist / CAVERN_FADE);

      const nx = x / width;
      const ny = y / width;

      // Sample all three noise fields with domain warping
      const big = warpedSample(bigNoise, nx * 8, ny * 8, cwx, cwy, CAVERN_WARP);
      const mid = warpedSample(midNoise, nx * 14, ny * 14, cwx, cwy, CAVERN_WARP);
      const small = warpedSample(smallNoise, nx * 20, ny * 20, cwx, cwy, CAVERN_WARP);
      // Detail subtracts to create pillars and irregular edges
      const d = detailNoise.sample(nx * 24, ny * 24) * 0.12;

      // Fade raises thresholds near edges
      const bigThr = 0.52 + (1 - fade) * 0.35;
      const midThr = 0.55 + (1 - fade) * 0.35;
      const smallThr = 0.58 + (1 - fade) * 0.32;

      // Union: carve if ANY noise exceeds its threshold
      if (big - d > bigThr || mid - d > midThr || small - d > smallThr) {
        blocks[y][x] = BlockMaterial.Air;
      }
    }
  }
}
