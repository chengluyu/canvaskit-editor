import { CanvasKit, FontMgr } from "canvaskit-wasm";
import { fonts } from "../shared/fonts";

const urlArrayBufferMap = new Map<string, ArrayBuffer | Promise<ArrayBuffer>>();

export async function loadArrayBuffer(url: string): Promise<ArrayBuffer> {
  const bufferOrPromise = urlArrayBufferMap.get(url);
  if (bufferOrPromise === undefined) {
    const promise = fetch(url)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => {
        urlArrayBufferMap.set(url, arrayBuffer);
        return arrayBuffer;
      });
    urlArrayBufferMap.set(url, promise);
    return promise;
  } else if (bufferOrPromise instanceof ArrayBuffer) {
    return Promise.resolve(bufferOrPromise);
  } else {
    return bufferOrPromise;
  }
}

export function preloadFonts(): void {
  for (const font of fonts) {
    loadArrayBuffer(font.runtimeFileName);
  }
}

export async function loadFonts(kit: CanvasKit): Promise<FontMgr> {
  const loadedFonts = await Promise.all(
    fonts.map((font) => loadArrayBuffer(font.runtimeFileName))
  );
  const fontMgr = kit.FontMgr.FromData(...loadedFonts);
  if (fontMgr === null) {
    throw new Error("cannot create FontMgr");
  }
  return fontMgr;
}
