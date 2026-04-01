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
import type { WaterSimState } from '../../sim/water/types';
import { BlockMaterial, Direction } from '../../sim/types';
import { pipeNeighborDirs } from '../../sim/water/pipeNetwork';

const PIPE_COLOR = 0xb87333;
const PUMP_COLOR = 0xb87333;
const PUMP_ARROW_COLOR = 0xff3333;
const FLOW_COLOR = 0x3b6990;
const SPLASH_COLOR = 0x5a8aaa;

export function drawPipeTerminals(
  g: Phaser.GameObjects.Graphics, state: WaterSimState,
  blocks: BlockMaterial[][] | undefined,
  wx: number, wy: number,
  px: number, py: number, ts: number,
  cx: number, cy: number, pipeW: number, wallT: number,
  activeArms?: Set<Direction>,
): void {
  // Draw pump if present at this tile
  if (state.pumps.some(p => p.x === wx && p.y === wy)) {
    drawPumpTile(g, px, py, ts, cx, cy, pipeW);
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
    const isActive = activeArms !== undefined && activeArms.has(dir);

    // Circle marker
    g.lineStyle(Math.max(1, wallT), PIPE_COLOR, 0.6);
    switch (dir) {
      case Direction.Left:  g.strokeCircle(cx - half - r, cy, r); break;
      case Direction.Right: g.strokeCircle(cx + half + r, cy, r); break;
      case Direction.Down:  g.strokeCircle(cx, cy + half + r, r); break;
    }

    // Flow visuals at active circles
    if (isActive) {
      drawTerminalFlow(g, dir, cx, cy, half, r, ts);
    }
  }
}

/** Draw a pump tile: solid wider block with red upward caret. */
function drawPumpTile(
  g: Phaser.GameObjects.Graphics,
  px: number, py: number, ts: number,
  cx: number, cy: number, _pipeW: number,
): void {
  // Wider solid block (60% of tile vs 40% for normal pipe)
  const pumpW = Math.max(6, Math.round(ts * 0.6));
  const half = pumpW / 2;

  // Solid pump body (opaque, no water visible through)
  g.fillStyle(PUMP_COLOR, 1);
  g.fillRect(cx - half, cy - half, pumpW, pumpW);

  // Red upward caret centered vertically with black outline
  const caretSize = Math.max(3, Math.round(pumpW * 0.4));
  const caretY = cy - caretSize / 4; // vertically centered
  const strokeW = Math.max(1, Math.round(ts * 0.08));
  const lx = cx - caretSize / 2, rx = cx + caretSize / 2;
  const ly = caretY + caretSize / 2, ty = caretY;

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

/** Draw flow expansion + splash at an active terminal circle. */
function drawTerminalFlow(
  g: Phaser.GameObjects.Graphics, dir: Direction,
  cx: number, cy: number, half: number, r: number, ts: number,
): void {
  const spread = Math.max(2, Math.round(r * 1.5));
  const splashLen = Math.max(1, Math.round(ts * 0.1));

  // Expanding fill from circle outward
  g.fillStyle(FLOW_COLOR, 1);
  switch (dir) {
    case Direction.Left: {
      const startX = cx - half - r * 2;
      g.fillRect(startX, cy - spread / 2, r * 2, spread);
      break;
    }
    case Direction.Right: {
      const startX = cx + half;
      g.fillRect(startX, cy - spread / 2, r * 2, spread);
      break;
    }
    case Direction.Down: {
      const startY = cy + half;
      g.fillRect(cx - spread / 2, startY, spread, r * 2);
      break;
    }
  }

  // Splash lines
  g.lineStyle(1, SPLASH_COLOR, 0.5);
  switch (dir) {
    case Direction.Left: {
      const sx = cx - half - r * 2;
      g.beginPath(); g.moveTo(sx, cy); g.lineTo(sx - splashLen, cy - splashLen); g.strokePath();
      g.beginPath(); g.moveTo(sx, cy); g.lineTo(sx - splashLen, cy + splashLen); g.strokePath();
      break;
    }
    case Direction.Right: {
      const sx = cx + half + r * 2;
      g.beginPath(); g.moveTo(sx, cy); g.lineTo(sx + splashLen, cy - splashLen); g.strokePath();
      g.beginPath(); g.moveTo(sx, cy); g.lineTo(sx + splashLen, cy + splashLen); g.strokePath();
      break;
    }
    case Direction.Down: {
      const sy = cy + half + r * 2;
      g.beginPath(); g.moveTo(cx, sy); g.lineTo(cx - splashLen, sy + splashLen); g.strokePath();
      g.beginPath(); g.moveTo(cx, sy); g.lineTo(cx + splashLen, sy + splashLen); g.strokePath();
      break;
    }
  }
}
