import type { Component } from '../ecs/Component';

export const CARVING_MAX_TICKS = 40;
/** Armed ticks per visual progress step (total work ticks stays at 80). */
export const TICKS_PER_STAGE = 2;

export type CarvingSide = 'top' | 'left' | 'right';

export class ShapeBlockComponent implements Component {
  readonly kind = 'shapeBlock';
  public progress = 0;
  /** Work ticks within the current progress stage (0 → TICKS_PER_STAGE). */
  public workTicks = 0;
  public carvingSide: CarvingSide = 'top';
  constructor(public companionId: number) {}
}
