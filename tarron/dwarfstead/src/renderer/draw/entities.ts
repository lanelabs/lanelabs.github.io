import Phaser from 'phaser';
import type { Game } from '../../sim/Game';
import { Direction } from '../../sim/types';
import { PositionComponent } from '../../sim/components/Position';
import { DwarfComponent } from '../../sim/components/Dwarf';
import { BlockTypeComponent } from '../../sim/components/BlockType';
import { CreatureComponent } from '../../sim/components/Creature';
import { BLOCK_INFO } from '../../sim/terrain/BlockTypes';
import { CompanionTaskComponent } from '../../sim/components/CompanionTask';
import { ClimbableComponent } from '../../sim/components/Climbable';
import { ShapeBlockComponent } from '../../sim/components/ShapeBlock';
import { drawDwarfSprite, drawDashedChippedRect, drawLadder, drawPlatform, drawQuestionMark, drawExclamationMark } from './sprites';
import { drawShaped } from './shapedBlock';
import { RopeComponent } from '../../sim/components/Rope';
import { ChippingComponent } from '../../sim/components/Chipping';
import { drawRopeEntity } from './rope';

/**
 * Each crack is a polyline with segments that reveal progressively.
 * `start` = progress tick when the first segment appears.
 * Each subsequent segment appears `pace` ticks later.
 * At 200ms/tick, pace=5 means a new segment every second.
 */
interface CrackDef {
  start: number;
  pace: number;
  /** Waypoints as [x%, y%] within the tile */
  pts: [number, number][];
}

const CRACK_DEFS: CrackDef[] = [
  // Crack A: top-center, zig-zags down-left (progress 1–21)
  { start: 1,  pace: 5, pts: [[0.45, 0], [0.48, 0.15], [0.38, 0.30], [0.42, 0.48], [0.33, 0.58]] },
  // Crack B: right edge, angles inward (progress 10–30)
  { start: 10, pace: 5, pts: [[1.0, 0.25], [0.82, 0.38], [0.72, 0.52], [0.65, 0.68], [0.58, 0.78]] },
  // Crack C: bottom-left, reaches up (progress 25–45)
  { start: 25, pace: 5, pts: [[0.15, 1.0], [0.22, 0.82], [0.30, 0.68], [0.42, 0.60], [0.52, 0.55]] },
  // Crack D: left edge, angles inward (progress 40–60)
  { start: 40, pace: 5, pts: [[0, 0.50], [0.15, 0.48], [0.28, 0.55], [0.38, 0.65], [0.45, 0.80]] },
  // Crack E: top-right, descends (progress 55–75)
  { start: 55, pace: 5, pts: [[0.75, 0], [0.70, 0.15], [0.60, 0.28], [0.55, 0.42], [0.50, 0.50]] },
  // Crack F: bottom-right, reaches up-left (progress 70–90)
  { start: 70, pace: 5, pts: [[0.85, 1.0], [0.78, 0.85], [0.68, 0.72], [0.58, 0.62], [0.50, 0.50]] },
];

function drawChippingCracks(
  g: Phaser.GameObjects.Graphics, sx: number, sy: number, ts: number, progress: number,
): void {
  const t = progress / 100;

  for (const crack of CRACK_DEFS) {
    if (progress < crack.start) continue;

    // How many segments of this crack are revealed?
    const elapsed = progress - crack.start;
    const segCount = Math.min(crack.pts.length - 1, Math.floor(elapsed / crack.pace) + 1);
    if (segCount < 1) continue;

    // Line gets thicker as overall progress grows
    const lw = Math.max(1, Math.round(ts / 14 * (0.6 + t * 0.6)));
    g.lineStyle(lw, 0x000000, 0.45 + t * 0.45);

    // Partial interpolation for the leading segment
    const fullSegs = Math.min(crack.pts.length - 2, Math.floor(elapsed / crack.pace));
    const frac = Math.min(1, (elapsed - fullSegs * crack.pace) / crack.pace);

    g.beginPath();
    g.moveTo(sx + crack.pts[0][0] * ts, sy + crack.pts[0][1] * ts);
    for (let i = 1; i <= fullSegs && i < crack.pts.length; i++) {
      g.lineTo(sx + crack.pts[i][0] * ts, sy + crack.pts[i][1] * ts);
    }
    // Leading edge: interpolate between last full point and next
    const nextIdx = fullSegs + 1;
    if (nextIdx < crack.pts.length) {
      const p0 = crack.pts[nextIdx - 1];
      const p1 = crack.pts[nextIdx];
      const ix = p0[0] + (p1[0] - p0[0]) * frac;
      const iy = p0[1] + (p1[1] - p0[1]) * frac;
      g.lineTo(sx + ix * ts, sy + iy * ts);
    }
    g.strokePath();
  }
}

export function drawEntities(
  g: Phaser.GameObjects.Graphics, game: Game,
  ts: number, screenW: number, screenH: number,
  camX: number, camY: number,
  mainDwarfCrouching = false,
): void {
  g.clear();

  const pad = Math.max(1, Math.round(ts * 0.1));

  const mainDwarf = game.getMainDwarf();
  const mainDwarfComp = mainDwarf?.get<DwarfComponent>('dwarf') ?? null;
  const tetheredId = mainDwarfComp?.tetheredEntityId ?? null;
  const overheadId = mainDwarfComp?.overheadEntityId ?? null;
  const chippingComp = mainDwarf?.get<ChippingComponent>('chipping') ?? null;
  const chippingTargetId = chippingComp?.targetEntityId ?? null;
  const chippingProgress = chippingComp?.progress ?? 0;

  const drawEntity = (entity: ReturnType<typeof game.world.all>[number]) => {
    const pos = entity.get<PositionComponent>('position');
    if (!pos) return;

    const sx = (pos.x - camX) * ts;
    const sy = (pos.y - camY) * ts;
    if (sx < -ts || sx >= screenW + ts || sy < -ts || sy >= screenH + ts) return;

    if (entity.has('dwarf')) {
      const d = entity.get<DwarfComponent>('dwarf')!;
      let facing = d.facingDirection;
      if (!d.isMainDwarf) {
        const md = game.getMainDwarf();
        if (md) {
          const mp = md.get<PositionComponent>('position')!;
          const dx = mp.x - pos.x;
          const dy = mp.y - pos.y;
          if (Math.abs(dx) >= Math.abs(dy)) {
            facing = dx >= 0 ? Direction.Right : Direction.Left;
          } else {
            facing = dy >= 0 ? Direction.Down : Direction.Up;
          }
        }
      }
      const crouch = d.isMainDwarf && mainDwarfCrouching;
      const dAlpha = d.isGhost ? 0.5 : 1;
      drawDwarfSprite(g, sx, sy, ts, d.isMainDwarf, facing, crouch, dAlpha);
      // Draw indicators above companions
      if (!d.isMainDwarf) {
        const ct = entity.get<CompanionTaskComponent>('companionTask');
        if (ct && ct.blocked) {
          drawExclamationMark(g, sx + ts * 0.35, sy - ts * 0.5, ts / 16);
        } else if (ct && ct.task === 'waiting') {
          drawQuestionMark(g, sx + ts * 0.35, sy - ts * 0.5, ts / 16);
        }
      }
    } else if (entity.has('creature')) {
      const c = entity.get<CreatureComponent>('creature')!;
      const color = c.creatureType === 'cave_beetle' ? 0xff4444 : 0xff8800;
      g.fillStyle(color, 1);
      g.fillRect(sx + pad, sy + pad, ts - pad * 2, ts - pad * 2);
    } else if (entity.has('rope')) {
      const r = entity.get<RopeComponent>('rope')!;
      drawRopeEntity(game, g, ts, camX, camY, pos.x, pos.y, r.length);
    } else if (entity.has('climbable')) {
      const c = entity.get<ClimbableComponent>('climbable')!;
      if (c.type === 'platform') {
        drawPlatform(g, sx, sy, ts);
      } else {
        // Pass anchor indicator info
        const isAnchorTile = c.anchorEnd !== null;
        if (isAnchorTile) {
          const isBottom = c.anchorEnd === 'bottom' && !game.hasLadder({ x: pos.x, y: pos.y + 1 });
          const isTop = c.anchorEnd === 'top' && !game.hasLadder({ x: pos.x, y: pos.y - 1 });
          drawLadder(g, sx, sy, ts);
          if (isBottom || isTop) {
            // Draw small gray bracket at anchor end
            const bracketH = Math.max(2, Math.round(ts * 0.12));
            const bracketW = ts * 0.7;
            const bx = sx + (ts - bracketW) / 2;
            g.fillStyle(0x888888, 0.7);
            if (isBottom) {
              g.fillRect(bx, sy + ts - bracketH, bracketW, bracketH);
            } else {
              g.fillRect(bx, sy, bracketW, bracketH);
            }
          }
        } else {
          drawLadder(g, sx, sy, ts);
        }
      }
    } else if (entity.has('supplyCrate')) {
      // Brown box with cross-hatch pattern
      const crateColor = 0x8B6914;
      g.fillStyle(crateColor, 0.9);
      g.fillRect(sx + pad, sy + pad, ts - pad * 2, ts - pad * 2);
      // Cross-hatch lines
      g.lineStyle(1, 0x5C3A1E, 0.7);
      g.beginPath();
      g.moveTo(sx + pad, sy + pad);
      g.lineTo(sx + ts - pad, sy + ts - pad);
      g.moveTo(sx + ts - pad, sy + pad);
      g.lineTo(sx + pad, sy + ts - pad);
      g.strokePath();
    } else if (entity.has('blockType')) {
      const bt = entity.get<BlockTypeComponent>('blockType')!;
      const color = parseInt(BLOCK_INFO[bt.material].color.slice(1), 16);
      const shape = entity.get<ShapeBlockComponent>('shapeBlock');
      if (shape) {
        drawShaped(g, sx, sy, ts, color, shape.progress);
      } else if (entity.has('rubble')) {
        const isOverhead = overheadId !== null && entity.id === overheadId;
        const alpha = isOverhead ? 0.65 : 0.9;
        g.fillStyle(0x6B6B6B, alpha);
        g.fillRect(sx, sy, ts, ts);
        const step = Math.max(1, Math.round(ts / 8));
        for (let py = 0; py < ts; py += step) {
          for (let px = 0; px < ts; px += step) {
            const hash = ((px * 7 + py * 13 + entity.id * 31) & 0xff);
            if (hash < 40) {
              g.fillStyle(0x000000, 0.6 * alpha);
              g.fillRect(sx + px, sy + py, step, step);
            } else if (hash < 100) {
              g.fillStyle(0x585858, alpha);
              g.fillRect(sx + px, sy + py, step, step);
            } else if (hash < 140) {
              g.fillStyle(0x8a8a8a, alpha);
              g.fillRect(sx + px, sy + py, step, step);
            }
          }
        }
      } else {
        const isOverhead = overheadId !== null && entity.id === overheadId;
        const chip = Math.ceil(ts * 0.2);
        // Draw loose block as polygon with all 4 corners cut (octagonal)
        g.fillStyle(color, isOverhead ? 0.65 : 0.9);
        g.beginPath();
        g.moveTo(sx, sy + chip);
        g.lineTo(sx + chip, sy);
        g.lineTo(sx + ts - chip, sy);
        g.lineTo(sx + ts, sy + chip);
        g.lineTo(sx + ts, sy + ts - chip);
        g.lineTo(sx + ts - chip, sy + ts);
        g.lineTo(sx + chip, sy + ts);
        g.lineTo(sx, sy + ts - chip);
        g.closePath();
        g.fillPath();
        const dashLen = Math.max(2, Math.round(ts / 5));
        const gapLen = Math.max(1, Math.round(ts / 8));
        g.lineStyle(1, 0x000000, 0.7);
        drawDashedChippedRect(g, sx, sy, ts, chip, dashLen, gapLen);

        // Draw cracks if this block is being chipped
        if (chippingTargetId !== null && entity.id === chippingTargetId && chippingProgress > 0) {
          drawChippingCracks(g, sx, sy, ts, chippingProgress);
        }
      }
    }
  };

  const characters: ReturnType<typeof game.world.all>[number][] = [];
  let tetheredEntity: ReturnType<typeof game.world.all>[number] | null = null;
  let ghostEntity: ReturnType<typeof game.world.all>[number] | null = null;
  for (const entity of game.world.all()) {
    if (tetheredId !== null && entity.id === tetheredId) {
      tetheredEntity = entity;
      continue;
    }
    if (entity.has('dwarf') && entity.get<DwarfComponent>('dwarf')!.isGhost) {
      ghostEntity = entity;
      continue;
    }
    if (entity.has('dwarf') || entity.has('creature')) {
      characters.push(entity);
    } else {
      drawEntity(entity);
    }
  }
  for (const c of characters) drawEntity(c);
  if (tetheredEntity) drawEntity(tetheredEntity);
  if (ghostEntity) drawEntity(ghostEntity);
}
