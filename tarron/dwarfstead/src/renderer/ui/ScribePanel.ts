import Phaser from 'phaser';
import type { GameLog, LogCategory, LogEntry } from '../../sim/log/GameLog';

const PANEL_WIDTH = 350;
const PANEL_MARGIN = 10;
const LINE_HEIGHT = 18;

const CATEGORY_COLORS: Record<LogCategory, string> = {
  action: '#e0e0e0',
  discovery: '#FFD700',
  combat: '#FF4444',
  system: '#88AAFF',
  narration: '#a0a0b8',
};

export class ScribePanel {
  private log: GameLog;
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private visible = false;
  private textObjects: Phaser.GameObjects.Text[] = [];
  private scrollOffset = 0;
  private panelHeight: number;
  private maxSlots: number;
  private closeBtn!: Phaser.GameObjects.Text;

  /** Top of the scrollable content area. */
  private static readonly CONTENT_TOP = 42;
  /** Bottom padding below the last log entry. */
  private static readonly BOTTOM_PAD = 12;

  constructor(scene: Phaser.Scene, log: GameLog) {
    this.log = log;
    const gameW = scene.scale.width;
    const gameH = scene.scale.height;

    this.panelHeight = gameH - PANEL_MARGIN * 2;
    this.maxSlots = Math.floor((this.panelHeight - 60) / LINE_HEIGHT);

    const panelX = gameW - PANEL_WIDTH - PANEL_MARGIN;
    const panelY = PANEL_MARGIN;

    this.container = scene.add.container(panelX, panelY).setDepth(200).setVisible(false);

    // Background
    this.bg = scene.add.graphics();
    this.drawBg();
    this.container.add(this.bg);

    // Copy button (left side)
    const copyBtn = scene.add.text(14, 12, '[Copy]', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#88AAFF',
    }).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    copyBtn.on('pointerover', () => copyBtn.setColor('#FFD700'));
    copyBtn.on('pointerout', () => copyBtn.setColor('#88AAFF'));
    copyBtn.on('pointerdown', () => {
      const text = this.log.all().slice(this.log.sessionStartIndex)
        .map(e => this.formatEntry(e))
        .join('\n');
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.setText('Copied!');
        scene.time.delayedCall(1500, () => copyBtn.setText('[Copy]'));
      });
    });
    this.container.add(copyBtn);

    // Title (center)
    const title = scene.add.text(PANEL_WIDTH / 2, 12, 'The Scribe\'s Chronicle', {
      fontSize: '14px',
      fontFamily: 'serif',
      color: '#e8c170',
    }).setOrigin(0.5, 0);
    this.container.add(title);

    // Close button (top-right, near where [Scribe] button sits)
    this.closeBtn = scene.add.text(PANEL_WIDTH - 14, 10, '[Close]', {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#e8c170',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this.closeBtn.on('pointerover', () => this.closeBtn.setColor('#FFD700'));
    this.closeBtn.on('pointerout', () => this.closeBtn.setColor('#e8c170'));
    this.closeBtn.on('pointerdown', () => this.toggle());
    this.container.add(this.closeBtn);

    // Separator
    const sep = scene.add.graphics();
    sep.lineStyle(1, 0xe8c170, 0.3);
    sep.lineBetween(10, 35, PANEL_WIDTH - 10, 35);
    this.container.add(sep);

    // Pre-create text objects (positioned dynamically in refresh)
    for (let i = 0; i < this.maxSlots; i++) {
      const text = scene.add.text(10, 0, '', {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#e0e0e0',
        wordWrap: { width: PANEL_WIDTH - 20 },
      });
      this.textObjects.push(text);
      this.container.add(text);
    }

  }

  private drawBg() {
    this.bg.clear();
    this.bg.fillStyle(0x1a1a2e, 0.92);
    this.bg.fillRoundedRect(0, 0, PANEL_WIDTH, this.panelHeight, 8);
    this.bg.lineStyle(1, 0xe8c170, 0.6);
    this.bg.strokeRoundedRect(0, 0, PANEL_WIDTH, this.panelHeight, 8);
  }

  /** Reposition after a resize. */
  reposition(gameW: number, gameH: number) {
    this.container.setPosition(gameW - PANEL_WIDTH - PANEL_MARGIN, PANEL_MARGIN);
    this.panelHeight = gameH - PANEL_MARGIN * 2;
    this.maxSlots = Math.floor((this.panelHeight - 60) / LINE_HEIGHT);
    this.drawBg();
  }

  toggle(): void {
    this.visible = !this.visible;
    this.container.setVisible(this.visible);
    if (this.visible) {
      this.scrollOffset = 0;
      this.refresh();
    }
  }

  refresh(): void {
    if (!this.visible) return;

    const entries = this.log.all();
    const contentBottom = this.panelHeight - ScribePanel.BOTTOM_PAD;

    // Figure out how many entries we can show. We still use scrollOffset
    // to allow paging through history, but we position each text object
    // dynamically so wrapped lines don't overlap.
    const endEntryIdx = Math.max(0, entries.length - this.scrollOffset);
    const startIdx = Math.max(0, endEntryIdx - this.textObjects.length);

    let y = ScribePanel.CONTENT_TOP;

    for (let i = 0; i < this.textObjects.length; i++) {
      const entryIdx = startIdx + i;
      const text = this.textObjects[i];

      if (entryIdx < endEntryIdx) {
        const entry = entries[entryIdx];
        text.setText(this.formatEntry(entry));
        text.setColor(CATEGORY_COLORS[entry.category]);
        text.setY(y);

        // Check if this entry would overflow the content area
        if (y + text.height > contentBottom) {
          text.setVisible(false);
          continue;
        }

        text.setVisible(true);
        y += text.height + 4;
      } else {
        text.setVisible(false);
      }
    }
  }

  private formatEntry(entry: LogEntry): string {
    const tag = entry.category.slice(0, 3).toUpperCase();
    const repeat = entry.repeatCount && entry.repeatCount > 1 ? ` (x${entry.repeatCount})` : '';
    return `[t${entry.tick} ${tag}] ${entry.message}${repeat}`;
  }

  isVisible(): boolean {
    return this.visible;
  }
}
