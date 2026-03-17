import type { Component } from '../ecs/Component';

export class OxygenComponent implements Component {
  readonly kind = 'oxygen';
  current: number;
  max: number;

  constructor(max = 10) {
    this.max = max;
    this.current = max;
  }
}
