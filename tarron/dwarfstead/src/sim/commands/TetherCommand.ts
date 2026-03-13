import type { Command } from './Command';
import type { Game } from '../Game';
import { DirectionVec, type CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { isRappelling } from '../helpers';

export class TetherCommand implements Command {
  readonly name = 'tether';

  execute(game: Game): CommandResult {
    if (isRappelling(game)) return { success: false, message: 'Cannot tether while on a rope.' };
    const dwarf = game.getMainDwarf();
    if (!dwarf) return { success: false, message: 'No main dwarf found.' };

    const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;
    const pos = dwarf.get<PositionComponent>('position')!;

    // If already tethered, untie
    if (dwarfComp.tetheredEntityId !== null) {
      const block = game.world.getEntity(dwarfComp.tetheredEntityId);
      dwarfComp.tetheredEntityId = null;
      if (block) {
        game.log.add('action', `${dwarfComp.name} unties the rope.`);
        return { success: true, message: 'Rope untied.' };
      }
      game.log.add('action', `${dwarfComp.name} coils up the rope.`);
      return { success: true, message: 'Rope coiled (block was gone).' };
    }

    // Look for movable block at facing tile
    const delta = DirectionVec[dwarfComp.facingDirection];
    const tx = pos.x + delta.x;
    const ty = pos.y + delta.y;

    // Check bounds
    if (tx < 0 || tx >= game.terrain.width || ty < 0 || ty >= game.terrain.height) {
      return { success: false, message: 'Nothing to lasso there.' };
    }

    // Find movable block at target
    const blocks = game.world.query('position', 'movable').filter((e) => {
      const p = e.get<PositionComponent>('position')!;
      return p.x === tx && p.y === ty;
    });

    if (blocks.length === 0) {
      return { success: false, message: 'No loose block to lasso there.' };
    }

    dwarfComp.tetheredEntityId = blocks[0].id;
    game.log.add('action', `${dwarfComp.name} lassos a block!`);
    return { success: true, message: 'Block lassoed!' };
  }
}
