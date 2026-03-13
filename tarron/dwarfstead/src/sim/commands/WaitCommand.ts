import type { Command } from './Command';
import type { Game } from '../Game';
import type { CommandResult } from '../types';

export class WaitCommand implements Command {
  readonly name = 'wait';

  execute(game: Game): CommandResult {
    const dwarfComp = game.getMainDwarf()?.get<import('../components/Dwarf').DwarfComponent>('dwarf');
    const name = dwarfComp?.name ?? 'The dwarf';
    game.log.add('action', `${name} waits.`);
    return { success: true, message: 'Time passes.' };
  }
}
