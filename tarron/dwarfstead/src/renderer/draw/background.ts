import Phaser from 'phaser';
import type { Game } from '../../sim/Game';

export const SKY_COLOR = 0x7a9ab0;
export const CAVE_COLOR = 0x252535;

/** Number of strips used to fade between sky and cave at the transition. */
const FADE_STRIPS = 12;

/** Set to true to draw debug overlay lines for gradient vs surface positions. */
const DEBUG_BG = true;

export type GradientDir =
  | 'top-bottom' | 'bottom-top' | 'left-right' | 'right-left'
  | 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom'
  | 'inv-left-bottom' | 'inv-right-bottom';

interface Pt { x: number; y: number }

function lerp2(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function clampPt(p: Pt, px: number, py: number, ts: number): Pt {
  return {
    x: Math.max(px, Math.min(p.x, px + ts)),
    y: Math.max(py, Math.min(p.y, py + ts)),
  };
}

type TerrainInfo = { surfaceHeights?: number[]; surfaceY: number; width: number };

function getSurfY(t: TerrainInfo, wx: number): number {
  if (!t.surfaceHeights || t.surfaceHeights.length === 0) return t.surfaceY;
  const clamped = Math.max(0, Math.min(wx, t.width - 1));
  return t.surfaceHeights[clamped] ?? t.surfaceY;
}


/**
 * Map sky/cave edge positions to (x,y) points on the two sweep edges.
 * Returns [skyA, skyB, caveA, caveB] and an array of corner points for the
 * sky polygon (between skyA and skyB going through tile corners).
 */
function gradientGeometry(
  px: number, py: number, ts: number, dir: GradientDir,
  skyPos0: number, skyPos1: number,
  cavePos0: number, cavePos1: number,
): { skyA: Pt; skyB: Pt; caveA: Pt; caveB: Pt; corners: Pt[] } {
  const r = px + ts, b = py + ts;
  switch (dir) {
    case 'top-bottom':
      return { skyA: { x: px, y: skyPos0 }, skyB: { x: r, y: skyPos1 },
        caveA: { x: px, y: cavePos0 }, caveB: { x: r, y: cavePos1 },
        corners: [{ x: px, y: py }, { x: r, y: py }] };
    case 'bottom-top':
      return { skyA: { x: px, y: skyPos0 }, skyB: { x: r, y: skyPos1 },
        caveA: { x: px, y: cavePos0 }, caveB: { x: r, y: cavePos1 },
        corners: [{ x: px, y: b }, { x: r, y: b }] };
    case 'left-right':
      return { skyA: { x: skyPos0, y: py }, skyB: { x: skyPos1, y: b },
        caveA: { x: cavePos0, y: py }, caveB: { x: cavePos1, y: b },
        corners: [{ x: px, y: py }, { x: px, y: b }] };
    case 'right-left':
      return { skyA: { x: skyPos0, y: py }, skyB: { x: skyPos1, y: b },
        caveA: { x: cavePos0, y: py }, caveB: { x: cavePos1, y: b },
        corners: [{ x: r, y: py }, { x: r, y: b }] };
    case 'left-top':
      return { skyA: { x: px, y: skyPos0 }, skyB: { x: skyPos1, y: py },
        caveA: { x: px, y: cavePos0 }, caveB: { x: cavePos1, y: py },
        corners: [{ x: px, y: py }] };
    case 'left-bottom':
      return { skyA: { x: px, y: skyPos0 }, skyB: { x: skyPos1, y: b },
        caveA: { x: px, y: cavePos0 }, caveB: { x: cavePos1, y: b },
        corners: [{ x: px, y: b }] };
    case 'right-top':
      return { skyA: { x: r, y: skyPos0 }, skyB: { x: skyPos1, y: py },
        caveA: { x: r, y: cavePos0 }, caveB: { x: cavePos1, y: py },
        corners: [{ x: r, y: py }] };
    case 'right-bottom':
      return { skyA: { x: r, y: skyPos0 }, skyB: { x: skyPos1, y: b },
        caveA: { x: r, y: cavePos0 }, caveB: { x: cavePos1, y: b },
        corners: [{ x: r, y: b }] };
    case 'inv-left-bottom':
      return { skyA: { x: px, y: skyPos0 }, skyB: { x: skyPos1, y: b },
        caveA: { x: px, y: cavePos0 }, caveB: { x: cavePos1, y: b },
        corners: [{ x: px, y: py }, { x: r, y: py }, { x: r, y: b }] };
    case 'inv-right-bottom':
      return { skyA: { x: r, y: skyPos0 }, skyB: { x: skyPos1, y: b },
        caveA: { x: r, y: cavePos0 }, caveB: { x: cavePos1, y: b },
        corners: [{ x: r, y: py }, { x: px, y: py }, { x: px, y: b }] };
  }
}

/** Draw sky polygon and fade strips within a single tile's pixel bounds. */
export function drawTileGradient(
  g: Phaser.GameObjects.Graphics,
  px: number, py: number, ts: number,
  dir: GradientDir,
  skyPos0: number, skyPos1: number,
  cavePos0: number, cavePos1: number,
): void {
  const geo = gradientGeometry(px, py, ts, dir, skyPos0, skyPos1, cavePos0, cavePos1);
  const sA = clampPt(geo.skyA, px, py, ts);
  const sB = clampPt(geo.skyB, px, py, ts);

  // Sky polygon: skyA → corners → skyB → close
  g.fillStyle(SKY_COLOR, 1);
  g.beginPath();
  g.moveTo(sA.x, sA.y);
  for (const c of geo.corners) g.lineTo(c.x, c.y);
  g.lineTo(sB.x, sB.y);
  g.closePath();
  g.fillPath();

  // Fade strips between sky edge and cave edge
  for (let i = 0; i < FADE_STRIPS; i++) {
    const t0 = i / FADE_STRIPS;
    const t1 = (i + 1) / FADE_STRIPS;
    const topA = clampPt(lerp2(geo.skyA, geo.caveA, t0), px, py, ts);
    const topB = clampPt(lerp2(geo.skyB, geo.caveB, t0), px, py, ts);
    const botA = clampPt(lerp2(geo.skyA, geo.caveA, t1), px, py, ts);
    const botB = clampPt(lerp2(geo.skyB, geo.caveB, t1), px, py, ts);

    // Skip degenerate strips
    if (topA.x === botA.x && topA.y === botA.y &&
        topB.x === botB.x && topB.y === botB.y) continue;

    const alpha = 1 - (i + 0.5) / FADE_STRIPS;
    g.fillStyle(SKY_COLOR, alpha);
    g.beginPath();
    g.moveTo(topA.x, topA.y);
    g.lineTo(topB.x, topB.y);
    g.lineTo(botB.x, botB.y);
    g.lineTo(botA.x, botA.y);
    g.closePath();
    g.fillPath();
  }
}

export function drawBackground(
  g: Phaser.GameObjects.Graphics, game: Game,
  ts: number, tilesX: number, tilesY: number,
  camX: number, camY: number,
): void {
  g.clear();
  // Base fill: cave color over entire viewport
  g.fillStyle(CAVE_COLOR, 1);
  g.fillRect(0, 0, tilesX * ts, tilesY * ts);

  const t = game.terrain;

  // Fill solid sky above each column's surface height.
  // The overlay chain (drawDebugOverlay) handles the transition tiles.
  g.fillStyle(SKY_COLOR, 1);
  for (let vx = 0; vx < tilesX; vx++) {
    const wx = camX + vx;
    const surfY = getSurfY(t, wx);
    const skyBottomPx = (surfY - camY) * ts;
    if (skyBottomPx > 0) {
      g.fillRect(vx * ts, 0, ts, skyBottomPx);
    }
  }
}

export { DEBUG_BG };

/** Inline variant specs (avoids circular import with gradientTiles). */
interface ChainVar { dir: GradientDir; sf0: number; sf1: number; cf0: number; cf1: number }
const BAND: ChainVar       = { dir: 'top-bottom',       sf0: 0.2, sf1: 0.2, cf0: 0.8, cf1: 0.8 };
const CB_R: ChainVar       = { dir: 'inv-right-bottom', sf0: 0.2, sf1: 0.2, cf0: 0.8, cf1: 0.8 };
const CB_L: ChainVar       = { dir: 'inv-left-bottom',  sf0: 0.2, sf1: 0.8, cf0: 0.8, cf1: 0.2 };
const CT_R: ChainVar       = { dir: 'right-top',        sf0: 0.2, sf1: 0.8, cf0: 0.8, cf1: 0.2 };
const CT_L: ChainVar       = { dir: 'left-top',         sf0: 0.2, sf1: 0.2, cf0: 0.8, cf1: 0.8 };
const CLIFF_R: ChainVar    = { dir: 'right-left',       sf0: 0.8, sf1: 0.8, cf0: 0.2, cf1: 0.2 };
const CLIFF_L: ChainVar    = { dir: 'left-right',       sf0: 0.2, sf1: 0.2, cf0: 0.8, cf1: 0.8 };

function chainPos(v: ChainVar, px: number, py: number, ts: number) {
  let b0: number, b1: number;
  switch (v.dir) {
    case 'left-right': case 'right-left': b0 = px; b1 = px; break;
    case 'top-bottom': case 'bottom-top': b0 = py; b1 = py; break;
    default: b0 = py; b1 = px; break;
  }
  return { s0: b0 + v.sf0 * ts, s1: b1 + v.sf1 * ts, c0: b0 + v.cf0 * ts, c1: b1 + v.cf1 * ts };
}

/** Surface-chain overlay using gradient tiles. */
export function drawDebugOverlay(
  g: Phaser.GameObjects.Graphics,
  t: TerrainInfo,
  ts: number, tilesX: number,
  camX: number, camY: number,
): void {
  // NOTE: no g.clear() here — this draws on top of the existing background fill.

  // Build set of all chain tile positions (only within terrain bounds)
  const chain = new Set<string>();
  const k = (vx: number, y: number) => `${vx},${y}`;
  for (let vx = 0; vx < tilesX; vx++) {
    const wx = camX + vx;
    if (wx < 0 || wx >= t.width) continue;
    const surfY = getSurfY(t, wx);
    const nextSurfY = getSurfY(t, wx + 1);
    chain.add(k(vx, surfY));
    if (surfY < nextSurfY) {
      for (let y = surfY + 1; y <= nextSurfY; y++) chain.add(k(vx, y));
    } else if (nextSurfY < surfY) {
      if (vx + 1 < tilesX && wx + 1 < t.width) {
        for (let y = nextSurfY + 1; y <= surfY; y++) chain.add(k(vx + 1, y));
      }
    }
  }

  // Draw each chain tile with the appropriate gradient variant
  for (const pos of chain) {
    const [vx, wy] = pos.split(',').map(Number);
    const above = chain.has(k(vx, wy - 1));
    const below = chain.has(k(vx, wy + 1));
    const wx = camX + vx;

    let v: ChainVar;
    if (!above && !below) {
      v = BAND;
    } else if (!above) {
      const skyRight = wy < getSurfY(t, wx + 1);
      v = skyRight ? CB_L : CB_R;
    } else if (!below) {
      const skyRight = wy <= getSurfY(t, wx + 1);
      v = skyRight ? CT_R : CT_L;
    } else {
      const skyRight = wy <= getSurfY(t, wx + 1);
      v = skyRight ? CLIFF_R : CLIFF_L;
    }

    const px = vx * ts;
    const py = (wy - camY) * ts;
    g.fillStyle(CAVE_COLOR, 1);
    g.fillRect(px, py, ts, ts);
    const p = chainPos(v, px, py, ts);
    drawTileGradient(g, px, py, ts, v.dir, p.s0, p.s1, p.c0, p.c1);
  }
}
