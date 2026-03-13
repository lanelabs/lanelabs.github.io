import Phaser from 'phaser';
import type { Game } from '../../sim/Game';
import { BlockMaterial } from '../../sim/types';
import { BLOCK_INFO } from '../../sim/terrain/BlockTypes';

const AIR_COLOR = parseInt(BLOCK_INFO[BlockMaterial.Air].color.slice(1), 16);

function blockColor(game: Game, wx: number, wy: number): number {
  const t = game.terrain;
  if (wx < 0 || wx >= t.width || wy < 0 || wy >= t.height) return 0x2c2c2c;
  if (game.isFlooded({ x: wx, y: wy })) return 0x2244aa;
  return parseInt(BLOCK_INFO[t.blocks[wy][wx]].color.slice(1), 16);
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

      const color = blockColor(game, wx, wy);
      g.fillStyle(color, 1);
      g.fillRect(vx * ts, vy * ts, ts, ts);

      const inBounds = wx >= 0 && wx < terrain.width && wy >= 0 && wy < terrain.height;
      if (!inBounds) continue;

      const solid = terrain.blocks[wy][wx] !== BlockMaterial.Air;
      const px = vx * ts;
      const py = vy * ts;

      if (solid) {
        // Chip top-left: air above AND air to the left
        if (!isSolid(game, wx, wy - 1) && !isSolid(game, wx - 1, wy)) {
          fillTriangle(g, AIR_COLOR, px, py, px + chip, py, px, py + chip);
        }
        // Chip top-right: air above AND air to the right
        if (!isSolid(game, wx, wy - 1) && !isSolid(game, wx + 1, wy)) {
          fillTriangle(g, AIR_COLOR, px + ts, py, px + ts - chip, py, px + ts, py + chip);
        }
        // Chip bottom-left: air below AND air to the left
        if (!isSolid(game, wx, wy + 1) && !isSolid(game, wx - 1, wy)) {
          fillTriangle(g, AIR_COLOR, px, py + ts, px + chip, py + ts, px, py + ts - chip);
        }
        // Chip bottom-right: air below AND air to the right
        if (!isSolid(game, wx, wy + 1) && !isSolid(game, wx + 1, wy)) {
          fillTriangle(g, AIR_COLOR, px + ts, py + ts, px + ts - chip, py + ts, px + ts, py + ts - chip);
        }
      } else {
        // Debris top-left: solid to the left AND solid above
        if (isSolid(game, wx - 1, wy) && isSolid(game, wx, wy - 1)) {
          const leftColor = blockColor(game, wx - 1, wy);
          fillTriangle(g, leftColor, px, py, px + chip, py, px, py + chip);
        }
        // Debris top-right: solid to the right AND solid above
        if (isSolid(game, wx + 1, wy) && isSolid(game, wx, wy - 1)) {
          const rightColor = blockColor(game, wx + 1, wy);
          fillTriangle(g, rightColor, px + ts, py, px + ts - chip, py, px + ts, py + chip);
        }
        // Debris bottom-left: solid to the left AND solid below
        if (isSolid(game, wx - 1, wy) && isSolid(game, wx, wy + 1)) {
          const leftColor = blockColor(game, wx - 1, wy);
          fillTriangle(g, leftColor, px, py + ts, px + chip, py + ts, px, py + ts - chip);
        }
        // Debris bottom-right: solid to the right AND solid below
        if (isSolid(game, wx + 1, wy) && isSolid(game, wx, wy + 1)) {
          const rightColor = blockColor(game, wx + 1, wy);
          fillTriangle(g, rightColor, px + ts, py + ts, px + ts - chip, py + ts, px + ts, py + ts - chip);
        }
      }
    }
  }
}
