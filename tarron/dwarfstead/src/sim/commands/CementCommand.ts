import type { Command } from './Command';
import type { Game } from '../Game';
import { BlockMaterial, DirectionVec, type CommandResult } from '../types';
import { PositionComponent } from '../components/Position';
import { DwarfComponent } from '../components/Dwarf';
import { BlockTypeComponent } from '../components/BlockType';
import { findMovableAt, touchesSolidTerrain, isRappelling } from '../helpers';

/**
 * Cement: convert a loose block touching solid terrain into permanent terrain.
 * Used in Build mode to "glue" blocks to ceilings, walls, or floors.
 */
export class CementCommand implements Command {
  readonly name = 'cement';

  constructor(private targetX?: number, private targetY?: number) {}

  execute(game: Game): CommandResult {
    if (isRappelling(game)) return { success: false, message: 'Cannot cement while on a rope.' };
    const dwarf = game.getMainDwarf();
    if (!dwarf) return { success: false, message: 'No main dwarf found.' };

    const pos = dwarf.get<PositionComponent>('position')!;
    const dwarfComp = dwarf.get<DwarfComponent>('dwarf')!;

    // Resolve target from constructor args or dwarf facing
    let tx = this.targetX;
    let ty = this.targetY;
    if (tx === undefined || ty === undefined) {
      const delta = DirectionVec[dwarfComp.facingDirection];
      tx = pos.x + delta.x;
      ty = pos.y + delta.y;
    }

    const block = findMovableAt(game, tx, ty);
    if (!block) {
      return { success: false, message: 'No loose block to cement.' };
    }
    if (block.has('supplyCrate')) {
      return { success: false, message: 'Cannot cement a supply crate.' };
    }
    if (block.has('rubble')) {
      return { success: false, message: 'Rubble is too loose to cement.' };
    }

    if (!touchesSolidTerrain(game, tx, ty)) {
      return { success: false, message: 'Block must touch solid terrain to cement.' };
    }

    // Get block material
    const bt = block.get<BlockTypeComponent>('blockType');
    const material = bt ? bt.material : BlockMaterial.Stone;

    // GrassyDirt becomes plain Dirt when cemented
    const cementMaterial = material === BlockMaterial.GrassyDirt ? BlockMaterial.Dirt : material;

    // Clear any dwarf references to this block
    for (const e of game.world.query('dwarf')) {
      const d = e.get<DwarfComponent>('dwarf')!;
      if (d.overheadEntityId === block.id) d.overheadEntityId = null;
      if (d.tetheredEntityId === block.id) d.tetheredEntityId = null;
      if (d.carryingEntityId === block.id) d.carryingEntityId = null;
    }

    // Despawn entity and set terrain
    game.world.despawn(block.id);
    game.setBlock({ x: tx, y: ty }, cementMaterial);

    game.log.add('action', `${dwarfComp.name} cements a ${cementMaterial} block into place.`);
    return { success: true, message: `Cemented ${cementMaterial} block.` };
  }
}
