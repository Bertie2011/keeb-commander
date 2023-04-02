import { describe, expect, jest, test} from '@jest/globals';
import { Display } from 'electron';
import { DisplayAnalyzerService, DisplayLayout, DisplayMode } from './display-analyzer-service';
import { Settings } from './settings';
import { SettingsService } from './settings-service';

jest.mock('electron', () => ({
  screen: {
    getPrimaryDisplay: () => displays[0],
    getAllDisplays: () => displays
  },
  dialog: {
    showErrorBox: () => { /* Do nothing */ },
  }
}));

const settingsService = new SettingsService();
let settings: Settings;
let displays: Display[] = [];
jest.spyOn(settingsService, 'save').mockImplementation(() => Promise.resolve(true));
jest.spyOn(settingsService, 'getSettings').mockImplementation(() => settings);

function createSettings(leftPrimary: boolean, leftEnabled: boolean, rightEnabled: boolean, rightPrimary: boolean) {
  return {
    input: {
      leftHand: {
        enabled: leftEnabled,
        primary: leftPrimary
      },
      rightHand: {
        enabled: rightEnabled,
        primary: rightPrimary
      }
    },
    pointer: {
      displays: {
        locked: false,
      }
    }
  } as Partial<Settings> as Settings;
}
function createDisplay(id: number, x: number, y: number, width: number, height: number): Display {
  return {
    id: id,
    bounds: {x, y, width, height}
  } as Partial<Display> as Display
}
function createDisplayTile(id: number, xTile: number, yTile: number) {
  return createDisplay(id, xTile * 600, yTile * 400, 600, 400);
}

describe('Display Analyzer', () => {
  describe('1 Display', () => {
    test('Outputs single handed mode', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplay(1, 0, 0, 500, 500)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Single,
        layout: [
          [1, null, null],
          [null, null, null],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
  });
  describe('9+ Displays', () => {
    test('Should be dumped', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplay(1, 0, 0, 500, 500), createDisplay(2, 0, 0, 500, 500), createDisplay(3, 0, 0, 500, 500), createDisplay(4, 0, 0, 500, 500), createDisplay(5, 0, 0, 500, 500), createDisplay(6, 0, 0, 500, 500), createDisplay(7, 0, 0, 500, 500), createDisplay(8, 0, 0, 500, 500), createDisplay(9, 0, 0, 500, 500), createDisplay(10, 0, 0, 500, 500)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9]
        ]
      } as DisplayLayout);
    });
  });
  describe('2 Displays', () => {
    test('Dual-Handed, Primary Left', () => {
      settings = createSettings(true, true, true, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, 1, 0)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Dual,
        layout: [
          [1, 2, null],
          [null, null, null],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('Dual-Handed, Primary Right', () => {
      settings = createSettings(true, true, true, false);
      displays = [createDisplayTile(1, 1, 0), createDisplayTile(2, 0, 0)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Dual,
        layout: [
          [2, 1, null],
          [null, null, null],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('Dual-Handed, Overlap, Left Handed', () => {
      settings = createSettings(true, true, true, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, 0.5, 1)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Dual,
        layout: [
          [1, 2, null],
          [null, null, null],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('Dual-Handed, Overlap, Right Handed', () => {
      settings = createSettings(false, true, true, true);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, 0.5, 1)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Dual,
        layout: [
          [2, 1, null],
          [null, null, null],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('Single-Handed, Primary Left', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, 1, 0)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [null, null, null],
          [1, null, 2],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('Single-Handed, Primary Left Up', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, 1, 1)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [null, null, null],
          [1, null, 2],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('Single-Handed, Primary Left Down', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, 1, -1)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [null, null, null],
          [1, null, 2],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('Single-Handed, Primary Up', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, 0.5, 1)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [null, 1, null],
          [null, null, null],
          [null, 2, null]
        ]
      } as DisplayLayout);
    });
    test('Single-Handed, Primary Down', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, -0.5, -1)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [null, 2, null],
          [null, null, null],
          [null, 1, null]
        ]
      } as DisplayLayout);
    });
    test('Single-Handed, Primary Right', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, -1, 0)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [null, null, null],
          [2, null, 1],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('Single-Handed, Primary Right Up', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, -1, 1)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [null, null, null],
          [2, null, 1],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('Single-Handed, Primary Right Down', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, -1, -1)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [null, null, null],
          [2, null, 1],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
  });
  describe('Many Displays', () => {
    test('3 Horizontal with laptop', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplay(1, 0, 0, 600, 400), createDisplay(2, -450, 100, 450, 300), createDisplay(3, 600, 0, 600, 400)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [null, null, null],
          [2, 1, 3],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('3 Horizontal with vertical', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplay(1, 0, 0, 600, 400), createDisplay(2, -400, -100, 400, 600), createDisplay(3, 600, 0, 600, 400)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [null, null, null],
          [2, 1, 3],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('3 Horizontal with primary on the side', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplayTile(1, -1, 0), createDisplayTile(2, 0, 0), createDisplayTile(3, 1, 0)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [1, 2, 3],
          [null, null, null],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('3 Corner down', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, -1, 0), createDisplayTile(3, 0, 1)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [null, null, null],
          [2, 1, null],
          [null, 3, null]
        ]
      } as DisplayLayout);
    });
    test('3 double stacked with extra', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplay(1, 0, 0, 600, 400), createDisplay(2, 0, -400, 600, 400), createDisplay(3, 600, -200, 900, 600)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [null, 2, null],
          [null, 1, 3],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('4 Cross up', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, -1, 0), createDisplayTile(3, 0, -1), createDisplayTile(4, 1, 0)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [null, 3, null],
          [2, 1, 4],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('4 Cross up with primary on the side', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, -1, 0), createDisplayTile(3, -1, -1), createDisplayTile(4, -2, 0)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [1, 2, 3],
          [4, null, null],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('4 Cross down', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, -1, 0), createDisplayTile(3, 0, 1), createDisplayTile(4, 1, 0)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [null, null, null],
          [2, 1, 4],
          [null, 3, null]
        ]
      } as DisplayLayout);
    });
    test('4 Cross with wide screen at top', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplay(1, 0, 0, 600, 400), createDisplay(2, -600, 0, 600, 400), createDisplay(3, -100, -400, 800, 400), createDisplay(4, 600, 0, 600, 400)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [null, 3, null],
          [2, 1, 4],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('4 Square', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, -1, 0), createDisplayTile(3, 0, -1), createDisplayTile(4, -1, -1)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [4, 3, null],
          [2, 1, null],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('4 Horizontal line', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, -1, 0), createDisplayTile(3, -2, 0), createDisplayTile(4, -3, 0)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [1, 2, 3],
          [4, null, null],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('5 Pyramid', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, -1, 0), createDisplayTile(3, 1, 0), createDisplayTile(4, -0.5, -1), createDisplayTile(5, 0.5, -1)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [1, 2, 3],
          [4, 5, null],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('5 Square with extra', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplay(1, 0, 0, 600, 400), createDisplay(2, 0, -400, 600, 400), createDisplay(3, 600, -200, 900, 600), createDisplay(4, -600, 0, 600, 400), createDisplay(5, -600, -400, 600, 400)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [5, 2, null],
          [4, 1, 3],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('5 Horizontal line', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, 1, 0), createDisplayTile(3, 2, 0), createDisplayTile(4, -1, 0), createDisplayTile(5, -2, 0)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [1, 2, 3],
          [4, 5, null],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('6 Horizontal bar', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, -1, 0), createDisplayTile(3, 1, 0), createDisplayTile(4, 0, -1), createDisplayTile(5, -1, -1), createDisplayTile(6, 1, -1)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [5, 4, 6],
          [2, 1, 3],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
    test('6 Horizontal bar with primary on the side', () => {
      settings = createSettings(true, true, false, false);
      displays = [createDisplayTile(1, 0, 0), createDisplayTile(2, 1, 0), createDisplayTile(3, 2, 0), createDisplayTile(4, 0, 1), createDisplayTile(5, 1, 1), createDisplayTile(6, 2, 1)];
      const analyzer = new DisplayAnalyzerService(settingsService);
      analyzer.generateLayout();
      expect(analyzer.getLayout()).toEqual({
        mode: DisplayMode.Multi,
        layout: [
          [1, 2, 3],
          [4, 5, 6],
          [null, null, null]
        ]
      } as DisplayLayout);
    });
  });
});