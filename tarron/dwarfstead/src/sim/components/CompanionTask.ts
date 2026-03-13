import type { Component } from '../ecs/Component';
import type { Vec2 } from '../types';

export type TaskType = 'idle' | 'haul' | 'mine' | 'shape' | 'waiting' | 'selling' | 'pathfinding';

export class CompanionTaskComponent implements Component {
  readonly kind = 'companionTask';
  /** Ticks remaining for an off-screen task (0 = actively on map). */
  public ticksRemaining = 0;
  /** Entity ID of the block being hauled. */
  public targetEntityId: number | null = null;
  /** Entity ID of the block being shaped. */
  public shapeTargetId: number | null = null;

  // --- Sell errand fields ---
  /** Current errand type (null = none). */
  public pendingErrand: 'sell' | 'return' | null = null;
  /** Sell phase: 0=none, 1=toBlock, 2=dragToEdge, 3=offScreen, 4=returning. */
  public sellPhase = 0;
  /** Entity being dragged (shaped block or supply crate). */
  public dragEntityId: number | null = null;
  /** X position where companion exits/enters map. */
  public edgeX = 0;
  /** Pathfinding path (transient, not serialized). */
  public path: Vec2[] | null = null;
  /** Current index into path array. */
  public pathIndex = 0;
  /** Recent positions for drag trailing (transient, max 2 entries, newest first). */
  public dragTrail: Vec2[] = [];
  /** True when the companion is blocked and waiting for a clear path. */
  public blocked = false;

  constructor(public task: TaskType = 'idle') {}
}
