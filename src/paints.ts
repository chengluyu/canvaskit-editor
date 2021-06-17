import { CanvasKit, Paint } from "./canvaskit";

export function getDefaultPaints(kit: CanvasKit): Record<string, Paint> {
  const selection = new kit.Paint();
  selection.setColor(kit.Color(189, 211, 232, 1));
  selection.setAntiAlias(true);

  const topAndBottom = new kit.Paint();
  topAndBottom.setColor(kit.RED);
  topAndBottom.setStrokeWidth(2);
  topAndBottom.setAntiAlias(true);

  const line = new kit.Paint();
  line.setColor(kit.BLUE);
  line.setAntiAlias(true);

  const cursor = new kit.Paint();
  cursor.setColor(kit.Color(182, 44, 49, 1.0));
  cursor.setAntiAlias(true);

  const caret = new kit.Paint();
  caret.setColor(kit.Color(0, 0, 0, 0.8));
  caret.setStrokeWidth(1.5);
  caret.setAntiAlias(true);

  const scrollBar = new kit.Paint();
  scrollBar.setColor(kit.Color(0, 0, 0, 0.5));
  scrollBar.setAntiAlias(true);

  return { selection, topAndBottom, line, cursor, caret, scrollBar };
}
