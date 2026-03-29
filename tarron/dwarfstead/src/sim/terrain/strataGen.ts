import { SeededRNG } from '../rng';
import { ValueNoise2D, fractalNoise1D } from './Noise';
import { getDepthZone, type LayerBoundaries } from './depthZones';

/**
 * Generate per-block brightness tint for geological strata.
 * Returns a 2D grid of integer brightness offsets (e.g. -20 to +20).
 * Bands run horizontally with a 1D wobble per column.
 */
export function generateStrata(
  width: number, height: number, bounds: LayerBoundaries, rng: SeededRNG,
): number[][] {
  // Fractal noise along Y axis for band values
  const bandNoise = fractalNoise1D(rng, height, {
    octaves: 4, baseFreq: 12, amplitude: 1, persistence: 0.6,
  });

  // 1D wobble per column — shifts Y to make bands undulate
  const wobble = fractalNoise1D(rng, width, {
    octaves: 2, baseFreq: 6, amplitude: 4, persistence: 0.5,
  });

  // Fine detail noise for per-block variation
  const detailNoise = new ValueNoise2D(rng, 16, Math.ceil(16 * height / width));

  // Per-zone tint range
  const tintRange: Record<string, number> = {
    surface: 0, shallow: 10, midStone: 15, darkStone: 8, cavern: 18, deep: 20,
  };

  const grid: number[][] = [];
  for (let y = 0; y < height; y++) {
    const row = new Array<number>(width);
    for (let x = 0; x < width; x++) {
      const { zone } = getDepthZone(x, y, bounds);
      const range = tintRange[zone] ?? 0;
      if (range === 0) { row[x] = 0; continue; }

      // Wobbled Y for band lookup
      const wy = Math.max(0, Math.min(height - 1, Math.round(y + wobble[x])));
      const band = bandNoise[wy]; // [-0.5, 0.5) range from fractalNoise1D

      // Add fine detail
      const detail = (detailNoise.sample(x * 16 / width, y * 16 / width) - 0.5) * 0.3;

      row[x] = Math.round((band + detail) * range);
    }
    grid.push(row);
  }
  return grid;
}
