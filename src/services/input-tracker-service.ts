import { globalShortcut } from 'electron';
import { Settings } from './settings';
import { PointerPlacerService } from './pointer-placer-service';
import { Button, mouse } from '@nut-tree/nut-js';
export class InputTrackerService {
  private enabled = false;
  private pointerGridVisible = false;
  private pointerPlacerService: PointerPlacerService;
  private registeredAccelerators: Electron.Accelerator[] = [];
  private onKeysEnabled: (state: boolean) => void;

  public constructor(private settings: Settings) {
    this.pointerPlacerService = new PointerPlacerService(settings);
  }

  public registerShortcuts() {
    globalShortcut.register(this.settings.input.enable, () => this.toggleKeysEnabled());
  }

  public toggleKeysEnabled() {
    this.setKeysEnabled(!this.enabled);
  }

  public setKeysEnabled(enabled: boolean) {
    if (enabled == this.enabled) return;
    this.enabled = enabled;
    if (this.onKeysEnabled != undefined) this.onKeysEnabled(enabled);

    if (!enabled) {
      this.registeredAccelerators.forEach(a => globalShortcut.unregister(a));
      this.registeredAccelerators = [];
      this.hidePointerGrid();
      return;
    }
    if (this.registeredAccelerators.length > 0) return;

    const grid = this.settings.input.grid;
    this.registeredAccelerators.push(grid.topLeft, grid.top, grid.topRight, grid.left, grid.center, grid.right, grid.bottomLeft, grid.bottom, grid.bottomRight);
    globalShortcut.register(grid.topLeft, () => this.onGridKeyPress(0, 0));
    globalShortcut.register(grid.top, () => this.onGridKeyPress(1, 0));
    globalShortcut.register(grid.topRight, () => this.onGridKeyPress(2, 0));
    globalShortcut.register(grid.left, () => this.onGridKeyPress(0, 1));
    globalShortcut.register(grid.center, () => this.onGridKeyPress(1, 1));
    globalShortcut.register(grid.right, () => this.onGridKeyPress(2, 1));
    globalShortcut.register(grid.bottomLeft, () => this.onGridKeyPress(0, 2));
    globalShortcut.register(grid.bottom, () => this.onGridKeyPress(1, 2));
    globalShortcut.register(grid.bottomRight, () => this.onGridKeyPress(2, 2));

    this.registeredAccelerators.push(this.settings.input.leftMouseButton, this.settings.input.rightMouseButton, this.settings.input.showPointerGrid);
    globalShortcut.register(this.settings.input.leftMouseButton, () => this.onActionKeyPress(ActionButton.Left));
    globalShortcut.register(this.settings.input.rightMouseButton, () => this.onActionKeyPress(ActionButton.Right));
    globalShortcut.register(this.settings.input.showPointerGrid, () => this.togglePointerGrid());
  }

  private async togglePointerGrid(): Promise<void> {
    if (!this.pointerGridVisible) await this.showPointerGrid();
    else this.hidePointerGrid();
  }

  private async showPointerGrid(): Promise<void> {
    if (this.pointerGridVisible) return;
    this.pointerGridVisible = true;
    this.pointerPlacerService.enable();
    await this.pointerPlacerService.showOptions();
  }

  private hidePointerGrid() {
    if (!this.pointerGridVisible) return;
    this.pointerGridVisible = false;
    this.pointerPlacerService.disable();
  }

  public destroy() {
    this.hidePointerGrid();
    this.pointerPlacerService.destroy();
    this.setKeysEnabled(false);
  }

  private async onGridKeyPress(x: number, y: number): Promise<void> {
    if (this.pointerGridVisible) await this.pointerPlacerService.selectSubRegion(x, y);
  }

  private async onActionKeyPress(actionButton: ActionButton): Promise<void> {
      if (actionButton == ActionButton.Left) mouse.click(Button.LEFT);
      if (actionButton == ActionButton.Right) mouse.click(Button.RIGHT);
      this.hidePointerGrid();
  }

  public setOnKeysEnabled(handler: (state: boolean) => void) {
    this.onKeysEnabled = handler;
  }
}
enum ActionButton {
  Left,
  Right
}