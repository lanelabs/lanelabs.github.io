import { SimulationBridge } from '../bridge';
import { serializeGame } from '../../sim/save';
import type { Game } from '../../sim/Game';
import { saveToSlot, setActiveSlot, loadSlot } from '../saveSlots';

const MODE_KEY = 'dwarfstead-mode';

export function createFreshBridge(_gameW: number, _gameH: number, _zoomTileSize: number): SimulationBridge {
  const bridge = new SimulationBridge({
    seed: Date.now(), worldWidth: 200,
    worldHeight: 400, startingDwarves: 3,
  });
  bridge.init(); return bridge;
}

export function initBridge(
  slotId: string | null, makeFresh: () => SimulationBridge,
): SimulationBridge {
  const saveData = slotId ? loadSlot(slotId) : null;
  if (!saveData) return makeFresh();
  try {
    const b = SimulationBridge.fromSaveData(saveData);
    b.game.log.markSessionStart();
    b.game.log.add('narration', 'You awaken from a brief rest. The mountain still calls.');
    return b;
  } catch { return makeFresh(); }
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
