const showGlyphBordersCheckbox = document.getElementById(
  "show-glyph-borders"
) as HTMLInputElement;

showGlyphBordersCheckbox.addEventListener("change", () => {
  showGlyphBorders = showGlyphBordersCheckbox.checked;
});

export let showGlyphBorders = showGlyphBordersCheckbox.checked;

const showCursorPositionCheckbox = document.getElementById(
  "show-cursor-position"
) as HTMLInputElement;

showCursorPositionCheckbox.addEventListener("change", () => {
  showCursorPosition = showCursorPositionCheckbox.checked;
});

export let showCursorPosition = showCursorPositionCheckbox.checked;
