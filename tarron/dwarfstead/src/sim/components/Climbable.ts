import type { Component } from '../ecs/Component';

export type ClimbableType = 'ladder' | 'platform';

/** Marks a position as climbable (ladder, rope, etc.) or walkable (platform). */
export class ClimbableComponent implements Component {
  readonly kind = 'climbable';
  constructor(
    public type: ClimbableType = 'ladder',
    public anchorEnd: 'top' | 'bottom' | null = null,
  ) {}
}
