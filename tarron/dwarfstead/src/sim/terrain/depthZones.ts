import type { SeededRNG } from '../rng';

export type DepthZone = 'surface' | 'shallow' | 'midStone' | 'darkStone' | 'cavern' | 'deep';

export interface LayerBoundaries {
  surfaceHeights: number[];
  dirtBottom: number[];
  darkStoneTop: number[];
  darkStoneBottom: number[];
  stoneBottom: number[];
  height: number;
}

/** Returns the depth zone and 0-1 progress within that zone. */
export function getDepthZone(
  x: number, y: number, b: LayerBoundaries,
): { zone: DepthZone; t: number } {
  const surf = b.surfaceHeights[x];
  if (y < surf) return { zone: 'surface', t: 0 };
  if (y < b.dirtBottom[x]) {
    const range = b.dirtBottom[x] - surf;
    return { zone: 'shallow', t: range > 0 ? (y - surf) / range : 0 };
  }
  if (y < b.darkStoneTop[x]) {
    const range = b.darkStoneTop[x] - b.dirtBottom[x];
    return { zone: 'midStone', t: range > 0 ? (y - b.dirtBottom[x]) / range : 0 };
  }
  if (y < b.darkStoneBottom[x]) {
    const range = b.darkStoneBottom[x] - b.darkStoneTop[x];
    return { zone: 'darkStone', t: range > 0 ? (y - b.darkStoneTop[x]) / range : 0 };
  }
  if (y < b.stoneBottom[x]) {
    const range = b.stoneBottom[x] - b.darkStoneBottom[x];
    return { zone: 'cavern', t: range > 0 ? (y - b.darkStoneBottom[x]) / range : 0 };
  }
  const range = b.height - b.stoneBottom[x];
  return { zone: 'deep', t: range > 0 ? (y - b.stoneBottom[x]) / range : 0 };
}

/** Pick a random Y within a given zone for column x. Returns -1 if zone has no range. */
export function randomYInZone(
  zone: DepthZone, x: number, b: LayerBoundaries, rng: SeededRNG,
): number {
  let top: number, bot: number;
  switch (zone) {
    case 'shallow': top = b.surfaceHeights[x]; bot = b.dirtBottom[x]; break;
    case 'midStone': top = b.dirtBottom[x]; bot = b.darkStoneTop[x]; break;
    case 'darkStone': top = b.darkStoneTop[x]; bot = b.darkStoneBottom[x]; break;
    case 'cavern': top = b.darkStoneBottom[x]; bot = b.stoneBottom[x]; break;
    case 'deep': top = b.stoneBottom[x]; bot = b.height - 2; break;
    default: return -1;
  }
  if (top >= bot) return -1;
  return top + Math.floor(rng.next() * (bot - top));
}
