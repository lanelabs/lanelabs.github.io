import Phaser from 'phaser';
import { CARVING_MAX_TICKS } from '../../sim/components/ShapeBlock';

const AIR = 0x1a1a2e;
const WIP_OUTLINE = 0x4488ff;
/** Dark ashen wood — cool gray-brown to contrast warm dirt tones. */
export const WOOD_COLOR = 0x3d3530;
const WOOD_HIGHLIGHT = 0x574e47;

export function drawShaped(
  g: Phaser.GameObjects.Graphics,
  sx: number, sy: number, ts: number,
  blockColor: number, progress: number,
): void {
  const done = progress >= CARVING_MAX_TICKS;
  const t = Math.min(progress, CARVING_MAX_TICKS);
  const u = ts / 16;

  // Final shape: 1px inset on each side, clean rectangle on wooden slab
  const finalInset = Math.max(1, Math.round(u));
  const finalBoardH = Math.max(2, Math.round(3 * u));

  // Interpolate toward final shape
  const frac = t / CARVING_MAX_TICKS;
  const inset = Math.round(frac * finalInset);
  const boardH = Math.round(frac * finalBoardH);

  // WIP corner chips: grow first half, shrink second half, gone when done
  const maxChip = Math.ceil(ts * 0.2);
  const half = CARVING_MAX_TICKS / 2;
  const chipFrac = t <= half ? t / half : (CARVING_MAX_TICKS - t) / half;
  const cornerChip = done ? 0 : Math.floor(chipFrac * maxChip);

  const blockTop = sy;
  const blockH = ts - boardH;

  // Block body
  g.fillStyle(blockColor, 0.9);
  g.fillRect(sx + inset, blockTop, ts - inset * 2, blockH);

  // Corner chips (WIP only)
  if (cornerChip > 0) {
    g.fillStyle(AIR, 1);
    const cx = sx + inset;
    const cw = ts - inset * 2;
    const by = blockTop + blockH;
    g.beginPath(); g.moveTo(cx, blockTop); g.lineTo(cx + cornerChip, blockTop); g.lineTo(cx, blockTop + cornerChip); g.closePath(); g.fillPath();
    g.beginPath(); g.moveTo(cx + cw, blockTop); g.lineTo(cx + cw - cornerChip, blockTop); g.lineTo(cx + cw, blockTop + cornerChip); g.closePath(); g.fillPath();
    g.beginPath(); g.moveTo(cx, by); g.lineTo(cx + cornerChip, by); g.lineTo(cx, by - cornerChip); g.closePath(); g.fillPath();
    g.beginPath(); g.moveTo(cx + cw, by); g.lineTo(cx + cw - cornerChip, by); g.lineTo(cx + cw, by - cornerChip); g.closePath(); g.fillPath();
  }

  // Inner recessed rectangle (door inset) — fades in early for visible feedback
  const insetStart = Math.round(CARVING_MAX_TICKS * 0.15);
  const insetFrac = Math.max(0, (t - insetStart) / (CARVING_MAX_TICKS - insetStart));
  if (insetFrac > 0) {
    const pad = Math.max(2, Math.round(3 * u));
    const ix = sx + inset + pad;
    const iy = blockTop + pad;
    const iw = ts - inset * 2 - pad * 2;
    const ih = blockH - pad * 2;
    if (iw > 0 && ih > 0) {
      g.fillStyle(darken(blockColor, 0.25 * insetFrac), 0.9);
      g.fillRect(ix, iy, iw, ih);
      g.lineStyle(1, darken(blockColor, 0.45 * insetFrac), 0.5 * insetFrac);
      g.strokeRect(ix, iy, iw, ih);
    }
  }

  // Wooden slab at bottom — dark walnut
  if (boardH > 0) {
    g.fillStyle(WOOD_COLOR, 1);
    g.fillRect(sx, sy + ts - boardH, ts, boardH);
    // Top edge highlight
    g.fillStyle(WOOD_HIGHLIGHT, 0.8);
    g.fillRect(sx, sy + ts - boardH, ts, Math.max(1, Math.round(u)));
  }

  // WIP outline (blue) while in progress, clean border when done
  if (!done) {
    g.lineStyle(2, WIP_OUTLINE, 0.7);
    g.strokeRect(sx, sy, ts, ts);
  } else {
    g.lineStyle(1, darken(blockColor, 0.35), 0.6);
    g.strokeRect(sx + inset, blockTop, ts - inset * 2, blockH);
  }
}

function darken(color: number, amount: number): number {
  const r = Math.floor(((color >> 16) & 0xff) * (1 - amount));
  const gr = Math.floor(((color >> 8) & 0xff) * (1 - amount));
  const b = Math.floor((color & 0xff) * (1 - amount));
  return (r << 16) | (gr << 8) | b;
}
