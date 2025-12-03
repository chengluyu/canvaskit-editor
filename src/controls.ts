import { atom, type WritableAtom } from "nanostores";
import clamp from "lodash/clamp";

export let showGlyphBorders = createCheckboxStore("show-glyph-borders");

export let showCursorPosition = createCheckboxStore("show-cursor-position");

export const width = createNumericInputStore("#width", [400, 800]);

export const fontSize = createNumericInputStore("#font-size", [10, 72]);

showCursorPosition.subscribe((showCursor) => {
  const canvas = document.querySelector("canvas");
  if (canvas) {
    canvas.style.cursor = showCursor ? "none" : "text";
  }
});

function createCheckboxStore(selector: string): WritableAtom<boolean> {
  const element = document.getElementById(selector) as HTMLInputElement;
  const store = atom<boolean>(element.checked);
  element.addEventListener("change", () => {
    store.set(element.checked);
  });
  return store;
}

function createNumericInputStore(
  selector: string,
  range: [number, number]
): WritableAtom<number> {
  const element = document.querySelector(selector) as HTMLInputElement;
  const initialValue = clamp(parseInt(element.value, 10), ...range);
  const store = atom<number>(initialValue);
  element.value = initialValue.toString();
  element.addEventListener("change", () => {
    const value = clamp(parseInt(element.value, 10), ...range);
    store.set(value);
    element.value = value.toString();
  });
  return store;
}
