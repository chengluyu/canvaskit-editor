import * as all from "canvaskit-wasm";
import { CanvasKit } from "canvaskit-wasm";
export * from "canvaskit-wasm";

type CorrectModule = {
  default: typeof all.CanvasKitInit;
};

const initialize = (all as unknown as CorrectModule).default;

export function CanvasKitInit(): Promise<CanvasKit> {
  return initialize({ locateFile: () => "canvaskit.wasm" });
}
