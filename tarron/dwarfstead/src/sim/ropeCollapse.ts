import type { Game } from './Game';
import { BlockMaterial } from './types';
import { PositionComponent } from './components/Position';
import { DwarfComponent } from './components/Dwarf';
import { RopeComponent } from './components/Rope';

/**
 * Collapse any ropes whose gallows beam was supported by the climbable at (cx, cy).
 * Detaches the dwarf if rappelling on a collapsed rope and refunds supplies.
 */
export function collapseRopesSupportedBy(game: Game, cx: number, cy: number): void {
  const ropes = game.world.query('position', 'rope');
  for (const ropeEntity of ropes) {
    const rp = ropeEntity.get<PositionComponent>('position')!;
    const rc = ropeEntity.get<RopeComponent>('rope')!;
    // Platform-anchored ropes: the anchor IS the climbable
    if (rp.x === cx && rp.y === cy) {
      collapseRope(game, ropeEntity, rc);
      continue;
    }
    // Platform/ladder-anchored ropes only collapse via the direct match above
    if (game.hasPlatform({ x: rp.x, y: rp.y }) || game.hasLadder({ x: rp.x, y: rp.y - 1 })) continue;
    // Gallows ropes: check if this climbable is adjacent (same scan as rendering)
    const dist = Math.abs(rp.x - cx);
    if (dist < 1 || dist > 5) continue;
    if (Math.abs(rp.y - cy) > 3) continue;
    // Verify this climbable was the nearest support (same scan as rendering)
    let nearest: number | null = null;
    for (let d = 1; d <= 5; d++) {
      for (const row of [rp.y, rp.y + 1, rp.y - 1, rp.y + 2, rp.y - 2, rp.y + 3, rp.y - 3]) {
        if (row < 0 || row >= game.terrain.height) continue;
        for (const dx of [-d, d]) {
          const sx = rp.x + dx;
          if (sx < 0 || sx >= game.terrain.width) continue;
          if (game.getBlock({ x: sx, y: row }) !== BlockMaterial.Air || game.hasClimbable({ x: sx, y: row })) {
            if (nearest === null || d < Math.abs(rp.x - nearest)) nearest = sx;
          }
        }
        if (nearest !== null) break;
      }
      if (nearest !== null) break;
    }
    if (nearest === cx) {
      collapseRope(game, ropeEntity, rc);
    }
  }
}

function collapseRope(game: Game, ropeEntity: { id: number }, rc: RopeComponent): void {
  // Detach dwarf if rappelling on this rope
  const md = game.getMainDwarf();
  if (md) {
    const dc = md.get<DwarfComponent>('dwarf')!;
    if (dc.rappelRopeId === ropeEntity.id) {
      dc.rappelRopeId = null;
    }
  }
  game.supplies += rc.suppliesRecoverable;
  game.world.despawn(ropeEntity.id);
  game.log.add('action', 'The rope collapses without its support.');
}
