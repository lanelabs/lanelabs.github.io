import type { Component } from '../ecs/Component';
import type { CreatureType } from '../types';

export class CreatureComponent implements Component {
  readonly kind = 'creature';
  constructor(
    public name: string,
    public creatureType: CreatureType,
    public hp: number,
    public maxHp: number,
    public damage: number,
  ) {}
}
