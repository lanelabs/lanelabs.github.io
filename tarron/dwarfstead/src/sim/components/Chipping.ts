import type { Component } from '../ecs/Component';
import type { Direction } from '../types';

export class ChippingComponent implements Component {
  readonly kind = 'chipping';
  progress = 0;
  constructor(public targetEntityId: number, public direction: Direction) {}
}
