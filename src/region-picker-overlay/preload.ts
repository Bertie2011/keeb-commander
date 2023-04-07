import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import { MainProcessApi } from './bridgeApi';

contextBridge.exposeInMainWorld('mainProcessApi', {
  onSetRegion: (callback) => ipcRenderer.on('setRegion', (event: IpcRendererEvent, x: number, y: number, width: number, height: number) => callback(x, y, width, height)),
  onSetTile: (callback) => ipcRenderer.on('setTile', (event: IpcRendererEvent, xIndex: number, yIndex: number, width: number, height: number) => callback(xIndex, yIndex, width, height)),
} as MainProcessApi);