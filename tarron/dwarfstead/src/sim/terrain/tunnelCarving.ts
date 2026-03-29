import { BlockMaterial } from '../types';
import { SeededRNG } from '../rng';
import { ValueNoise2D } from './Noise';

/** Tunnel shape determines curvature behavior */
type TunnelShape = 'straight' | 'gentle' | 'winding' | 'jagged';

const SHAPES: TunnelShape[] = ['straight', 'straight', 'gentle', 'gentle', 'gentle', 'winding', 'jagged'];

/** Curvature multiplier per shape — how aggressively the angle drifts */
const DRIFT: Record<TunnelShape, number> = {
  straight: 0.03,
  gentle: 0.12,
  winding: 0.35,
  jagged: 0.6,
};

/**
 * Carve tunnels with varied shapes across the underground.
 *
 * Mix of tunnel types:
 * - straight: long runs with barely any curvature
 * - gentle: slow bends, most natural-looking
 * - winding: pronounced curves, classic spaghetti
 * - jagged: sharp turns, short chaotic passages
 *
 * Two populations: longer "backbone" tunnels + many short scattered segments
 * to fill gaps and ensure no large area is tunnel-free.
 */
export function carveSpaghettiTunnels(
  blocks: BlockMaterial[][],
  width: number,
  height: number,
  surfaceHeights: number[],
  rng: SeededRNG,
): void {
  const curvatureNoise = new ValueNoise2D(rng, 16, 16);
  const widthNoise = new ValueNoise2D(rng, 8, 8);

  // Backbone tunnels: 15-25 longer strands
  const backboneCount = 15 + Math.floor(rng.next() * 11);
  for (let i = 0; i < backboneCount; i++) {
    const length = 60 + Math.floor(rng.next() * 141); // 60-200
    const shape = SHAPES[Math.floor(rng.next() * SHAPES.length)];
    carveStrand(blocks, width, height, surfaceHeights, rng, curvatureNoise, widthNoise, length, shape);
  }

  // Scatter tunnels: 30-50 short segments to fill gaps
  const scatterCount = 30 + Math.floor(rng.next() * 21);
  for (let i = 0; i < scatterCount; i++) {
    const length = 10 + Math.floor(rng.next() * 31); // 10-40
    const shape = SHAPES[Math.floor(rng.next() * SHAPES.length)];
    carveStrand(blocks, width, height, surfaceHeights, rng, curvatureNoise, widthNoise, length, shape);
  }
}

function carveStrand(
  blocks: BlockMaterial[][],
  width: number,
  height: number,
  surfaceHeights: number[],
  rng: SeededRNG,
  curvatureNoise: ValueNoise2D,
  widthNoise: ValueNoise2D,
  length: number,
  shape: TunnelShape,
): void {
  const startX = Math.floor(rng.next() * width);
  // Start anywhere from just below the surface down — strands that curve
  // upward will naturally intersect the surface, creating open entrances
  const minY = surfaceHeights[startX] + 2;
  const maxY = height - 3;
  if (minY >= maxY) return;
  const startY = minY + Math.floor(rng.next() * (maxY - minY));

  let angle = rng.next() * Math.PI * 2;
  const drift = DRIFT[shape];

  // Unique noise offset per strand
  const nox = rng.next() * 100;
  const noy = rng.next() * 100;

  let px = startX;
  let py = startY;

  for (let step = 0; step < length; step++) {
    const t = step / length;

    // Angle drift — shape controls intensity
    if (shape === 'jagged') {
      // Jagged: occasional sharp turns instead of smooth drift
      if (rng.next() < 0.15) angle += (rng.next() - 0.5) * Math.PI * 0.8;
      else angle += (rng.next() - 0.5) * drift;
    } else {
      const curveSample = curvatureNoise.sample(nox + t * 4, noy);
      angle += (curveSample - 0.5) * drift;
    }

    px += Math.cos(angle);
    py += Math.sin(angle);

    const ix = Math.round(px);
    const iy = Math.round(py);

    if (ix < 0 || ix >= width || iy < 0 || iy >= height) break;

    // Width: mostly 1, sometimes 2, rarely 0 (gap)
    const ws = widthNoise.sample(nox + t * 3, noy + 50);
    const radius = ws < 0.15 ? 0 : ws < 0.75 ? 1 : 2;
    if (radius === 0) continue;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > radius * radius) continue;
        const cx = ix + dx;
        const cy = iy + dy;
        if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
        if (blocks[cy][cx] === BlockMaterial.Bedrock) continue;
        blocks[cy][cx] = BlockMaterial.Air;
      }
    }
  }
}
