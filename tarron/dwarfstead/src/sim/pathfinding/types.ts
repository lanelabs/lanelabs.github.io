import type { Vec2 } from '../types';
import type { BlockMaterial } from '../types';

/** Context for pathfinding — thin adapter over game state. */
export interface PathContext {
  terrainWidth: number;
  terrainHeight: number;
  maxSafeFallHeight: number;
  getBlock: (pos: Vec2) => BlockMaterial;
  isFlooded: (pos: Vec2) => boolean;
  hasLadder: (pos: Vec2) => boolean;
  hasPlatform: (pos: Vec2) => boolean;
  hasClimbable: (pos: Vec2) => boolean;
  hasMovableAt: (x: number, y: number) => boolean;
  hasRope: (pos: Vec2) => boolean;
}
