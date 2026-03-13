import type { Command } from './Command';
import type { Game } from '../Game';
import { BlockMaterial, type CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { ClimbableComponent } from '../components/Climbable';
import { isRappelling } from '../helpers';

/** Dismantle the ladder at the dwarf's current position (Ctrl+Space). */
export class DismantleAtFeetCommand implements Command {
  readonly name = 'dismantle_at_feet';

  execute(game: Game): CommandResult {
    if (isRappelling(game)) return { success: false, message: 'Cannot dismantle while on a rope.' };
    const dwarf = game.getMainDwarf();
    if (!dwarf) return { success: false, message: 'No main dwarf found.' };

    const pos = dwarf.get<PositionComponent>('position')!;
    const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;

    const targets = game.world.query('position', 'climbable').filter((e) => {
      const p = e.get<PositionComponent>('position')!;
      const c = e.get<ClimbableComponent>('climbable')!;
      return p.x === pos.x && p.y === pos.y && c.type === 'ladder';
    });

    if (targets.length === 0) {
      return { success: false, message: 'Nothing to dismantle here.' };
    }

    const target = targets[0];
    const climbable = target.get<ClimbableComponent>('climbable')!;

    // --- Anchored ladder retraction: always removes from free end, moves dwarf toward anchor ---
    if (climbable.anchorEnd !== null) {
      const step = climbable.anchorEnd === 'top' ? 1 : -1;
      let freeY = pos.y;
      while (game.hasLadder({ x: pos.x, y: freeY + step })) {
        freeY += step;
      }

      const freeEntity = game.world.query('position', 'climbable').find((e) => {
        const p = e.get<PositionComponent>('position')!;
        const c = e.get<ClimbableComponent>('climbable')!;
        return p.x === pos.x && p.y === freeY && c.type === 'ladder';
      });
      if (!freeEntity) return { success: false, message: 'Nothing to dismantle here.' };

      const freeClimb = freeEntity.get<ClimbableComponent>('climbable')!;
      const towardAnchorY = freeY - step;
      const isLast = !game.hasLadder({ x: pos.x, y: towardAnchorY });

      // Last segment: top-anchored → convert to platform
      if (isLast && climbable.anchorEnd === 'top') {
        freeClimb.type = 'platform';
        game.log.add('action', `${dwarfComp.name} converts a ladder into a platform.`);
        return { success: true, message: 'Ladder converted to platform.' };
      }

      // Move dwarf toward anchor — except on free end with support below
      if (!isLast) {
        const onFreeEnd = pos.y === freeY;
        if (onFreeEnd) {
          const belowY = pos.y + 1;
          const hasSupportBelow = belowY < game.terrain.height && (
            game.getBlock({ x: pos.x, y: belowY }) !== BlockMaterial.Air ||
            game.hasClimbable({ x: pos.x, y: belowY }) ||
            game.world.query('position', 'movable').some((e) => {
              const p = e.get<PositionComponent>('position')!;
              return p.x === pos.x && p.y === belowY;
            })
          );
          if (!hasSupportBelow) {
            pos.y = pos.y + (-step); // toward anchor
          }
        } else {
          const newY = pos.y + (-step); // toward anchor
          if (game.hasLadder({ x: pos.x, y: newY })) {
            pos.y = newY;
          }
        }
      }

      // Adjacent platform → convert instead of despawning
      if (game.hasPlatform({ x: pos.x - 1, y: freeY }) || game.hasPlatform({ x: pos.x + 1, y: freeY })) {
        freeClimb.type = 'platform';
        game.log.add('action', `${dwarfComp.name} converts a ladder into a platform.`);
        return { success: true, message: 'Ladder converted to platform.' };
      }

      // Trail cleanup + despawn + refund
      for (let i = game.trail.length - 1; i >= 0; i--) {
        if (game.trail[i].x === pos.x && game.trail[i].y === freeY) {
          game.trail.splice(i, 1);
        }
      }
      game.collapseRopesSupportedBy(pos.x, freeY);
      game.world.despawn(freeEntity.id);
      game.supplies += 1;
      game.log.add('action', `${dwarfComp.name} dismantles a ladder underfoot and recovers supplies.`);
      return { success: true, message: 'Ladder dismantled. +1 supply.' };
    }

    // --- Unanchored ladder ---

    // Ladder with adjacent platform → convert to platform instead of despawning
    if (climbable.type === 'ladder' &&
        (game.hasPlatform({ x: pos.x - 1, y: pos.y }) || game.hasPlatform({ x: pos.x + 1, y: pos.y }))) {
      climbable.type = 'platform';
      game.log.add('action', `${dwarfComp.name} converts a ladder into a platform.`);
      return { success: true, message: 'Ladder converted to platform.' };
    }

    // Safety: don't dismantle if the dwarf would fall too far
    const maxFall = game.config.maxSafeFallHeight ?? 1;
    let dropDist = 0;
    let checkY = pos.y + 1;
    while (checkY < game.terrain.height && game.getBlock({ x: pos.x, y: checkY }) === BlockMaterial.Air) {
      if (game.hasClimbable({ x: pos.x, y: checkY })) break;
      if (game.world.query('position', 'movable').some((e) => {
        const p = e.get<PositionComponent>('position')!;
        return p.x === pos.x && p.y === checkY;
      })) break;
      dropDist++;
      checkY++;
    }
    if (dropDist > maxFall) {
      // Convert to platform instead of refusing
      climbable.type = 'platform';
      game.log.add('action', `${dwarfComp.name} converts a ladder into a platform.`);
      return { success: true, message: 'Ladder converted to platform.' };
    }

    // Remove trail entries so companions retract instead of falling
    for (let i = game.trail.length - 1; i >= 0; i--) {
      if (game.trail[i].x === pos.x && game.trail[i].y === pos.y) game.trail.splice(i, 1);
    }

    const targetPos = target.get<PositionComponent>('position')!;
    game.collapseRopesSupportedBy(targetPos.x, targetPos.y);
    game.world.despawn(target.id);
    game.supplies += 1;
    game.log.add('action', `${dwarfComp.name} dismantles a ladder underfoot and recovers supplies.`);
    return { success: true, message: 'Ladder dismantled. +1 supply.' };
  }
}
