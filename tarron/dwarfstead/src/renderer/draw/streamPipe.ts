/**
 * Active-arm pipe interior fill — draws water only through pipe arms
 * that actually carry flow, rather than filling all connected arms.
 */

import Phaser from 'phaser';
import { Direction } from '../../sim/types';

/** Pre-blended flow color: 0x55bbff at 0.45 alpha over cave bg 0x252535. */
const FLOW_COLOR = 0x3b6990;

/**
 * Fill pipe interior only on active (water-carrying) arms.
 * Center box always fills if any arms are active.
 * Individual arms fill only if their direction is in activeArms.
 */
export function drawActivePipeInterior(
  g: Phaser.GameObjects.Graphics,
  px: number, py: number, ts: number,
  pipeW: number, wallT: number, inner: number,
  activeArms: Set<Direction>,
): void {
  if (activeArms.size === 0) return;

  const cx = px + ts / 2;
  const cy = py + ts / 2;
  const half = pipeW / 2;

  const hasUp = activeArms.has(Direction.Up);
  const hasDown = activeArms.has(Direction.Down);
  const hasLeft = activeArms.has(Direction.Left);
  const hasRight = activeArms.has(Direction.Right);

  g.fillStyle(FLOW_COLOR, 1);

  // Center box — adjusted edges based on which arms are active
  const il = cx - half + (hasLeft ? 0 : wallT);
  const ir = cx + half - (hasRight ? 0 : wallT);
  const it = cy - half + (hasUp ? 0 : wallT);
  const ib = cy + half - (hasDown ? 0 : wallT);
  g.fillRect(il, it, ir - il, ib - it);

  // Only fill active arms
  if (hasLeft) {
    g.fillRect(px, cy - half + wallT, cx - half - px, inner);
  }
  if (hasRight) {
    g.fillRect(cx + half, cy - half + wallT, px + ts - cx - half, inner);
  }
  if (hasUp) {
    g.fillRect(cx - half + wallT, py, inner, cy - half - py);
  }
  if (hasDown) {
    g.fillRect(cx - half + wallT, cy + half, inner, py + ts - cy - half);
  }
}
