import type { Game } from '../../sim/Game';
import type { Direction } from '../../sim/types';
import type { SceneUI } from './createSceneUI';
import { PositionComponent } from '../../sim/components/Position';
import { drawBackground, drawDebugOverlay, DEBUG_BG } from '../draw/background';
import { drawTerrain } from '../draw/terrain';
import { drawEntities as drawEntitiesLayer } from '../draw/entities';
import { drawCursor, drawRopeOverlay } from '../draw/cursor';
import { drawToolbar } from '../draw/toolbar';
import { SmartMode } from '../smartMode';
import { getActionHintText } from './actionHint';
import { isNoclipActive } from './noclipMode';

export interface RedrawContext {
  ui: SceneUI;
  game: Game;
  gameW: number;
  gameH: number;
  ts: number;
  tilesX: number;
  tilesY: number;
  mapOpen: boolean;
  selfSelect: boolean;
  hasActed: boolean;
  currentMode: SmartMode;
  pendingHeave: { verticalDir: Direction.Up | Direction.Down; blockX: number; blockY: number; leftAvailable: boolean; rightAvailable: boolean } | null;
  pendingHoist: { leftAvailable: boolean; rightAvailable: boolean } | null;
}

export function computeCamera(
  game: Game, mapOpen: boolean,
  gameW: number, gameH: number, ts: number, tilesX: number, tilesY: number,
): { camX: number; camY: number } {
  if (mapOpen) {
    const { width: tw, height: th } = game.terrain;
    return { camX: -Math.round((gameW - tw * ts) / (2 * ts)), camY: -Math.round((gameH - th * ts) / (2 * ts)) };
  }
  const dwarf = game.getMainDwarf();
  if (!dwarf) return { camX: 0, camY: 0 };
  const pos = dwarf.get<PositionComponent>('position')!;
  return {
    camX: pos.x - Math.floor(tilesX / 2),
    camY: pos.y - Math.floor(tilesY / 2),
  };
}

export function redrawScene(ctx: RedrawContext): void {
  const { ui, game, gameW, ts, tilesX, tilesY, mapOpen, selfSelect, currentMode } = ctx;
  const { camX, camY } = computeCamera(game, mapOpen, gameW, ctx.gameH, ts, tilesX, tilesY);

  drawBackground(ui.bgGraphics, game, ts, tilesX, tilesY, camX, camY);
  ui.debugGraphics.clear();
  if (DEBUG_BG) drawDebugOverlay(ui.bgGraphics, game.terrain, ts, tilesX, camX, camY);
  drawTerrain(ui.terrainGraphics, game, ts, tilesX, tilesY, camX, camY);
  drawEntitiesLayer(ui.entityGraphics, game, ts, gameW, ctx.gameH, camX, camY, selfSelect);

  if (mapOpen) {
    ui.cursorGraphics.clear();
    ui.ropeGraphics.clear();
    ui.toolbarGraphics.clear();
    ui.gridOverlay.setVisible(false);
    for (const lbl of ui.toolbarLabels) lbl.setVisible(false);
    ui.actionHint.setText('');
  } else {
    ui.gridOverlay.restoreSessionVisible();
    for (const lbl of ui.toolbarLabels) lbl.setVisible(true);
    drawCursor(ui.cursorGraphics, game, ts, camX, camY, {
      hasActed: ctx.hasActed, selfSelect, currentMode,
      pendingHeave: ctx.pendingHeave, pendingHoist: ctx.pendingHoist,
    });
    drawRopeOverlay(ui.ropeGraphics, game, ts, camX, camY);
    const topOff = ui.gridOverlay.getTopOffset();
    drawToolbar(ui.toolbarGraphics, gameW, currentMode, ui.toolbarLabels, topOff);
    ui.actionHint.setText(getActionHintText(game, currentMode, {
      pendingHeave: ctx.pendingHeave, pendingHoist: ctx.pendingHoist, selfSelect,
    }));
  }

  const topOff = ui.gridOverlay.getTopOffset();
  const leftOff = ui.gridOverlay.getLeftOffset();
  ui.hintsText.setX(10 + leftOff);
  ui.suppliesText.setPosition(10 + leftOff, 10 + topOff);
  ui.suppliesText.setText(`Supplies: ${game.supplies}`);
  const noclip = isNoclipActive(game);
  ui.noclipText.setVisible(noclip);
  const belowSupplies = 10 + topOff + ui.suppliesText.height + 4;
  ui.noclipText.setPosition(10 + leftOff, belowSupplies);
  ui.statsPanel.setPosition(10 + leftOff, noclip ? belowSupplies + ui.noclipText.height + 4 : belowSupplies);
  ui.scribeBtn.setPosition(gameW - 10, 10 + topOff);
  ui.zoomBtn.setPosition(gameW - 10, 36 + topOff);
  ui.regenBtn.setPosition(gameW - 10, 62 + topOff);
  ui.mapBtn.setPosition(gameW - 10, 88 + topOff);
  ui.gridOverlay.update(camX, camY, ts, tilesX, tilesY);
  ui.statsPanel.update(game);
  ui.scribePanel.refresh();
}
