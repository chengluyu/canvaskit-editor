import "./index.css";

export function createCanvasElement(
  width: number,
  height: number,
  scale = window.devicePixelRatio
): HTMLCanvasElement {
  let element = document.querySelector("canvas");
  if (element === null) {
    element = document.createElement("canvas");
    document.body.appendChild(element);
  }
  element.id = "editor";
  element.tabIndex = 0;
  [element.width, element.height] = [width * scale, height * scale];
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  return element;
}
