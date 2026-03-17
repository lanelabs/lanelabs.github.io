import { SimulationBridge } from '../bridge';
import { serializeGame } from '../../sim/save';
import type { Game } from '../../sim/Game';
import { saveToSlot, setActiveSlot } from '../saveSlots';

const MODE_KEY = 'dwarfstead-mode';

export function createFreshBridge(gameW: number, gameH: number, zoomTileSize: number): SimulationBridge {
  const bridge = new SimulationBridge({
    seed: Date.now(), worldWidth: Math.max(80, Math.ceil(gameW / zoomTileSize) + 20),
    worldHeight: Math.max(60, Math.ceil(gameH / zoomTileSize) + 20), startingDwarves: 3,
  });
  bridge.init(); return bridge;
}

export function autoSave(
  game: Game, slotId: string | null, slotName: string, currentMode: number,
): void {
  try {
    if (!slotId) return;
    const data = serializeGame(game);
    saveToSlot(slotId, data, slotName);
    setActiveSlot(slotId);
    localStorage.setItem(MODE_KEY, String(currentMode));
  } catch { /* ignore */ }
}
