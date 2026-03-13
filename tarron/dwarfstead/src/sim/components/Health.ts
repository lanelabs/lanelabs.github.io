import type { Component } from '../ecs/Component';

export class HealthComponent implements Component {
  readonly kind = 'health';
  constructor(public current: number, public max: number) {}
}
