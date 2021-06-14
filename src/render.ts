import { Canvas, CanvasKit } from "canvaskit-wasm";
import { Paragraph } from "./canvaskit";
import { createCanvasElement } from "./helpers";
import { sampleText } from "./data";
import { loadFonts } from "./fonts";
import * as controls from "./controls";
import TextModel from "./TextModel";
import PhantomTextArea from "./PhantomTextArea";
import { drawShapedLines } from "./canvas-helpers";
import { fontFamilies } from "../shared/fonts";

export async function render(kit: CanvasKit) {
  const [width, height] = [800, 400];
  const scale = window.devicePixelRatio;
  const canvasEl = createCanvasElement(width, height, scale);
  const surface = kit.MakeCanvasSurface(canvasEl);
  const fontSize = 24;
  if (surface === null) {
    throw new Error("cannot make the canvas surface");
  }
  // Scale the canvas by `devicePixelRatio`.
  const canvas = surface.getCanvas();
  canvas.scale(scale, scale);
  const fontMgr = await loadFonts(kit);
  const paragraphStyle = new kit.ParagraphStyle({
    textStyle: {
      color: kit.BLACK,
      fontFamilies,
      fontSize,
    },
    textAlign: kit.TextAlign.Left,
  });

  let model = new TextModel(sampleText);
  let paragraph = buildParagraph();
  let shapedLines = paragraph.getShapedLines();

  model.onChange(() => {
    paragraph = buildParagraph();
    shapedLines = paragraph.getShapedLines();
    if (selection !== null) {
      selection = model.clampRange(selection);
    }
  });

  function buildParagraph(): Paragraph {
    const builder = kit.ParagraphBuilder.Make(paragraphStyle, fontMgr);
    builder.addText(model.text);
    const paragraph = builder.build();
    paragraph.layout(width);
    return paragraph;
  }

  let isMouseDown = false;
  let lastMousePosition: [number, number] | null = null;

  canvasEl.addEventListener("mouseenter", (e) => {
    lastMousePosition = [e.offsetX, e.offsetY];
  });

  canvasEl.addEventListener("mouseleave", () => {
    lastMousePosition = null;
    isMouseDown = false;
  });

  canvasEl.addEventListener("mousemove", (e) => {
    lastMousePosition = [e.offsetX, e.offsetY];
    if (isMouseDown) {
      updateSelection(...lastMousePosition);
    }
  });

  canvasEl.addEventListener("mousedown", (e) => {
    lastMousePosition = [e.offsetX, e.offsetY];
    isMouseDown = true;
    resetSelection(...lastMousePosition);
  });

  canvasEl.addEventListener("dblclick", (e) => {
    lastMousePosition = [e.offsetX, e.offsetY];
    const { pos } = paragraph.getGlyphPositionAtCoordinate(
      ...lastMousePosition
    );
    selection = model.getWordIncludingPosition(pos);
    updateSelectionRects();
  });

  canvasEl.addEventListener("mouseup", (e) => {
    lastMousePosition = [e.offsetX, e.offsetY];
    isMouseDown = false;
  });

  canvasEl.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "Backspace":
        performBackspace();
        break;
      case "Delete":
        performDelete();
        break;
      case "ArrowUp":
        performMoveBetweenRows(true);
        break;
      case "ArrowDown":
        performMoveBetweenRows(false);
        break;
      case "ArrowLeft":
        performMoveLeft();
        break;
      case "ArrowRight":
        performMoveRight();
        break;
    }
  });

  const paintForSelection = new kit.Paint();
  paintForSelection.setColor(kit.Color(189, 211, 232, 1));

  const paintForTopAndBottom = new kit.Paint();
  paintForTopAndBottom.setColor(kit.RED);
  paintForTopAndBottom.setStrokeWidth(2);

  const paintForLine = new kit.Paint();
  paintForLine.setColor(kit.BLUE);

  const paintForCursor = new kit.Paint();
  paintForCursor.setColor(kit.Color(182, 44, 49, 1.0));
  paintForCursor.setAntiAlias(true);

  const paintForCaret = new kit.Paint();
  paintForCaret.setColor(kit.Color(0, 0, 0, 0.8));
  paintForCaret.setStrokeWidth(1.5);
  paintForCaret.setAntiAlias(true);

  let selection: [number, number] | null = [2, 100];
  let selectedRects: Float32Array[] | null = paragraph.getRectsForRange(
    ...selection,
    kit.RectHeightStyle.Max,
    kit.RectWidthStyle.Tight
  ) as unknown as Float32Array[];
  let caretPosition: [x: number, top: number, bottom: number] | null = null;
  const textArea = new PhantomTextArea();

  textArea.addEventListener("insert", (event) => {
    if (selection) {
      const [low, high] = selection;
      if (low === high) {
        const position = model.insert(low, event.text);
        selection = [position, position];
        updateSelectionRects();
      }
    }
  });
  textArea.addEventListener("backspace", performBackspace);
  textArea.addEventListener("delete", performDelete);
  textArea.addEventListener("left", performMoveLeft);
  textArea.addEventListener("right", performMoveRight);
  textArea.addEventListener("up", performMoveBetweenRows.bind(null, true));
  textArea.addEventListener("down", performMoveBetweenRows.bind(null, false));

  model.onChange(updateSelectionRects);

  function resetSelection(x: number, y: number): void {
    const { pos } = paragraph.getGlyphPositionAtCoordinate(x, y);
    selection = [pos, pos];
    updateSelectionRects();
  }

  function updateSelection(x: number, y: number): void {
    const { pos } = paragraph.getGlyphPositionAtCoordinate(x, y);
    if (selection === null) {
      selection = [pos, pos];
    } else {
      selection = [selection[0], pos];
    }
    updateSelectionRects();
  }

  function clearSelection(): void {
    selection = null;
    selectedRects = null;
  }

  function updateSelectionRects(): void {
    if (selection) {
      let [low, high] = selection;
      if (low === high) {
        let useX1 = false;
        selectedRects = null;
        // Special case: caret in the beginning.
        if (low === 0) {
          high = 1;
        }

        // Special case: caret in the end.
        else if (low === model.text.length) {
          low = high - 1;
          useX1 = true;
        }

        // Normal case.
        else {
          high = low + 1;
        }
        const rects = paragraph.getRectsForRange(
          low,
          high,
          kit.RectHeightStyle.Max,
          kit.RectWidthStyle.Tight
        ) as unknown as Float32Array[];
        // It should be greater than 0.
        if (rects.length > 0) {
          const [[x0, y0, x1, y1]] = rects;
          selectedRects = null;
          caretPosition = [useX1 ? x1 : x0, y0, y1];
          textArea.height = Math.abs(y1 - y0);
          textArea.move(x0, y0);
          textArea.show();
          textArea.focus();
        }
      } else {
        const useLast = low > high;
        if (low > high) {
          [high, low] = selection;
        }
        selectedRects = paragraph.getRectsForRange(
          low,
          high,
          kit.RectHeightStyle.Max,
          kit.RectWidthStyle.Tight
        ) as unknown as Float32Array[];
        if (selectedRects.length > 0) {
          const rect = useLast
            ? selectedRects[selectedRects.length - 1]
            : selectedRects[0];
          const [x0, y0, x1, y1] = rect;
          caretPosition = [useLast ? x1 : x0, y0, y1];
          textArea.height = Math.abs(y1 - y0);
        } else {
          caretPosition = null;
        }
      }
    } else {
      selectedRects = null;
    }
  }

  function performBackspace(): void {
    if (selection === null) {
    } else {
      const [begin, end] = selection;
      if (begin === end) {
        const position = model.deleteBackward(begin);
        selection = [position, position];
      } else {
        const position = model.strip(begin, end);
        selection = [position, position];
      }
      updateSelectionRects();
    }
  }

  function performDelete(): void {
    if (selection === null) {
    } else {
      const [begin, end] = selection;
      if (begin === end) {
        const position = model.deleteForward(begin);
        selection = [position, position];
      } else {
        const position = model.strip(begin, end);
        selection = [position, position];
      }
      updateSelectionRects();
    }
  }

  function performMoveLeft() {
    if (selection === null) {
      return;
    }
    const position = model.clampPosition(Math.min(...selection) - 1);
    selection = [position, position];
    updateSelectionRects();
  }

  function performMoveRight() {
    if (selection === null) {
      return;
    }
    const position = model.clampPosition(Math.min(...selection) + 1);
    selection = [position, position];
    updateSelectionRects();
  }

  function performMoveBetweenRows(upward: boolean): void {
    if (caretPosition === null) {
      return;
    }
    const [x, y0, y1] = caretPosition;
    const y = (upward ? Math.min : Math.max)(y0, y1);
    const glyphPosition = paragraph.getGlyphPositionAtCoordinate(
      x,
      upward
        ? Math.max(0, y - fontSize / 2)
        : Math.min(height, y + fontSize / 2)
    );
    // Update the selection.
    selection = [glyphPosition.pos, glyphPosition.pos];
    updateSelectionRects();
  }

  // Start the rendering looop.
  surface.requestAnimationFrame(drawFrame);
  function drawFrame(canvas: Canvas): void {
    surface?.requestAnimationFrame(drawFrame);
    canvas.clear(kit.WHITE);
    // Draw selected texts.
    if (selectedRects !== null) {
      for (const rect of selectedRects) {
        canvas.drawRect(rect, paintForSelection);
      }
    }
    // Draw glyph borders.
    if (controls.showGlyphBorders) {
      drawShapedLines(
        canvas,
        shapedLines,
        width,
        paintForLine,
        paintForTopAndBottom
      );
    }
    // Draw the paragraph.
    canvas.drawParagraph(paragraph, 0, 0);
    // Draw the caret.
    if (caretPosition !== null) {
      const [x, top, bottom] = caretPosition;
      canvas.drawLine(x, top, x, bottom, paintForCaret);
    }
    // Indicate the cursor position.
    if (lastMousePosition && controls.showCursorPosition) {
      canvas.drawCircle(...lastMousePosition, 4, paintForCursor);
    }
  }
}
