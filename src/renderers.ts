import { Canvas, CanvasKit } from "canvaskit-wasm";
import { Paint, Paragraph, ShapedLine } from "./canvaskit";
import { drawShapedLines } from "./canvas-helpers";
import CanvasManager from "./CanvasManager";
import { SelectionRegions } from "./dataflow";

export type FrameData = {
  paragraph: Paragraph;
  selectionRegions: SelectionRegions | null;
};

export function renderFrame(
  kit: CanvasKit,
  canvas: Canvas,
  data: FrameData,
  paints: Record<string, Paint>
): void {
  canvas.clear(kit.WHITE);
  // Draw selected texts.
  if (data.selectionRegions?.regions) {
    for (const rect of data.selectionRegions.regions) {
      canvas.drawRect(rect, paints.selection);
    }
  }
  // Draw the paragraph.
  canvas.drawParagraph(data.paragraph, 0, 0);
  // Draw the caret.
  if (data.selectionRegions?.caret) {
    const [x, top, bottom] = data.selectionRegions.caret;
    canvas.drawLine(x, top, x, bottom, paints.caret);
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
