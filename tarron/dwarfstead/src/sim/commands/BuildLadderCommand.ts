import type { Command } from './Command';
import type { Game } from '../Game';
import { Direction, DirectionVec, BlockMaterial, type CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { ClimbableComponent } from '../components/Climbable';
import { findMovableAt, isRappelling } from '../helpers';

export class BuildLadderCommand implements Command {
  readonly name = 'build_ladder';

  constructor(private direction: Direction) {}

  execute(game: Game): CommandResult {
    if (isRappelling(game)) return { success: false, message: 'Cannot build while on a rope.' };
    const dwarf = game.getMainDwarf();
    if (!dwarf) return { success: false, message: 'No main dwarf found.' };

    const pos = dwarf.get<PositionComponent>('position')!;
    const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;

    // Untether if tethered — can't build while holding a rope
    if (dwarfComp.tetheredEntityId !== null) {
      dwarfComp.tetheredEntityId = null;
      game.log.add('action', `${dwarfComp.name} drops the rope.`);
    }

    const delta = DirectionVec[this.direction];
    const targetX = pos.x + delta.x;
    const targetY = pos.y + delta.y;

    const isHorizontal = this.direction === Direction.Left || this.direction === Direction.Right;

    if (isHorizontal) {
      // --- Platform (horizontal) ---
      // Platform goes one tile below the aim position so the dwarf can stand at the aim tile
      const platX = targetX;
      const platY = targetY + 1;

      const platBlock = game.getBlock({ x: platX, y: platY });
      if (platBlock !== BlockMaterial.Air) {
        return { success: false, message: 'Cannot place a platform there — ground is in the way.' };
      }
      if (findMovableAt(game, platX, platY)) {
        return { success: false, message: 'A loose block is in the way.' };
      }
      if (game.hasClimbable({ x: platX, y: platY })) {
        return { success: false, message: 'Something is already built there.' };
      }

      if (game.supplies < 1) {
        return { success: false, message: `Not enough supplies. Need 1, have ${game.supplies}.` };
      }
      game.supplies -= 1;

      const platform = game.world.spawn();
      platform
        .add(new PositionComponent(platX, platY))
        .add(new ClimbableComponent('platform'));

      game.log.add('action', `${dwarfComp.name} builds a platform to the ${this.direction}.`);
      return { success: true, message: `Built platform ${this.direction}.` };
    } else {
      // --- Ladder (vertical) ---
      // Build-down lowering: find the bottommost ladder below and extend one tile further
      if (this.direction === Direction.Down) {
        // Platform at feet → convert to top-anchored ladder (starts a new chain)
        const platformAtFeet = game.world.query('position', 'climbable').find((e) => {
          const p = e.get<PositionComponent>('position')!;
          const c = e.get<ClimbableComponent>('climbable')!;
          return p.x === pos.x && p.y === pos.y && c.type === 'platform';
        });
        if (platformAtFeet) {
          const c = platformAtFeet.get<ClimbableComponent>('climbable')!;
          c.type = 'ladder';
          c.anchorEnd = 'top';
          game.unifyLadderColumn(pos.x, pos.y, 'top');
          game.log.add('action', `${dwarfComp.name} converts the platform into a ladder.`);
          return { success: true, message: 'Platform converted to ladder.' };
        }

        // Platform at target → convert to top-anchored ladder (free conversion)
        const platformAtTarget = game.world.query('position', 'climbable').find((e) => {
          const p = e.get<PositionComponent>('position')!;
          const c = e.get<ClimbableComponent>('climbable')!;
          return p.x === targetX && p.y === targetY && c.type === 'platform';
        });
        if (platformAtTarget) {
          const c = platformAtTarget.get<ClimbableComponent>('climbable')!;
          c.type = 'ladder';
          c.anchorEnd = 'top';
          game.unifyLadderColumn(targetX, targetY, 'top');
          pos.y = targetY;
          game.log.add('action', `${dwarfComp.name} converts the platform into a ladder.`);
          return { success: true, message: 'Platform converted to ladder.' };
        }

        // Scan down from target to find existing ladder column bottom
        let bottomY = targetY;
        while (bottomY < game.terrain.height && game.hasLadder({ x: targetX, y: bottomY })) {
          bottomY++;
        }
        // bottomY is now the first tile without a ladder below the column
        const placeY = bottomY;
        if (placeY >= game.terrain.height) {
          return { success: false, message: 'Cannot extend ladder further down.' };
        }
        const placeBlock = game.getBlock({ x: targetX, y: placeY });
        if (placeBlock !== BlockMaterial.Air) {
          return { success: false, message: 'Cannot place a ladder in solid rock.' };
        }
        if (findMovableAt(game, targetX, placeY)) {
          return { success: false, message: 'A loose block is in the way.' };
        }
        if (game.supplies < 1) {
          return { success: false, message: `Not enough supplies. Need 1, have ${game.supplies}.` };
        }
        // Connectivity check: must be standing on solid ground, ladder, or platform
        const solidBelow = pos.y + 1 < game.terrain.height && game.getBlock({ x: pos.x, y: pos.y + 1 }) !== BlockMaterial.Air;
        const onClimbableHere = game.hasClimbable({ x: pos.x, y: pos.y });
        const climbableBelow = game.hasClimbable({ x: pos.x, y: pos.y + 1 });
        if (!solidBelow && !onClimbableHere && !climbableBelow) {
          return { success: false, message: 'Ladder must connect to ground or infrastructure.' };
        }
        game.supplies -= 1;
        const ladder = game.world.spawn();
        ladder.add(new PositionComponent(targetX, placeY)).add(new ClimbableComponent('ladder', 'top'));
        // Tag existing ladders in the column as top-anchored
        for (const e of game.world.query('position', 'climbable')) {
          const p = e.get<PositionComponent>('position')!;
          const c = e.get<ClimbableComponent>('climbable')!;
          if (p.x === targetX && p.y >= targetY && p.y < placeY && c.type === 'ladder') {
            c.anchorEnd = 'top';
          }
        }
        game.unifyLadderColumn(targetX, placeY, 'top');
        pos.y = placeY;
        game.log.add('action', `${dwarfComp.name} lowers a ladder ${this.direction}.`);
        return { success: true, message: `Lowered ladder ${this.direction}.` };
      }

      // --- Building UP ---
      const targetBlock = game.getBlock({ x: targetX, y: targetY });
      if (targetBlock !== BlockMaterial.Air) {
        return { success: false, message: 'Cannot place a ladder in solid rock.' };
      }
      if (findMovableAt(game, targetX, targetY)) {
        return { success: false, message: 'A loose block is in the way.' };
      }
      if (game.hasLadder({ x: targetX, y: targetY })) {
        return { success: false, message: 'A ladder is already there.' };
      }

      const onClimbable = game.hasClimbable({ x: pos.x, y: pos.y });

      // Connectivity check: must have solid ground below OR existing ladder/climbable at feet or below
      const solidBelowUp = pos.y + 1 < game.terrain.height && game.getBlock({ x: pos.x, y: pos.y + 1 }) !== BlockMaterial.Air;
      const climbableBelowUp = game.hasClimbable({ x: pos.x, y: pos.y + 1 });
      if (!onClimbable && !solidBelowUp && !climbableBelowUp) {
        return { success: false, message: 'Ladder must connect to ground or infrastructure.' };
      }

      // Base ladder is only needed when building UP from bare ground
      const needsBase = !onClimbable && this.direction === Direction.Up;

      // If target has a platform, replace it with a ladder for free (platform supplies material)
      const platformsAtTarget = game.world.query('position', 'climbable').filter((e) => {
        const p = e.get<PositionComponent>('position')!;
        const c = e.get<ClimbableComponent>('climbable')!;
        return p.x === targetX && p.y === targetY && c.type === 'platform';
      });
      if (platformsAtTarget.length > 0) {
        for (const e of platformsAtTarget) game.world.despawn(e.id);
        if (needsBase) {
          if (game.supplies < 1) {
            return { success: false, message: `Not enough supplies. Need 1, have ${game.supplies}.` };
          }
          game.supplies -= 1;
          const baseLadder = game.world.spawn();
          baseLadder.add(new PositionComponent(pos.x, pos.y)).add(new ClimbableComponent('ladder', 'bottom'));
        }
        const ladder = game.world.spawn();
        ladder.add(new PositionComponent(targetX, targetY)).add(new ClimbableComponent('ladder', 'bottom'));
        game.unifyLadderColumn(targetX, targetY, 'bottom');
        game.log.add('action', `${dwarfComp.name} converts the platform into a ladder.`);
        return { success: true, message: 'Platform converted to ladder.' };
      }

      // Normal ladder build
      if (game.supplies < 1) {
        return { success: false, message: `Not enough supplies. Need 1, have ${game.supplies}.` };
      }

      if (needsBase) {
        const canBuildBoth = game.supplies >= 2;
        game.supplies -= canBuildBoth ? 2 : 1;
        const baseLadder = game.world.spawn();
        baseLadder.add(new PositionComponent(pos.x, pos.y)).add(new ClimbableComponent('ladder', 'bottom'));
        if (canBuildBoth) {
          const ladder = game.world.spawn();
          ladder.add(new PositionComponent(targetX, targetY)).add(new ClimbableComponent('ladder', 'bottom'));
          game.log.add('action', `${dwarfComp.name} sets up a ladder and extends it ${this.direction}.`);
        } else {
          game.log.add('action', `${dwarfComp.name} plants a base ladder. Need more supplies to extend up.`);
        }
      } else {
        game.supplies -= 1;
        const ladder = game.world.spawn();
        ladder.add(new PositionComponent(targetX, targetY)).add(new ClimbableComponent('ladder', 'bottom'));
        game.log.add('action', `${dwarfComp.name} builds a ladder to the ${this.direction}.`);
      }
      game.unifyLadderColumn(targetX, targetY, 'bottom');
      return { success: true, message: `Built ladder ${this.direction}.` };
    }
  }
}
