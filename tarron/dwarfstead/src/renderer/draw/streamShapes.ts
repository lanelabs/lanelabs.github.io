/**
 * Stream shape drawing — renders each classified air node as a narrow
 * context-aware water shape (ribbon, column, corner, landing, etc.).
 *
 * All shapes use FLOW_COLOR at full alpha. The narrow geometry provides
 * visual contrast without needing translucency.
 */

import Phaser from 'phaser';
import { Direction } from '../../sim/types';
import type { ClassifiedNode } from './streamContext';
import { FLOW_COLOR, FLOW_ALPHA, RIBBON_FRAC, FALL_FRAC, bezierTo } from './streamConstants';
import { drawCliffEdge } from './streamCliff';

/** Draw a single classified air node. */
export function drawStreamNode(
  g: Phaser.GameObjects.Graphics,
  node: ClassifiedNode,
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

/** Horizontal ribbon — bottom-aligned narrow strip. */
function drawHorizontal(
  g: Phaser.GameObjects.Graphics, px: number, py: number, ts: number,
): void {
  const h = Math.max(2, Math.round(ts * RIBBON_FRAC));
  g.fillStyle(FLOW_COLOR, FLOW_ALPHA);
  g.fillRect(px, py + ts - h, ts, h);
}

/** Vertical column — centered narrow strip, with optional rounded chip(s). */
function drawVertical(
  g: Phaser.GameObjects.Graphics, px: number, py: number, ts: number,
  chipDir?: 'left' | 'right' | 'both',
): void {
  const w = Math.max(2, Math.round(ts * FALL_FRAC));
  const x = px + Math.round((ts - w) / 2);
  g.fillStyle(FLOW_COLOR, FLOW_ALPHA);
  g.fillRect(x, py, w, ts);

  // Rounded chip(s) extending from the column
  if (chipDir) {
    const r = Math.round(ts * 0.35);
    const steps = Math.max(6, Math.round(ts / 4));
    if (chipDir === 'left' || chipDir === 'both') {
      g.beginPath();
      g.moveTo(x, py);
      g.lineTo(x - r, py);
      bezierTo(g, x - r, py, x, py, x, py + r, steps);
      g.closePath();
      g.fillPath();
    }
    if (chipDir === 'right' || chipDir === 'both') {
      g.beginPath();
      g.moveTo(x + w, py);
      g.lineTo(x + w + r, py);
      bezierTo(g, x + w + r, py, x + w, py, x + w, py + r, steps);
      g.closePath();
      g.fillPath();
    }
  }
}

/**
 * Corner — rectangle fill with one rounded corner on the outside of the turn.
 */
function drawCorner(
  g: Phaser.GameObjects.Graphics, node: ClassifiedNode,
  px: number, py: number, ts: number,
): void {
  const ribbonH = Math.max(2, Math.round(ts * RIBBON_FRAC));
  const fallW = Math.max(2, Math.round(ts * FALL_FRAC));
  const ribbonY = py + ts - ribbonH;
  const fallX = px + Math.round((ts - fallW) / 2);
  const bottom = py + ts;
  const right = px + ts;
  const r = Math.round(Math.min(ts * 0.5, fallW, ribbonH));
  const steps = Math.max(6, Math.round(ts / 4));

  g.fillStyle(FLOW_COLOR, FLOW_ALPHA);

  const goingDown = node.nextDir === Direction.Down || node.prevDir === Direction.Up;
  const fromLeft = node.prevDir === Direction.Right || node.nextDir === Direction.Left;
  const fromTop = node.prevDir === Direction.Down || node.nextDir === Direction.Up;

  if (goingDown && fromLeft) {
    g.fillRect(px, ribbonY, fallX - px, ribbonH);
    g.beginPath();
    g.moveTo(fallX, ribbonY);
    g.lineTo(fallX + fallW - r, ribbonY);
    bezierTo(g, fallX + fallW - r, ribbonY, fallX + fallW, ribbonY, fallX + fallW, ribbonY + r, steps);
    g.lineTo(fallX + fallW, bottom);
    g.lineTo(fallX, bottom);
    g.closePath();
    g.fillPath();
  } else if (goingDown && !fromLeft) {
    g.fillRect(fallX + fallW, ribbonY, right - fallX - fallW, ribbonH);
    g.beginPath();
    g.moveTo(fallX + fallW, ribbonY);
    g.lineTo(fallX + r, ribbonY);
    bezierTo(g, fallX + r, ribbonY, fallX, ribbonY, fallX, ribbonY + r, steps);
    g.lineTo(fallX, bottom);
    g.lineTo(fallX + fallW, bottom);
    g.closePath();
    g.fillPath();
  } else if (fromTop && node.nextDir === Direction.Right) {
    g.fillRect(fallX + fallW, ribbonY, right - fallX - fallW, ribbonH);
    g.beginPath();
    g.moveTo(fallX, py);
    g.lineTo(fallX + fallW, py);
    g.lineTo(fallX + fallW, ribbonY - r);
    bezierTo(g, fallX + fallW, ribbonY - r, fallX + fallW, ribbonY, fallX + fallW + r, ribbonY, steps);
    g.lineTo(right, ribbonY);
    g.lineTo(right, bottom);
    g.lineTo(fallX, bottom);
    g.closePath();
    g.fillPath();
  } else if (fromTop && node.nextDir === Direction.Left) {
    g.fillRect(px, ribbonY, fallX - px, ribbonH);
    g.beginPath();
    g.moveTo(fallX + fallW, py);
    g.lineTo(fallX + fallW, bottom);
    g.lineTo(px, bottom);
    g.lineTo(px, ribbonY);
    g.lineTo(fallX - r, ribbonY);
    bezierTo(g, fallX - r, ribbonY, fallX, ribbonY, fallX, ribbonY - r, steps);
    g.lineTo(fallX, py);
    g.closePath();
    g.fillPath();
  } else {
    g.fillRect(fallX, py, fallW, ts);
    g.fillRect(px, ribbonY, ts, ribbonH);
  }
}

/**
 * Landing — vertical flow hitting ground, with rounded outside corner
 * where column meets outgoing ribbon. Fan-out on the non-ribbon side.
 *
 * When innerCurve is set (tile below a cliff-edge), the top of the column
 * gets concave indents that smoothly continue the cliff arc curvature.
 */
function drawLanding(
  g: Phaser.GameObjects.Graphics, node: ClassifiedNode,
  px: number, py: number, ts: number,
): void {
  const fallW = Math.max(2, Math.round(ts * FALL_FRAC));
  const ribbonH = Math.max(2, Math.round(ts * RIBBON_FRAC));
  const fallX = px + Math.round((ts - fallW) / 2);
  const ribbonY = py + ts - ribbonH;
  const bottom = py + ts;
  const fanSpread = Math.max(2, Math.round(ts * 0.2));
  const r = Math.round(Math.min(ts * 0.5, fallW, ribbonH));
  const steps = Math.max(6, Math.round(ts / 4));
  const right = px + ts;

  g.fillStyle(FLOW_COLOR, FLOW_ALPHA);

  const ic = node.innerCurve;
  const cr = ic ? Math.round(ts * 0.35) : 0;

  if (node.dual) {
    g.beginPath();
    g.moveTo(fallX, py);
    g.lineTo(fallX, ribbonY - r);
    bezierTo(g, fallX, ribbonY - r, fallX, ribbonY, fallX - r, ribbonY, steps);
    g.lineTo(px, ribbonY);
    g.lineTo(px, bottom);
    g.lineTo(right, bottom);
    g.lineTo(right, ribbonY);
    g.lineTo(fallX + fallW + r, ribbonY);
    bezierTo(g, fallX + fallW + r, ribbonY, fallX + fallW, ribbonY, fallX + fallW, ribbonY - r, steps);
    g.lineTo(fallX + fallW, py);
    g.closePath();
    g.fillPath();
  } else if (node.nextDir === Direction.Right) {
    g.beginPath();
    // Left edge: chip curve if cliff on left, else fan
    if (ic === 'left' || ic === 'both') {
      g.moveTo(fallX - cr, py);
      bezierTo(g, fallX - cr, py, fallX, py, fallX, py + cr, steps);
      g.lineTo(px, bottom);
    } else {
      g.moveTo(fallX, py);
      g.lineTo(fallX, ribbonY);
      g.lineTo(fallX - fanSpread, bottom);
    }
    g.lineTo(right, bottom);
    g.lineTo(right, ribbonY);
    g.lineTo(fallX + fallW + r, ribbonY);
    bezierTo(g, fallX + fallW + r, ribbonY, fallX + fallW, ribbonY, fallX + fallW, ribbonY - r, steps);
    // Right edge: chip curve if cliff on right, else normal
    if (ic === 'right' || ic === 'both') {
      g.lineTo(fallX + fallW, py + cr);
      bezierTo(g, fallX + fallW, py + cr, fallX + fallW, py, fallX + fallW + cr, py, steps);
    } else {
      g.lineTo(fallX + fallW, py);
    }
    g.closePath();
    g.fillPath();
  } else if (node.nextDir === Direction.Left) {
    g.beginPath();
    // Right edge: chip curve if cliff on right, else fan
    if (ic === 'right' || ic === 'both') {
      g.moveTo(fallX + fallW + cr, py);
      bezierTo(g, fallX + fallW + cr, py, fallX + fallW, py, fallX + fallW, py + cr, steps);
      g.lineTo(right, bottom);
    } else {
      g.moveTo(fallX + fallW, py);
      g.lineTo(fallX + fallW, ribbonY);
      g.lineTo(fallX + fallW + fanSpread, bottom);
    }
    g.lineTo(px, bottom);
    g.lineTo(px, ribbonY);
    g.lineTo(fallX - r, ribbonY);
    bezierTo(g, fallX - r, ribbonY, fallX, ribbonY, fallX, ribbonY - r, steps);
    // Left edge: chip curve if cliff on left, else normal
    if (ic === 'left' || ic === 'both') {
      g.lineTo(fallX, py + cr);
      bezierTo(g, fallX, py + cr, fallX, py, fallX - cr, py, steps);
    } else {
      g.lineTo(fallX, py);
    }
    g.closePath();
    g.fillPath();
  } else {
    // No outgoing direction — simple fan trapezoid (rare fallback)
    g.beginPath();
    g.moveTo(fallX, py);
    g.lineTo(fallX - fanSpread, bottom);
    g.lineTo(fallX + fallW + fanSpread, bottom);
    g.lineTo(fallX + fallW, py);
    g.closePath();
    g.fillPath();
  }
}

/**
 * Pool entry — angled widening from stream to full tile width.
 * When innerCurve is set (tile below a cliff-edge), the top gets
 * concave indents matching the cliff arc curvature above.
 */
function drawPoolEntry(
  g: Phaser.GameObjects.Graphics, node: ClassifiedNode,
  px: number, py: number, ts: number,
): void {
  const ribbonH = Math.max(2, Math.round(ts * RIBBON_FRAC));
  const fallW = Math.max(2, Math.round(ts * FALL_FRAC));

  g.fillStyle(FLOW_COLOR, FLOW_ALPHA);

  if (node.prevDir === Direction.Down || node.prevDir === null) {
    const fallX = px + Math.round((ts - fallW) / 2);
    const ic = node.innerCurve;
    const cr = ic ? Math.round(ts * 0.35) : 0;
    const steps = Math.max(6, Math.round(ts / 4));
    // When pipe exit overlaps with pool, start at top of pipe center box
    // pipeW = ts*0.4, half = ts*0.2 → top of box = ts/2 - ts*0.2 = ts*0.3
    const topY = node.pipeExit ? py + Math.round(ts * 0.3) : py;
    g.beginPath();
    // Left edge
    if (ic === 'left' || ic === 'both') {
      g.moveTo(fallX - cr, topY);
      bezierTo(g, fallX - cr, topY, fallX, topY, fallX, topY + cr, steps);
    } else {
      g.moveTo(fallX, topY);
    }
    g.lineTo(px, py + ts);
    g.lineTo(px + ts, py + ts);
    // Right edge
    if (ic === 'right' || ic === 'both') {
      g.lineTo(fallX + fallW, topY + cr);
      bezierTo(g, fallX + fallW, topY + cr, fallX + fallW, topY, fallX + fallW + cr, topY, steps);
    } else {
      g.lineTo(fallX + fallW, topY);
    }
    g.closePath();
    g.fillPath();
  } else if (node.prevDir === Direction.Right || node.prevDir === Direction.Left) {
    const ribbonY = py + ts - ribbonH;
    g.fillRect(px, ribbonY, ts, ribbonH);
    g.beginPath();
    g.moveTo(px, ribbonY);
    g.lineTo(px + ts, ribbonY);
    g.lineTo(px + ts, py + ts);
    g.lineTo(px, py + ts);
    g.closePath();
    g.fillPath();
  } else {
    g.fillRect(px, py, ts, ts);
  }
}

/**
 * Source — first air node, rendered based on next direction.
 * When pipeExit is set, only draws from tile midpoint down.
 */
function drawSource(
  g: Phaser.GameObjects.Graphics, node: ClassifiedNode,
  px: number, py: number, ts: number,
): void {
  if (node.pipeExit) {
    const midY = py + Math.round(ts / 2);
    g.fillStyle(FLOW_COLOR, FLOW_ALPHA);
    if (node.nextDir === Direction.Down) {
      const w = Math.max(2, Math.round(ts * FALL_FRAC));
      const x = px + Math.round((ts - w) / 2);
      g.fillRect(x, midY, w, py + ts - midY);
    } else if (node.nextDir === Direction.Left || node.nextDir === Direction.Right) {
      const h = Math.max(2, Math.round(ts * RIBBON_FRAC));
      g.fillRect(px, py + ts - h, ts, h);
    } else {
      const w = Math.max(2, Math.round(ts * FALL_FRAC));
      const x = px + Math.round((ts - w) / 2);
      g.fillRect(x, midY, w, py + ts - midY);
    }
    return;
  }
  if (node.nextDir === Direction.Down) {
    drawVertical(g, px, py, ts);
  } else if (node.nextDir === Direction.Left || node.nextDir === Direction.Right) {
    drawHorizontal(g, px, py, ts);
  } else {
    drawVertical(g, px, py, ts);
  }
}

/**
 * Debug overlay: draws sample tiles for each stream node variant in a grid,
 * with labels showing classification + flags. Call from scene for visual debugging.
 */
export function drawStreamDebugTiles(
  scene: Phaser.Scene,
  g: Phaser.GameObjects.Graphics,
  labels: Phaser.GameObjects.Text[],
  ts: number,
): Phaser.GameObjects.Text[] {
  for (const lbl of labels) lbl.destroy();
  const newLabels: Phaser.GameObjects.Text[] = [];

  const samples: { label: string; node: ClassifiedNode }[] = [
    { label: 'flat stream', node: { x: 0, y: 0, cls: 'horizontal', prevDir: Direction.Right, nextDir: Direction.Right } },
    { label: 'falling', node: { x: 0, y: 0, cls: 'vertical', prevDir: Direction.Down, nextDir: Direction.Down } },
    { label: 'fall after\nturn from R', node: { x: 0, y: 0, cls: 'vertical', prevDir: Direction.Down, nextDir: Direction.Down, chipDir: 'left' } },
    { label: 'fall after\nturn from L', node: { x: 0, y: 0, cls: 'vertical', prevDir: Direction.Down, nextDir: Direction.Down, chipDir: 'right' } },
    { label: 'fall after\nT-junction', node: { x: 0, y: 0, cls: 'vertical', prevDir: Direction.Down, nextDir: Direction.Down, chipDir: 'both' } },
    { label: 'stream falls\noff edge R', node: { x: 0, y: 0, cls: 'cliff-edge', prevDir: Direction.Right, nextDir: Direction.Down } },
    { label: 'stream falls\noff edge L', node: { x: 0, y: 0, cls: 'cliff-edge', prevDir: Direction.Left, nextDir: Direction.Down } },
    { label: 'cliff: T-fork\nfalls both', node: { x: 0, y: 0, cls: 'cliff-edge', prevDir: Direction.Right, nextDir: Direction.Down, dual: true } },
    { label: 'land: fall\nhits ground R', node: { x: 0, y: 0, cls: 'landing', prevDir: Direction.Down, nextDir: Direction.Right } },
    { label: 'land: fall\nhits ground L', node: { x: 0, y: 0, cls: 'landing', prevDir: Direction.Down, nextDir: Direction.Left } },
    { label: 'land: T-fork\nhits ground', node: { x: 0, y: 0, cls: 'landing', prevDir: Direction.Down, nextDir: Direction.Right, dual: true } },
    { label: 'land below\ncliff, go R', node: { x: 0, y: 0, cls: 'landing', prevDir: Direction.Down, nextDir: Direction.Right, innerCurve: 'left' } },
    { label: 'land below\ncliff, go L', node: { x: 0, y: 0, cls: 'landing', prevDir: Direction.Down, nextDir: Direction.Left, innerCurve: 'right' } },
    { label: 'land below\ncliff, T-fork', node: { x: 0, y: 0, cls: 'landing', prevDir: Direction.Down, nextDir: Direction.Right, dual: true, innerCurve: 'both' } },
    { label: 'fall enters\npool', node: { x: 0, y: 0, cls: 'pool-entry', prevDir: Direction.Down, nextDir: null } },
    { label: 'pool below\ncliff on L', node: { x: 0, y: 0, cls: 'pool-entry', prevDir: Direction.Down, nextDir: null, innerCurve: 'left' } },
    { label: 'pool below\ncliff on R', node: { x: 0, y: 0, cls: 'pool-entry', prevDir: Direction.Down, nextDir: null, innerCurve: 'right' } },
    { label: 'pool below\ncliff both', node: { x: 0, y: 0, cls: 'pool-entry', prevDir: Direction.Down, nextDir: null, innerCurve: 'both' } },
    { label: 'source:\nfirst air tile', node: { x: 0, y: 0, cls: 'source', prevDir: null, nextDir: Direction.Down } },
    { label: 'pipe exit\nfalls down', node: { x: 0, y: 0, cls: 'source', prevDir: null, nextDir: Direction.Down, pipeExit: true } },
    { label: 'pipe exit\ninto pool', node: { x: 0, y: 0, cls: 'pool-entry', prevDir: Direction.Down, nextDir: null, pipeExit: true } },
  ];

  const cols = 5;
  const pad = 12;
  const cellW = Math.max(ts + pad * 2, 100);
  const cellH = ts + pad * 2 + 28;
  const startX = 10;
  const startY = 70;

  // Dark background
  g.fillStyle(0x111122, 0.9);
  const rows = Math.ceil(samples.length / cols);
  g.fillRect(startX - 4, startY - 4, cols * cellW + 8, rows * cellH + 8);

  const style = { fontSize: '8px', fontFamily: 'monospace', color: '#ffcc44' };

  for (let i = 0; i < samples.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const px = startX + col * cellW + Math.round((cellW - ts) / 2);
    const py = startY + row * cellH + pad;

    // Tile background
    g.fillStyle(0x252535, 1);
    g.fillRect(px, py, ts, ts);

    // Draw the shape
    drawStreamNode(g, samples[i].node, px, py, ts);

    // Label
    const cellCx = startX + col * cellW + cellW / 2;
    const lbl = scene.add.text(cellCx, py + ts + 2, samples[i].label, style)
      .setOrigin(0.5, 0).setDepth(200);
    newLabels.push(lbl);
  }

  return newLabels;
}
