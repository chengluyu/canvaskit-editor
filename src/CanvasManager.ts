import { Canvas, CanvasKit, Surface } from "./canvaskit";

export default class CanvasManager {
  private _scale = window.devicePixelRatio;
  private _kit: CanvasKit;
  private _element: HTMLCanvasElement;
  private _size: [width: number, height: number];
  private _surface: Surface;

  private initializeElement(): void {
    this._element.width = this._size[0] * this._scale;
    this._element.height = this._size[1] * this._scale;
    this._element.style.width = `${this._size[0]}px`;
    this._element.style.height = `${this._size[1]}px;`;
  }

  private initializeCanvas(): void {
    const canvas = this._surface.getCanvas();
    canvas.scale(this._scale, this._scale);
  }

  public constructor(
    kit: CanvasKit,
    selectorOrElement: string | HTMLCanvasElement,
    width = 800,
    height = 400
  ) {
    this._kit = kit;
    if (typeof selectorOrElement === "string") {
      const element = document.querySelector(selectorOrElement);
      if (element instanceof HTMLCanvasElement) {
        this._element = element;
      } else {
        throw new TypeError("expect a canvas element");
      }
    } else {
      this._element = selectorOrElement;
    }
    this._size = [width, height];
    this.initializeElement();
    const surface = kit.MakeCanvasSurface(this._element);
    if (surface === null) {
      throw new Error("cannot make the canvas surface");
    }
    this._surface = surface;
    this.initializeCanvas();
  }

  public requestAnimationFrame(callback: (canvas: Canvas) => void): void {
    this._surface.requestAnimationFrame(callback);
  }

  public get width(): number {
    return this._size[0];
  }

  public get height(): number {
    return this._size[1];
  }

  public addEventListener<K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLCanvasElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void {
    this._element.addEventListener(type, listener, options);
  }
}
