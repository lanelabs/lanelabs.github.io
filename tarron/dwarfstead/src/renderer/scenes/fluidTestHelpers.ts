/**
 * Helper functions extracted from WaterTestScene to stay under 400-line limit.
 * Handles mode switching, HUD text, and click handlers for the Fluid Test Lab.
 */

import type { WaterPathSystem } from '../../sim/water/WaterPathSystem';
import type { GasPathSystem } from '../../sim/gas/GasPathSystem';
import { BlockMaterial, Direction } from '../../sim/types';
import { findLayer } from '../../sim/water/waterLayer';
import { findGasLayer } from '../../sim/gas/gasLayer';
import { pipeNeighborDirs, hasPumpAt } from '../../sim/water/pipeNetwork';

export type FluidLabMode = 'water' | 'gas' | 'stone' | 'pipe' | 'pump' | 'downpump';
export type DrawAction = 'place' | 'remove';

export const MODE_CYCLE: FluidLabMode[] = ['water', 'gas', 'stone', 'pipe', 'pump', 'downpump'];

export function getModeLabelParts(mode: FluidLabMode): string {
  const labels = ['Water', 'Gas', 'Stone', 'Pipe', 'Pump↑', 'Pump↓'];
  const idx = MODE_CYCLE.indexOf(mode);
  return labels.map((l, i) => i === idx ? `[${l}]` : l).join('  ');
}

export function executeFluidAction(
  mode: FluidLabMode,
  x: number, y: number,
  waterSystem: WaterPathSystem,
  gasSystem: GasPathSystem,
  blocks: BlockMaterial[][],
): void {
  switch (mode) {
    case 'water':
      waterSystem.fillAt(x, y);
      break;
    case 'gas':
      gasSystem.fillAt(x, y);
      break;
    case 'stone':
      toggleStone(x, y, blocks, waterSystem, gasSystem);
      break;
    case 'pipe':
      togglePipe(x, y, waterSystem);
      break;
    case 'pump':
      togglePump(x, y, 'up', waterSystem);
      break;
    case 'downpump':
      togglePump(x, y, 'down', waterSystem);
      break;
  }
}

function toggleStone(
  x: number, y: number,
  blocks: BlockMaterial[][],
  waterSystem: WaterPathSystem,
  gasSystem: GasPathSystem,
): void {
  if (y < 0 || y >= blocks.length || x < 0 || x >= blocks[0].length) return;
  if (blocks[y][x] === BlockMaterial.Air) {
    if (findLayer(waterSystem.state.waterLayers, x, y)) return;
    if (findGasLayer(gasSystem.state.gasLayers, x, y)) return;
    blocks[y][x] = BlockMaterial.Stone;
  } else {
    blocks[y][x] = BlockMaterial.Air;
    waterSystem.onBlockRemoved(x, y);
    gasSystem.onBlockRemoved(x, y);
  }
}

function togglePipe(x: number, y: number, waterSystem: WaterPathSystem): void {
  const pipes = waterSystem.state.pipes;
  if (y < 0 || y >= pipes.length || x < 0 || x >= pipes[0].length) return;
  if (pipes[y][x]) {
    const pumps = waterSystem.state.pumps;
    for (const [nx, ny] of [[x, y - 1], [x, y + 1]] as const) {
      if (ny < 0 || ny >= pipes.length) continue;
      if (!hasPumpAt(pumps, nx, ny)) continue;
      const ph = pipes.length;
      const pw = ph > 0 ? pipes[0].length : 0;
      const dirs = pipeNeighborDirs(pipes, nx, ny, pw, ph);
      const vertCount = (dirs.includes(Direction.Up) ? 1 : 0) + (dirs.includes(Direction.Down) ? 1 : 0);
      if (vertCount - 1 < 2) return;
    }
    if (hasPumpAt(pumps, x, y)) return;
  }
  pipes[y][x] = pipes[y][x] ? null : true;
}

function togglePump(
  x: number, y: number,
  direction: 'up' | 'down',
  waterSystem: WaterPathSystem,
): void {
  const pipes = waterSystem.state.pipes;
  if (y < 0 || y >= pipes.length || x < 0 || x >= pipes[0].length) return;
  if (!pipes[y][x]) return;
  const pumps = waterSystem.state.pumps;
  const idx = pumps.findIndex(p => p.x === x && p.y === y);
  if (idx >= 0) {
    pumps.splice(idx, 1);
  } else {
    const ph = pipes.length;
    const pw = ph > 0 ? pipes[0].length : 0;
    const dirs = pipeNeighborDirs(pipes, x, y, pw, ph);
    if (dirs.includes(Direction.Left) || dirs.includes(Direction.Right)) return;
    if (!dirs.includes(Direction.Up) || !dirs.includes(Direction.Down)) return;
    pumps.push({ x, y, direction });
  }
}

/* ── Drag-draw helpers (non-toggling, one-direction only) ────────── */

function placePipe(x: number, y: number, waterSystem: WaterPathSystem): void {
  const pipes = waterSystem.state.pipes;
  if (y < 0 || y >= pipes.length || x < 0 || x >= pipes[0].length) return;
  if (!pipes[y][x]) pipes[y][x] = true;
}

function removePipe(x: number, y: number, waterSystem: WaterPathSystem): void {
  const pipes = waterSystem.state.pipes;
  if (y < 0 || y >= pipes.length || x < 0 || x >= pipes[0].length) return;
  if (!pipes[y][x]) return;
  const pumps = waterSystem.state.pumps;
  for (const [nx, ny] of [[x, y - 1], [x, y + 1]] as const) {
    if (ny < 0 || ny >= pipes.length) continue;
    if (!hasPumpAt(pumps, nx, ny)) continue;
    const ph = pipes.length;
    const pw = ph > 0 ? pipes[0].length : 0;
    const dirs = pipeNeighborDirs(pipes, nx, ny, pw, ph);
    const vc = (dirs.includes(Direction.Up) ? 1 : 0) + (dirs.includes(Direction.Down) ? 1 : 0);
    if (vc - 1 < 2) return;
  }
  if (hasPumpAt(pumps, x, y)) return;
  pipes[y][x] = null;
}

function placeStone(
  x: number, y: number, blocks: BlockMaterial[][],
  waterSystem: WaterPathSystem, gasSystem: GasPathSystem,
): void {
  if (y < 0 || y >= blocks.length || x < 0 || x >= blocks[0].length) return;
  if (blocks[y][x] !== BlockMaterial.Air) return;
  if (findLayer(waterSystem.state.waterLayers, x, y)) return;
  if (findGasLayer(gasSystem.state.gasLayers, x, y)) return;
  blocks[y][x] = BlockMaterial.Stone;
}

function removeStone(
  x: number, y: number, blocks: BlockMaterial[][],
  waterSystem: WaterPathSystem, gasSystem: GasPathSystem,
): void {
  if (y < 0 || y >= blocks.length || x < 0 || x >= blocks[0].length) return;
  if (blocks[y][x] === BlockMaterial.Air) return;
  blocks[y][x] = BlockMaterial.Air;
  waterSystem.onBlockRemoved(x, y);
  gasSystem.onBlockRemoved(x, y);
}

/** Determine whether the starting tile implies a 'place' or 'remove' drag. */
export function getDragAction(
  mode: FluidLabMode, x: number, y: number,
  waterSystem: WaterPathSystem, blocks: BlockMaterial[][],
): DrawAction | null {
  if (mode === 'pipe') {
    const pipes = waterSystem.state.pipes;
    if (y < 0 || y >= pipes.length || x < 0 || x >= pipes[0].length) return null;
    return pipes[y][x] ? 'remove' : 'place';
  }
  if (mode === 'stone') {
    if (y < 0 || y >= blocks.length || x < 0 || x >= blocks[0].length) return null;
    return blocks[y][x] === BlockMaterial.Air ? 'place' : 'remove';
  }
  return null;
}

/** Execute only the locked drag action (place or remove) — never toggles. */
export function executeDragAction(
  mode: FluidLabMode, action: DrawAction, x: number, y: number,
  waterSystem: WaterPathSystem, gasSystem: GasPathSystem, blocks: BlockMaterial[][],
): void {
  if (mode === 'pipe') {
    if (action === 'place') placePipe(x, y, waterSystem);
    else removePipe(x, y, waterSystem);
  } else if (mode === 'stone') {
    if (action === 'place') placeStone(x, y, blocks, waterSystem, gasSystem);
    else removeStone(x, y, blocks, waterSystem, gasSystem);
  }
}
