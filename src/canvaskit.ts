import initCanvasKit, { CanvasKit } from "canvaskit-wasm";
export * from "canvaskit-wasm";

export function CanvasKitInit(): Promise<CanvasKit> {
  return initCanvasKit({ locateFile: () => "canvaskit.wasm" });
}
