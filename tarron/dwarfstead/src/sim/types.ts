export interface Vec2 {
  x: number;
  y: number;
}

export enum Direction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
}

export const DirectionVec: Record<Direction, Vec2> = {
  [Direction.Up]: { x: 0, y: -1 },
  [Direction.Down]: { x: 0, y: 1 },
  [Direction.Left]: { x: -1, y: 0 },
  [Direction.Right]: { x: 1, y: 0 },
};

export enum BlockMaterial {
  Air = 'air',
  Dirt = 'dirt',
  Stone = 'stone',
  Granite = 'granite',
  Iron = 'iron',
  Gold = 'gold',
  Crystal = 'crystal',
  DarkStone = 'dark_stone',
  Bedrock = 'bedrock',
  Rubble = 'rubble',
  GrassyDirt = 'grassy_dirt',
}

export enum CreatureType {
  CaveBeetle = 'cave_beetle',
  RockCrab = 'rock_crab',
}

export enum Season {
  Dry = 'dry',
  Wet = 'wet',
}

export interface GameConfig {
  seed: number;
  worldWidth: number;
  worldHeight: number;
  startingDwarves: number;
  seasonLength?: number;     // ticks per season (default 50)
  waterRiseRate?: number;    // ticks between water level changes (default 5)
  maxSafeFallHeight?: number; // max tiles a dwarf can drop without a ladder (default 1)
  terrainOverride?: import('./terrain/TerrainGenerator').TerrainGrid; // skip generation, use this terrain
}

export interface CommandResult {
  success: boolean;
  message: string;
}

export interface HiddenRoom {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'cache' | 'lair' | 'ruin' | 'pool';
}
