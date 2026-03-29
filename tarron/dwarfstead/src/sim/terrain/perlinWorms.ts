import { BlockMaterial } from '../types';
import { SeededRNG } from '../rng';
import { ValueNoise2D } from './Noise';
import { randomYInZone, type DepthZone, type LayerBoundaries } from './depthZones';

interface WormConfig {
  zone: DepthZone;
  count: number;
  lengthRange: [number, number];
  radiusRange: [number, number];
  radiusCycleFreq: number;
  turnRate: number;
}

const WORM_CONFIGS: WormConfig[] = [
  { zone: 'shallow', count: 3, lengthRange: [30, 60], radiusRange: [1, 2], radiusCycleFreq: 0.15, turnRate: 0.08 },
  { zone: 'midStone', count: 5, lengthRange: [50, 120], radiusRange: [1, 3], radiusCycleFreq: 0.08, turnRate: 0.06 },
  { zone: 'cavern', count: 4, lengthRange: [40, 90], radiusRange: [1, 4], radiusCycleFreq: 0.06, turnRate: 0.07 },
  { zone: 'deep', count: 2, lengthRange: [25, 50], radiusRange: [1, 2], radiusCycleFreq: 0.12, turnRate: 0.12 },
];

/**
 * Carve Perlin worm tunnels — variable-radius noise-directed tunnels
 * that create bulge/pinch profiles through the terrain.
 */
export function carvePerlinWorms(
  blocks: BlockMaterial[][], width: number, height: number,
  bounds: LayerBoundaries, rng: SeededRNG,
): void {
  // Direction noise field shared by all worms
  const dirNoise = new ValueNoise2D(rng, 12, Math.ceil(12 * height / width));
  // Radius modulation noise
  const radNoise = new ValueNoise2D(rng, 8, Math.ceil(8 * height / width));

  for (const cfg of WORM_CONFIGS) {
    for (let i = 0; i < cfg.count; i++) {
      // Find start position in target zone
      const sx = Math.floor(rng.next() * width);
      const sy = randomYInZone(cfg.zone, sx, bounds, rng);
      if (sy < 0) continue;

      const length = cfg.lengthRange[0] +
        Math.floor(rng.next() * (cfg.lengthRange[1] - cfg.lengthRange[0] + 1));

      // Initial angle
      let angle = rng.next() * Math.PI * 2;
      const nox = rng.next() * 100;
      const noy = rng.next() * 100;

      let px = sx, py = sy;

      for (let step = 0; step < length; step++) {
        // Direction from noise field — maps sample to angle adjustment
        const dirSample = dirNoise.sample(
          ((px / width) * 12 + nox) % 12,
          ((py / width) * 12 + noy) % (Math.ceil(12 * height / width)),
        );
        angle += (dirSample - 0.5) * 2 * cfg.turnRate;

        // Radius modulation: sin wave + noise for bulge/pinch
        const sinComponent = Math.sin(step * cfg.radiusCycleFreq) * 0.6;
        const noiseSample = radNoise.sample(
          ((px / width) * 8 + nox) % 8,
          ((py / width) * 8 + noy) % (Math.ceil(8 * height / width)),
        );
        const noiseComponent = (noiseSample - 0.5) * 0.4;
        const radiusT = (sinComponent + noiseComponent + 1) / 2; // normalize to 0-1
        const radius = Math.round(
          cfg.radiusRange[0] + radiusT * (cfg.radiusRange[1] - cfg.radiusRange[0]),
        );

        // Advance position
        px += Math.cos(angle);
        py += Math.sin(angle);

        const ix = Math.round(px);
        const iy = Math.round(py);
        if (ix < 0 || ix >= width || iy < 0 || iy >= height) break;

        // Carve circle at current position
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
  }
}
