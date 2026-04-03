/**
 * Gas stream shape drawing — renders each classified air node as a narrow
 * context-aware gas shape (ribbon, column, corner, liftoff, etc.).
 *
 * All shapes are vertically flipped from water:
 * - Horizontal ribbon is top-aligned (gas clings to ceiling)
 * - Corners curve upward
 * - Landing = gas hits ceiling, liftoff = gas lifts off floor
 */

import Phaser from 'phaser';
import { Direction } from '../../sim/types';
import type { GasClassifiedNode } from './gasStreamContext';
import { GAS_FLOW_COLOR, GAS_FLOW_ALPHA, GAS_RIBBON_FRAC, GAS_RISE_FRAC } from './gasStreamConstants';
import { bezierTo } from './streamConstants';

/** Draw a single classified gas air node. */
export function drawGasStreamNode(
  g: Phaser.GameObjects.Graphics,
  node: GasClassifiedNode,
  px: number, py: number, ts: number,
): void {
  switch (node.cls) {
    case 'horizontal': drawHorizontal(g, px, py, ts); break;
    case 'vertical': drawVertical(g, px, py, ts, node.chipDir); break;
    case 'corner': drawCorner(g, node, px, py, ts); break;
    case 'cliff-edge': drawCliffEdge(g, node, px, py, ts); break;
    case 'landing': drawLanding(g, node, px, py, ts); break;
    case 'pool-entry': drawPoolEntry(g, node, px, py, ts); break;
    case 'source': drawSource(g, node, px, py, ts); break;
  }
}

/** Horizontal ribbon — top-aligned (gas clings to ceiling). */
function drawHorizontal(
  g: Phaser.GameObjects.Graphics, px: number, py: number, ts: number,
): void {
  const h = Math.max(2, Math.round(ts * GAS_RIBBON_FRAC));
  g.fillStyle(GAS_FLOW_COLOR, GAS_FLOW_ALPHA);
  g.fillRect(px, py, ts, h); // top-aligned (inverted from water's bottom-aligned)
}

/** Vertical column — centered narrow strip, with optional rounded chip(s). */
function drawVertical(
  g: Phaser.GameObjects.Graphics, px: number, py: number, ts: number,
  chipDir?: 'left' | 'right' | 'both',
): void {
  const w = Math.max(2, Math.round(ts * GAS_RISE_FRAC));
  const x = px + Math.round((ts - w) / 2);
  g.fillStyle(GAS_FLOW_COLOR, GAS_FLOW_ALPHA);
  g.fillRect(x, py, w, ts);

  // Rounded chip(s) at bottom (inverted from water's top chips)
  if (chipDir) {
    const r = Math.round(ts * 0.35);
    const steps = Math.max(6, Math.round(ts / 4));
    const bottom = py + ts;
    if (chipDir === 'left' || chipDir === 'both') {
      g.beginPath();
      g.moveTo(x, bottom);
      g.lineTo(x - r, bottom);
      bezierTo(g, x - r, bottom, x, bottom, x, bottom - r, steps);
      g.closePath();
      g.fillPath();
    }
    if (chipDir === 'right' || chipDir === 'both') {
      g.beginPath();
      g.moveTo(x + w, bottom);
      g.lineTo(x + w + r, bottom);
      bezierTo(g, x + w + r, bottom, x + w, bottom, x + w, bottom - r, steps);
      g.closePath();
      g.fillPath();
    }
  }
}

/**
 * Corner — rectangle fill with one rounded corner (inverted from water).
 * Gas corners curve upward where water curves downward.
 */
function drawCorner(
  g: Phaser.GameObjects.Graphics, node: GasClassifiedNode,
  px: number, py: number, ts: number,
): void {
  const ribbonH = Math.max(2, Math.round(ts * GAS_RIBBON_FRAC));
  const riseW = Math.max(2, Math.round(ts * GAS_RISE_FRAC));
  const ribbonBottom = py + ribbonH; // top-aligned ribbon
  const riseX = px + Math.round((ts - riseW) / 2);
  const right = px + ts;
  const r = Math.round(Math.min(ts * 0.5, riseW, ribbonH));
  const steps = Math.max(6, Math.round(ts / 4));

  g.fillStyle(GAS_FLOW_COLOR, GAS_FLOW_ALPHA);

  const goingUp = node.nextDir === Direction.Up || node.prevDir === Direction.Down;
  const fromLeft = node.prevDir === Direction.Right || node.nextDir === Direction.Left;
  const fromBottom = node.prevDir === Direction.Up || node.nextDir === Direction.Down;

  if (goingUp && fromLeft) {
    // Horizontal from left, turn upward
    g.fillRect(px, py, riseX - px, ribbonH);
    g.beginPath();
    g.moveTo(riseX, ribbonBottom);
    g.lineTo(riseX + riseW - r, ribbonBottom);
    bezierTo(g, riseX + riseW - r, ribbonBottom, riseX + riseW, ribbonBottom, riseX + riseW, ribbonBottom - r, steps);
    g.lineTo(riseX + riseW, py);
    g.lineTo(riseX, py);
    g.closePath();
    g.fillPath();
  } else if (goingUp && !fromLeft) {
    // Horizontal from right, turn upward
    g.fillRect(riseX + riseW, py, right - riseX - riseW, ribbonH);
    g.beginPath();
    g.moveTo(riseX + riseW, ribbonBottom);
    g.lineTo(riseX + r, ribbonBottom);
    bezierTo(g, riseX + r, ribbonBottom, riseX, ribbonBottom, riseX, ribbonBottom - r, steps);
    g.lineTo(riseX, py);
    g.lineTo(riseX + riseW, py);
    g.closePath();
    g.fillPath();
  } else if (fromBottom && node.nextDir === Direction.Right) {
    g.fillRect(riseX + riseW, py, right - riseX - riseW, ribbonH);
    g.beginPath();
    g.moveTo(riseX, py + ts);
    g.lineTo(riseX + riseW, py + ts);
    g.lineTo(riseX + riseW, ribbonBottom + r);
    bezierTo(g, riseX + riseW, ribbonBottom + r, riseX + riseW, ribbonBottom, riseX + riseW + r, ribbonBottom, steps);
    g.lineTo(right, ribbonBottom);
    g.lineTo(right, py);
    g.lineTo(riseX, py);
    g.closePath();
    g.fillPath();
  } else if (fromBottom && node.nextDir === Direction.Left) {
    g.fillRect(px, py, riseX - px, ribbonH);
    g.beginPath();
    g.moveTo(riseX + riseW, py + ts);
    g.lineTo(riseX + riseW, py);
    g.lineTo(px, py);
    g.lineTo(px, ribbonBottom);
    g.lineTo(riseX - r, ribbonBottom);
    bezierTo(g, riseX - r, ribbonBottom, riseX, ribbonBottom, riseX, ribbonBottom + r, steps);
    g.lineTo(riseX, py + ts);
    g.closePath();
    g.fillPath();
  } else {
    g.fillRect(riseX, py, riseW, ts);
    g.fillRect(px, py, ts, ribbonH);
  }
}

/**
 * Cliff-edge — gas version: horizontal flow turning upward.
 * Unlike water (which arcs off a cliff with momentum), gas simply turns
 * upward like a corner. Dual mode draws a full-width ribbon for T-junctions.
 */
function drawCliffEdge(
  g: Phaser.GameObjects.Graphics, node: GasClassifiedNode,
  px: number, py: number, ts: number,
): void {
  if (node.dual) {
    const ribbonH = Math.max(2, Math.round(ts * GAS_RIBBON_FRAC));
    g.fillStyle(GAS_FLOW_COLOR, GAS_FLOW_ALPHA);
    g.fillRect(px, py, ts, ribbonH);
    return;
  }
  // Single-direction: same as corner (gas has no momentum arc)
  drawCorner(g, node, px, py, ts);
}


/**
 * Landing — gas rising and hitting ceiling, with rounded outside corner
 * where column meets outgoing ribbon (top-aligned).
 */
function drawLanding(
  g: Phaser.GameObjects.Graphics, node: GasClassifiedNode,
  px: number, py: number, ts: number,
): void {
  const riseW = Math.max(2, Math.round(ts * GAS_RISE_FRAC));
  const ribbonH = Math.max(2, Math.round(ts * GAS_RIBBON_FRAC));
  const riseX = px + Math.round((ts - riseW) / 2);
  const ribbonBottom = py + ribbonH;
  const fanSpread = Math.max(2, Math.round(ts * 0.2));
  const r = Math.round(Math.min(ts * 0.5, riseW, ribbonH));
  const steps = Math.max(6, Math.round(ts / 4));
  const right = px + ts;
  const bottom = py + ts;

  g.fillStyle(GAS_FLOW_COLOR, GAS_FLOW_ALPHA);

  const ic = node.innerCurve;
  const cr = ic ? Math.round(ts * 0.35) : 0;

  if (node.dual) {
    // T-junction: gas hits ceiling and goes both ways
    g.beginPath();
    g.moveTo(riseX, bottom);
    g.lineTo(riseX, ribbonBottom + r);
    bezierTo(g, riseX, ribbonBottom + r, riseX, ribbonBottom, riseX - r, ribbonBottom, steps);
    g.lineTo(px, ribbonBottom);
    g.lineTo(px, py);
    g.lineTo(right, py);
    g.lineTo(right, ribbonBottom);
    g.lineTo(riseX + riseW + r, ribbonBottom);
    bezierTo(g, riseX + riseW + r, ribbonBottom, riseX + riseW, ribbonBottom, riseX + riseW, ribbonBottom + r, steps);
    g.lineTo(riseX + riseW, bottom);
    g.closePath();
    g.fillPath();
  } else if (node.nextDir === Direction.Right) {
    g.beginPath();
    if (ic === 'left' || ic === 'both') {
      g.moveTo(riseX - cr, bottom);
      bezierTo(g, riseX - cr, bottom, riseX, bottom, riseX, bottom - cr, steps);
      g.lineTo(px, py);
    } else {
      g.moveTo(riseX, bottom);
      g.lineTo(riseX, ribbonBottom);
      g.lineTo(riseX - fanSpread, py);
    }
    g.lineTo(right, py);
    g.lineTo(right, ribbonBottom);
    g.lineTo(riseX + riseW + r, ribbonBottom);
    bezierTo(g, riseX + riseW + r, ribbonBottom, riseX + riseW, ribbonBottom, riseX + riseW, ribbonBottom + r, steps);
    if (ic === 'right' || ic === 'both') {
      g.lineTo(riseX + riseW, bottom - cr);
      bezierTo(g, riseX + riseW, bottom - cr, riseX + riseW, bottom, riseX + riseW + cr, bottom, steps);
    } else {
      g.lineTo(riseX + riseW, bottom);
    }
    g.closePath();
    g.fillPath();
  } else if (node.nextDir === Direction.Left) {
    g.beginPath();
    if (ic === 'right' || ic === 'both') {
      g.moveTo(riseX + riseW + cr, bottom);
      bezierTo(g, riseX + riseW + cr, bottom, riseX + riseW, bottom, riseX + riseW, bottom - cr, steps);
      g.lineTo(right, py);
    } else {
      g.moveTo(riseX + riseW, bottom);
      g.lineTo(riseX + riseW, ribbonBottom);
      g.lineTo(riseX + riseW + fanSpread, py);
    }
    g.lineTo(px, py);
    g.lineTo(px, ribbonBottom);
    g.lineTo(riseX - r, ribbonBottom);
    bezierTo(g, riseX - r, ribbonBottom, riseX, ribbonBottom, riseX, ribbonBottom + r, steps);
    if (ic === 'left' || ic === 'both') {
      g.lineTo(riseX, bottom - cr);
      bezierTo(g, riseX, bottom - cr, riseX, bottom, riseX - cr, bottom, steps);
    } else {
      g.lineTo(riseX, bottom);
    }
    g.closePath();
    g.fillPath();
  } else {
    // No outgoing direction — fan trapezoid upward
    g.beginPath();
    g.moveTo(riseX, bottom);
    g.lineTo(riseX - fanSpread, py);
    g.lineTo(riseX + riseW + fanSpread, py);
    g.lineTo(riseX + riseW, bottom);
    g.closePath();
    g.fillPath();
  }
}

/**
 * Pool entry — gas enters ceiling pool from below, widening upward.
 */
function drawPoolEntry(
  g: Phaser.GameObjects.Graphics, node: GasClassifiedNode,
  px: number, py: number, ts: number,
): void {
  const ribbonH = Math.max(2, Math.round(ts * GAS_RIBBON_FRAC));
  const riseW = Math.max(2, Math.round(ts * GAS_RISE_FRAC));

  g.fillStyle(GAS_FLOW_COLOR, GAS_FLOW_ALPHA);

  if (node.prevDir === Direction.Up || node.prevDir === null) {
    const riseX = px + Math.round((ts - riseW) / 2);
    const ic = node.innerCurve;
    const cr = ic ? Math.round(ts * 0.35) : 0;
    const steps = Math.max(6, Math.round(ts / 4));
    const bottomY = node.pipeExit ? py + Math.round(ts * 0.7) : py + ts;
    g.beginPath();
    // Left edge
    if (ic === 'left' || ic === 'both') {
      g.moveTo(riseX - cr, bottomY);
      bezierTo(g, riseX - cr, bottomY, riseX, bottomY, riseX, bottomY - cr, steps);
    } else {
      g.moveTo(riseX, bottomY);
    }
    g.lineTo(px, py);
    g.lineTo(px + ts, py);
    // Right edge
    if (ic === 'right' || ic === 'both') {
      g.lineTo(riseX + riseW, bottomY - cr);
      bezierTo(g, riseX + riseW, bottomY - cr, riseX + riseW, bottomY, riseX + riseW + cr, bottomY, steps);
    } else {
      g.lineTo(riseX + riseW, bottomY);
    }
    g.closePath();
    g.fillPath();
  } else if (node.prevDir === Direction.Right || node.prevDir === Direction.Left) {
    // Horizontal entry into ceiling pool
    g.fillRect(px, py, ts, ribbonH);
    g.beginPath();
    g.moveTo(px, py);
    g.lineTo(px + ts, py);
    g.lineTo(px + ts, py + ribbonH);
    g.lineTo(px, py + ribbonH);
    g.closePath();
    g.fillPath();
  } else {
    g.fillRect(px, py, ts, ts);
  }
}

/**
 * Source — first air node for gas paths.
 * When pipeExit is set, draws only from tile midpoint up.
 */
function drawSource(
  g: Phaser.GameObjects.Graphics, node: GasClassifiedNode,
  px: number, py: number, ts: number,
): void {
  if (node.pipeExit) {
    const midY = py + Math.round(ts / 2);
    const riseW = Math.max(2, Math.round(ts * GAS_RISE_FRAC));
    const riseX = px + Math.round((ts - riseW) / 2);
    g.fillStyle(GAS_FLOW_COLOR, GAS_FLOW_ALPHA);
    if (node.nextDir === Direction.Up) {
      // Half bar: narrow strip from tile top to pipe midpoint (gas rises into air)
      g.fillRect(riseX, py, riseW, midY - py);
    } else if (node.nextDir === Direction.Left || node.nextDir === Direction.Right) {
      const h = Math.max(2, Math.round(ts * GAS_RIBBON_FRAC));
      g.fillRect(px, py, ts, h);
    } else {
      // Default: same half bar as Up
      g.fillRect(riseX, py, riseW, midY - py);
    }
    return;
  }
  if (node.nextDir === Direction.Up) {
    drawVertical(g, px, py, ts);
  } else if (node.nextDir === Direction.Left || node.nextDir === Direction.Right) {
    drawHorizontal(g, px, py, ts);
  } else {
    drawVertical(g, px, py, ts);
  }
}
