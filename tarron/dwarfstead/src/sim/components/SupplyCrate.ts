import type { Component } from '../ecs/Component';

export class SupplyCrateComponent implements Component {
  readonly kind = 'supplyCrate';
  constructor(public suppliesInside = 1) {}
}
