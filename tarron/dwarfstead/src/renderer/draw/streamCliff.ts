/**
 * Cliff-edge stream shapes — renders the horizontal-to-vertical water arc
 * when flow goes over a ledge.
 */

import Phaser from 'phaser';
import { Direction } from '../../sim/types';
import type { ClassifiedNode } from './streamContext';
import { FLOW_COLOR, FLOW_ALPHA, RIBBON_FRAC, FALL_FRAC, bezierTo } from './streamConstants';

/**
 * Cliff edge — horizontal flow arcing off an edge into a fall.
 * Draws the incoming ribbon, then a curved filled shape that bends
 * from horizontal into vertical, like water arcing over a ledge.
 */
export function drawCliffEdge(
  g: Phaser.GameObjects.Graphics, node: ClassifiedNode,
  px: number, py: number, ts: number,
): void {
  const ribbonH = Math.max(2, Math.round(ts * RIBBON_FRAC));
  const fallW = Math.max(2, Math.round(ts * FALL_FRAC));
  const ribbonY = py + ts - ribbonH;
  const fallX = px + Math.round((ts - fallW) / 2);
  const cx = px + ts / 2;

  g.fillStyle(FLOW_COLOR, FLOW_ALPHA);

  const fromRight = node.prevDir === Direction.Left;
  const dual = node.dual === true;
  const r = Math.round(Math.min(ts * 0.5, fallW, ribbonH));
  const rSteps = Math.max(6, Math.round(ts / 4));
  const steps = Math.max(4, Math.round(ts / 6));
  const bottom = py + ts;
  const right = px + ts;

  if (dual) {
    // T-junction: simple full-width ribbon — arcs handled by tiles below
    g.fillRect(px, ribbonY, right - px, ribbonH);
    return;
  }

  // Single-direction ribbon with rounded outside corner
  if (fromRight) {
    g.beginPath();
    g.moveTo(right, ribbonY);
    g.lineTo(right, ribbonY + ribbonH);
    g.lineTo(fallX, ribbonY + ribbonH);
    g.lineTo(fallX, ribbonY + r);
    bezierTo(g, fallX, ribbonY + r, fallX, ribbonY, fallX + r, ribbonY, rSteps);
    g.closePath();
    g.fillPath();
  } else {
    g.beginPath();
    g.moveTo(px, ribbonY);
    g.lineTo(fallX + fallW - r, ribbonY);
    bezierTo(g, fallX + fallW - r, ribbonY, fallX + fallW, ribbonY, fallX + fallW, ribbonY + r, rSteps);
    g.lineTo(fallX + fallW, ribbonY + ribbonH);
    g.lineTo(px, ribbonY + ribbonH);
    g.closePath();
    g.fillPath();
  }

  drawCliffArc(g, cx, fallW, px, ribbonY, ribbonH, bottom, steps, fromRight);
}

/** Draw one side of the cliff-edge arc (the curved water bending from ribbon into fall). */
function drawCliffArc(
  g: Phaser.GameObjects.Graphics,
  cx: number, fallW: number, px: number,
  ribbonY: number, ribbonH: number, bottom: number,
  steps: number, bendLeft: boolean,
): void {
  const tileW = bottom - ribbonY + ribbonH;
  const right = px + tileW;

  g.beginPath();
  if (bendLeft) {
    const outerStartX = cx + fallW / 2;
    const innerStartX = cx - fallW / 2;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = outerStartX + (1 - t) * (1 - t) * (right - outerStartX);
      const y = ribbonY + t * t * (bottom - ribbonY);
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.lineTo(innerStartX, bottom);
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const x = innerStartX + (1 - t) * (1 - t) * (right - ribbonH - innerStartX);
      const y = ribbonY + ribbonH + (t * t) * (bottom - ribbonY - ribbonH);
      g.lineTo(x, y);
    }
  } else {
    const outerStartX = cx - fallW / 2;
    const innerStartX = cx + fallW / 2;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = outerStartX - (1 - t) * (1 - t) * (outerStartX - px);
      const y = ribbonY + t * t * (bottom - ribbonY);
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.lineTo(innerStartX, bottom);
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const x = innerStartX - (1 - t) * (1 - t) * (innerStartX - px - ribbonH);
      const y = ribbonY + ribbonH + (t * t) * (bottom - ribbonY - ribbonH);
      g.lineTo(x, y);
    }
  }
  g.closePath();
  g.fillPath();
}
