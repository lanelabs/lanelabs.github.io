/**
 * Pipe terminal visual markers — flared entrances and nozzle exits.
 *
 * Detects pipe segments whose entry/exit sides have no neighboring pipe
 * and draws directional copper markers (funnels for entrances, nozzles for exits).
 */

import Phaser from 'phaser';
import type { WaterSimState, PipeCell } from '../../sim/water/types';
import { Direction } from '../../sim/types';

const PIPE_COLOR = 0xb87333;

const TERM_DX: Record<Direction, number> = {
  [Direction.Left]: -1, [Direction.Right]: 1,
  [Direction.Up]: 0, [Direction.Down]: 0,
};
const TERM_DY: Record<Direction, number> = {
  [Direction.Left]: 0, [Direction.Right]: 0,
  [Direction.Up]: -1, [Direction.Down]: 1,
};

export function drawPipeTerminals(
  g: Phaser.GameObjects.Graphics, state: WaterSimState,
  pipe: PipeCell, wx: number, wy: number,
  px: number, py: number, ts: number,
  cx: number, cy: number, pipeW: number, wallT: number,
): void {
  const ph = state.pipes.length;
  const pw = ph > 0 ? state.pipes[0].length : 0;
  const half = pipeW / 2;
  const flare = Math.max(2, Math.round(pipeW * 0.3));

  // Check entry side — is there a neighboring pipe in the entry direction?
  const enx = wx + TERM_DX[pipe.entry];
  const eny = wy + TERM_DY[pipe.entry];
  const entryNeighbor = (enx >= 0 && enx < pw && eny >= 0 && eny < ph)
    ? state.pipes[eny][enx] : null;

  if (!entryNeighbor && !pipe.isDrain) {
    drawTerminalFlare(g, pipe.entry, px, py, ts, cx, cy, half, wallT, flare);
  }

  // Check exit side
  const exnx = wx + TERM_DX[pipe.exit];
  const exny = wy + TERM_DY[pipe.exit];
  const exitNeighbor = (exnx >= 0 && exnx < pw && exny >= 0 && exny < ph)
    ? state.pipes[exny][exnx] : null;

  if (!exitNeighbor) {
    drawTerminalNozzle(g, pipe.exit, px, py, ts, cx, cy, half, wallT, flare);
  }
}

function drawTerminalFlare(
  g: Phaser.GameObjects.Graphics, dir: Direction,
  px: number, py: number, ts: number,
  cx: number, cy: number, half: number, wallT: number, flare: number,
): void {
  g.fillStyle(PIPE_COLOR, 1);
  const t = Math.max(2, wallT * 2);
  switch (dir) {
    case Direction.Left:
      g.fillRect(px, cy - half - flare, t, half * 2 + flare * 2);
      break;
    case Direction.Right:
      g.fillRect(px + ts - t, cy - half - flare, t, half * 2 + flare * 2);
      break;
    case Direction.Up:
      g.fillRect(cx - half - flare, py, half * 2 + flare * 2, t);
      break;
    case Direction.Down:
      g.fillRect(cx - half - flare, py + ts - t, half * 2 + flare * 2, t);
      break;
  }
}

function drawTerminalNozzle(
  g: Phaser.GameObjects.Graphics, dir: Direction,
  px: number, py: number, ts: number,
  cx: number, cy: number, half: number, wallT: number, flare: number,
): void {
  g.fillStyle(PIPE_COLOR, 1);
  const nozzle = Math.max(1, Math.round(flare * 0.6));
  const t = Math.max(2, wallT * 2);
  switch (dir) {
    case Direction.Left:
      g.fillRect(px, cy - half - nozzle, t, half * 2 + nozzle * 2);
      break;
    case Direction.Right:
      g.fillRect(px + ts - t, cy - half - nozzle, t, half * 2 + nozzle * 2);
      break;
    case Direction.Up:
      g.fillRect(cx - half - nozzle, py, half * 2 + nozzle * 2, t);
      break;
    case Direction.Down:
      g.fillRect(cx - half - nozzle, py + ts - t, half * 2 + nozzle * 2, t);
      break;
  }
}
