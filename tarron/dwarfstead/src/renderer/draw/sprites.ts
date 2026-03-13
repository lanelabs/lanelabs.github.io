import Phaser from 'phaser';
import { Direction } from '../../sim/types';

/** Draw a dashed line between two points. */
function dashedLine(
  g: Phaser.GameObjects.Graphics,
  x0: number, y0: number, x1: number, y1: number,
  dash: number, gap: number,
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;
  const ux = dx / dist;
  const uy = dy / dist;
  const step = dash + gap;
  for (let t = 0; t < dist; t += step) {
    const end = Math.min(t + dash, dist);
    g.beginPath();
    g.moveTo(x0 + ux * t, y0 + uy * t);
    g.lineTo(x0 + ux * end, y0 + uy * end);
    g.strokePath();
  }
}

/** Draw a dashed rectangle outline. */
export function drawDashedRect(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  dash: number, gap: number,
): void {
  dashedLine(g, x, y, x + w, y, dash, gap);
  dashedLine(g, x + w, y, x + w, y + h, dash, gap);
  dashedLine(g, x + w, y + h, x, y + h, dash, gap);
  dashedLine(g, x, y + h, x, y, dash, gap);
}

/** Draw a dashed outline that follows chipped corners (octagon). */
export function drawDashedChippedRect(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, s: number, chip: number,
  dash: number, gap: number,
): void {
  // 8 vertices clockwise from top-left chip
  const pts: [number, number][] = [
    [x + chip, y],             // top edge start
    [x + s - chip, y],         // top edge end
    [x + s, y + chip],         // right edge start
    [x + s, y + s - chip],     // right edge end
    [x + s - chip, y + s],     // bottom edge end
    [x + chip, y + s],         // bottom edge start
    [x, y + s - chip],         // left edge end
    [x, y + chip],             // left edge start
  ];
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % pts.length];
    dashedLine(g, ax, ay, bx, by, dash, gap);
  }
}

/** Draw a ladder filling the full tile. */
export function drawLadder(
  g: Phaser.GameObjects.Graphics,
  sx: number, sy: number, ts: number, alpha = 0.9,
  color = 0x3d3530,
): void {
  g.fillStyle(color, alpha);
  const rail = Math.max(2, Math.round(ts * 0.15));
  g.fillRect(sx, sy, rail, ts);
  g.fillRect(sx + ts - rail, sy, rail, ts);
  g.fillRect(sx, sy, ts, rail);                          // Top rung (tiles seamlessly with ladder above)
  g.fillRect(sx, sy + Math.round(ts / 3), ts, rail);     // Middle rung
  g.fillRect(sx, sy + Math.round(ts * 2 / 3), ts, rail); // Bottom rung
}

/** Draw a platform (horizontal plank) filling the full tile. */
export function drawPlatform(
  g: Phaser.GameObjects.Graphics,
  sx: number, sy: number, ts: number, alpha = 0.9,
  color = 0x3d3530,
): void {
  g.fillStyle(color, alpha);
  const plank = Math.max(2, Math.round(ts * 0.2));
  // Top plank (walkable surface) — simple line, no support struts
  g.fillRect(sx, sy, ts, plank);
}

/** Draw a 5x7 pixel-art "?" glyph in gold. */
export function drawQuestionMark(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, unit: number,
): void {
  g.fillStyle(0xe8c170, 1);
  // Row 0:  _##_
  g.fillRect(x + 1 * unit, y, 3 * unit, unit);
  // Row 1: #  #
  g.fillRect(x, y + unit, unit, unit);
  g.fillRect(x + 4 * unit, y + unit, unit, unit);
  // Row 2:    #
  g.fillRect(x + 3 * unit, y + 2 * unit, unit, unit);
  // Row 3:  ##
  g.fillRect(x + 1 * unit, y + 3 * unit, 2 * unit, unit);
  // Row 4:  #
  g.fillRect(x + 2 * unit, y + 4 * unit, unit, unit);
  // Row 5: (gap)
  // Row 6:  #  (dot)
  g.fillRect(x + 2 * unit, y + 6 * unit, unit, unit);
}

/** Draw a 5x7 pixel-art "!" glyph in red. */
export function drawExclamationMark(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, unit: number,
): void {
  g.fillStyle(0xff4444, 1);
  // Rows 0-3: vertical bar
  g.fillRect(x + 2 * unit, y, unit, 4 * unit);
  // Row 4: (gap)
  // Row 5: dot
  g.fillRect(x + 2 * unit, y + 5 * unit, unit, unit);
}

/** Draw a 16×16 pixel-art dwarf scaled to tile size. */
export function drawDwarfSprite(
  g: Phaser.GameObjects.Graphics,
  sx: number, sy: number, ts: number,
  isMain: boolean, facing: Direction = Direction.Right,
  crouching = false,
): void {
  const u = ts / 16; // each pixel = ts/16 screen units

  // Crouch: squash vertically and shift down so feet stay on ground
  const yOff = crouching ? 5 : 0;
  const px = (col: number, row: number, w: number, h: number) => {
    if (crouching) {
      // Compress rows into bottom 11 rows (5-15), skip gaps to squash
      const cr = Math.round(row * 11 / 16) + yOff;
      const ch = Math.max(1, Math.round(h * 11 / 16));
      g.fillRect(sx + col * u, sy + cr * u, w * u, ch * u);
    } else {
      g.fillRect(sx + col * u, sy + row * u, w * u, h * u);
    }
  };

  // Colors
  const helmet = isMain ? 0xc9a840 : 0x707888;
  const helmetDark = isMain ? 0xa88630 : 0x586068;
  const skin = 0xdebb8e;
  const skinShadow = 0xc4a478;
  const eyeWhite = 0xeeeeee;
  const eyePupil = 0x222222;
  const beard = isMain ? 0x8B4513 : 0x666666;
  const beardDark = isMain ? 0x6e3610 : 0x555555;
  const tunic = isMain ? 0x8B6914 : 0x556070;
  const tunicDark = isMain ? 0x6e5310 : 0x445060;
  const belt = 0x333333;
  const buckle = 0xccaa44;
  const boots = 0x3a2a1a;
  const bootsDark = 0x2a1a10;

  // Pupil position within 2x2 eye whites (left eye cols 5-6, right eye cols 9-10, rows 4-5)
  const leftPupilCol = facing === Direction.Left ? 5 : 6;
  const rightPupilCol = facing === Direction.Left ? 9 : 10;
  const pupilRow = facing === Direction.Up ? 4 : 5;

  // -- Helmet (rows 0-3) --
  g.fillStyle(helmet, 1);
  px(5, 0, 6, 1);
  px(4, 1, 8, 1);
  px(3, 2, 10, 1);
  px(3, 3, 10, 1);
  g.fillStyle(helmetDark, 1);
  px(4, 1, 1, 1);
  px(11, 1, 1, 1);
  px(3, 3, 1, 1);
  px(12, 3, 1, 1);

  // -- Face (rows 4-6) --
  g.fillStyle(skin, 1);
  px(4, 4, 8, 3);
  g.fillStyle(skinShadow, 1);
  px(4, 5, 1, 2);
  px(11, 5, 1, 2);

  // -- Eyes (row 4-5) with facing-aware pupils --
  g.fillStyle(eyeWhite, 1);
  px(5, 4, 2, 2);
  px(9, 4, 2, 2);
  g.fillStyle(eyePupil, 1);
  px(leftPupilCol, pupilRow, 1, 1);
  px(rightPupilCol, pupilRow, 1, 1);

  // -- Nose (row 5-6 center), shift slightly with horizontal facing --
  g.fillStyle(skinShadow, 1);
  const noseX = facing === Direction.Right ? 8 : 7;
  px(noseX, 5, 2, 1);
  px(noseX, 6, 2, 1);

  // -- Beard (rows 7-10, tapers) --
  g.fillStyle(beard, 1);
  px(3, 7, 10, 1);
  px(4, 8, 8, 1);
  px(5, 9, 6, 1);
  px(6, 10, 4, 1);
  g.fillStyle(beardDark, 1);
  px(5, 7, 1, 1);
  px(9, 7, 1, 1);
  px(6, 8, 1, 1);
  px(8, 9, 1, 1);

  // -- Body / tunic (rows 7-11, behind beard) --
  g.fillStyle(tunic, 1);
  px(3, 7, 2, 4);
  px(11, 7, 2, 4);
  px(5, 8, 1, 3);
  px(10, 8, 1, 3);
  px(5, 11, 6, 1);
  g.fillStyle(tunicDark, 1);
  px(3, 10, 1, 1);
  px(12, 10, 1, 1);

  // -- Belt (row 12) --
  g.fillStyle(belt, 1);
  px(4, 12, 8, 1);
  g.fillStyle(buckle, 1);
  px(7, 12, 2, 1);

  // -- Legs / boots (rows 13-15), toe direction matches facing --
  const toeLeft = facing === Direction.Left;
  const bootOff = toeLeft ? -1 : 0;
  g.fillStyle(tunic, 1);
  px(5, 13, 2, 1);
  px(9, 13, 2, 1);
  g.fillStyle(boots, 1);
  px(4, 14, 3, 1);
  px(9, 14, 3, 1);
  px(4 + bootOff, 15, 4, 1);
  px(9 + bootOff, 15, 4, 1);
  g.fillStyle(bootsDark, 1);
  px(toeLeft ? 3 : 7, 15, 1, 1);
  px(toeLeft ? 8 : 12, 15, 1, 1);
}
