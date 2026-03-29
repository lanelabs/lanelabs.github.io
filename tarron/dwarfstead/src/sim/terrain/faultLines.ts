import { BlockMaterial } from '../types';
import { SeededRNG } from '../rng';
import { ValueNoise2D } from './Noise';
import { randomYInZone, type DepthZone, type LayerBoundaries } from './depthZones';

interface FaultConfig {
  zone: DepthZone;
  count: number;
  widthRange: [number, number];
  angleRange: [number, number]; // radians
  wobbleStrength: number;
  oreChance: number;
  oreMaterial: BlockMaterial;
}

const FAULT_CONFIGS: FaultConfig[] = [
  { zone: 'shallow', count: 1, widthRange: [1, 1], angleRange: [0.5, 1.2], wobbleStrength: 0.3, oreChance: 0.15, oreMaterial: BlockMaterial.Iron },
  { zone: 'midStone', count: 2, widthRange: [1, 2], angleRange: [0.4, 1.4], wobbleStrength: 0.4, oreChance: 0.12, oreMaterial: BlockMaterial.Iron },
  { zone: 'cavern', count: 1, widthRange: [1, 2], angleRange: [0.3, 1.3], wobbleStrength: 0.5, oreChance: 0.1, oreMaterial: BlockMaterial.Gold },
  { zone: 'deep', count: 1, widthRange: [1, 1], angleRange: [0.6, 1.2], wobbleStrength: 0.3, oreChance: 0.08, oreMaterial: BlockMaterial.Crystal },
];

/**
 * Carve diagonal geological fractures through the terrain.
 * Each fault traces a line at an angle with wobble noise,
 * optionally placing ore on adjacent solid blocks.
 */
export function carveFaultLines(
  blocks: BlockMaterial[][], width: number, height: number,
  bounds: LayerBoundaries, rng: SeededRNG,
): void {
  const wobbleNoise = new ValueNoise2D(rng, 10, 10);

  for (const cfg of FAULT_CONFIGS) {
    for (let i = 0; i < cfg.count; i++) {
      // Pick start position in target zone
      const sx = Math.floor(rng.next() * width);
      const sy = randomYInZone(cfg.zone, sx, bounds, rng);
      if (sy < 0) continue;

      const faultWidth = cfg.widthRange[0] + Math.floor(rng.next() * (cfg.widthRange[1] - cfg.widthRange[0] + 1));
      const angle = cfg.angleRange[0] + rng.next() * (cfg.angleRange[1] - cfg.angleRange[0]);
      // Randomize sign so faults go both left-leaning and right-leaning
      const signedAngle = rng.next() > 0.5 ? angle : -angle;
      const faultLength = 30 + Math.floor(rng.next() * 61); // 30-90 blocks

      const nOffset = rng.next() * 100;
      let px = sx, py = sy;

      for (let step = 0; step < faultLength; step++) {
        const t = step / faultLength;
        const wobble = (wobbleNoise.sample(nOffset + t * 4, nOffset) - 0.5) * 2 * cfg.wobbleStrength;

        px += Math.cos(signedAngle) + wobble;
        py += Math.sin(signedAngle);

        const ix = Math.round(px);
        const iy = Math.round(py);
        if (ix < 1 || ix >= width - 1 || iy < 1 || iy >= height - 2) break;

        // Carve the fault line
        for (let w = 0; w < faultWidth; w++) {
          const cx = ix + w;
          if (cx >= width) break;
          if (blocks[iy][cx] === BlockMaterial.Bedrock) continue;
          blocks[iy][cx] = BlockMaterial.Air;
        }

        // Place ore on adjacent solid blocks
        if (cfg.oreChance > 0) {
          for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [faultWidth, 0]]) {
            const ox = ix + dx, oy = iy + dy;
            if (ox < 0 || ox >= width || oy < 0 || oy >= height) continue;
            const mat = blocks[oy][ox];
            if (mat === BlockMaterial.Air || mat === BlockMaterial.Bedrock ||
                mat === BlockMaterial.DarkStone || mat === BlockMaterial.GrassyDirt) continue;
            if (rng.next() < cfg.oreChance) {
              blocks[oy][ox] = cfg.oreMaterial;
            }
          }
        }
      }
    }
  }
}
