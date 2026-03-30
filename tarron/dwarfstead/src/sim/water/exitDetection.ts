/**
 * Exit detection — finds all points where water can leave a pool.
 *
 * Terrain exits (air breaches):
 * - Side breach: air adjacent to pool edge at or below water surface
 * - Floor breach: air below a pool tile
 *
 * Pipe exits (terminal-based):
 * - Pipe terminals adjacent to water pools create pipe paths.
 * - Direction determined by gravity (different y) or effective height (same y).
 * - Anti-oscillation prevents back-and-forth when pools are nearly equal.
 * - One path per pipe network per tick (1 volume/tick throughput).
 */

import { BlockMaterial } from '../types';
import type { WaterPath, PumpCell } from './types';
import { ExitType } from './types';
import type { WaterLayer } from './waterLayer';
import { VOLUME_PER_TILE, findLayer, layerFillFraction } from './waterLayer';
import { buildNetworkGrid, findTerminals, tagPumpExitOnly, type PipeTerminal } from './pipeNetwork';
import type { PipeCell } from './types';

function isAir(blocks: BlockMaterial[][], x: number, y: number, w: number, h: number): boolean {
  if (x < 0 || x >= w || y < 0 || y >= h) return false;
  return blocks[y][x] === BlockMaterial.Air;
}

/**
 * Find the topmost layer with water in the column that contains the given layer.
 * Walks upward through connected air tiles to find the surface layer.
 */
function findSurfaceLayerY(
  layers: WaterLayer[], blocks: BlockMaterial[][],
  poolX: number, startY: number,
): number {
  let surfaceY = startY;
  for (let y = startY - 1; y >= 0; y--) {
    if (blocks[y][poolX] !== BlockMaterial.Air) break;
    const l = findLayer(layers, poolX, y);
    if (l && l.volume > 0) surfaceY = y;
  }
  return surfaceY;
}

/**
 * Detect all terrain exits (side and floor breaches) for all water layers.
 */
function findTerrainExits(
  waterLayers: WaterLayer[],
  blocks: BlockMaterial[][],
  w: number, h: number,
  seen: Set<string>,
): WaterPath[] {
  const exits: WaterPath[] = [];

  for (const layer of waterLayers) {
    if (layer.volume <= 0) continue;

    const y = layer.y;
    const surfaceY = findSurfaceLayerY(waterLayers, blocks, layer.left, y);
    if (y < surfaceY) continue;

    // --- Side breaches ---
    const lx = layer.left - 1;
    if (lx >= 0) {
      const key = `S${lx},${y}`;
      if (!seen.has(key) && isAir(blocks, lx, y, w, h) && !findLayer(waterLayers, lx, y)) {
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
      if (!seen.has(key) && isAir(blocks, rx, y, w, h) && !findLayer(waterLayers, rx, y)) {
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

    // --- Floor breaches ---
    if (y + 1 < h) {
      for (let x = layer.left; x <= layer.right; x++) {
        const key = `B${x},${y + 1}`;
        if (seen.has(key)) continue;
        if (isAir(blocks, x, y + 1, w, h) && !findLayer(waterLayers, x, y + 1)) {
          seen.add(key);
          exits.push({
            exitX: x, exitY: y + 1,
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

/** Info about a terminal submerged in water. */
interface TerminalWaterInfo {
  terminal: PipeTerminal;
  layer: WaterLayer;
  fillFrac: number;
}

/** Fill fraction tolerance — below this gap, same-y terminals are "equalized". */
const EQUALIZE_THRESHOLD = 0.05;

/**
 * Select entrance and exit terminals for a pipe network.
 *
 * Works in layers (by y):
 * 1. Topmost y with submerged non-exitOnly terminals = entrance layer
 * 2. Within entrance layer:
 *    - If fills differ by > threshold: highest fill = entrance, lower fill = exit
 *    - If equalized: pick one as entrance, others are inactive (not exits)
 *      Caller round-robins between equalized entrances across ticks.
 * 3. All terminals strictly below entrance layer = exits
 * 4. exitOnly terminals are always exits regardless of position
 */
function selectEntranceAndExits(
  waterInfos: TerminalWaterInfo[],
  allTerminals: PipeTerminal[],
): { entrance: TerminalWaterInfo; exitTerminals: PipeTerminal[] } | null {
  const candidates = waterInfos.filter(w => !w.terminal.exitOnly);
  if (candidates.length === 0) return null;

  // Find topmost y among candidates
  const topY = Math.min(...candidates.map(c => c.terminal.y));
  const topLayer = candidates.filter(c => c.terminal.y === topY);
  topLayer.sort((a, b) => b.fillFrac - a.fillFrac);

  const highest = topLayer[0];
  const allEqualized = topLayer.length > 1 && topLayer.every(
    c => Math.abs(c.fillFrac - highest.fillFrac) <= EQUALIZE_THRESHOLD,
  );

  const entrance = highest;

  const exitTerminals = allTerminals.filter(t => {
    if (t.exitOnly) return true;
    if (t.x === entrance.terminal.x && t.y === entrance.terminal.y) return false;
    // Below entrance layer = always exit
    if (t.y > topY) return true;
    // Same layer: exit only if NOT equalized and has meaningfully lower fill
    if (t.y === topY) {
      if (allEqualized) return false; // equalized peers are inactive, not exits
      const wi = waterInfos.find(w => w.terminal.x === t.x && w.terminal.y === t.y);
      if (!wi) return false; // dry same-y terminal is inactive
      return wi.fillFrac < highest.fillFrac - EQUALIZE_THRESHOLD;
    }
    // Above entrance layer = never exit (unless exitOnly, handled above)
    return false;
  });

  return { entrance, exitTerminals };
}

/**
 * Detect pipe exits for all pipe networks.
 * Gravity entrance (topmost submerged) + all lower terminals as exits.
 * Pump-tagged terminals are excluded from entrance candidacy.
 */
function findPipeExits(
  waterLayers: WaterLayer[],
  blocks: BlockMaterial[][],
  pipes: (PipeCell | null)[][],
  pumps: PumpCell[],
  w: number, h: number,
  seen: Set<string>,
): WaterPath[] {
  const networkGrid = buildNetworkGrid(pipes, w, h);
  const terminals = findTerminals(pipes, blocks, w, h, networkGrid);

  if (terminals.length === 0) return [];

  // Tag pump exit-only terminals
  tagPumpExitOnly(terminals, pumps, pipes, networkGrid, w, h);

  // Group terminals by network
  const networkTerminals = new Map<number, PipeTerminal[]>();
  for (const t of terminals) {
    let group = networkTerminals.get(t.networkId);
    if (!group) {
      group = [];
      networkTerminals.set(t.networkId, group);
    }
    group.push(t);
  }

  const exits: WaterPath[] = [];

  for (const [networkId, terms] of networkTerminals) {
    // Find submerged terminals
    const waterInfos: TerminalWaterInfo[] = [];
    for (const term of terms) {
      const ownLayer = findLayer(waterLayers, term.x, term.y);
      if (ownLayer && ownLayer.volume > 0) {
        waterInfos.push({
          terminal: term,
          layer: ownLayer,
          fillFrac: layerFillFraction(ownLayer),
        });
      }
    }

    if (waterInfos.length === 0) continue;

    const result = selectEntranceAndExits(waterInfos, terms);
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
 * Detect all exits for all water layers.
 * Returns partially-filled WaterPath objects (branches not yet traced).
 */
export function findPoolExits(
  waterLayers: WaterLayer[],
  blocks: BlockMaterial[][],
  pipes: (PipeCell | null)[][],
  pumps: PumpCell[],
  w: number, h: number,
): WaterPath[] {
  const seen = new Set<string>();
  const terrain = findTerrainExits(waterLayers, blocks, w, h, seen);
  const pipe = findPipeExits(waterLayers, blocks, pipes, pumps, w, h, seen);
  return [...terrain, ...pipe];
}
