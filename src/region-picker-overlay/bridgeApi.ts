export type MainProcessApi = {
  onSetRegion: (callback: (x: number, y: number, width: number, height: number) => void) => void
  onSetTile: (callback: (xIndex: number, yIndex: number, width: number, height: number) => void) => void
};