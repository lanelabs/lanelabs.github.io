import type { Component } from '../ecs/Component';

export class MovableComponent implements Component {
  readonly kind = 'movable';
  constructor(public weight: number = 1) {}
}
