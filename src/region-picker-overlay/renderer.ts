import './index.css';
import { MainProcessApi } from './bridgeApi';

declare global {
  interface Window {
    mainProcessApi: MainProcessApi
  }
}

let containerGrid: HTMLDivElement;
let containerSingle: HTMLDivElement;
let cellSingle: HTMLDivElement;
let cellSingleClass: string;

window.addEventListener('load', () => {
  containerGrid = document.getElementsByClassName('container-grid')[0] as HTMLDivElement;
  containerSingle = document.getElementsByClassName('container-single')[0] as HTMLDivElement;
  cellSingle = document.getElementsByClassName('cell-single')[0] as HTMLDivElement;
});

window.mainProcessApi.onSetRegion((x, y, width, height) => {
  containerSingle.style.display = 'none';
  containerGrid.style.removeProperty('display');
  containerGrid.style.marginLeft = x + 'px';
  containerGrid.style.marginTop = y + 'px';
  containerGrid.style.width = width + 'px';
  containerGrid.style.height = height + 'px';
});

window.mainProcessApi.onSetTile((xIndex, yIndex, width, height) => {
  containerSingle.style.removeProperty('display');
  containerGrid.style.display = 'none';

  if (cellSingleClass != undefined) cellSingle.classList.remove(cellSingleClass);
  cellSingleClass = 'cell-' + (yIndex * 3 + xIndex);

  cellSingle.classList.add(cellSingleClass);
});