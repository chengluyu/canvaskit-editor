import { Canvas } from "canvaskit-wasm";

declare module "canvaskit-wasm" {
  export interface Surface {
    requestAnimationFrame(callback: (canvas: Canvas) => void);
  }
}
