import type { Component } from '../ecs/Component';
import type { BlockMaterial } from '../types';

export class BlockTypeComponent implements Component {
  readonly kind = 'blockType';
  constructor(public material: BlockMaterial) {}
}
