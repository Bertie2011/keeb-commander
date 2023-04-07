import { dialog } from 'electron';
import * as fs from 'fs/promises';
import { DisplayMode } from './display-analyzer-service';
import { Settings } from './settings';

export class SettingsService {
  private readonly settingsVersion = 1;
  private readonly settingsPath = 'settings.json';
  private settings: Settings;

  public getSettings(): Settings {
    return this.settings;
  }

  public async load(): Promise<void> {
    try {
      const json = await fs.readFile(this.settingsPath, 'utf8');
      this.settings = JSON.parse(json);
    } catch (error) {
      this.settings = this.createDefault();
      if (error.code === 'ENOENT') { // File did not exist
        await this.save();
        return;
      }
      dialog.showErrorBox('Error while loading settings', 'Could not load settings, default settings are assumed until restarted.');
    }
    if (this.settings.version != this.settingsVersion) {
      this.settings = this.createDefault();
      dialog.showErrorBox('Error while loading settings', `Settings version is not ${this.settingsVersion}, update your settings file using the upgrade guide online. Default settings are assumed until restarted.`);
    }
  }

  public async save(): Promise<boolean> {
    try {
      await fs.writeFile(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf8');
      return true;
    } catch (error) {
      dialog.showErrorBox('Error while saving settings', 'Could not save settings, any changes will be discarded.');
      return false;
    }
  }

  private createDefault(): Settings {
    return {
      version: this.settingsVersion,
      input: {
        enable: 'Meta+CmdOrCtrl+Alt+K',
        grid: {
          topLeft: 'W',
          top: 'E',
          topRight: 'R',
          left: 'S',
          center: 'D',
          right: 'F',
          bottomLeft: 'X',
          bottom: 'C',
          bottomRight: 'V'
        },
        leftMouseButton: 'J',
        rightMouseButton: 'L',
        showPointerGrid: 'K',
      },
      pointer: {
        displays: {
          locked: false,
          mode: DisplayMode.Single,
          layout: [[null, null, null], [null, null, null], [null, null, null]]
        },
        relativeMovement: {
          width: 480,
          height: 270,
        }
      }
    }
  }
}