import type { World } from './World';
import type { GameLog } from '../log/GameLog';

export interface System {
  readonly name: string;
  update(world: World, log: GameLog): void;
}
