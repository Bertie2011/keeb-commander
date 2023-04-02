import './index.css';
import { MainProcessApi } from './bridgeApi';

declare global {
  interface Window {
    mainProcessApi: MainProcessApi
  }
}

window.mainProcessApi.onSetRegion((dualHanded, x, y, width, height) => {
  console.log('pong!');
  const container = document.getElementsByClassName('container')[0] as HTMLDivElement;
  container.style.marginLeft = x + 'px';
  container.style.marginTop = y + 'px';
  container.style.width = width + 'px';
  container.style.height = height + 'px';
  console.log(dualHanded);
  const secondaryPad = document.getElementsByClassName('pad-secondary')[0] as HTMLDivElement;
  secondaryPad.style.display = dualHanded ? 'flex' : 'none';
});