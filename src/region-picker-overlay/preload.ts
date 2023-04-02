import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { MainProcessApi } from './bridgeApi';

contextBridge.exposeInMainWorld('mainProcessApi', {
  onSetRegion: (callback) => ipcRenderer.on('setRegion', (event: IpcRendererEvent, dualHanded: boolean, x: number, y: number, width: number, height: number) => callback(dualHanded, x, y, width, height)),
} as MainProcessApi);