import type { Command } from './Command';
import type { Game } from '../Game';
import { Direction, DirectionVec, BlockMaterial, type CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { BlockTypeComponent } from '../components/BlockType';
import { MovableComponent } from '../components/Movable';
import { BLOCK_INFO } from '../terrain/BlockTypes';
import { isRappelling } from '../helpers';

export class DigCommand implements Command {
  readonly name = 'dig';

  constructor(private direction: Direction) {}

  execute(game: Game): CommandResult {
    if (isRappelling(game)) return { success: false, message: 'Cannot dig while on a rope.' };
    const dwarf = game.getMainDwarf();
    if (!dwarf) {
      return { success: false, message: 'No main dwarf found.' };
    }

    const pos = dwarf.get<PositionComponent>('position')!;
    const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;
    const delta = DirectionVec[this.direction];
    const targetX = pos.x + delta.x;
    const targetY = pos.y + delta.y;

    const targetBlock = game.getBlock({ x: targetX, y: targetY });

    if (targetBlock === BlockMaterial.Air) {
      return { success: false, message: 'Nothing to dig there.' };
    }

    const info = BLOCK_INFO[targetBlock];
    if (info.hardness < 0) {
      return { success: false, message: 'This rock is unbreakable.' };
    }

    // Dig the block — replace with air
    game.setBlock({ x: targetX, y: targetY }, BlockMaterial.Air);

    // Spawn a dropped material entity where the block was carved free.
    // Gravity will settle it to the nearest solid ground.
    if (info.drops) {
      const drop = game.world.spawn();
      drop
        .add(new PositionComponent(targetX, targetY))
        .add(new BlockTypeComponent(info.drops))
        .add(new MovableComponent(1));
    }

    game.log.add('action', `${dwarfComp.name} digs ${this.direction} through ${targetBlock}.`);

    if (targetBlock === BlockMaterial.Iron || targetBlock === BlockMaterial.Gold || targetBlock === BlockMaterial.Crystal) {
      game.log.add('discovery', `${dwarfComp.name} uncovers ${targetBlock}!`);
    }

    return { success: true, message: `Dug ${targetBlock} to the ${this.direction}.` };
  }
}
