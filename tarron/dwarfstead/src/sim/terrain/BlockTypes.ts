import { BlockMaterial } from '../types';

export interface BlockInfo {
  hardness: number;       // Ticks to dig (0 = instant, -1 = unbreakable)
  displayChar: string;    // ASCII character for CLI rendering
  color: string;          // Hex color for Phaser rendering
  drops: BlockMaterial | null; // What material entity is spawned when dug
}

export const BLOCK_INFO: Record<BlockMaterial, BlockInfo> = {
  [BlockMaterial.Air]: {
    hardness: 0,
    displayChar: ' ',
    color: '#1a1a2e',
    drops: null,
  },
  [BlockMaterial.Dirt]: {
    hardness: 1,
    displayChar: '.',
    color: '#8B5E3C',
    drops: BlockMaterial.Dirt,
  },
  [BlockMaterial.Stone]: {
    hardness: 2,
    displayChar: '#',
    color: '#808080',
    drops: BlockMaterial.Stone,
  },
  [BlockMaterial.Granite]: {
    hardness: 4,
    displayChar: '%',
    color: '#A0A0A0',
    drops: BlockMaterial.Granite,
  },
  [BlockMaterial.Iron]: {
    hardness: 3,
    displayChar: '*',
    color: '#B87333',
    drops: BlockMaterial.Iron,
  },
  [BlockMaterial.Gold]: {
    hardness: 3,
    displayChar: '$',
    color: '#FFD700',
    drops: BlockMaterial.Gold,
  },
  [BlockMaterial.Crystal]: {
    hardness: 5,
    displayChar: '&',
    color: '#00CED1',
    drops: BlockMaterial.Crystal,
  },
  [BlockMaterial.DarkStone]: {
    hardness: 2,
    displayChar: '▓',
    color: '#3A3A3A',
    drops: BlockMaterial.DarkStone,
  },
  [BlockMaterial.Bedrock]: {
    hardness: -1,
    displayChar: '=',
    color: '#2C2C2C',
    drops: null,
  },
  [BlockMaterial.Rubble]: {
    hardness: -1,
    displayChar: ',',
    color: '#6B6B6B',
    drops: null,
  },
  [BlockMaterial.GrassyDirt]: {
    hardness: 1,
    displayChar: '"',
    color: '#4A7C3F',
    drops: BlockMaterial.GrassyDirt,
  },
};
