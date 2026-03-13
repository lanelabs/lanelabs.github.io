import Phaser from 'phaser';
import type { Game } from '../../sim/Game';
import { Direction, DirectionVec } from '../../sim/types';
import { PositionComponent } from '../../sim/components/Position';
import { DwarfComponent } from '../../sim/components/Dwarf';
import { drawDashedRect, drawLadder, drawPlatform } from './sprites';
import { drawRope } from './rope';
import { CompanionTaskComponent } from '../../sim/components/CompanionTask';
import { resolveAction, SmartMode } from '../smartMode';

export interface CursorState {
  hasActed: boolean;
  selfSelect: boolean;
  currentMode: SmartMode;
  pendingHeave?: {
    verticalDir: Direction.Up | Direction.Down;
    blockX: number; blockY: number;
    leftAvailable: boolean; rightAvailable: boolean;
  } | null;
  pendingHoist?: {
    leftAvailable: boolean; rightAvailable: boolean;
  } | null;
}

export function drawCursor(
  g: Phaser.GameObjects.Graphics,
  game: Game,
  ts: number,
  camX: number,
  camY: number,
  state: CursorState,
): void {
  g.clear();

  if (!state.hasActed) return;

  // --- Pending heave: draw orange highlight on block + directional arrows ---
  if (state.pendingHeave) {
    const ph = state.pendingHeave;
    const sx = (ph.blockX - camX) * ts;
    const sy = (ph.blockY - camY) * ts;

    // Orange highlight on the block
    g.fillStyle(0xff8800, 0.25);
    g.fillRect(sx, sy, ts, ts);
    g.lineStyle(2, 0xff8800, 0.9);
    g.strokeRect(sx, sy, ts, ts);

    // Draw arrows to available sides
    if (ph.leftAvailable) drawArrow(g, sx, sy, ts, Direction.Left);
    if (ph.rightAvailable) drawArrow(g, sx, sy, ts, Direction.Right);
    return;
  }

  // --- Pending hoist: draw orange highlight on dwarf tile + inward arrows ---
  if (state.pendingHoist) {
    const dwarf = game.getMainDwarf();
    if (!dwarf) return;
    const pos = dwarf.get<PositionComponent>('position')!;
    const sx = (pos.x - camX) * ts;
    const sy = (pos.y - camY) * ts;

    g.fillStyle(0xff8800, 0.25);
    g.fillRect(sx, sy, ts, ts);
    g.lineStyle(2, 0xff8800, 0.9);
    g.strokeRect(sx, sy, ts, ts);

    // Inward arrows: point TOWARD the dwarf from each side
    if (state.pendingHoist.leftAvailable) drawInwardArrow(g, sx, sy, ts, Direction.Left);
    if (state.pendingHoist.rightAvailable) drawInwardArrow(g, sx, sy, ts, Direction.Right);
    return;
  }

  const resolved = resolveAction(game, state.currentMode, state.selfSelect);
  if (resolved.cursorColor === null) return;

  const dwarf = game.getMainDwarf();
  if (!dwarf) return;

  const pos = dwarf.get<PositionComponent>('position')!;
  const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;
  const fd = DirectionVec[dwarfComp.facingDirection];
  let cursorX: number;
  let cursorY: number;
  // Demolish always highlights the block in front; other modes use self tile when Ctrl held
  if (state.currentMode === SmartMode.Demolish) {
    cursorX = pos.x + fd.x;
    cursorY = pos.y + fd.y;
  } else if (state.selfSelect) {
    cursorX = pos.x;
    cursorY = pos.y;
  } else {
    cursorX = pos.x + fd.x;
    cursorY = pos.y + fd.y;
  }

  const sx = (cursorX - camX) * ts;
  const sy = (cursorY - camY) * ts;
  g.lineStyle(2, resolved.cursorColor, 0.8);

  if (resolved.label === 'cement') {
    // Green semi-transparent fill for cement ghost
    g.fillStyle(resolved.cursorColor, 0.3);
    g.fillRect(sx, sy, ts, ts);
    g.lineStyle(2, resolved.cursorColor, 0.8);
    g.strokeRect(sx, sy, ts, ts);
  } else if (resolved.label === 'ladder' && resolved.ladderTiles) {
    for (const tile of resolved.ladderTiles) {
      const tx = (tile.x - camX) * ts;
      const ty = (tile.y - camY) * ts;
      drawLadder(g, tx, ty, ts, 0.5, resolved.cursorColor!);
    }
  } else if (resolved.label === 'ladder') {
    drawLadder(g, sx, sy, ts, 0.5, resolved.cursorColor);
  } else if (resolved.label === 'platform') {
    drawPlatform(g, sx, sy + ts, ts, 0.5, resolved.cursorColor);
  } else if (resolved.label === 'dismantle_ladder') {
    drawLadder(g, sx, sy, ts, 0.5, resolved.cursorColor);
  } else if (resolved.label === 'dismantle_platform') {
    drawPlatform(g, sx, sy + ts, ts, 0.5, resolved.cursorColor);
  } else if (resolved.label === 'shape' || resolved.label === 'sell' || resolved.label === 'collect') {
    // Command mode: blue semi-transparent fill + blue stroke
    g.fillStyle(resolved.cursorColor, 0.2);
    g.fillRect(sx, sy, ts, ts);
    g.lineStyle(2, resolved.cursorColor, 0.8);
    g.strokeRect(sx, sy, ts, ts);
  } else if (resolved.cursorDashed) {
    const dashLen = Math.max(2, Math.round(ts / 4));
    const gap = Math.max(1, Math.round(ts / 6));
    drawDashedRect(g, sx, sy, ts, ts, dashLen, gap);
  } else {
    g.strokeRect(sx, sy, ts, ts);
  }
}

/** Draw an arrow pointing from the block tile to a side. */
function drawArrow(
  g: Phaser.GameObjects.Graphics,
  blockSX: number, blockSY: number, ts: number,
  dir: Direction.Left | Direction.Right,
): void {
  const cy = blockSY + ts / 2; // vertical center of the block
  const arrowLen = ts * 0.35;
  const headSize = ts * 0.18;

  const sign = dir === Direction.Left ? -1 : 1;
  // Arrow starts at the block edge, points outward
  const startX = dir === Direction.Left ? blockSX : blockSX + ts;
  const endX = startX + sign * arrowLen;

  g.lineStyle(Math.max(2, ts * 0.08), 0xff8800, 0.9);
  g.beginPath();
  g.moveTo(startX, cy);
  g.lineTo(endX, cy);
  g.strokePath();

  // Filled triangle arrowhead
  g.fillStyle(0xff8800, 0.9);
  g.fillTriangle(
    endX, cy,
    endX - sign * headSize, cy - headSize,
    endX - sign * headSize, cy + headSize,
  );
}

/** Draw an inward-pointing arrow from outside the tile pointing toward center. */
function drawInwardArrow(
  g: Phaser.GameObjects.Graphics,
  blockSX: number, blockSY: number, ts: number,
  fromSide: Direction.Left | Direction.Right,
): void {
  const cy = blockSY + ts / 2;
  const arrowLen = ts * 0.35;
  const headSize = ts * 0.18;

  // Arrow starts outside the tile and points inward
  const sign = fromSide === Direction.Left ? 1 : -1; // inward direction
  const startX = fromSide === Direction.Left ? blockSX - arrowLen : blockSX + ts + arrowLen;
  const endX = fromSide === Direction.Left ? blockSX : blockSX + ts;

  g.lineStyle(Math.max(2, ts * 0.08), 0xff8800, 0.9);
  g.beginPath();
  g.moveTo(startX, cy);
  g.lineTo(endX, cy);
  g.strokePath();

  g.fillStyle(0xff8800, 0.9);
  g.fillTriangle(
    endX, cy,
    endX - sign * headSize, cy - headSize,
    endX - sign * headSize, cy + headSize,
  );
}

export function drawRopeOverlay(
  g: Phaser.GameObjects.Graphics,
  game: Game,
  ts: number,
  camX: number,
  camY: number,
): void {
  g.clear();

  const dwarf = game.getMainDwarf();
  if (!dwarf) return;

  // Main dwarf tether rope
  const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;
  if (dwarfComp.tetheredEntityId !== null) {
    const block = game.world.getEntity(dwarfComp.tetheredEntityId);
    if (block) {
      const dwarfPos = dwarf.get<PositionComponent>('position')!;
      const blockPos = block.get<PositionComponent>('position')!;
      drawRope(g, ts, camX, camY, {
        dwarfX: dwarfPos.x, dwarfY: dwarfPos.y,
        blockX: blockPos.x, blockY: blockPos.y,
      });
    }
  }

  // Draw companion drag ropes (same visual as main dwarf tether)
  for (const comp of game.world.query('dwarf', 'position', 'companionTask')) {
    const cd = comp.get<DwarfComponent>('dwarf')!;
    if (cd.isMainDwarf) continue;
    const ct = comp.get<CompanionTaskComponent>('companionTask')!;
    if (ct.dragEntityId === null) continue;
    const dragged = game.world.getEntity(ct.dragEntityId);
    if (!dragged) continue;
    const cp = comp.get<PositionComponent>('position')!;
    const dp = dragged.get<PositionComponent>('position')!;
    drawRope(g, ts, camX, camY, {
      dwarfX: cp.x, dwarfY: cp.y,
      blockX: dp.x, blockY: dp.y,
    });
  }
}
