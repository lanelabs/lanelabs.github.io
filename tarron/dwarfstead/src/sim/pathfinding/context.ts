import type { Game } from '../Game';
import type { PathContext } from './types';
import { findMovableAt } from '../helpers';

/** Build a PathContext from a Game instance. Optionally exclude an entity from movable checks. */
export function buildPathContext(game: Game, excludeEntityId?: number): PathContext {
  return {
    terrainWidth: game.terrain.width,
    terrainHeight: game.terrain.height,
    maxSafeFallHeight: game.config.maxSafeFallHeight ?? 1,
    getBlock: (pos) => game.getBlock(pos),
    isFlooded: (pos) => game.isFlooded(pos),
    hasLadder: (pos) => game.hasLadder(pos),
    hasPlatform: (pos) => game.hasPlatform(pos),
    hasClimbable: (pos) => game.hasClimbable(pos),
    hasMovableAt: (x, y) => !!findMovableAt(game, x, y, excludeEntityId),
    hasRope: (pos) => game.hasRope(pos),
  };
}
