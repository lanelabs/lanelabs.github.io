import type { CommandResult } from '../types';
import type { Game } from '../Game';

export interface Command {
  readonly name: string;
  execute(game: Game): CommandResult;
}
