import type { Component } from '../ecs/Component';

export class PositionComponent implements Component {
  readonly kind = 'position';
  constructor(public x: number, public y: number) {}
}
