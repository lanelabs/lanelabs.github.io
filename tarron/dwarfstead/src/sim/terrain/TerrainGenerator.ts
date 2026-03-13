import { BlockMaterial, type HiddenRoom } from '../types';
import { SeededRNG } from '../rng';
import { ValueNoise2D } from './Noise';

export interface TerrainGrid {
  width: number;
  height: number;
  blocks: BlockMaterial[][];
  surfaceY: number;
  rooms: HiddenRoom[];
}

/**
 * Generates a 2D terrain grid from a seed.
 *
 * Layout (top to bottom):
 *   - Sky (air) above the surface
 *   - Surface line (varies with noise)
 *   - Dirt layer
 *   - Stone layer (with ore veins)
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
    const surfaceNoise = new ValueNoise2D(rng, 8, 1);
    const oreNoise = new ValueNoise2D(rng, 10, 10);

    const blocks: BlockMaterial[][] = [];

    // Surface sits roughly at 30% from top
    const surfaceBase = Math.floor(height * 0.3);

    // First pass: base terrain
    for (let y = 0; y < height; y++) {
      const row: BlockMaterial[] = [];
      for (let x = 0; x < width; x++) {
        const surfaceOffset = Math.floor(
          (surfaceNoise.sample(x / width, 0) - 0.5) * 6
        );
        const surfaceY = surfaceBase + surfaceOffset;

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
            const oreVal = oreNoise.sample(x / width, y / height);
            if (oreVal > 0.85) {
              row.push(BlockMaterial.Iron);
            } else if (oreVal > 0.92) {
              row.push(BlockMaterial.Gold);
            } else {
              row.push(BlockMaterial.Stone);
            }
          } else if (depthRatio < 0.95) {
            const oreVal = oreNoise.sample(x / width, y / height);
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

    // Second pass: carve hidden rooms
    const rooms: HiddenRoom[] = [];
    const roomCount = 3 + Math.floor(rng.next() * 3); // 3-5 rooms
    const roomTypes: Array<'cache' | 'lair' | 'ruin'> = ['cache', 'cache', 'lair', 'lair', 'ruin'];

    for (let i = 0; i < roomCount; i++) {
      const rw = 3 + Math.floor(rng.next() * 3); // 3-5 wide
      const rh = 3 + Math.floor(rng.next() * 2); // 3-4 tall
      const rx = 3 + Math.floor(rng.next() * (width - rw - 6));
      // Rooms should be below the dirt layer
      const minRoomY = surfaceBase + Math.floor((height - surfaceBase) * 0.25);
      const maxRoomY = height - rh - 3;
      if (minRoomY >= maxRoomY) continue;
      const ry = minRoomY + Math.floor(rng.next() * (maxRoomY - minRoomY));

      const type = roomTypes[i % roomTypes.length];
      rooms.push({ x: rx, y: ry, width: rw, height: rh, type });

      // Carve the room (air inside, keep walls)
      for (let dy = 0; dy < rh; dy++) {
        for (let dx = 0; dx < rw; dx++) {
          const bx = rx + dx;
          const by = ry + dy;
          if (bx >= 0 && bx < width && by >= 0 && by < height - 1) {
            blocks[by][bx] = BlockMaterial.Air;
          }
        }
      }

      // Resource caches: ring the room with ore
      if (type === 'cache') {
        const oreMat = rng.next() > 0.5 ? BlockMaterial.Iron : BlockMaterial.Gold;
        for (let dx = -1; dx <= rw; dx++) {
          for (let dy = -1; dy <= rh; dy++) {
            if (dx >= 0 && dx < rw && dy >= 0 && dy < rh) continue; // skip interior
            const bx = rx + dx;
            const by = ry + dy;
            if (bx >= 0 && bx < width && by >= 0 && by < height - 1) {
              if (blocks[by][bx] !== BlockMaterial.Air && blocks[by][bx] !== BlockMaterial.Bedrock) {
                if (rng.next() > 0.5) {
                  blocks[by][bx] = oreMat;
                }
              }
            }
          }
        }
      }
    }

    return { width, height, blocks, surfaceY: surfaceBase, rooms };
  }
}
