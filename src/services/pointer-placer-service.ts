import { mouse } from "@nut-tree/nut-js";
import { BrowserWindow, dialog, Display, screen } from "electron";
import { DisplayMode } from "./display-analyzer-service";
import { Settings } from "./settings";

declare const REGION_PICKER_OVERLAY_WEBPACK_ENTRY: string;
declare const REGION_PICKER_OVERLAY_PRELOAD_WEBPACK_ENTRY: string;

export class PointerPlacerService {
  private readonly showOverlayDevTools = false;
  private overlays: Map<number, BrowserWindow> = new Map<number, BrowserWindow>();

  private options: Selection[][] = [];

  public constructor(private settings: Settings) {
  }

  public enable(): void {
    // Do nothing
  }

  public disable(): void {
    this.hideAllWindows([]);
  }

  public async showOptions(): Promise<void> {
    if (this.settings.pointer.displays.mode == DisplayMode.Single) {
      const display = this.findDisplay(0, 0);
      if (display == undefined) {
        dialog.showErrorBox('Display not found', 'Could not find desplay with at row 0, column 0');
        return;
      }
      await this.showOptionsForDisplayRegion(display.id, { x: display.bounds.x, y: display.bounds.y, width: display.bounds.width, height: display.bounds.height }, { x: 0, y: 0, width: display.bounds.width, height: display.bounds.height });
    } else if (this.settings.pointer.displays.mode == DisplayMode.Multi) {
      const displays = Array(3).fill(undefined).map((_, y) => Array(3).fill(undefined).map((_, x) => this.findDisplay(x, y)));
      await this.showOptionsForDisplays(displays);
    }
  }

  public async showOptionsForDisplays(displays: Display[][]): Promise<void> {
    this.resetOptions();
    this.hideAllWindows(displays.flat().filter(d => d != undefined).map(d => d.id));
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        const display = displays[y][x];
        if (display == undefined) continue;
        const displayRegion: Region = { x: display.bounds.x, y: display.bounds.y, width: display.bounds.width, height: display.bounds.height };
        const selectionRegion: Region = { x: 0, y: 0, width: display.bounds.width, height: display.bounds.height };
        this.options[y][x] = { 
          display: display.id,
          displayRegion: displayRegion,
          selectionRegion: selectionRegion
        };
        const window: BrowserWindow = await this.createOverlay(display.id, displayRegion);
        window.webContents.send('setTile', x, y, displayRegion.width, displayRegion.height);
      }
    }
  }

  public async showOptionsForDisplayRegion(display: number, displayRegion: Region, selectionRegion: Region): Promise<void> {
    this.resetOptions();
    console.log('generate options');
    this.fillOptions(display, displayRegion, selectionRegion);
    console.log('hide all windows');
    this.hideAllWindows([display]);
    console.log('fetch overlay');
    const window: BrowserWindow = await this.createOverlay(display, displayRegion);
    console.log('send region msg');
    window.webContents.send('setRegion', selectionRegion.x, selectionRegion.y, selectionRegion.width, selectionRegion.height);
  }

  private async fillOptions(display: number, displayRegion: Region, selectionRegion: Region): Promise<void> {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        this.options[row][col] = { display: display, displayRegion: displayRegion, selectionRegion: {
          x: selectionRegion.x + (selectionRegion.width * col / 3),
          y: selectionRegion.y + (selectionRegion.height * row / 3),
          width: selectionRegion.width / 3,
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
    window.setBounds({ x: displayRegion.x, y: displayRegion.y, width: displayRegion.width, height: displayRegion.height }, false);
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

  private hideAllWindows(except: number[]): void {
    for (const [display, window] of this.overlays) {
      if (except.includes(display)) continue;
      if (window.isVisible()) window.hide();
    }
  }

  private findDisplay(xIndex: number, yIndex: number): Display {
    return screen.getAllDisplays().find(d => d.id == this.settings.pointer.displays.layout[yIndex][xIndex]);
  }

  private resetOptions(): void {
    this.options = Array(3).fill(undefined).map(() => Array(3).fill(undefined));
  }

  public destroy(): void {
    for (const window of this.overlays.values()) {
      window.destroy();
    }
  }
}

export type Region = { x: number, y: number, width: number, height: number };
type Selection = { display: number, displayRegion: Region, selectionRegion: Region };