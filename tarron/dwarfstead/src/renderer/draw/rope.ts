import Phaser from 'phaser';
import type { Game } from '../../sim/Game';
import { BlockMaterial } from '../../sim/types';

export interface RopeEndpoints {
  dwarfX: number;
  dwarfY: number;
  blockX: number;
  blockY: number;
}

/** Draw the tether rope between dwarf and block. */
export function drawRope(
  g: Phaser.GameObjects.Graphics,
  ts: number, camX: number, camY: number,
  endpoints: RopeEndpoints,
): void {
  const { dwarfX, dwarfY, blockX, blockY } = endpoints;
  const ropeColor = 0x5C3A1E;

  // Dwarf tile screen pos
  const dsx = (dwarfX - camX) * ts;
  const dsy = (dwarfY - camY) * ts;
  // Block tile screen pos
  const bsx = (blockX - camX) * ts;
  const bsy = (blockY - camY) * ts;

  // Relative direction from dwarf to block
  const relX = blockX - dwarfX;
  const relY = blockY - dwarfY;

  // Dwarf attachment: side middle (left or right edge, vertical center)
  const dwarfEdgeX = relX >= 0 ? dsx + ts : dsx;
  const dwarfEdgeY = dsy + ts / 2;

  // Block attachment: edge closest to dwarf
  let blockEdgeX: number;
  let blockEdgeY: number;
  if (relX === 0) {
    blockEdgeX = bsx + ts / 2;
    blockEdgeY = relY > 0 ? bsy : bsy + ts;
  } else if (relY === 0) {
    blockEdgeX = relX > 0 ? bsx : bsx + ts;
    blockEdgeY = bsy + ts / 2;
  } else {
    blockEdgeX = relX > 0 ? bsx : bsx + ts;
    blockEdgeY = relY > 0 ? bsy : bsy + ts;
  }

  // Draw rope line from dwarf edge to block edge
  g.lineStyle(2, ropeColor, 0.9);
  g.beginPath();
  g.moveTo(dwarfEdgeX, dwarfEdgeY);

  if (relX === 0) {
    const midX = bsx + ts / 2;
    g.lineTo(midX, dwarfEdgeY);
    g.lineTo(blockEdgeX, blockEdgeY);
  } else if (relY === 0) {
    g.lineTo(blockEdgeX, blockEdgeY);
  } else {
    blockEdgeX = bsx + ts / 2;
    blockEdgeY = relY > 0 ? bsy : bsy + ts;
    g.lineTo(blockEdgeX, blockEdgeY);
  }
  g.strokePath();

  // Draw lasso markings on the dwarf: horizontal line through center
  g.lineStyle(2, ropeColor, 0.8);
  g.beginPath();
  g.moveTo(dsx, dsy + ts / 2);
  g.lineTo(dsx + ts, dsy + ts / 2);
  g.strokePath();

  // Draw lasso markings on the block: cross (horizontal + vertical)
  g.beginPath();
  g.moveTo(bsx, bsy + ts / 2);
  g.lineTo(bsx + ts, bsy + ts / 2);
  g.strokePath();
  g.beginPath();
  g.moveTo(bsx + ts / 2, bsy);
  g.lineTo(bsx + ts / 2, bsy + ts);
  g.strokePath();
}

/** Draw a rappel rope entity (vertical line from anchor to bottom with knots). */
export function drawRopeEntity(
  game: Game,
  g: Phaser.GameObjects.Graphics,
  ts: number, camX: number, camY: number,
  anchorX: number, anchorY: number, length: number,
): void {
  const ropeColor = 0x5C3A1E;
  const cx = (anchorX - camX) * ts + ts / 2;
  const anchoredAtPlatform = game.hasPlatform({ x: anchorX, y: anchorY });
  const anchoredBelowLadder = !anchoredAtPlatform && game.hasLadder({ x: anchorX, y: anchorY - 1 });
  const anchoredBelowSupport = anchoredAtPlatform || anchoredBelowLadder;

  // topY: where the rope line starts visually
  const plankBottom = Math.max(2, Math.round(ts * 0.2));
  const barH = Math.max(2, Math.round(ts * 0.15));
  const bracketH = Math.max(2, Math.round(ts * 0.12));
  const topY = anchoredAtPlatform
    ? (anchorY - camY) * ts + plankBottom
    : anchoredBelowLadder
      ? (anchorY - camY) * ts + barH + bracketH
      : (anchorY - camY) * ts;
  // Rope bottom stops ~75% through the bottom tile
  const bottomY = (anchorY + length - camY) * ts + ts * 0.75;

  // Main vertical line (skip if top is at or below bottom — e.g. length 0 support rope)
  if (topY < bottomY) {
    g.lineStyle(Math.max(2, ts * 0.1), ropeColor, 0.9);
    g.beginPath();
    g.moveTo(cx, topY);
    g.lineTo(cx, bottomY);
    g.strokePath();
  }

  const bracketW = Math.max(4, ts * 0.2);
  const bx = cx - bracketW / 2;

  if (anchoredAtPlatform) {
    // Bracket just below the platform plank
    const by = (anchorY - camY) * ts + plankBottom;
    g.fillStyle(0x888888, 0.7);
    g.fillRect(bx, by, bracketW, bracketH);
  } else if (anchoredBelowLadder) {
    // Horizontal crossbar connecting ladder sides, with anchor bracket
    const tileX = (anchorX - camX) * ts;
    const tileY = (anchorY - camY) * ts;
    g.fillStyle(0x3d3530, 0.9);
    g.fillRect(tileX, tileY, ts, barH);
    g.fillStyle(0x888888, 0.7);
    g.fillRect(bx, tileY + barH, bracketW, bracketH);
  } else {
    // Gallows beam to nearest solid support
    const rawTopY = (anchorY - camY) * ts;
    const beamThick = Math.max(2, ts * 0.12);

    const isSolid = (x: number, y: number) =>
      game.getBlock({ x, y }) !== BlockMaterial.Air || game.hasClimbable({ x, y });
    let wallX: number | null = null;
    let wallRow = anchorY;
    // Prioritize nearest horizontal distance, checking multiple Y levels
    // to handle surface height variation (hills/valleys)
    for (let dist = 1; dist <= 5; dist++) {
      for (const row of [anchorY, anchorY + 1, anchorY - 1, anchorY + 2, anchorY - 2, anchorY + 3, anchorY - 3]) {
        if (row < 0 || row >= game.terrain.height) continue;
        const lx = anchorX - dist;
        if (lx >= 0 && isSolid(lx, row)) {
          wallX = lx; wallRow = row; break;
        }
        const rx = anchorX + dist;
        if (rx < game.terrain.width && isSolid(rx, row)) {
          wallX = rx; wallRow = row; break;
        }
      }
      if (wallX !== null) break;
    }

    if (wallX !== null) {
      const wallEdgeX = (wallX < anchorX)
        ? (wallX + 1 - camX) * ts
        : (wallX - camX) * ts;
      const wallTopY = (wallRow - camY) * ts;

      g.lineStyle(beamThick, ropeColor, 1);

      g.beginPath();
      g.moveTo(cx, rawTopY);
      g.lineTo(wallEdgeX, rawTopY);
      g.strokePath();

      if (wallTopY > rawTopY) {
        g.beginPath();
        g.moveTo(wallEdgeX, rawTopY);
        g.lineTo(wallEdgeX, wallTopY);
        g.strokePath();
      }
    } else {
      const hookW = ts * 0.3;
      g.lineStyle(beamThick, ropeColor, 1);
      g.beginPath();
      g.moveTo(cx - hookW, rawTopY);
      g.lineTo(cx + hookW, rawTopY);
      g.strokePath();
    }

    g.fillStyle(0x888888, 0.7);
    g.fillRect(bx, rawTopY, bracketW, bracketH);
  }

  // Knots every tile along the rope (start from first full tile below visible top)
  const knotStart = anchoredBelowSupport ? 2 : 1;
  const knotR = Math.max(1, ts * 0.08);
  g.fillStyle(ropeColor, 0.9);
  for (let i = knotStart; i <= length; i++) {
    const ky = (anchorY + i - camY) * ts + ts * 0.5;
    g.fillCircle(cx, ky, knotR);
  }
}
