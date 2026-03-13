import Phaser from 'phaser';
import type { Game } from '../../sim/Game';
import { BlockMaterial } from '../../sim/types';
import { BLOCK_INFO } from '../../sim/terrain/BlockTypes';

/** Returns a fill color when the air at (wx,wy) contains a visible substance, or null for plain air. */
function chipFillColor(game: Game, wx: number, wy: number): number | null {
  if (game.isFlooded({ x: wx, y: wy })) return 0x2244aa;
  if (game.hasClimbable({ x: wx, y: wy })) return 0x3d3530;
  return null;
}

function blockColor(game: Game, wx: number, wy: number): number {
  const t = game.terrain;
  if (wx < 0 || wx >= t.width || wy < 0 || wy >= t.height) return 0x2c2c2c;
  const mat = t.blocks[wy][wx];
  return parseInt(BLOCK_INFO[mat].color.slice(1), 16);
}

function isSolid(game: Game, wx: number, wy: number): boolean {
  const t = game.terrain;
  if (wx < 0 || wx >= t.width || wy < 0 || wy >= t.height) return true;
  return t.blocks[wy][wx] !== BlockMaterial.Air;
}

function fillTriangle(
  g: Phaser.GameObjects.Graphics, color: number,
  x0: number, y0: number, x1: number, y1: number, x2: number, y2: number,
): void {
  g.fillStyle(color, 1);
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(x1, y1);
  g.lineTo(x2, y2);
  g.closePath();
  g.fillPath();
}

export function drawTerrain(
  g: Phaser.GameObjects.Graphics, game: Game,
  ts: number, tilesX: number, tilesY: number,
  camX: number, camY: number,
): void {
  g.clear();
  const terrain = game.terrain;
  const chip = Math.ceil(ts * 0.2);

  for (let vy = 0; vy < tilesY; vy++) {
    for (let vx = 0; vx < tilesX; vx++) {
      const wx = camX + vx;
      const wy = camY + vy;

      const inBounds = wx >= 0 && wx < terrain.width && wy >= 0 && wy < terrain.height;
      if (!inBounds) {
        // Out-of-bounds: draw dark fill
        g.fillStyle(0x2c2c2c, 1);
        g.fillRect(vx * ts, vy * ts, ts, ts);
        continue;
      }

      const solid = terrain.blocks[wy][wx] !== BlockMaterial.Air;
      const px = vx * ts;
      const py = vy * ts;

      if (!solid) {
        // Substance fills for air tiles (water, etc.)
        if (game.isFlooded({ x: wx, y: wy })) {
          g.fillStyle(0x2244aa, 0.8);
          g.fillRect(px, py, ts, ts);
        }
        // Debris chips on air tiles (adjacent solid bleeds in)
        if (isSolid(game, wx - 1, wy) && isSolid(game, wx, wy - 1)) {
          fillTriangle(g, blockColor(game, wx - 1, wy), px, py, px + chip, py, px, py + chip);
        }
        if (isSolid(game, wx + 1, wy) && isSolid(game, wx, wy - 1)) {
          fillTriangle(g, blockColor(game, wx + 1, wy), px + ts, py, px + ts - chip, py, px + ts, py + chip);
        }
        if (isSolid(game, wx - 1, wy) && isSolid(game, wx, wy + 1)) {
          fillTriangle(g, blockColor(game, wx - 1, wy), px, py + ts, px + chip, py + ts, px, py + ts - chip);
        }
        if (isSolid(game, wx + 1, wy) && isSolid(game, wx, wy + 1)) {
          fillTriangle(g, blockColor(game, wx + 1, wy), px + ts, py + ts, px + ts - chip, py + ts, px + ts, py + ts - chip);
        }
      } else {
        // Solid block — determine which corners are chipped
        const chipTL = !isSolid(game, wx, wy - 1) && !isSolid(game, wx - 1, wy);
        const chipTR = !isSolid(game, wx, wy - 1) && !isSolid(game, wx + 1, wy);
        const chipBL = !isSolid(game, wx, wy + 1) && !isSolid(game, wx - 1, wy);
        const chipBR = !isSolid(game, wx, wy + 1) && !isSolid(game, wx + 1, wy);

        // Draw solid block as polygon with chipped corners cut out
        const color = parseInt(BLOCK_INFO[terrain.blocks[wy][wx]].color.slice(1), 16);
        g.fillStyle(color, 1);
        g.beginPath();
        // Top edge (left to right)
        if (chipTL) { g.moveTo(px, py + chip); g.lineTo(px + chip, py); }
        else { g.moveTo(px, py); }
        if (chipTR) { g.lineTo(px + ts - chip, py); g.lineTo(px + ts, py + chip); }
        else { g.lineTo(px + ts, py); }
        // Right edge down to bottom
        if (chipBR) { g.lineTo(px + ts, py + ts - chip); g.lineTo(px + ts - chip, py + ts); }
        else { g.lineTo(px + ts, py + ts); }
        // Bottom edge (right to left)
        if (chipBL) { g.lineTo(px + chip, py + ts); g.lineTo(px, py + ts - chip); }
        else { g.lineTo(px, py + ts); }
        g.closePath();
        g.fillPath();

        // Conditional chip fills — only when neighbor air contains a substance
        if (chipTL) {
          const fill = chipFillColor(game, wx - 1, wy) ?? chipFillColor(game, wx, wy - 1);
          if (fill !== null) fillTriangle(g, fill, px, py, px + chip, py, px, py + chip);
        }
        if (chipTR) {
          const fill = chipFillColor(game, wx + 1, wy) ?? chipFillColor(game, wx, wy - 1);
          if (fill !== null) fillTriangle(g, fill, px + ts, py, px + ts - chip, py, px + ts, py + chip);
        }
        if (chipBL) {
          const fill = chipFillColor(game, wx - 1, wy) ?? chipFillColor(game, wx, wy + 1);
          if (fill !== null) fillTriangle(g, fill, px, py + ts, px + chip, py + ts, px, py + ts - chip);
        }
        if (chipBR) {
          const fill = chipFillColor(game, wx + 1, wy) ?? chipFillColor(game, wx, wy + 1);
          if (fill !== null) fillTriangle(g, fill, px + ts, py + ts, px + ts - chip, py + ts, px + ts, py + ts - chip);
        }
      }
    }
  }
}
