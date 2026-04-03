/**
 * Gas exit detection — finds all points where gas can leave a ceiling pool.
 *
 * Inverted from water exitDetection.ts:
 * - Ceiling breach: air above a gas tile (y-1)
 * - Side breach: air adjacent to pool edge at or above gas surface
 * - Pipe entrance: bottommost submerged terminal (not topmost)
 * - Only considers pumps with direction 'down'
 */

import { BlockMaterial } from '../types';
import type { GasPath, PumpCell, PipeCell } from './types';
import { ExitType } from './types';
import type { GasLayer } from './types';
import { VOLUME_PER_TILE, findGasLayer, gasLayerFillFraction } from './gasLayer';
import { buildNetworkGrid, findTerminals, tagPumpExitOnly, type PipeTerminal } from '../water/pipeNetwork';

function isAir(blocks: BlockMaterial[][], x: number, y: number, w: number, h: number): boolean {
  if (x < 0 || x >= w || y < 0 || y >= h) return false;
  return blocks[y][x] === BlockMaterial.Air;
}

function hasGasAt(layers: GasLayer[], x: number, y: number): boolean {
  const l = findGasLayer(layers, x, y);
  return l !== null && l.volume > 0;
}

/**
 * Find the bottommost layer with gas in the column that contains the given layer.
 * Walks downward through connected air tiles to find the gas surface (bottom).
 */
function findGasSurfaceLayerY(
  layers: GasLayer[], blocks: BlockMaterial[][],
  poolX: number, startY: number, h: number,
): number {
  let surfaceY = startY;
  for (let y = startY + 1; y < h; y++) {
    if (blocks[y][poolX] !== BlockMaterial.Air) break;
    const l = findGasLayer(layers, poolX, y);
    if (l && l.volume > 0) surfaceY = y;
  }
  return surfaceY;
}

/**
 * Detect all terrain exits (side and ceiling breaches) for all gas layers.
 */
function findTerrainExits(
  gasLayers: GasLayer[],
  blocks: BlockMaterial[][],
  w: number, h: number,
  seen: Set<string>,
): GasPath[] {
  const exits: GasPath[] = [];

  for (const layer of gasLayers) {
    if (layer.volume <= 0) continue;

    const y = layer.y;
    const surfaceY = findGasSurfaceLayerY(gasLayers, blocks, layer.left, y, h);
    // Only process the bottom layer (gas surface)
    if (y > surfaceY) continue;

    // --- Side breaches ---
    const lx = layer.left - 1;
    if (lx >= 0) {
      const key = `S${lx},${y}`;
      if (!seen.has(key) && isAir(blocks, lx, y, w, h) && !hasGasAt(gasLayers, lx, y)) {
        seen.add(key);
        exits.push({
          exitX: lx, exitY: y,
          exitType: ExitType.Terrain,
          rate: VOLUME_PER_TILE,
          sourceX: layer.left,
          sourceLayerY: y,
          branches: [],
        });
      }
    }

    const rx = layer.right + 1;
    if (rx < w) {
      const key = `S${rx},${y}`;
      if (!seen.has(key) && isAir(blocks, rx, y, w, h) && !hasGasAt(gasLayers, rx, y)) {
        seen.add(key);
        exits.push({
          exitX: rx, exitY: y,
          exitType: ExitType.Terrain,
          rate: VOLUME_PER_TILE,
          sourceX: layer.right,
          sourceLayerY: y,
          branches: [],
        });
      }
    }

    // --- Ceiling breaches (inverted floor breaches) ---
    if (y - 1 >= 0) {
      for (let x = layer.left; x <= layer.right; x++) {
        const key = `B${x},${y - 1}`;
        if (seen.has(key)) continue;
        if (isAir(blocks, x, y - 1, w, h) && !hasGasAt(gasLayers, x, y - 1)) {
          seen.add(key);
          exits.push({
            exitX: x, exitY: y - 1,
            exitType: ExitType.Terrain,
            rate: VOLUME_PER_TILE,
            sourceX: x,
            sourceLayerY: y,
            branches: [],
          });
        }
      }
    }
  }

  return exits;
}

interface TerminalGasInfo {
  terminal: PipeTerminal;
  layer: GasLayer;
  fillFrac: number;
}

const EQUALIZE_THRESHOLD = 0.05;

/**
 * Select entrance and exit terminals for a pipe network (gas version).
 * Entrance = bottommost submerged non-exitOnly terminal (inverted from water).
 */
function selectEntranceAndExits(
  gasInfos: TerminalGasInfo[],
  allTerminals: PipeTerminal[],
): { entrance: TerminalGasInfo; exitTerminals: PipeTerminal[] } | null {
  const candidates = gasInfos.filter(w => !w.terminal.exitOnly);
  if (candidates.length === 0) return null;

  // Find bottommost y among candidates (inverted: was topmost for water)
  const bottomY = Math.max(...candidates.map(c => c.terminal.y));
  const bottomLayer = candidates.filter(c => c.terminal.y === bottomY);
  bottomLayer.sort((a, b) => b.fillFrac - a.fillFrac);

  const highest = bottomLayer[0];
  const allEqualized = bottomLayer.length > 1 && bottomLayer.every(
    c => Math.abs(c.fillFrac - highest.fillFrac) <= EQUALIZE_THRESHOLD,
  );

  const entrance = highest;

  const exitTerminals = allTerminals.filter(t => {
    if (t.exitOnly) return true;
    if (t.x === entrance.terminal.x && t.y === entrance.terminal.y) return false;
    // Above entrance layer = always exit (inverted: was below for water)
    if (t.y < bottomY) return true;
    // Same layer
    if (t.y === bottomY) {
      if (allEqualized) return false;
      const wi = gasInfos.find(w => w.terminal.x === t.x && w.terminal.y === t.y);
      if (!wi) return false;
      return wi.fillFrac < highest.fillFrac - EQUALIZE_THRESHOLD;
    }
    return false;
  });

  return { entrance, exitTerminals };
}

/**
 * Detect pipe exits for all pipe networks (gas version).
 * Only considers pumps with direction 'down'.
 */
function findPipeExits(
  gasLayers: GasLayer[],
  blocks: BlockMaterial[][],
  pipes: (PipeCell | null)[][],
  pumps: PumpCell[],
  w: number, h: number,
  seen: Set<string>,
): GasPath[] {
  const networkGrid = buildNetworkGrid(pipes, w, h, pumps);
  const terminals = findTerminals(pipes, blocks, w, h, networkGrid, pumps);

  if (terminals.length === 0) return [];

  tagPumpExitOnly(terminals, pumps, pipes, networkGrid, w, h);

  const networkTerminals = new Map<number, PipeTerminal[]>();
  for (const t of terminals) {
    let group = networkTerminals.get(t.networkId);
    if (!group) { group = []; networkTerminals.set(t.networkId, group); }
    group.push(t);
  }

  const exits: GasPath[] = [];

  for (const [networkId, terms] of networkTerminals) {
    const gasInfos: TerminalGasInfo[] = [];
    for (const term of terms) {
      const ownLayer = findGasLayer(gasLayers, term.x, term.y);
      if (ownLayer && ownLayer.volume > 0) {
        gasInfos.push({
          terminal: term,
          layer: ownLayer,
          fillFrac: gasLayerFillFraction(ownLayer),
        });
      }
    }

    if (gasInfos.length === 0) continue;

    const result = selectEntranceAndExits(gasInfos, terms);
    if (!result) continue;

    const { entrance, exitTerminals } = result;
    if (exitTerminals.length === 0) continue;

    const key = `P${entrance.terminal.x},${entrance.terminal.y}`;
    if (seen.has(key)) continue;
    seen.add(key);

    exits.push({
      exitX: entrance.terminal.x,
      exitY: entrance.terminal.y,
      exitType: ExitType.Pipe,
      rate: 1,
      sourceX: entrance.terminal.x,
      sourceLayerY: entrance.terminal.y,
      branches: [],
      networkId,
      validExitTerminals: exitTerminals.map(t => ({ x: t.x, y: t.y })),
    });
  }

  return exits;
}

/**
 * Detect all exits for all gas layers.
 */
export function findGasPoolExits(
  gasLayers: GasLayer[],
  blocks: BlockMaterial[][],
  pipes: (PipeCell | null)[][],
  pumps: PumpCell[],
  w: number, h: number,
): GasPath[] {
  const seen = new Set<string>();
  const terrain = findTerrainExits(gasLayers, blocks, w, h, seen);
  const pipe = findPipeExits(gasLayers, blocks, pipes, pumps, w, h, seen);
  return [...terrain, ...pipe];
}
