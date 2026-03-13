import type { System } from '../ecs/System';
import type { World } from '../ecs/World';
import type { GameLog } from '../log/GameLog';
import { Season } from '../types';

export interface WaterState {
  waterLevel: number;   // Y coordinate — everything at y >= waterLevel is flooded (if air)
  season: Season;
  seasonTick: number;
  seasonLength: number;
  waterRiseRate: number;
  worldHeight: number;
  surfaceY: number;
}

export class WaterSystem implements System {
  readonly name = 'water';

  constructor(private state: WaterState) {}

  update(_world: World, log: GameLog): void {
    const s = this.state;
    s.seasonTick++;

    // Season transition
    if (s.seasonTick >= s.seasonLength) {
      s.seasonTick = 0;
      const oldSeason = s.season;
      s.season = s.season === Season.Dry ? Season.Wet : Season.Dry;
      if (s.season === Season.Wet) {
        log.add('system', 'The rains begin. The water table stirs below...');
      } else {
        log.add('system', 'The dry season arrives. The waters recede.');
      }
      if (oldSeason !== s.season) {
        log.add('narration', s.season === Season.Wet
          ? 'Water seeps through the cracks. Time to retreat upward.'
          : 'The tunnels dry out. Time to push deeper.');
      }
    }

    // Water level changes
    if (s.seasonTick % s.waterRiseRate === 0 && s.seasonTick > 0) {
      if (s.season === Season.Wet) {
        // Water rises (waterLevel decreases)
        const minLevel = s.surfaceY + 5; // Don't flood above near-surface
        if (s.waterLevel > minLevel) {
          s.waterLevel--;
        }
      } else {
        // Water recedes (waterLevel increases)
        const maxLevel = s.worldHeight - 2;
        if (s.waterLevel < maxLevel) {
          s.waterLevel++;
        }
      }
    }
  }
}
