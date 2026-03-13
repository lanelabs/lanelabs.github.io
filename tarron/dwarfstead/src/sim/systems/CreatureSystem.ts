import type { System } from '../ecs/System';
import type { World } from '../ecs/World';
import type { GameLog } from '../log/GameLog';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { HealthComponent } from '../components/Health';
import { CreatureComponent } from '../components/Creature';

export class CreatureSystem implements System {
  readonly name = 'creature';

  update(world: World, log: GameLog): void {
    const creatures = world.query('position', 'creature');
    const dwarves = world.query('position', 'dwarf', 'health');

    for (const creature of creatures) {
      const cPos = creature.get<PositionComponent>('position')!;
      const cComp = creature.get<CreatureComponent>('creature')!;

      // Check if any dwarf is adjacent
      for (const dwarf of dwarves) {
        const dPos = dwarf.get<PositionComponent>('position')!;
        const dist = Math.abs(dPos.x - cPos.x) + Math.abs(dPos.y - cPos.y);
        if (dist <= 1) {
          // Creature attacks the dwarf
          const hp = dwarf.get<HealthComponent>('health')!;
          const dComp = dwarf.get<DwarfComponent>('dwarf')!;
          hp.current -= cComp.damage;
          log.add('combat', `The ${cComp.name} attacks ${dComp.name} for ${cComp.damage} damage! (${hp.current}/${hp.max} HP)`);

          if (hp.current <= 0) {
            log.add('combat', `${dComp.name} has fallen!`);
          }
          break; // One attack per creature per tick
        }
      }
    }
  }
}
