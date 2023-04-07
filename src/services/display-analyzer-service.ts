import { dialog, Display, screen } from 'electron';
import { SettingsService } from './settings-service';
export class DisplayAnalyzerService {
  private layout: DisplayLayout;

  public constructor(private settingsService: SettingsService) {

  }


  public generateLayout(): void {
    // Load from settings
    if (this.settingsService.getSettings().pointer.displays.locked) {
      const displaySettings = this.settingsService.getSettings().pointer.displays;
      this.layout = { layout: JSON.parse(JSON.stringify(displaySettings.layout)), mode: displaySettings.mode };
      return;
    }

    // Generate
    this.layout = {mode: DisplayMode.Single, layout: [[null, null, null], [null, null, null], [null, null, null]]};
    const primary = screen.getPrimaryDisplay();
    const otherDisplays = screen.getAllDisplays().filter(d => d.id != primary.id).sort(d => d.id);
    const inputSettings = this.settingsService.getSettings().input;
    if (otherDisplays.length == 0) this.generateSingleDisplayLayout(primary)
    else if (otherDisplays.length == 1) this.generateDualDisplayLayout(primary, otherDisplays[0]);
    else if (otherDisplays.length >= 8) this.generateDumpLayout(primary, otherDisplays);
    else this.generateAutoLayout(primary, otherDisplays)

    this.settingsService.getSettings().pointer.displays = {
      locked: false,
      mode: this.layout.mode,
      layout: JSON.parse(JSON.stringify(this.layout.layout)),
    }
    this.settingsService.save();
  }

  private generateSingleDisplayLayout(primary: Display): void {
    this.layout.mode = DisplayMode.Single;
    this.layout.layout[0][0] = primary.id;
  }

  private generateDualDisplayLayout(primary: Display, secondary: Display) {
    let primaryX = 0, primaryY = 0, secondaryX = 0, secondaryY = 0;

    if (primary.bounds.x + primary.bounds.width <= secondary.bounds.x) [primaryX, secondaryX] = [-1, 1];
    else if (secondary.bounds.x + secondary.bounds.width <= primary.bounds.x) [secondaryX, primaryX] = [-1, 1];
    else if (primary.bounds.y + primary.bounds.height <= secondary.bounds.y) [primaryY, secondaryY] = [-1, 1];
    else if (secondary.bounds.y + secondary.bounds.height <= primary.bounds.y) [secondaryY, primaryY] = [-1, 1];

    this.layout.mode = DisplayMode.Multi;
    this.layout.layout[1 + primaryY][1 + primaryX] = primary.id;
    this.layout.layout[1 + secondaryY][1 + secondaryX] = secondary.id;
  }

  private generateDumpLayout(primary: Display, otherDisplays: Display[]): void {
    this.layout.mode = DisplayMode.Multi;

    this.layout.layout[0][0] = primary.id;
    for (let i = 0; i < Math.min(otherDisplays.length, 8); i++) {
      const displayIndex = i + 1;
      const display = otherDisplays[i];
      this.layout.layout[Math.floor(displayIndex/3)][displayIndex % 3] = display.id;
    }
    
    dialog.showErrorBox('Failed Display Detection', 'Could not fit the current displays in a 3x3 layout, defaulting back to . Please open settings to configure it manually and lock it to re-use the layout on next start. Use the tray icon menu to view a list of displays.');
  }

  private generateAutoLayout(primary: Display, otherDisplays: Display[]): void {
    const layout = [[null, null, null], [null, primary.id, null], [null, null, null]];
    let occupied = false;
    for (const display of otherDisplays) {
      let x = 1, y = 1;
      if (primary.bounds.x + primary.bounds.width <= display.bounds.x) x = 2;
      else if (display.bounds.x + display.bounds.width <= primary.bounds.x) x = 0;
      if (primary.bounds.y + primary.bounds.height <= display.bounds.y) y = 2;
      else if (display.bounds.y + display.bounds.height <= primary.bounds.y) y = 0;

      if (layout[y][x] != undefined) {
        occupied = true;
        break;
      } else {
        layout[y][x] = display.id;
      }
    }

    if (occupied) {
      this.generateDumpLayout(primary, otherDisplays);
    } else {
      this.layout.mode = DisplayMode.Multi;
      this.layout.layout = layout;
    }
  }

  public getLayout(): DisplayLayout {
    return this.layout;
  }
}

export enum DisplayMode {
  Single = 1,
  Multi = 2
}
export type DisplayLayout = { mode: DisplayMode, layout: number[][] }