import { NativeImage, nativeImage } from 'electron';
import path = require('path');

export class Icons {
  private static trayIcon: NativeImage;

  public static getTrayIcon(): NativeImage {
    if (this.trayIcon == undefined) this.trayIcon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'icons', 'tray', 'icon.png'));
    return this.trayIcon;
  }
}