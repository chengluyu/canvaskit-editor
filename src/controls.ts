import { createStore, WritableStore } from "nanostores";
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

function createCheckboxStore(selector: string): WritableStore<boolean> {
  const element = document.getElementById(selector) as HTMLInputElement;
  element.addEventListener("change", update);
  const store = createStore<boolean>(update);
  return store;

  function update(): void {
    store.set(element.checked);
  }
}

function createNumericInputStore(
  selector: string,
  range: [number, number]
): WritableStore<number> {
  const element = document.querySelector(selector) as HTMLInputElement;
  element.addEventListener("change", update);
  const store = createStore<number>(update);
  return store;

  function update(): void {
    const value = clamp(parseInt(element.value, 10), ...range);
    store.set(value);
    element.value = value.toString();
  }
}
