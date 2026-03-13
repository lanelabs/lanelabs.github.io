import type { Component } from '../ecs/Component';

export class RopeComponent implements Component {
  readonly kind = 'rope';
  constructor(
    public length: number = 0,
    public suppliesRecoverable: number = 0,
  ) {}
}
