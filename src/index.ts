import { app, Menu, Tray } from 'electron';
import { DisplayAnalyzerService } from './services/display-analyzer-service';
import { Icons } from './services/icons';
import { InputTrackerService } from './services/input-tracker-service';
import { SettingsService } from './services/settings-service';

if (require('electron-squirrel-startup')) {
  shutdown();
}

let tray = null;
const settingsService = new SettingsService();
const displayAnalyzer = new DisplayAnalyzerService(settingsService);
let inputTrackerService: InputTrackerService = null;
app.on('ready', async () => {
  await settingsService.load();
  displayAnalyzer.generateLayout();
  inputTrackerService = new InputTrackerService(settingsService.getSettings());
  inputTrackerService.registerShortcuts();
  
  const trayMenu = Menu.buildFromTemplate([
    { label: 'Toggle Enabled State', click: () => inputTrackerService.toggleKeysEnabled(), checked: false, type: 'checkbox', id: 'enabled' },
    { label: 'Quit', click: () => shutdown() },
  ]);
  const enabledStateItem = trayMenu.getMenuItemById('enabled');
  inputTrackerService.setOnKeysEnabled(s => enabledStateItem.checked = s);

  tray = new Tray(Icons.getTrayIcon(), 'a8718098-ff8d-45a7-bc72-c5547037b64b');
  tray.setContextMenu(trayMenu);
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
  inputTrackerService.destroy();
  app.quit();
}