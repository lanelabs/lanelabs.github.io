/**
 * Pipe terminal visual markers + pump tile rendering.
 *
 * Terminals are pipe tiles with fewer than 2 pipe neighbors.
 * All non-neighbor sides are capped by drawPipeSegment.
 * Flow-able air sides (down/left/right on air terminals) get a circle marker.
 *
 * Pumps are solid, wider blocks with a red upward caret.
 */

import Phaser from 'phaser';
import type { PipeCell, PumpCell } from '../../sim/water/types';
import { BlockMaterial, Direction } from '../../sim/types';
import { pipeNeighborDirs } from '../../sim/water/pipeNetwork';

const PIPE_COLOR = 0xb87333;
const PUMP_COLOR = 0xb87333;
const PUMP_ARROW_COLOR = 0xff3333;

export function drawPipeTerminals(
  g: Phaser.GameObjects.Graphics, state: { pipes: (PipeCell | null)[][]; pumps: PumpCell[] },
  blocks: BlockMaterial[][] | undefined,
  wx: number, wy: number,
  px: number, py: number, ts: number,
  cx: number, cy: number, pipeW: number, wallT: number,
): void {
  // Draw pump if present at this tile
  const pump = state.pumps.find(p => p.x === wx && p.y === wy);
  if (pump) {
    drawPumpTile(g, px, py, ts, cx, cy, pipeW, pump.direction);
    return; // pump replaces normal terminal visuals
  }

  const ph = state.pipes.length;
  const pw = ph > 0 ? state.pipes[0].length : 0;
  const neighbors = pipeNeighborDirs(state.pipes, wx, wy, pw, ph, state.pumps);
  if (neighbors.length >= 2) return;

  if (!blocks || blocks[wy]?.[wx] !== BlockMaterial.Air) return;

  const half = pipeW / 2;

  // Determine which sides get indicators based on pipe direction.
  const indicatorDirs: Direction[] = [];
  const pipeDir = neighbors[0]; // terminal has 0 or 1 pipe neighbor
  if (pipeDir === Direction.Up) {
    indicatorDirs.push(Direction.Down, Direction.Left, Direction.Right);
  } else if (pipeDir === Direction.Down) {
    indicatorDirs.push(Direction.Left, Direction.Right);
  } else if (pipeDir === Direction.Left) {
    indicatorDirs.push(Direction.Down, Direction.Right);
  } else if (pipeDir === Direction.Right) {
    indicatorDirs.push(Direction.Down, Direction.Left);
  } else {
    indicatorDirs.push(Direction.Down, Direction.Left, Direction.Right);
  }

  for (const dir of indicatorDirs) {
    const r = Math.max(1, Math.round(half * 0.3));

    // Circle marker
    g.lineStyle(Math.max(1, wallT), PIPE_COLOR, 0.6);
    switch (dir) {
      case Direction.Left:  g.strokeCircle(cx - half - r, cy, r); break;
      case Direction.Right: g.strokeCircle(cx + half + r, cy, r); break;
      case Direction.Down:  g.strokeCircle(cx, cy + half + r, r); break;
    }
  }
}

/** Draw a pump tile: solid wider block with red caret (up or down). */
export function drawPumpTile(
  g: Phaser.GameObjects.Graphics,
  px: number, py: number, ts: number,
  cx: number, cy: number, _pipeW: number,
  direction: 'up' | 'down' = 'up',
): void {
  // Wider solid block (60% of tile vs 40% for normal pipe)
  const pumpW = Math.max(6, Math.round(ts * 0.6));
  const half = pumpW / 2;

  // Solid pump body (opaque, no water visible through)
  g.fillStyle(PUMP_COLOR, 1);
  g.fillRect(cx - half, cy - half, pumpW, pumpW);

  // Red caret centered vertically with black outline
  const caretSize = Math.max(3, Math.round(pumpW * 0.4));
  const strokeW = Math.max(1, Math.round(ts * 0.08));
  const lx = cx - caretSize / 2, rx = cx + caretSize / 2;

  let ty: number, ly: number;
  if (direction === 'up') {
    const caretY = cy - caretSize / 4;
    ty = caretY;
    ly = caretY + caretSize / 2;
  } else {
    const caretY = cy + caretSize / 4;
    ty = caretY;
    ly = caretY - caretSize / 2;
  }

  // Black outline (slightly thicker behind)
  g.lineStyle(strokeW + 2, 0x000000, 1);
  g.beginPath();
  g.moveTo(lx, ly); g.lineTo(cx, ty); g.lineTo(rx, ly);
  g.strokePath();

  // Red caret on top
  g.lineStyle(strokeW, PUMP_ARROW_COLOR, 1);
  g.beginPath();
  g.moveTo(lx, ly); g.lineTo(cx, ty); g.lineTo(rx, ly);
  g.strokePath();
}
