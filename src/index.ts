import { app, Menu, Tray } from 'electron';
import { DisplayAnalyzerService } from './services/display-analyzer-service';
import { Icons } from './services/icons';
import { ModeManagerService } from './services/mode-manager-service';
import { SettingsService } from './services/settings-service';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;


if (require('electron-squirrel-startup')) {
  shutdown();
}

let tray = null;
const settingsService = new SettingsService();
const displayAnalyzer = new DisplayAnalyzerService(settingsService);
let modeManagerService: ModeManagerService = null;
app.on('ready', async () => {
  await settingsService.load();
  displayAnalyzer.generateLayout();
  modeManagerService = new ModeManagerService(settingsService.getSettings());
  modeManagerService.registerShortcuts();

  tray = new Tray(Icons.getTrayIcon(), 'a8718098-ff8d-45a7-bc72-c5547037b64b');
  tray.setContextMenu(Menu.buildFromTemplate([{
    label: 'Quit', click: () => shutdown()
  }]));
  tray.setToolTip('Keeb Commander');
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  // if (BrowserWindow.getAllWindows().length === 0) {
  //   createWindow();
  // }
});

function shutdown() {
  modeManagerService.destroy();
  app.quit();
}