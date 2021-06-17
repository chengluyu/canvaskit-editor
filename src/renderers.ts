import { Canvas, CanvasKit } from "canvaskit-wasm";
import { Paint, Paragraph, ShapedLine } from "./canvaskit";
import { drawShapedLines } from "./canvas-helpers";
import CanvasManager from "./CanvasManager";
import { SelectionRegions } from "./dataflow";

export type FrameData = {
  paragraph: Paragraph;
  selectionRegions: SelectionRegions | null;
  offsetY: number;
};

export function renderFrame(
  manager: CanvasManager,
  canvas: Canvas,
  data: FrameData,
  paints: Record<string, Paint>
): void {
  canvas.clear(manager.kit.WHITE);
  // Draw selected texts.
  if (data.selectionRegions?.regions) {
    for (const rect of data.selectionRegions.regions) {
      const [x0, y0, x1, y1] = rect;
      canvas.drawRect(
        [x0, y0 + data.offsetY, x1, y1 + data.offsetY],
        paints.selection
      );
    }
  }
  // Draw the paragraph.
  canvas.drawParagraph(data.paragraph, 0, data.offsetY);
  // Draw the caret.
  if (data.selectionRegions?.caret) {
    const [x, top, bottom] = data.selectionRegions.caret;
    canvas.drawLine(
      x,
      data.offsetY + top,
      x,
      data.offsetY + bottom,
      paints.caret
    );
  }
  const canvasHeight = manager.height;
  const paragraphHeight = data.paragraph.getHeight();
  if (paragraphHeight > canvasHeight) {
    const scrollBarBaseY = canvasHeight * (-data.offsetY / paragraphHeight);
    const scrollBarWidth = 8;
    const scrollBarHeight = canvasHeight * (canvasHeight / paragraphHeight);
    canvas.drawRect(
      [
        manager.width - scrollBarWidth,
        scrollBarBaseY,
        manager.width,
        scrollBarBaseY + scrollBarHeight,
      ],
      paints.scrollBar
    );
  }
}

export type DebugLayerData = {
  shapedLines: ShapedLine[] | null;
  lastMousePosition: readonly [number, number] | null;
};

export function renderDebugLayer(
  manager: CanvasManager,
  canvas: Canvas,
  data: DebugLayerData,
  paints: Record<string, Paint>
): void {
  // Draw glyph borders.
  if (data.shapedLines) {
    drawShapedLines(
      canvas,
      data.shapedLines,
      manager.width,
      paints.line,
      paints.topAndBottom
    );
  }
  // Indicate the cursor position.
  if (data.lastMousePosition) {
    canvas.drawCircle(...data.lastMousePosition, 4, paints.cursor);
  }
}
