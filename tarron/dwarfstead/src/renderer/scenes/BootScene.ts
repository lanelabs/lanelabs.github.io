import Phaser from 'phaser';
import {
  listSlots, deleteSlot, createSlot, migrateOldSave,
  MAX_SLOTS, setActiveSlot, getActiveSlot, getSlotMeta,
} from '../saveSlots';
import type { SlotMeta } from '../saveSlots';

export class BootScene extends Phaser.Scene {
  private slotButtons: Phaser.GameObjects.Text[] = [];
  private deleteButtons: Phaser.GameObjects.Text[] = [];
  private newBtn!: Phaser.GameObjects.Text;
  private headerLabel!: Phaser.GameObjects.Text;
  private namingOverlay: Phaser.GameObjects.DOMElement | null = null;

  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    migrateOldSave();
    // Auto-resume water lab if it was active on reload
    if (sessionStorage.getItem('dwarfstead_waterlab') === '1') {
      sessionStorage.removeItem('dwarfstead_waterlab');
      this.scene.start('WaterTestScene');
      return;
    }
    // Auto-resume last active slot on page load (browser refresh)
    const activeId = getActiveSlot();
    if (activeId) {
      const meta = getSlotMeta(activeId);
      if (meta) {
        this.scene.start('ExpeditionScene', { slotId: meta.id, slotName: meta.name });
        return;
      }
    }
    this.buildMenu();
  }

  private buildMenu(): void {
    // Clear previous objects
    this.children.removeAll(true);
    this.slotButtons = [];
    this.deleteButtons = [];
    this.namingOverlay = null;

    const { width, height } = this.scale;

    // Title
    this.add.text(width / 2, height * 0.2, 'DWARFSTEAD', {
      fontSize: '48px', fontFamily: 'serif', color: '#e8c170',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.2 + 50, 'Dig deep. Build well. Honor the mountain.', {
      fontSize: '16px', color: '#a0a0b8',
    }).setOrigin(0.5);

    // New Expedition button
    const slots = listSlots();
    const isFull = slots.length >= MAX_SLOTS;
    this.newBtn = this.add.text(width / 2, height * 0.2 + 100, '[ New Expedition ]', {
      fontSize: '20px', color: isFull ? '#555566' : '#e8c170',
    }).setOrigin(0.5);

    if (!isFull) {
      this.newBtn.setInteractive({ useHandCursor: true });
      this.newBtn.on('pointerover', () => this.newBtn.setColor('#ffffff'));
      this.newBtn.on('pointerout', () => this.newBtn.setColor('#e8c170'));
      this.newBtn.on('pointerdown', () => this.showNamingDialog());
    }

    // Water Test button
    const waterBtn = this.add.text(width / 2, height * 0.2 + 130, '[ Water Test Lab ]', {
      fontSize: '16px', color: '#4488ff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    waterBtn.on('pointerover', () => waterBtn.setColor('#88bbff'));
    waterBtn.on('pointerout', () => waterBtn.setColor('#4488ff'));
    waterBtn.on('pointerdown', () => this.scene.start('WaterTestScene'));

    // Saved expeditions header
    if (slots.length > 0) {
      this.headerLabel = this.add.text(width / 2, height * 0.2 + 165, 'Saved Expeditions:', {
        fontSize: '14px', color: '#a0a0b8',
      }).setOrigin(0.5);
    }

    // Slot buttons
    const startY = height * 0.2 + 195;
    slots.forEach((slot, i) => {
      this.addSlotRow(slot, startY + i * 36, width);
    });
  }

  private addSlotRow(slot: SlotMeta, y: number, screenW: number): void {
    const label = `[ Continue: ${slot.name}  - Turn ${slot.turn} ]`;
    const btn = this.add.text(screenW / 2 - 20, y, label, {
      fontSize: '16px', color: '#e8c170',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#ffffff'));
    btn.on('pointerout', () => btn.setColor('#e8c170'));
    btn.on('pointerdown', () => {
      setActiveSlot(slot.id);
      this.scene.start('ExpeditionScene', { slotId: slot.id, slotName: slot.name });
    });
    this.slotButtons.push(btn);

    // Delete button
    const delBtn = this.add.text(screenW / 2 + btn.width / 2 + 16, y, '[X]', {
      fontSize: '14px', color: '#ff6666',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    delBtn.on('pointerover', () => delBtn.setColor('#ff0000'));
    delBtn.on('pointerout', () => delBtn.setColor('#ff6666'));
    delBtn.on('pointerdown', () => this.confirmDelete(slot));
    this.deleteButtons.push(delBtn);
  }

  private confirmDelete(slot: SlotMeta): void {
    const { width, height } = this.scale;
    // Simple confirmation: overlay with yes/no
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(200);

    const prompt = this.add.text(width / 2, height / 2 - 30, `Delete "${slot.name}"?`, {
      fontSize: '20px', color: '#ff6666',
    }).setOrigin(0.5).setDepth(201);

    const yesBtn = this.add.text(width / 2 - 60, height / 2 + 20, '[ Yes ]', {
      fontSize: '18px', color: '#ff6666',
    }).setOrigin(0.5).setDepth(201).setInteractive({ useHandCursor: true });
    yesBtn.on('pointerover', () => yesBtn.setColor('#ff0000'));
    yesBtn.on('pointerout', () => yesBtn.setColor('#ff6666'));
    yesBtn.on('pointerdown', () => {
      deleteSlot(slot.id);
      overlay.destroy();
      prompt.destroy();
      yesBtn.destroy();
      noBtn.destroy();
      this.buildMenu();
    });

    const noBtn = this.add.text(width / 2 + 60, height / 2 + 20, '[ No ]', {
      fontSize: '18px', color: '#a0a0b8',
    }).setOrigin(0.5).setDepth(201).setInteractive({ useHandCursor: true });
    noBtn.on('pointerover', () => noBtn.setColor('#ffffff'));
    noBtn.on('pointerout', () => noBtn.setColor('#a0a0b8'));
    noBtn.on('pointerdown', () => {
      overlay.destroy();
      prompt.destroy();
      yesBtn.destroy();
      noBtn.destroy();
    });
  }

  private showNamingDialog(): void {
    if (this.namingOverlay) return;

    const html = `
      <div style="
        background: #1a1a2e; border: 2px solid #e8c170; border-radius: 8px;
        padding: 24px 32px; text-align: center; font-family: serif;
      ">
        <div style="color: #e8c170; font-size: 18px; margin-bottom: 12px;">
          Name your expedition:
        </div>
        <input id="expedition-name" type="text" maxlength="24" placeholder="Iron Delve"
          style="
            background: #2a2a3e; color: #e8c170; border: 1px solid #e8c170;
            border-radius: 4px; padding: 8px 12px; font-size: 16px;
            width: 200px; outline: none; font-family: monospace;
          "
        />
        <div style="margin-top: 16px;">
          <button id="begin-btn" style="
            background: #e8c170; color: #1a1a2e; border: none; border-radius: 4px;
            padding: 8px 20px; font-size: 16px; cursor: pointer; margin-right: 8px;
            font-family: serif;
          ">Begin</button>
          <button id="cancel-btn" style="
            background: #2a2a3e; color: #a0a0b8; border: 1px solid #a0a0b8;
            border-radius: 4px; padding: 8px 20px; font-size: 16px; cursor: pointer;
            font-family: serif;
          ">Cancel</button>
        </div>
      </div>
    `;

    const { width, height } = this.scale;
    this.namingOverlay = this.add.dom(width / 2, height / 2).createFromHTML(html);
    this.namingOverlay.setDepth(250);

    const input = this.namingOverlay.getChildByID('expedition-name') as HTMLInputElement;
    const beginBtn = this.namingOverlay.getChildByID('begin-btn') as HTMLButtonElement;
    const cancelBtn = this.namingOverlay.getChildByID('cancel-btn') as HTMLButtonElement;

    // Focus the input after a brief delay
    this.time.delayedCall(50, () => input?.focus());

    const startExpedition = () => {
      const name = (input?.value || '').trim() || 'Expedition';
      const slotId = createSlot(name);
      setActiveSlot(slotId);
      this.namingOverlay?.destroy();
      this.namingOverlay = null;
      this.scene.start('ExpeditionScene', { slotId, slotName: name });
    };

    beginBtn.addEventListener('click', startExpedition);
    cancelBtn.addEventListener('click', () => {
      this.namingOverlay?.destroy();
      this.namingOverlay = null;
    });
    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') startExpedition();
      if (e.key === 'Escape') {
        this.namingOverlay?.destroy();
        this.namingOverlay = null;
      }
    });
  }
}
