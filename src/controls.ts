import { createStore, WritableStore } from "nanostores";

export let showGlyphBorders = createCheckboxStore("show-glyph-borders");

export let showCursorPosition = createCheckboxStore("show-cursor-position");

function createCheckboxStore(selector: string): WritableStore<boolean> {
  const element = document.getElementById(selector) as HTMLInputElement;
  element.addEventListener("change", update);
  const store = createStore<boolean>(update);
  return store;

  function update(): void {
    store.set(element.checked);
  }
}
