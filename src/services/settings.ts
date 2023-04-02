import { DisplayLayout } from './display-analyzer-service';
export type Settings = {
  version: number,
  input: {
    leftHand: {
      enabled: boolean,
      primary: boolean,
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
    rightHand: {
      enabled: boolean,
      primary: boolean,
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
    leftActionButton: string,
    rightActionButton: string
  },
  modes: {
    pointer: string,
    none: string,
    arrows: string
  },
  pointer: {
    displays: DisplayLayout & { locked: boolean };
  }
};