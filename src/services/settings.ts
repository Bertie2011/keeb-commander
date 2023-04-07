import { DisplayLayout } from './display-analyzer-service';
export type Settings = {
  version: number,
  input: {
    enable: string,
    grid: {
      topLeft: string,
      top: string,
      topRight: string,
      left: string,
      center: string,
      right: string,
      bottomLeft: string,
      bottom: string,
      bottomRight: string
    },
    leftMouseButton: string,
    rightMouseButton: string,
    showPointerGrid: string
  },
  pointer: {
    displays: DisplayLayout & { locked: boolean };
  }
};