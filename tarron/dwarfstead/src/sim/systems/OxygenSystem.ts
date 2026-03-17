/**
 * OxygenSystem — drains oxygen when a dwarf is submerged, restores in air.
 * When oxygen hits 0, the dwarf takes 2 HP damage and respawns at surface.
 */

import type { System } from '../ecs/System';
import type { World } from '../ecs/World';
import type { GameLog } from '../log/GameLog';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { HealthComponent } from '../components/Health';
import { OxygenComponent } from '../components/Oxygen';
import { WATER_SWIM_THRESHOLD } from './waterCA';

export interface OxygenSystemConfig {
  surfaceY: number;
  terrainWidth: number;
  getWaterMass: (x: number, y: number) => number;
}

export class OxygenSystem implements System {
  readonly name = 'oxygen';

  constructor(private cfg: OxygenSystemConfig) {}

  update(world: World, log: GameLog): void {
    for (const entity of world.query('position', 'dwarf', 'oxygen')) {
      const pos = entity.get<PositionComponent>('position')!;
      const d = entity.get<DwarfComponent>('dwarf')!;
      const o = entity.get<OxygenComponent>('oxygen')!;
      const h = entity.get<HealthComponent>('health');

      const mass = this.cfg.getWaterMass(pos.x, pos.y);
      if (mass >= WATER_SWIM_THRESHOLD) {
        // Submerged — drain oxygen
        o.current = Math.max(0, o.current - 1);
        if (o.current === 3) {
          log.add('system', `${d.name} is running out of air!`);
        }
        if (o.current <= 0 && h) {
          // Drowning! Take damage and respawn at surface
          h.current = Math.max(0, h.current - 2);
          log.add('system', `${d.name} drowns! Gasping, they surface with injuries.`);
          // Respawn at surface above current X
          pos.y = this.findSurfaceY(pos.x);
          o.current = o.max;
          if (h.current <= 0) {
            log.add('system', `${d.name} has perished from drowning.`);
          }
        }
      } else {
        // In air — restore oxygen
        if (o.current < o.max) {
          o.current = o.max;
        }
      }
    }
  }

  private findSurfaceY(x: number): number {
    const cx = Math.max(0, Math.min(this.cfg.terrainWidth - 1, x));
    // Walk up from surfaceY to find first air tile
    for (let y = this.cfg.surfaceY; y >= 0; y--) {
      if (this.cfg.getWaterMass(cx, y) < WATER_SWIM_THRESHOLD) {
        return y;
      }
    }
    return 0;
  }
}
