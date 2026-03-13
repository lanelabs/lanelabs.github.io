import type { Command } from './Command';
import type { Game } from '../Game';
import { Direction, DirectionVec, BlockMaterial, type CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { findMovableAt, hasLooseBlockOnTop, isRappelling } from '../helpers';

/**
 * Move horizontally while pushing or pulling an adjacent block.
 * - Push: block in front gets shoved one tile further, dwarf moves into its spot.
 * - Pull: block behind follows into dwarf's old position.
 * - If both exist, push wins (pull block stays put).
 * - If neither exists, the dwarf just moves normally.
 */
export class ShoveCommand implements Command {
  readonly name = 'shove';

  constructor(private direction: Direction) {}

  execute(game: Game): CommandResult {
    if (isRappelling(game)) return { success: false, message: 'Cannot shove while on a rope.' };
    if (this.direction !== Direction.Left && this.direction !== Direction.Right) {
      return { success: false, message: 'Can only shove left or right.' };
    }

    const dwarf = game.getMainDwarf();
    if (!dwarf) return { success: false, message: 'No main dwarf found.' };

    const pos = dwarf.get<PositionComponent>('position')!;
    const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;

    if (dwarfComp.overheadEntityId !== null) {
      return { success: false, message: "Can't shove while balancing a block overhead." };
    }

    const delta = DirectionVec[this.direction];

    const targetX = pos.x + delta.x;
    const targetY = pos.y;
    const behindX = pos.x - delta.x;

    const pushBlock = findMovableAt(game, targetX, targetY);
    const pullBlock = findMovableAt(game, behindX, pos.y);

    // Untether rope — can't shove while tethered
    if (dwarfComp.tetheredEntityId !== null) {
      dwarfComp.tetheredEntityId = null;
      game.log.add('action', `${dwarfComp.name} drops the rope.`);
    }

    if (pushBlock) {
      // --- PUSH: block forward, dwarf into block's spot ---
      if (hasLooseBlockOnTop(game, targetX, targetY)) {
        return { success: false, message: 'Too heavy — another block is stacked on top.' };
      }
      const pushDestX = targetX + delta.x;

      if (pushDestX < 0 || pushDestX >= game.terrain.width) {
        return { success: false, message: 'No room to push — edge of world.' };
      }
      if (game.getBlock({ x: pushDestX, y: targetY }) !== BlockMaterial.Air) {
        return { success: false, message: 'No room to push — blocked.' };
      }
      if (game.isFlooded({ x: pushDestX, y: targetY })) {
        return { success: false, message: 'Cannot push into water.' };
      }
      if (findMovableAt(game, pushDestX, targetY)) {
        return { success: false, message: 'No room to push — another block in the way.' };
      }

      // Move block
      pushBlock.get<PositionComponent>('position')!.x = pushDestX;

      // Move dwarf
      this.moveDwarf(game, pos, dwarfComp, targetX, targetY);

      game.log.add('action', `${dwarfComp.name} shoves a block ${this.direction}.`);
      return { success: true, message: `Shoved block ${this.direction}.` };

    } else {
      // --- Target tile must be passable for move (with or without pull) ---
      if (targetX < 0 || targetX >= game.terrain.width || targetY < 0 || targetY >= game.terrain.height) {
        return { success: false, message: 'Cannot move outside the world.' };
      }
      if (game.getBlock({ x: targetX, y: targetY }) !== BlockMaterial.Air) {
        return { success: false, message: `The way ${this.direction} is blocked.` };
      }
      if (game.isFlooded({ x: targetX, y: targetY })) {
        return { success: false, message: 'Water blocks the way.' };
      }
      if (findMovableAt(game, targetX, targetY)) {
        return { success: false, message: 'A loose block is in the way.' };
      }

      const oldX = pos.x;

      // Move dwarf
      this.moveDwarf(game, pos, dwarfComp, targetX, targetY);

      if (pullBlock) {
        // --- PULL: drag block into dwarf's old spot ---
        if (hasLooseBlockOnTop(game, behindX, pos.y)) {
          // Can't pull — block behind has something stacked on it
          game.log.add('action', `${dwarfComp.name} moves ${this.direction}.`);
          return { success: true, message: `Moved ${this.direction} (block behind too heavy to drag).` };
        }
        pullBlock.get<PositionComponent>('position')!.x = oldX;
        game.log.add('action', `${dwarfComp.name} drags a block ${this.direction}.`);
        return { success: true, message: `Dragged block ${this.direction}.` };
      }

      // No blocks — normal move
      game.log.add('action', `${dwarfComp.name} moves ${this.direction}.`);
      return { success: true, message: `Moved ${this.direction}.` };
    }
  }

  /** Move dwarf, update trail, sync carried item. */
  private moveDwarf(
    game: Game, pos: PositionComponent, dwarfComp: DwarfComponent,
    newX: number, newY: number,
  ): void {
    const oldX = pos.x;
    const oldY = pos.y;
    pos.x = newX;
    pos.y = newY;
    dwarfComp.facingDirection = this.direction;

    game.trail.unshift({ x: oldX, y: oldY });
    if (game.trail.length > 20) game.trail.length = 20;

    if (dwarfComp.carryingEntityId !== null) {
      const carried = game.world.getEntity(dwarfComp.carryingEntityId);
      if (carried) {
        const cp = carried.get<PositionComponent>('position')!;
        cp.x = newX;
        cp.y = newY;
      } else {
        dwarfComp.carryingEntityId = null;
      }
    }
  }
}
