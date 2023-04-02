import { WebpackPluginEntryPoint } from "@electron-forge/plugin-webpack/dist/Config";

// This file was created manually to store an entry points variable.
// Any existing items in forge.config.ts were moved and replaced with a reference to this variable.

export const entryPoints: WebpackPluginEntryPoint[] = [
  {
    html: './src/index.html',
    js: './src/renderer.ts',
    name: 'main_window',
    preload: {
      js: './src/preload.ts',
    },
  },
  {
    html: './src/region-picker-overlay/index.html',
    js: './src/region-picker-overlay/renderer.ts',
    name: 'region_picker_overlay',
    preload: {
      js: './src/region-picker-overlay/preload.ts',
    }
  },
];