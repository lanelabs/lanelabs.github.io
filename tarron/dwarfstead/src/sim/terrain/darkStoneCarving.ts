import { BlockMaterial } from '../types';
import { SeededRNG } from '../rng';
import { ValueNoise2D } from './Noise';

type TunnelBias = 'vertical' | 'horizontal' | 'angled';

const TUNNEL_BIASES: TunnelBias[] = ['vertical', 'horizontal', 'angled'];

/**
 * Carve sparse air pockets and rare tunnels through the DarkStone barrier.
 * Called after carveCaves() so the barrier is fully placed first.
 */
export function carveDarkStone(
  blocks: BlockMaterial[][],
  width: number,
  height: number,
  darkStoneTop: number[],
  darkStoneBottom: number[],
  rng: SeededRNG,
): void {
  // Sparse air pockets — high-threshold value noise so only ~12% becomes air
  const pocketNoise = new ValueNoise2D(rng, 12, Math.ceil(12 * height / width));
  const POCKET_THRESHOLD = 0.88;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (blocks[y][x] !== BlockMaterial.DarkStone) continue;
      const nx = x / width;
      const ny = y / width;
      if (pocketNoise.sample(nx * 12, ny * 12) > POCKET_THRESHOLD) {
        blocks[y][x] = BlockMaterial.Air;
      }
    }
  }

  // Rare tunnels — drunkard's walk worms confined to the barrier
  const tunnelCount = 2 + Math.floor(rng.next() * 3); // 2-4 tunnels
  for (let t = 0; t < tunnelCount; t++) {
    const bias = TUNNEL_BIASES[Math.floor(rng.next() * TUNNEL_BIASES.length)];
    const thickness = 1 + Math.floor(rng.next() * 4); // 1-4 blocks
    const steps = 30 + Math.floor(rng.next() * 30);   // 30-59 steps

    // Start at a random column within the barrier
    let wx = Math.floor(rng.next() * width);
    const topY = darkStoneTop[wx];
    const botY = darkStoneBottom[wx];
    if (topY >= botY) continue;
    let wy = topY + Math.floor(rng.next() * (botY - topY));

    for (let s = 0; s < steps; s++) {
      // Carve a cross-section at current position
      const halfT = Math.floor(thickness / 2);
      for (let dy = -halfT; dy <= halfT; dy++) {
        for (let dx = -halfT; dx <= halfT; dx++) {
          const cx = wx + dx;
          const cy = wy + dy;
          if (cx < 0 || cx >= width || cy < 0 || cy >= height) continue;
          if (cy < darkStoneTop[cx] || cy >= darkStoneBottom[cx]) continue;
          if (blocks[cy][cx] === BlockMaterial.DarkStone) {
            blocks[cy][cx] = BlockMaterial.Air;
          }
        }
      }

      // Move based on bias
      const r = rng.next();
      if (bias === 'vertical') {
        // 70% up/down, 30% lateral
        if (r < 0.35) wy -= 1;
        else if (r < 0.7) wy += 1;
        else if (r < 0.85) wx += 1;
        else wx -= 1;
      } else if (bias === 'horizontal') {
        // 70% lateral, 30% up/down
        if (r < 0.35) wx += 1;
        else if (r < 0.7) wx -= 1;
        else if (r < 0.85) wy += 1;
        else wy -= 1;
      } else {
        // angled: 50/50
        if (r < 0.25) wx += 1;
        else if (r < 0.5) wx -= 1;
        else if (r < 0.75) wy += 1;
        else wy -= 1;
      }

      // Clamp to world bounds
      wx = Math.max(0, Math.min(width - 1, wx));
      wy = Math.max(0, Math.min(height - 1, wy));
    }
  }
}
