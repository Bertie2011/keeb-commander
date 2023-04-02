export type MainProcessApi = {
  onSetRegion: (callback: (dualHanded: boolean, x: number, y: number, width: number, height: number) => void) => void
};