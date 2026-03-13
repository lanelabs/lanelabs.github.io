import { BlockMaterial, type HiddenRoom } from '../types';
import { SeededRNG } from '../rng';
import { ValueNoise2D } from './Noise';

export interface TerrainGrid {
  width: number;
  height: number;
  blocks: BlockMaterial[][];
  surfaceY: number;
  surfaceHeights: number[];
  rooms: HiddenRoom[];
}

const SKY_HEIGHT = 20;

/**
 * Generates a 2D terrain grid from a seed.
 *
 * Layout (top to bottom):
 *   - Sky (air) — fixed 20 blocks
 *   - Surface line (varies with noise, hills/valleys)
 *   - Dirt layer (with grass on top)
 *   - Stone layer (with ore veins, caves, and tunnels)
 *   - Granite / deep stone
 *   - Bedrock at the very bottom
 *
 * Hidden rooms are carved into the terrain:
 *   - Resource caches (extra ore)
 *   - Creature lairs
 *   - Ruins
 */
export class TerrainGenerator {
  static generate(seed: number, width: number, height: number): TerrainGrid {
    const rng = new SeededRNG(seed);
    const surfaceNoise = new ValueNoise2D(rng, 12, 1);
    const oreNoise = new ValueNoise2D(rng, 10, 10);
    const caveNoise = new ValueNoise2D(rng, 16, 16);
    const tunnelNoise = new ValueNoise2D(rng, 24, 24);

    // Pre-compute per-column surface heights
    // Noise coordinates must span [0, gridSize) to use the full grid
    const surfaceBase = SKY_HEIGHT;
    const surfaceHeights: number[] = [];
    for (let x = 0; x < width; x++) {
      const offset = Math.floor(
        (surfaceNoise.sample(x * 12 / width, 0) - 0.5) * 10,
      );
      surfaceHeights.push(surfaceBase + offset);
    }

    // Base terrain pass
    const blocks: BlockMaterial[][] = [];
    for (let y = 0; y < height; y++) {
      const row: BlockMaterial[] = [];
      for (let x = 0; x < width; x++) {
        const surfaceY = surfaceHeights[x];

        if (y < surfaceY) {
          row.push(BlockMaterial.Air);
        } else if (y >= height - 1) {
          row.push(BlockMaterial.Bedrock);
        } else {
          const depth = y - surfaceY;
          const depthRatio = depth / (height - surfaceY);

          if (depthRatio < 0.2) {
            row.push(BlockMaterial.Dirt);
          } else if (depthRatio < 0.7) {
            const oreVal = oreNoise.sample(x * 10 / width, y * 10 / height);
            if (oreVal > 0.85) {
              row.push(BlockMaterial.Iron);
            } else if (oreVal > 0.92) {
              row.push(BlockMaterial.Gold);
            } else {
              row.push(BlockMaterial.Stone);
            }
          } else if (depthRatio < 0.95) {
            const oreVal = oreNoise.sample(x * 10 / width, y * 10 / height);
            if (oreVal > 0.9) {
              row.push(BlockMaterial.Crystal);
            } else {
              row.push(BlockMaterial.Granite);
            }
          } else {
            row.push(BlockMaterial.Bedrock);
          }
        }
      }
      blocks.push(row);
    }

    // Cave carving pass — only 8+ blocks below surface
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const depthBelowSurface = y - surfaceHeights[x];
        if (depthBelowSurface < 8) continue;
        const mat = blocks[y][x];
        if (mat === BlockMaterial.Air || mat === BlockMaterial.Bedrock) continue;
        const val = caveNoise.sample(x * 16 / width, y * 16 / height);
        if (val > 0.72) {
          blocks[y][x] = BlockMaterial.Air;
        }
      }
    }

    // Tunnel carving pass — only 4+ blocks below surface
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const depthBelowSurface = y - surfaceHeights[x];
        if (depthBelowSurface < 4) continue;
        const mat = blocks[y][x];
        if (mat === BlockMaterial.Air || mat === BlockMaterial.Bedrock) continue;
        const val = tunnelNoise.sample(x * 24 / width, y * 24 / height);
        if (val > 0.78) {
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
        // Clamp to underground region
        wy = Math.max(minY, Math.min(maxY, wy));
        wx = Math.max(0, Math.min(width - 1, wx));
      }
    }

    // Grass painting pass — topmost Dirt at each surface column becomes GrassyDirt
    for (let x = 0; x < width; x++) {
      const sy = surfaceHeights[x];
      if (sy >= 0 && sy < height && blocks[sy][x] === BlockMaterial.Dirt) {
        blocks[sy][x] = BlockMaterial.GrassyDirt;
      }
    }

    // Hidden rooms pass
    const rooms: HiddenRoom[] = [];
    const roomCount = 3 + Math.floor(rng.next() * 3);
    const roomTypes: Array<'cache' | 'lair' | 'ruin'> = [
      'cache', 'cache', 'lair', 'lair', 'ruin',
    ];

    for (let i = 0; i < roomCount; i++) {
      const rw = 3 + Math.floor(rng.next() * 3);
      const rh = 3 + Math.floor(rng.next() * 2);
      const rx = 3 + Math.floor(rng.next() * (width - rw - 6));
      const minRoomY = surfaceBase + Math.floor((height - surfaceBase) * 0.25);
      const maxRoomY = height - rh - 3;
      if (minRoomY >= maxRoomY) continue;
      const ry = minRoomY + Math.floor(rng.next() * (maxRoomY - minRoomY));

      const type = roomTypes[i % roomTypes.length];
      rooms.push({ x: rx, y: ry, width: rw, height: rh, type });

      for (let dy = 0; dy < rh; dy++) {
        for (let dx = 0; dx < rw; dx++) {
          const bx = rx + dx;
          const by = ry + dy;
          if (bx >= 0 && bx < width && by >= 0 && by < height - 1) {
            blocks[by][bx] = BlockMaterial.Air;
          }
        }
      }

      if (type === 'cache') {
        const oreMat = rng.next() > 0.5 ? BlockMaterial.Iron : BlockMaterial.Gold;
        for (let dx = -1; dx <= rw; dx++) {
          for (let dy = -1; dy <= rh; dy++) {
            if (dx >= 0 && dx < rw && dy >= 0 && dy < rh) continue;
            const bx = rx + dx;
            const by = ry + dy;
            if (bx >= 0 && bx < width && by >= 0 && by < height - 1) {
              if (blocks[by][bx] !== BlockMaterial.Air
                && blocks[by][bx] !== BlockMaterial.Bedrock) {
                if (rng.next() > 0.5) {
                  blocks[by][bx] = oreMat;
                }
              }
            }
          }
        }
      }
    }

    return { width, height, blocks, surfaceY: surfaceBase, surfaceHeights, rooms };
  }

  static fallbackSurfaceHeights(width: number, surfaceY: number): number[] {
    return new Array(width).fill(surfaceY);
  }
}
