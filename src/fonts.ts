import { CanvasKit, FontMgr } from "canvaskit-wasm";
import { fonts } from "../shared/fonts";

export async function loadArrayBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return buffer;
}

export async function loadFonts(kit: CanvasKit): Promise<FontMgr> {
  const loadedFonts = await Promise.all(
    fonts.map((x) => loadArrayBuffer(x.runtimeFileName))
  );
  const fontMgr = kit.FontMgr.FromData(...loadedFonts);
  if (fontMgr === null) {
    throw new Error("cannot create FontMgr");
  }
  return fontMgr;
}
