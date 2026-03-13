import type { Command } from './Command';
import type { Game } from '../Game';
import { Direction, DirectionVec, BlockMaterial, type CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { ClimbableComponent, type ClimbableType } from '../components/Climbable';
import { isRappelling } from '../helpers';

export class DismantleLadderCommand implements Command {
  readonly name = 'dismantle';

  constructor(private preferType: ClimbableType = 'ladder') {}

  execute(game: Game): CommandResult {
    if (isRappelling(game)) return { success: false, message: 'Cannot dismantle while on a rope.' };
    const dwarf = game.getMainDwarf();
    if (!dwarf) return { success: false, message: 'No main dwarf found.' };

    const pos = dwarf.get<PositionComponent>('position')!;
    const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;

    // Untether if tethered — can't dismantle while holding a rope
    if (dwarfComp.tetheredEntityId !== null) {
      dwarfComp.tetheredEntityId = null;
      game.log.add('action', `${dwarfComp.name} drops the rope.`);
    }

    const facing = dwarfComp.facingDirection;
    const delta = DirectionVec[facing];
    const tx = pos.x + delta.x;
    const aimY = pos.y + delta.y;
    const isHorizontal = facing === Direction.Left || facing === Direction.Right;

    const climbables = game.world.query('position', 'climbable');
    let targets: typeof climbables;

    if (isHorizontal) {
      // Horizontal: ladders at aim tile, platforms at aimY+1 (matching build offset)
      const find = (y: number, type: ClimbableType) =>
        climbables.filter((e) => {
          const p = e.get<PositionComponent>('position')!;
          const c = e.get<ClimbableComponent>('climbable')!;
          return p.x === tx && p.y === y && c.type === type;
        });
      targets = find(aimY, 'ladder');
      if (!targets.length) targets = find(aimY + 1, 'platform');
      if (!targets.length) targets = find(aimY + 1, 'ladder');
      if (!targets.length) targets = find(aimY, 'platform');
    } else {
      // Vertical: only dismantle ladders (platforms are only removable via horizontal targeting)
      targets = climbables.filter((e) => {
        const p = e.get<PositionComponent>('position')!;
        const c = e.get<ClimbableComponent>('climbable')!;
        return p.x === tx && p.y === aimY && c.type === 'ladder';
      });
    }

    if (targets.length === 0) {
      return { success: false, message: 'Nothing to dismantle there.' };
    }

    const target = targets[0];
    const targetPos = target.get<PositionComponent>('position')!;

    const climbable = target.get<ClimbableComponent>('climbable')!;

    // --- Anchored ladder retraction: always removes from free end ---
    if (climbable.type === 'ladder' && climbable.anchorEnd !== null) {
      // Walk from target away from anchor to find the free end
      const step = climbable.anchorEnd === 'top' ? 1 : -1;
      let freeY = targetPos.y;
      while (game.hasLadder({ x: targetPos.x, y: freeY + step })) {
        freeY += step;
      }

      // Find the entity at the free end
      const freeEntity = game.world.query('position', 'climbable').find((e) => {
        const p = e.get<PositionComponent>('position')!;
        const c = e.get<ClimbableComponent>('climbable')!;
        return p.x === targetPos.x && p.y === freeY && c.type === 'ladder';
      });
      if (!freeEntity) return { success: false, message: 'Nothing to dismantle there.' };

      const freePos = freeEntity.get<PositionComponent>('position')!;
      const freeClimb = freeEntity.get<ClimbableComponent>('climbable')!;
      const towardAnchorY = freeY - step;
      const isLast = !game.hasLadder({ x: targetPos.x, y: towardAnchorY });

      // Last segment: top-anchored → convert to platform
      if (isLast && climbable.anchorEnd === 'top') {
        freeClimb.type = 'platform';
        game.log.add('action', `${dwarfComp.name} converts a ladder into a platform.`);
        return { success: true, message: 'Ladder converted to platform.' };
      }

      // If dwarf is on a ladder in this column, always move one step toward anchor
      const dwarfOnLadder = pos.x === targetPos.x && game.hasLadder({ x: pos.x, y: pos.y });
      if (dwarfOnLadder && !isLast) {
        const anchorDir = -step;
        pos.y += anchorDir;
      }

      // Trail cleanup + despawn + refund
      for (let i = game.trail.length - 1; i >= 0; i--) {
        if (game.trail[i].x === freePos.x && game.trail[i].y === freeY) {
          game.trail.splice(i, 1);
        }
      }
      game.collapseRopesSupportedBy(freePos.x, freeY);
      game.world.despawn(freeEntity.id);
      game.supplies += 1;
      game.log.add('action', `${dwarfComp.name} dismantles a ladder and recovers supplies.`);
      return { success: true, message: 'Ladder dismantled. +1 supply.' };
    }

    // Ladder with adjacent platform → convert to platform instead of despawning
    // (checked before fall safety because converting preserves support)
    if (climbable.type === 'ladder' &&
        (game.hasPlatform({ x: targetPos.x - 1, y: targetPos.y }) || game.hasPlatform({ x: targetPos.x + 1, y: targetPos.y }))) {
      climbable.type = 'platform';
      game.log.add('action', `${dwarfComp.name} converts a ladder into a platform.`);
      return { success: true, message: 'Ladder converted to platform.' };
    }

    // Safety: dwarf standing on it or would fall too far → convert to platform
    if (climbable.type === 'ladder' && targetPos.x === pos.x) {
      const standingOnIt = targetPos.y === pos.y;
      let wouldFall = false;
      if (!standingOnIt) {
        const hasSupportHere = game.hasClimbable({ x: pos.x, y: pos.y });
        const solidBelow = pos.y + 1 < game.terrain.height && game.getBlock({ x: pos.x, y: pos.y + 1 }) !== BlockMaterial.Air;
        if (!hasSupportHere && !solidBelow) {
          const maxFall = game.config.maxSafeFallHeight ?? 1;
          let dropDist = 0;
          let checkY = pos.y + 1;
          while (checkY < game.terrain.height && game.getBlock({ x: pos.x, y: checkY }) === BlockMaterial.Air) {
            if (checkY !== targetPos.y && game.hasClimbable({ x: pos.x, y: checkY })) break;
            if (game.world.query('position', 'movable').some((e) => {
              const p = e.get<PositionComponent>('position')!;
              return p.x === pos.x && p.y === checkY;
            })) break;
            dropDist++;
            checkY++;
          }
          wouldFall = dropDist > maxFall;
        }
      }
      if (standingOnIt || wouldFall) {
        climbable.type = 'platform';
        game.log.add('action', `${dwarfComp.name} converts a ladder into a platform.`);
        return { success: true, message: 'Ladder converted to platform.' };
      }
    }

    // Platforms: don't dismantle what you're standing on
    if (targetPos.x === pos.x && targetPos.y === pos.y) {
      return { success: false, message: "Can't dismantle what you're standing on." };
    }

    const label = climbable.type === 'platform' ? 'platform' : 'ladder';

    // Remove trail entries at the walkable space so companions retract instead of falling
    const walkY = climbable.type === 'platform' ? targetPos.y - 1 : targetPos.y;
    for (let i = game.trail.length - 1; i >= 0; i--) {
      if (game.trail[i].x === targetPos.x && game.trail[i].y === walkY) game.trail.splice(i, 1);
    }

    game.collapseRopesSupportedBy(targetPos.x, targetPos.y);
    game.world.despawn(target.id);
    game.supplies += 1;
    game.log.add('action', `${dwarfComp.name} dismantles a ${label} and recovers supplies.`);
    return { success: true, message: `${label.charAt(0).toUpperCase() + label.slice(1)} dismantled. +1 supply.` };
  }
}
