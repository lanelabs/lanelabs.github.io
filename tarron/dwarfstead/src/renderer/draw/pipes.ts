/**
 * Unified pipe + pump rendering layer.
 *
 * Draws all pipe geometry (interior, walls, terminals, pumps) once on a
 * dedicated Graphics canvas that sits above both water and gas layers.
 * Water and gas each supply their active-arm maps; this module merges
 * them and renders flow fill in the appropriate color per fluid.
 *
 * Two-pass rendering ensures pumps always draw on top of pipe interiors.
 */

import Phaser from 'phaser';
import type { PipeCell, PumpCell } from '../../sim/water/types';
import { BlockMaterial, Direction } from '../../sim/types';
import { pipeNeighborDirs } from '../../sim/water/pipeNetwork';
import { drawPipeTerminals, drawPumpTile } from './pipeTerminals';
import { CAVE_COLOR } from './background';

const PIPE_COLOR = 0xb87333;
const WATER_FLOW_COLOR = 0x3b6990;
const GAS_FLOW_COLOR = 0xa8916b;

/**
 * Draw all pipes and pumps for both fluids on a single Graphics layer.
 *
 * @param g           Dedicated pipe Graphics (cleared each frame)
 * @param pipes       Pipe grid (shared by water and gas)
 * @param pumps       Pump list
 * @param blocks      Terrain blocks (for terminal open-side detection)
 * @param waterArms   Active pipe arms from the water stream context
 * @param gasArms     Active pipe arms from the gas stream context
 */
export function drawAllPipes(
  g: Phaser.GameObjects.Graphics,
  pipes: (PipeCell | null)[][],
  pumps: PumpCell[],
  blocks: BlockMaterial[][] | undefined,
  waterArms: Map<string, Set<Direction>>,
  gasArms: Map<string, Set<Direction>>,
  ts: number, tilesX: number, tilesY: number,
  camX: number, camY: number,
): void {
  g.clear();

  const pipeW = Math.max(4, Math.round(ts * 0.4));
  const wallT = Math.max(1, Math.round(ts * 0.08));
  const inner = pipeW - wallT * 2;
  const ph = pipes.length;
  const pw = ph > 0 ? pipes[0].length : 0;

  // Build a state-like object for drawPipeTerminals which expects { pipes, pumps }
  const pipeState = { pipes, pumps };

  // Collect pump tiles for deferred second pass
  const pumpTiles: {
    wx: number; wy: number; px: number; py: number;
    cx: number; cy: number;
  }[] = [];

  // Pass 1: pipe interiors, flow fill, walls, non-pump terminals
  for (let vy = 0; vy < tilesY; vy++) {
    for (let vx = 0; vx < tilesX; vx++) {
      const wx = camX + vx;
      const wy = camY + vy;
      if (wx < 0 || wy < 0 || wy >= ph || wx >= pw) continue;
      if (!pipes[wy][wx]) continue;

      const px = vx * ts;
      const py = vy * ts;
      const cx = px + ts / 2;
      const cy = py + ts / 2;

      // Cave-colored interior (masks fluid beneath)
      drawPipeInterior(g, pipes, wx, wy, px, py, ts, pw, ph, pipeW, wallT, inner, CAVE_COLOR, 1, pumps);

      // Active-arm flow fill per fluid
      const neighbors = pipeNeighborDirs(pipes, wx, wy, pw, ph, pumps);
      const wArms = waterArms.get(`${wx},${wy}`);
      if (wArms && wArms.size > 0) {
        drawActiveArms(g, px, py, ts, pipeW, wallT, inner, wArms, WATER_FLOW_COLOR, neighbors);
      }
      const gArms = gasArms.get(`${wx},${wy}`);
      if (gArms && gArms.size > 0) {
        drawActiveArms(g, px, py, ts, pipeW, wallT, inner, gArms, GAS_FLOW_COLOR, neighbors);
      }

      // Copper walls + caps
      drawPipeSegment(g, pipes, wx, wy, px, py, ts, cx, cy, pipeW, wallT, pw, ph, pumps);

      // Terminals or deferred pump
      if (pumps.some(p => p.x === wx && p.y === wy)) {
        pumpTiles.push({ wx, wy, px, py, cx, cy });
      } else {
        drawPipeTerminals(g, pipeState, blocks, wx, wy, px, py, ts, cx, cy, pipeW, wallT);
      }
    }
  }

  // Pass 2: pumps on top of all pipe geometry
  for (const t of pumpTiles) {
    const pump = pumps.find(p => p.x === t.wx && p.y === t.wy);
    if (pump) {
      drawPumpTile(g, t.px, t.py, ts, t.cx, t.cy, pipeW, pump.direction);
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers (moved from water.ts)
// ---------------------------------------------------------------------------

/** Fill the interior of a pipe tile based on neighbor connectivity. */
function drawPipeInterior(
  g: Phaser.GameObjects.Graphics,
  pipes: (PipeCell | null)[][],
  wx: number, wy: number,
  px: number, py: number, ts: number,
  pw: number, ph: number,
  pipeW: number, wallT: number, inner: number,
  color: number, alpha: number,
  pumps?: PumpCell[],
): void {
  const neighbors = pipeNeighborDirs(pipes, wx, wy, pw, ph, pumps);
  const cx = px + ts / 2;
  const cy = py + ts / 2;
  const half = pipeW / 2;

  g.fillStyle(color, alpha);

  const il = cx - half + (neighbors.includes(Direction.Left) ? 0 : wallT);
  const ir = cx + half - (neighbors.includes(Direction.Right) ? 0 : wallT);
  const it = cy - half + (neighbors.includes(Direction.Up) ? 0 : wallT);
  const ib = cy + half - (neighbors.includes(Direction.Down) ? 0 : wallT);
  g.fillRect(il, it, ir - il, ib - it);

  for (const dir of neighbors) {
    fillArmToward(g, dir, px, py, ts, cx, cy, half, wallT, inner);
  }
}

function fillArmToward(
  g: Phaser.GameObjects.Graphics, dir: Direction,
  px: number, py: number, ts: number,
  cx: number, cy: number, half: number, wallT: number, inner: number,
): void {
  switch (dir) {
    case Direction.Left:  g.fillRect(px, cy - half + wallT, cx - half - px, inner); break;
    case Direction.Right: g.fillRect(cx + half, cy - half + wallT, px + ts - cx - half, inner); break;
    case Direction.Up:    g.fillRect(cx - half + wallT, py, inner, cy - half - py); break;
    case Direction.Down:  g.fillRect(cx - half + wallT, cy + half, inner, py + ts - cy - half); break;
  }
}

/** Fill active arms in a given color (replaces drawActivePipeInterior). */
function drawActiveArms(
  g: Phaser.GameObjects.Graphics,
  px: number, py: number, ts: number,
  pipeW: number, wallT: number, inner: number,
  arms: Set<Direction>, color: number,
  neighbors: Direction[],
): void {
  if (arms.size === 0) return;

  const cx = px + ts / 2;
  const cy = py + ts / 2;
  const half = pipeW / 2;

  const hasUp = arms.has(Direction.Up);
  const hasDown = arms.has(Direction.Down);
  const hasLeft = arms.has(Direction.Left);
  const hasRight = arms.has(Direction.Right);

  g.fillStyle(color, 1);

  const il = cx - half + (hasLeft ? 0 : wallT);
  const ir = cx + half - (hasRight ? 0 : wallT);
  const it = cy - half + (hasUp ? 0 : wallT);
  const ib = cy + half - (hasDown ? 0 : wallT);
  g.fillRect(il, it, ir - il, ib - it);

  // Only extend arm fills toward actual pipe neighbors — terminal arms
  // extending into open air are handled by stream shape rendering.
  if (hasLeft && neighbors.includes(Direction.Left))   g.fillRect(px, cy - half + wallT, cx - half - px, inner);
  if (hasRight && neighbors.includes(Direction.Right)) g.fillRect(cx + half, cy - half + wallT, px + ts - cx - half, inner);
  if (hasUp && neighbors.includes(Direction.Up))       g.fillRect(cx - half + wallT, py, inner, cy - half - py);
  if (hasDown && neighbors.includes(Direction.Down))   g.fillRect(cx - half + wallT, cy + half, inner, py + ts - cy - half);
}

/** Draw pipe walls based on neighbor connectivity. All non-neighbor sides capped. */
function drawPipeSegment(
  g: Phaser.GameObjects.Graphics,
  pipes: (PipeCell | null)[][],
  wx: number, wy: number,
  px: number, py: number, ts: number,
  cx: number, cy: number, pipeW: number, wallT: number,
  pw: number, ph: number,
  pumps?: PumpCell[],
): void {
  const neighbors = pipeNeighborDirs(pipes, wx, wy, pw, ph, pumps);
  const half = pipeW / 2;
  g.fillStyle(PIPE_COLOR, 0.9);

  for (const dir of neighbors) {
    drawWallsAlongArm(g, dir, px, py, ts, cx, cy, half, wallT);
  }

  const allDirs = [Direction.Up, Direction.Down, Direction.Left, Direction.Right];
  for (const dir of allDirs) {
    if (neighbors.includes(dir)) continue;
    drawWallCap(g, dir, cx, cy, half, wallT);
  }

  const hasUp = neighbors.includes(Direction.Up);
  const hasDown = neighbors.includes(Direction.Down);
  const hasLeft = neighbors.includes(Direction.Left);
  const hasRight = neighbors.includes(Direction.Right);
  if (hasUp && hasLeft)    g.fillRect(cx - half, cy - half, wallT, wallT);
  if (hasUp && hasRight)   g.fillRect(cx + half - wallT, cy - half, wallT, wallT);
  if (hasDown && hasLeft)  g.fillRect(cx - half, cy + half - wallT, wallT, wallT);
  if (hasDown && hasRight) g.fillRect(cx + half - wallT, cy + half - wallT, wallT, wallT);
}

function drawWallsAlongArm(
  g: Phaser.GameObjects.Graphics, dir: Direction,
  px: number, py: number, ts: number,
  cx: number, cy: number, half: number, wallT: number,
): void {
  switch (dir) {
    case Direction.Left:
      g.fillRect(px, cy - half, cx - half - px, wallT);
      g.fillRect(px, cy + half - wallT, cx - half - px, wallT);
      break;
    case Direction.Right:
      g.fillRect(cx + half, cy - half, px + ts - cx - half, wallT);
      g.fillRect(cx + half, cy + half - wallT, px + ts - cx - half, wallT);
      break;
    case Direction.Up:
      g.fillRect(cx - half, py, wallT, cy - half - py);
      g.fillRect(cx + half - wallT, py, wallT, cy - half - py);
      break;
    case Direction.Down:
      g.fillRect(cx - half, cy + half, wallT, py + ts - cy - half);
      g.fillRect(cx + half - wallT, cy + half, wallT, py + ts - cy - half);
      break;
  }
}

function drawWallCap(
  g: Phaser.GameObjects.Graphics, dir: Direction,
  cx: number, cy: number, half: number, wallT: number,
): void {
  switch (dir) {
    case Direction.Left:  g.fillRect(cx - half, cy - half, wallT, half * 2); break;
    case Direction.Right: g.fillRect(cx + half - wallT, cy - half, wallT, half * 2); break;
    case Direction.Up:    g.fillRect(cx - half, cy - half, half * 2, wallT); break;
    case Direction.Down:  g.fillRect(cx - half, cy + half - wallT, half * 2, wallT); break;
  }
}
