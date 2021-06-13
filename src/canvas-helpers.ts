import { Canvas } from "canvaskit-wasm";
import { Paint, ShapedLine } from "./canvaskit";

export function drawShapedLines(
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
