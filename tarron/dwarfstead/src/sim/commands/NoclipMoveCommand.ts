import type { Command } from './Command';
import type { Game } from '../Game';
import { Direction, DirectionVec, type CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';

/** Moves the ghost dwarf directly without collision checks. Ticks the simulation. */
export class NoclipMoveCommand implements Command {
  readonly name = 'noclip_move';
  constructor(private direction: Direction) {}

  execute(game: Game): CommandResult {
    const dwarf = game.getMainDwarf();
    if (!dwarf) return { success: false, message: 'No main dwarf.' };
    const pos = dwarf.get<PositionComponent>('position')!;
    const dComp = dwarf.get<DwarfComponent>('dwarf')!;
    const delta = DirectionVec[this.direction];
    const newX = pos.x + delta.x;
    const newY = pos.y + delta.y;
    if (newX < 0 || newX >= game.terrain.width || newY < 0 || newY >= game.terrain.height) {
      return { success: false, message: 'Edge of the world.' };
    }
    pos.x = newX;
    pos.y = newY;
    dComp.facingDirection = this.direction;
    return { success: true, message: '' };
  }
}
