import { Button, mouse } from "@nut-tree/nut-js";
import { BrowserWindow, dialog, Display, screen } from "electron";
import { DisplayMode } from "./display-analyzer-service";
import { Settings } from "./settings";

declare const REGION_PICKER_OVERLAY_WEBPACK_ENTRY: string;
declare const REGION_PICKER_OVERLAY_PRELOAD_WEBPACK_ENTRY: string;

export class PointerPlacerService {
  private readonly showOverlayDevTools = false;
  private overlays: Map<number, BrowserWindow> = new Map<number, BrowserWindow>();
  private requestDisableHandler: () => void;

  private options: Selection[][] = [];

  public constructor(private settings: Settings) {
  }

  public enable(requestDisableHandler: () => void): void {
    this.requestDisableHandler = requestDisableHandler;
  }

  public disable(): void {
    this.hideAllWindows([]);
  }

  public async showOptions(): Promise<void> {
    if (this.settings.pointer.displays.mode == DisplayMode.Single) {
      const display = this.findDisplay(0, 0);
      if (display == undefined) return;
      await this.showOptionsForDisplayRegion(display.id, { x: display.bounds.x, y: display.bounds.y, width: display.bounds.width, height: display.bounds.height }, { x: 0, y: 0, width: display.bounds.width, height: display.bounds.height });
    } else if (this.settings.pointer.displays.mode == DisplayMode.Dual) {
      const leftDisplay = this.findDisplay(0, 0), rightDisplay = this.findDisplay(1, 0);
      if (leftDisplay == undefined || rightDisplay == undefined) return;
      await this.showOptionsForTwoDisplays(leftDisplay, rightDisplay);
    }
  }

  public async showOptionsForDisplayRegion(display: number, displayRegion: Region, selectionRegion: Region): Promise<void> {
    this.resetOptions();
    console.log('calc button grid size');
    let xOffset, width;
    if (this.settings.input.leftHand.enabled && !this.settings.input.rightHand.enabled) {
      xOffset = 0, width = 3;
    } else if (!this.settings.input.leftHand.enabled && this.settings.input.rightHand.enabled) {
      xOffset = 3, width = 3;
    } else {
      const dualHandedRecommended = Math.abs(1 - (selectionRegion.width / 2) / selectionRegion.height) < Math.abs(1 - selectionRegion.width / selectionRegion.height);
      if (dualHandedRecommended) xOffset = 0, width = 6;
      else if (this.settings.input.leftHand.primary) xOffset = 0, width = 3;
      else xOffset = 3, width = 3;
    }
    console.log('generate options');
    this.fillOptions(display, displayRegion, selectionRegion, xOffset, width);
    console.log('hide all windows');
    this.hideAllWindows([display]);
    console.log('fetch overlay');
    const window: BrowserWindow = await this.createOverlay(display, displayRegion);
    console.log('send region msg')
    window.webContents.send('setRegion', width == 6, selectionRegion.x, selectionRegion.y, selectionRegion.width, selectionRegion.height);
  }

  public async showOptionsForTwoDisplays(leftDisplay: Display, rightDisplay: Display): Promise<void> {
    this.resetOptions();
    const leftDisplayRegion = { x: leftDisplay.bounds.x, y: leftDisplay.bounds.y, width: leftDisplay.bounds.width, height: leftDisplay.bounds.height };
    const leftSelectionRegion = { x: 0, y: 0, width: leftDisplay.bounds.width, height: leftDisplay.bounds.height };
    this.fillOptions(leftDisplay.id, leftDisplayRegion, leftSelectionRegion, 0, 3);
    const rightDisplayRegion = { x: rightDisplay.bounds.x, y: rightDisplay.bounds.y, width: rightDisplay.bounds.width, height: rightDisplay.bounds.height };
    const rightSelectionRegion = { x: 0, y: 0, width: rightDisplay.bounds.width, height: rightDisplay.bounds.height };
    this.fillOptions(rightDisplay.id, rightDisplayRegion, rightSelectionRegion, 3, 3);
    
    this.hideAllWindows([leftDisplay.id, rightDisplay.id]);
    const leftWindow: BrowserWindow = await this.createOverlay(leftDisplay.id, leftDisplayRegion);
    leftWindow.webContents.send('setRegion', false, leftSelectionRegion.x, leftSelectionRegion.y, leftSelectionRegion.width, leftSelectionRegion.height);
    const rightWindow: BrowserWindow = await this.createOverlay(rightDisplay.id, rightDisplayRegion);
    rightWindow.webContents.send('setRegion', false, rightSelectionRegion.x, rightSelectionRegion.y, rightSelectionRegion.width, rightSelectionRegion.height);
  }

  private async fillOptions(display: number, displayRegion: Region, selectionRegion: Region, xOffset: number, width: number): Promise<void> {
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 6; x++) {
        if (x < xOffset || x >= xOffset + width) continue;
        
        const row = y, col = x - xOffset;
        this.options[y][x] = { display: display, displayRegion: displayRegion, selectionRegion: {
          x: selectionRegion.x + (selectionRegion.width * col / width),
          y: selectionRegion.y + (selectionRegion.height * row / 3),
          width: selectionRegion.width / width,
          height: selectionRegion.height / 3,
        } };
      }
    }
  }

  public async selectSubRegion(xTile: number, yTile: number): Promise<void> {
    const selection = this.options[yTile][xTile];
    if (selection == undefined) return;
    console.log('set mouse pos');
    mouse.setPosition({x: selection.displayRegion.x + selection.selectionRegion.x + selection.selectionRegion.width/2, y: selection.displayRegion.y + selection.selectionRegion.y + selection.selectionRegion.height/2 });
    console.log('call set show options');
    await this.showOptionsForDisplayRegion(selection.display, selection.displayRegion, selection.selectionRegion);
  }

  private createOverlay(display: number, displayRegion: Region): Promise<BrowserWindow> {
    let window = this.overlays.get(display);
    if (window != undefined) {
      if (!window.isVisible()) window.showInactive();
      return Promise.resolve(window);
    }

    window = new BrowserWindow({
      fullscreen: true,
      useContentSize: true,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      focusable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      hiddenInMissionControl: true,
      frame: false,
      enableLargerThanScreen: true,
      transparent: true,
      roundedCorners: false,
      thickFrame: false,
      show: false,
      webPreferences: {
        backgroundThrottling: true,
        preload: REGION_PICKER_OVERLAY_PRELOAD_WEBPACK_ENTRY
      }
    });
    window.setContentBounds({ x: displayRegion.x, y: displayRegion.y, width: displayRegion.width, height: displayRegion.height }, false);
    window.setAlwaysOnTop(true, 'pop-up-menu');
    window.setIgnoreMouseEvents(true);

    if (this.showOverlayDevTools) {
      window.webContents.openDevTools({mode: 'detach'});
    }
    window.loadURL(REGION_PICKER_OVERLAY_WEBPACK_ENTRY);

    this.overlays.set(display, window);

    return new Promise<BrowserWindow>((resolve) => {
      window.on('ready-to-show', () => {
        window.showInactive();
        resolve(window);
      });
    });
  }

  public click(button: MouseClick) {
    if (button == MouseClick.Left) mouse.click(Button.LEFT);
    if (button == MouseClick.Right) mouse.click(Button.RIGHT);
    this.requestDisableHandler();
  }

  private hideAllWindows(except: number[]): void {
    for (const [display, window] of this.overlays) {
      if (except.includes(display)) continue;
      if (window.isVisible()) window.hide();
    }
  }

  private findDisplay(xIndex: number, yIndex: number): Display {
    const display = screen.getAllDisplays().find(d => d.id == this.settings.pointer.displays.layout[yIndex][xIndex]);
    if (display == undefined) {
      dialog.showErrorBox('Display not found', `Could not find desplay with id ${this.settings.pointer.displays.layout[yIndex][xIndex]}`);
      return;
    }
    return display;
  }

  private resetOptions(): void {
    this.options = Array(3).fill(undefined).map(() => Array(6).fill(undefined));
  }

  public destroy(): void {
    for (const window of this.overlays.values()) {
      window.destroy();
    }
  }
}

export type Region = { x: number, y: number, width: number, height: number };
export enum MouseClick {
  Left,
  Right
}
type Selection = { display: number, displayRegion: Region, selectionRegion: Region };