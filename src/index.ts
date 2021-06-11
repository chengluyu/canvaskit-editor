import { Canvas, CanvasKit } from "canvaskit-wasm";
import { fontFamilies } from "../shared/fonts";
import { CanvasKitInit, Paint, Paragraph, ShapedLine } from "./canvaskit";
import { createCanvasElement } from "./helpers";
import { sampleText } from "./data";
import { loadFonts } from "./fonts";
import clamp from "lodash/clamp";
import * as controls from "./controls";

CanvasKitInit().then(render);

async function render(kit: CanvasKit) {
  const [width, height] = [800, 400];
  const scale = window.devicePixelRatio;
  const canvasEl = createCanvasElement(width, height, scale);
  const surface = kit.MakeCanvasSurface(canvasEl);
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
      fontSize: 24,
    },
    textAlign: kit.TextAlign.Left,
  });

  let text = sampleText;
  let paragraph = buildParagraph();
  let shapedLines = paragraph.getShapedLines();

  function setText(newText: string): void {
    console.log(newText);
    text = newText;
    paragraph = buildParagraph();
    shapedLines = paragraph.getShapedLines();
    if (selection !== null) {
      let [low, high] = selection;
      low = clamp(low, 0, text.length);
      high = clamp(high, 0, text.length);
      selection = [low, high];
    }
  }

  function buildParagraph(): Paragraph {
    const builder = kit.ParagraphBuilder.Make(paragraphStyle, fontMgr);
    builder.addText(text);
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

  canvasEl.addEventListener("mouseup", (e) => {
    lastMousePosition = [e.offsetX, e.offsetY];
    isMouseDown = false;
  });

  canvasEl.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && selection) {
      const begin = Math.min(...selection);
      const end = Math.max(...selection);
      setText(text.slice(0, begin) + text.slice(end));
      clearSelection();
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

  let selection: [number, number] | null = [2, 100];
  let selectedRects: Float32Array[] | null = paragraph.getRectsForRange(
    ...selection,
    kit.RectHeightStyle.Max,
    kit.RectWidthStyle.Tight
  ) as unknown as Float32Array[];

  let caret = 0;
  let caretRect = 0;

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
      if (low > high) {
        [high, low] = selection;
      }
      console.log(`Selection range: ${low}, ${high}`);
      selectedRects = paragraph.getRectsForRange(
        low,
        high,
        kit.RectHeightStyle.Max,
        kit.RectWidthStyle.Tight
      ) as unknown as Float32Array[];
    } else {
      selectedRects = null;
    }
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
    // Indicate the cursor position.
    if (lastMousePosition && controls.showCursorPosition) {
      canvas.drawCircle(...lastMousePosition, 4, paintForCursor);
    }
  }
}

function drawShapedLines(
  canvas: Canvas,
  shapedLines: ShapedLine[],
  width: number,
  paintForLine: Paint,
  paintForTopAndBottom: Paint
): void {
  for (const line of shapedLines) {
    // canvas.drawRect([0, line.top, width, line.bottom], paintForRun);
    canvas.drawLine(0, line.baseline, width, line.baseline, paintForLine);
    canvas.drawLine(0, line.top, width, line.top, paintForTopAndBottom);
    canvas.drawLine(0, line.bottom, width, line.bottom, paintForTopAndBottom);
    for (const run of line.runs) {
      for (let i = 0; i < run.positions.length; i += 2) {
        const x = run.positions[i];
        canvas.drawLine(x, line.top, x, line.bottom, paintForLine);
      }
    }
  }
}
