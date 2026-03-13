import type { Command } from './Command';
import type { Game } from '../Game';
import { Direction, DirectionVec, type CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { CreatureComponent } from '../components/Creature';
import { isRappelling } from '../helpers';

export class AttackCommand implements Command {
  readonly name = 'attack';

  constructor(private direction: Direction) {}

  execute(game: Game): CommandResult {
    if (isRappelling(game)) return { success: false, message: 'Cannot attack while on a rope.' };
    const dwarf = game.getMainDwarf();
    if (!dwarf) return { success: false, message: 'No main dwarf found.' };

    const pos = dwarf.get<PositionComponent>('position')!;
    const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;
    const delta = DirectionVec[this.direction];
    const tx = pos.x + delta.x;
    const ty = pos.y + delta.y;

    dwarfComp.facingDirection = this.direction;

    // Find creature at target position
    const creatures = game.world.query('position', 'creature').filter((e) => {
      const p = e.get<PositionComponent>('position')!;
      return p.x === tx && p.y === ty;
    });

    if (creatures.length === 0) {
      return { success: false, message: 'Nothing to attack there.' };
    }

    const target = creatures[0];
    const creature = target.get<CreatureComponent>('creature')!;

    // Deal damage (base 3, miners deal 4)
    const damage = dwarfComp.specialty === 'miner' ? 4 : 3;
    creature.hp -= damage;

    game.log.add('combat', `${dwarfComp.name} strikes the ${creature.name} for ${damage} damage!`);

    if (creature.hp <= 0) {
      game.world.despawn(target.id);
      game.log.add('combat', `The ${creature.name} is defeated!`);
      game.log.add('discovery', `The way is clear.`);
      return { success: true, message: `Defeated the ${creature.name}!` };
    }

    return { success: true, message: `Hit ${creature.name} (${creature.hp}/${creature.maxHp} HP).` };
  }
}
