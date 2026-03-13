import Phaser from 'phaser';
import type { Game } from '../../sim/Game';

export const SKY_COLOR = 0x7a9ab0;
export const CAVE_COLOR = 0x252535;

/** Number of strips used to fade between sky and cave at the transition. */
const FADE_STRIPS = 12;

function getSurfY(t: { surfaceHeights?: number[]; surfaceY: number; width: number }, wx: number): number {
  if (wx < 0 || wx >= t.width) return t.surfaceY;
  return t.surfaceHeights?.[wx] ?? t.surfaceY;
}

export function drawBackground(
  g: Phaser.GameObjects.Graphics, game: Game,
  ts: number, tilesX: number, tilesY: number,
  camX: number, camY: number,
): void {
  g.clear();
  const viewH = tilesY * ts;
  // Fill entire viewport with cave color
  g.fillStyle(CAVE_COLOR, 1);
  g.fillRect(0, 0, tilesX * ts, viewH);

  const t = game.terrain;
  const chip = Math.ceil(ts * 0.2);

  for (let vx = 0; vx < tilesX; vx++) {
    const wx = camX + vx;
    const px = vx * ts;

    // Left edge uses this column's surfY, right edge uses next column's
    const surfL = getSurfY(t, wx);
    const surfR = getSurfY(t, wx + 1);
    const blockTopL = (surfL - camY) * ts;
    const blockTopR = (surfR - camY) * ts;
    const fadeTopL = blockTopL + chip;
    const fadeTopR = blockTopR + chip;
    const fadeBotL = blockTopL + ts - chip;
    const fadeBotR = blockTopR + ts - chip;

    // Skip if entirely below viewport
    if (Math.min(fadeTopL, fadeTopR) >= viewH) continue;

    // Solid sky polygon above the fade
    g.fillStyle(SKY_COLOR, 1);
    g.beginPath();
    g.moveTo(px, 0);
    g.lineTo(px + ts, 0);
    g.lineTo(px + ts, fadeTopR);
    g.lineTo(px, fadeTopL);
    g.closePath();
    g.fillPath();

    // Diagonal fade strips from sky to cave
    const fadeLenL = fadeBotL - fadeTopL;
    const fadeLenR = fadeBotR - fadeTopR;
    for (let i = 0; i < FADE_STRIPS; i++) {
      const t0 = i / FADE_STRIPS;
      const t1 = (i + 1) / FADE_STRIPS;
      const topL = fadeTopL + t0 * fadeLenL;
      const botL = fadeTopL + t1 * fadeLenL;
      const topR = fadeTopR + t0 * fadeLenR;
      const botR = fadeTopR + t1 * fadeLenR;
      if (Math.min(topL, topR) >= viewH) break;
      if (Math.max(botL, botR) <= 0) continue;
      const alpha = 1 - (i + 0.5) / FADE_STRIPS;
      g.fillStyle(SKY_COLOR, alpha);
      g.beginPath();
      g.moveTo(px, topL);
      g.lineTo(px + ts, topR);
      g.lineTo(px + ts, botR);
      g.lineTo(px, botL);
      g.closePath();
      g.fillPath();
    }
  }
}
