import { globalShortcut } from 'electron';
import { Settings } from './settings';
import { MouseClick, PointerPlacerService } from './pointer-placer-service';
export class ModeManagerService {
  private mode = InputMode.None;
  private pointerPlacerService: PointerPlacerService;
  private registeredAccelerators: Electron.Accelerator[] = [];

  public constructor(private settings: Settings) {
    this.pointerPlacerService = new PointerPlacerService(settings);
  }

  public registerShortcuts() {
    globalShortcut.register(this.settings.modes.pointer, () => this.togglePointerPlacer());
    globalShortcut.register(this.settings.modes.none, () => this.enableNone());
  }

  private async togglePointerPlacer(): Promise<void> {
    if (this.mode != InputMode.PointerPlacer) await this.enablePointerPlacer();
    else this.enableNone();
  }

  private async enablePointerPlacer(): Promise<void> {
    if (this.mode == InputMode.PointerPlacer) return;
    this.enableNone();
    this.mode = InputMode.PointerPlacer;
    this.setKeysEnabled(true);

    this.pointerPlacerService.enable(() => this.enableNone());
    await this.pointerPlacerService.showOptions();
  }

  private enableNone() {
    if (this.mode == InputMode.None) return;
    if (this.mode == InputMode.PointerPlacer) this.pointerPlacerService.disable();
    this.mode = InputMode.None;
    this.setKeysEnabled(false);
  }

  public destroy() {
    this.enableNone();
    this.pointerPlacerService.destroy();
  }

  public setKeysEnabled(enabled: boolean) {
    if (!enabled) {
      this.registeredAccelerators.forEach(a => globalShortcut.unregister(a));
      this.registeredAccelerators = [];
      return;
    }
    if (this.registeredAccelerators.length > 0) return;

    const leftHand = this.settings.input.leftHand;
    if (leftHand.enabled) {
      this.registeredAccelerators.push(leftHand.topLeft, leftHand.top, leftHand.topRight, leftHand.left, leftHand.center, leftHand.right, leftHand.bottomLeft, leftHand.bottom, leftHand.bottomRight);
      globalShortcut.register(leftHand.topLeft, () => this.onGridKeyPress(true, 0, 0));
      globalShortcut.register(leftHand.top, () => this.onGridKeyPress(true, 1, 0));
      globalShortcut.register(leftHand.topRight, () => this.onGridKeyPress(true, 2, 0));
      globalShortcut.register(leftHand.left, () => this.onGridKeyPress(true, 0, 1));
      globalShortcut.register(leftHand.center, () => this.onGridKeyPress(true, 1, 1));
      globalShortcut.register(leftHand.right, () => this.onGridKeyPress(true, 2, 1));
      globalShortcut.register(leftHand.bottomLeft, () => this.onGridKeyPress(true, 0, 2));
      globalShortcut.register(leftHand.bottom, () => this.onGridKeyPress(true, 1, 2));
      globalShortcut.register(leftHand.bottomRight, () => this.onGridKeyPress(true, 2, 2));
    }
    const rightHand = this.settings.input.rightHand;
    if (rightHand.enabled) {
      this.registeredAccelerators.push(rightHand.topLeft, rightHand.top, rightHand.topRight, rightHand.left, rightHand.center, rightHand.right, rightHand.bottomLeft, rightHand.bottom, rightHand.bottomRight);
      globalShortcut.register(rightHand.topLeft, () => this.onGridKeyPress(false, 0, 0));
      globalShortcut.register(rightHand.top, () => this.onGridKeyPress(false, 1, 0));
      globalShortcut.register(rightHand.topRight, () => this.onGridKeyPress(false, 2, 0));
      globalShortcut.register(rightHand.left, () => this.onGridKeyPress(false, 0, 1));
      globalShortcut.register(rightHand.center, () => this.onGridKeyPress(false, 1, 1));
      globalShortcut.register(rightHand.right, () => this.onGridKeyPress(false, 2, 1));
      globalShortcut.register(rightHand.bottomLeft, () => this.onGridKeyPress(false, 0, 2));
      globalShortcut.register(rightHand.bottom, () => this.onGridKeyPress(false, 1, 2));
      globalShortcut.register(rightHand.bottomRight, () => this.onGridKeyPress(false, 2, 2));
    }
    this.registeredAccelerators.push(this.settings.input.leftActionButton, this.settings.input.rightActionButton);
    globalShortcut.register(this.settings.input.leftActionButton, () => this.onActionKeyPress(ActionButton.Left));
    globalShortcut.register(this.settings.input.rightActionButton, () => this.onActionKeyPress(ActionButton.Right));
  }

  public async onGridKeyPress(leftHand: boolean, x: number, y: number): Promise<void> {
    if (this.mode == InputMode.PointerPlacer) await this.pointerPlacerService.selectSubRegion(leftHand ? x : x + 3, y);
  }

  public async onActionKeyPress(actionButton: ActionButton): Promise<void> {
    if (this.mode == InputMode.PointerPlacer) {
      if (actionButton == ActionButton.Left) await this.pointerPlacerService.click(MouseClick.Left);
      if (actionButton == ActionButton.Right) await this.pointerPlacerService.click(MouseClick.Right);
    }
  }
}

enum InputMode {
  None,
  PointerPlacer
}
enum ActionButton {
  Left,
  Right
}