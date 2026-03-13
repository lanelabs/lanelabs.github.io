import type { Game } from '../sim/Game';
import type { LogEntry } from '../sim/log/GameLog';
import { PositionComponent } from '../sim/components/Position';
import { DwarfComponent } from '../sim/components/Dwarf';
import { BlockTypeComponent } from '../sim/components/BlockType';
import { CreatureComponent } from '../sim/components/Creature';
import { CompanionTaskComponent } from '../sim/components/CompanionTask';
import { HealthComponent } from '../sim/components/Health';
import { RopeComponent } from '../sim/components/Rope';
import { BLOCK_INFO } from '../sim/terrain/BlockTypes';

const VIEWPORT_W = 40;
const VIEWPORT_H = 20;

/** Render ASCII terrain centered on the main dwarf. */
export function renderTerrain(game: Game): string {
  const dwarf = game.getMainDwarf();
  if (!dwarf) return 'No dwarf to view from.';

  const pos = dwarf.get<PositionComponent>('position')!;
  const camX = pos.x - Math.floor(VIEWPORT_W / 2);
  const camY = pos.y - Math.floor(VIEWPORT_H / 2);

  // Build entity position lookup
  const entityMap = new Map<string, string>();
  for (const entity of game.world.all()) {
    const ePos = entity.get<PositionComponent>('position');
    if (!ePos) continue;
    const key = `${ePos.x},${ePos.y}`;

    if (entity.has('dwarf')) {
      const d = entity.get<DwarfComponent>('dwarf')!;
      if (d.isMainDwarf) {
        entityMap.set(key, '@');
      } else {
        const ct = entity.get<CompanionTaskComponent>('companionTask');
        entityMap.set(key, ct?.task === 'haul' ? 'H' : 'd');
      }
    } else if (entity.has('creature')) {
      const c = entity.get<CreatureComponent>('creature')!;
      entityMap.set(key, c.creatureType === 'cave_beetle' ? 'B' : 'C');
    } else if (entity.has('rope')) {
      // Draw rope range: anchor = ^, rope tiles = |
      const r = entity.get<RopeComponent>('rope')!;
      const rKey = `${ePos.x},${ePos.y}`;
      if (!entityMap.has(rKey)) entityMap.set(rKey, '^');
      for (let ri = 1; ri <= r.length; ri++) {
        const rkKey = `${ePos.x},${ePos.y + ri}`;
        if (!entityMap.has(rkKey)) entityMap.set(rkKey, '|');
      }
    } else if (entity.has('supplyCrate')) {
      if (!entityMap.has(key)) entityMap.set(key, '+');
    } else if (entity.has('climbable')) {
      if (!entityMap.has(key)) entityMap.set(key, '#');
    } else if (entity.has('blockType')) {
      if (!entityMap.has(key)) {
        const bt = entity.get<BlockTypeComponent>('blockType')!;
        entityMap.set(key, bt.material[0].toLowerCase());
      }
    }
  }

  const lines: string[] = [];
  let header = '    ';
  for (let x = 0; x < VIEWPORT_W; x++) {
    header += (camX + x) % 10 === 0 ? '|' : ' ';
  }
  lines.push(header);

  for (let vy = 0; vy < VIEWPORT_H; vy++) {
    const wy = camY + vy;
    let row = '';
    for (let vx = 0; vx < VIEWPORT_W; vx++) {
      const wx = camX + vx;
      const key = `${wx},${wy}`;

      if (entityMap.has(key)) {
        row += entityMap.get(key);
      } else if (wx < 0 || wx >= game.terrain.width || wy < 0 || wy >= game.terrain.height) {
        row += '~';
      } else if (game.isFlooded({ x: wx, y: wy })) {
        row += '~';
      } else {
        const block = game.terrain.blocks[wy][wx];
        row += BLOCK_INFO[block].displayChar;
      }
    }
    const lineNum = String(wy).padStart(3, ' ');
    // Mark water level and surface
    let marker = ' ';
    if (wy === game.waterState.waterLevel) marker = 'W';
    else if (wy === game.surfaceY) marker = 'S';
    lines.push(`${lineNum}${marker}${row}`);
  }

  // Legend
  lines.push('');
  lines.push('  @ You  d Companion  B Beetle  C Crab  # Ladder  ^| Rope  + Crate  ~ Water  S=Surface W=WaterLine');

  return lines.join('\n');
}

/** Format a log entry for display. */
function formatLogEntry(entry: LogEntry): string {
  const tag = `[${entry.category.toUpperCase()}]`.padEnd(13);
  const repeat = entry.repeatCount && entry.repeatCount > 1 ? ` (x${entry.repeatCount})` : '';
  return `  t${entry.tick} ${tag} ${entry.message}${repeat}`;
}

/** Render recent log entries. */
export function renderLog(game: Game, count = 10, category?: string): string {
  const entries = game.log.recent(
    count,
    category as LogEntry['category'] | undefined,
  );
  if (entries.length === 0) return '  (no log entries)';
  return entries.map(formatLogEntry).join('\n');
}

/** Render dwarf status. */
export function renderStatus(game: Game): string {
  const lines: string[] = [
    `  Tick: ${game.getCurrentTick()}  |  Season: ${game.waterState.season}  (${game.waterState.seasonTick}/${game.waterState.seasonLength})  |  Water level: y=${game.waterState.waterLevel}  |  Supplies: ${game.supplies}`,
    '',
  ];

  // Dwarves
  const dwarves = game.world.query('dwarf', 'position', 'health');
  for (const entity of dwarves) {
    const d = entity.get<DwarfComponent>('dwarf')!;
    const p = entity.get<PositionComponent>('position')!;
    const h = entity.get<HealthComponent>('health')!;
    const marker = d.isMainDwarf ? ' *' : '';
    const ct = entity.get<CompanionTaskComponent>('companionTask');
    const taskStr = ct ? ` [${ct.task}${ct.ticksRemaining > 0 ? ` ${ct.ticksRemaining}t` : ''}]` : '';
    const carryStr = d.carryingEntityId ? ' (carrying)' : '';
    lines.push(`  ${d.name} (${d.specialty})${marker}  HP: ${h.current}/${h.max}  Pos: (${p.x}, ${p.y})${taskStr}${carryStr}`);
  }

  // Creatures
  const creatures = game.world.query('position', 'creature');
  if (creatures.length > 0) {
    lines.push('');
    lines.push('  Creatures:');
    for (const e of creatures) {
      const c = e.get<CreatureComponent>('creature')!;
      const p = e.get<PositionComponent>('position')!;
      lines.push(`    ${c.name}  HP: ${c.hp}/${c.maxHp}  Pos: (${p.x}, ${p.y})`);
    }
  }

  // Dropped items
  const items = game.world.query('blockType', 'position');
  if (items.length > 0) {
    const counts = new Map<string, number>();
    const atSurface = new Map<string, number>();
    for (const item of items) {
      const bt = item.get<BlockTypeComponent>('blockType')!;
      const ip = item.get<PositionComponent>('position')!;
      counts.set(bt.material, (counts.get(bt.material) || 0) + 1);
      if (ip.y <= game.surfaceY) {
        atSurface.set(bt.material, (atSurface.get(bt.material) || 0) + 1);
      }
    }
    lines.push('');
    lines.push('  Materials (total / at surface):');
    for (const [mat, count] of counts) {
      const surface = atSurface.get(mat) || 0;
      lines.push(`    ${mat}: ${count} total, ${surface} at surface`);
    }
  }

  // Hidden rooms info
  const rooms = game.terrain.rooms;
  if (rooms.length > 0) {
    lines.push('');
    lines.push(`  Hidden rooms: ${rooms.length} (${rooms.map(r => r.type).join(', ')})`);
  }

  return lines.join('\n');
}

/** Render block info at a position relative to main dwarf. */
export function renderInspect(game: Game, dx: number, dy: number): string {
  const dwarf = game.getMainDwarf();
  if (!dwarf) return 'No main dwarf.';
  const pos = dwarf.get<PositionComponent>('position')!;
  const tx = pos.x + dx;
  const ty = pos.y + dy;
  const block = game.getBlock({ x: tx, y: ty });
  const info = BLOCK_INFO[block];

  const lines = [
    `  Block at (${tx}, ${ty}): ${block}`,
    `  Hardness: ${info.hardness < 0 ? 'unbreakable' : info.hardness}`,
    `  Drops: ${info.drops ?? 'nothing'}`,
    `  Flooded: ${game.isFlooded({ x: tx, y: ty }) ? 'yes' : 'no'}`,
    `  Ladder: ${game.hasLadder({ x: tx, y: ty }) ? 'yes' : 'no'}  Platform: ${game.hasClimbable({ x: tx, y: ty }) && !game.hasLadder({ x: tx, y: ty }) ? 'yes' : 'no'}`,
  ];

  const entities = game.world.query('position').filter((e) => {
    const p = e.get<PositionComponent>('position')!;
    return p.x === tx && p.y === ty;
  });
  if (entities.length > 0) {
    lines.push(`  Entities here: ${entities.length}`);
    for (const e of entities) {
      lines.push(`    #${e.id}: [${e.kinds().join(', ')}]`);
    }
  }

  return lines.join('\n');
}
