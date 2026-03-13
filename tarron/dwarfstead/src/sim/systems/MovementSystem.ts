import type { System } from '../ecs/System';
import type { World } from '../ecs/World';
import type { GameLog } from '../log/GameLog';

/**
 * MovementSystem — placeholder for future pathfinding/AI movement.
 * Currently, all movement is handled directly by MoveCommand.
 * This system will later process queued movement orders for non-player dwarves.
 */
export class MovementSystem implements System {
  readonly name = 'movement';

  update(_world: World, _log: GameLog): void {
    // Future: process pathfinding queues for AI-controlled dwarves
  }
}
