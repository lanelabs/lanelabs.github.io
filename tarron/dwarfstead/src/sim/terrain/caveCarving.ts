import { BlockMaterial } from '../types';
import { SeededRNG } from '../rng';
import { ValueNoise2D } from './Noise';

/**
 * Carve caves with different character per geological layer,
 * then add worm tunnels for connectivity.
 */
export function carveCaves(
  blocks: BlockMaterial[][], width: number, height: number,
  surfaceHeights: number[],
  dirtBottom: number[], stoneBottom: number[],
  surfaceBase: number,
  rng: SeededRNG,
): void {
  // Per-layer noise — normalize both axes by width to avoid vertical stretching
  const dirtCaveNoise = new ValueNoise2D(rng, 8, Math.ceil(20 * height / width));
  const stoneCaveNoise = new ValueNoise2D(rng, 16, Math.ceil(16 * height / width));
  const graniteCaveNoise = new ValueNoise2D(rng, 20, Math.ceil(20 * height / width));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const depthBelowSurface = y - surfaceHeights[x];
      if (depthBelowSurface < 8) continue;
      const mat = blocks[y][x];
      if (mat === BlockMaterial.Air || mat === BlockMaterial.Bedrock) continue;

      const nx = x / width;
      const ny = y / width; // normalize y by width too — keeps noise isotropic

      let carved = false;
      if (y < dirtBottom[x]) {
        // Dirt layer: wide, flat horizontal caverns
        carved = dirtCaveNoise.sample(nx * 8, ny * 20) > 0.72;
      } else if (y < stoneBottom[x]) {
        // Stone layer: isotropic, rounder caves
        carved = stoneCaveNoise.sample(nx * 16, ny * 16) > 0.70;
      } else if (y < height - 2) {
        // Granite layer: sparse, small caves
        carved = graniteCaveNoise.sample(nx * 20, ny * 20) > 0.82;
      }

      if (carved) {
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
      wy = Math.max(minY, Math.min(maxY, wy));
      wx = Math.max(0, Math.min(width - 1, wx));
    }
  }
}
