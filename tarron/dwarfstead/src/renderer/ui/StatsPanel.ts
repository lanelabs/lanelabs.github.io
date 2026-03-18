import Phaser from 'phaser';
import type { Game } from '../../sim/Game';
import { PositionComponent } from '../../sim/components/Position';

const SESSION_KEY = 'dwarfstead-stats-panel';
const DEPTH = 100;

function getSessionVisible(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}
function setSessionVisible(v: boolean): void {
  if (v) sessionStorage.setItem(SESSION_KEY, '1');
  else sessionStorage.removeItem(SESSION_KEY);
}

export class StatsPanel {
  private text: Phaser.GameObjects.Text;

  constructor(private scene: Phaser.Scene) {
    this.text = scene.add.text(10, 10, '', {
      fontSize: '14px', fontFamily: 'monospace', color: '#e8c170',
      backgroundColor: '#1a1a2eCC', padding: { x: 6, y: 4 },
    }).setDepth(DEPTH).setVisible(getSessionVisible());
  }

  update(game: Game): void {
    if (!this.text.visible) return;
    const dwarf = game.getMainDwarf();
    const pos = dwarf?.get<PositionComponent>('position');
    const posStr = pos ? `Pos: (${pos.x}, ${pos.y})` : 'Pos: --';
    const mapStr = `Map: W${game.terrain.width} H${game.terrain.height}`;
    this.text.setText(`${posStr}  ${mapStr}`);
  }

  setPosition(x: number, y: number): void {
    this.text.setPosition(x, y);
  }

  isVisible(): boolean {
    return this.text.visible;
  }

  toggle(): void {
    const v = !this.text.visible;
    setSessionVisible(v);
    this.text.setVisible(v);
  }

  reposition(): void {
    // X stays at 10, Y is set externally via setY
  }
}
