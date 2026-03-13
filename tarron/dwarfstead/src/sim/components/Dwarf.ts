import type { Component } from '../ecs/Component';
import { Direction } from '../types';

export class DwarfComponent implements Component {
  readonly kind = 'dwarf';
  public carryingEntityId: number | null = null;
  public facingDirection: Direction = Direction.Right;
  public tetheredEntityId: number | null = null;
  public overheadEntityId: number | null = null;
  public crouching = false;
  public rappelRopeId: number | null = null;
  constructor(
    public name: string,
    public specialty: string = 'miner',
    public isMainDwarf: boolean = false,
  ) {}
}
