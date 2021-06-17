import { CanvasKit } from "canvaskit-wasm";
import { createDerived, createStore, getValue } from "nanostores";
import { fontFamilies } from "../shared/fonts";
import { Paragraph } from "./canvaskit";
import CanvasManager from "./CanvasManager";
import * as controls from "./controls";
import { sampleText } from "./data";
import { loadFonts } from "./fonts";
import { getDefaultPaints } from "./paints";
import PhantomTextArea from "./PhantomTextArea";
import {
  DebugLayerData,
  FrameData,
  renderDebugLayer,
  renderFrame,
} from "./renderers";
import TextModel from "./TextModel";
import clamp from "lodash/clamp";

export async function ignite(kit: CanvasKit) {
  const canvasManager = new CanvasManager(kit, "canvas");
  const fontMgr = await loadFonts(kit);

  const widthStore = createStore<number>(() => {
    widthStore.set(canvasManager.width);
  });

  const paragraphStyleStore = createDerived(
    controls.fontSize,
    (fontSize) =>
      new kit.ParagraphStyle({
        textStyle: {
          color: kit.BLACK,
          fontFamilies,
          fontSize,
        },
        textAlign: kit.TextAlign.Left,
      })
  );

  const modelStore = createStore<TextModel>(() => {
    modelStore.set(new TextModel(sampleText));
  });

  const selectionStore = createStore<[number, number] | number | null>(() => {
    selectionStore.set([2, 100]);
  });

  modelStore.subscribe((model) => {
    const selection = selectionStore.value;
    if (selection === null || selection === undefined) {
      selectionStore.set(null);
    } else if (typeof selection === "number") {
      selectionStore.set(model.clampPosition(selection));
    } else {
      selectionStore.set(model.clampRange(selection));
    }
  });

  const paragraphStore = createDerived(
    [modelStore, controls.width, paragraphStyleStore],
    (model, width, paragraphStyle): Paragraph => {
      const builder = kit.ParagraphBuilder.Make(paragraphStyle, fontMgr);
      builder.addText(model.text);
      const paragraph = builder.build();
      paragraph.layout(width);
      return paragraph;
    }
  );

  const shapedLinesStore = createDerived(paragraphStore, (paragraph) =>
    paragraph.getShapedLines()
  );

  const scrollBaseY = createStore<number>(() => {
    scrollBaseY.set(0);
  });

  const mouseOffsetY = createDerived(scrollBaseY, (x) => -x);

  // Event actions
  const performMoveLeft = performMoveBetweenColumns.bind(null, -1);
  const performMoveRight = performMoveBetweenColumns.bind(null, 1);
  const performMoveUp = performMoveBetweenRows.bind(null, true);
  const performMoveDown = performMoveBetweenRows.bind(null, false);

  let isMouseDown = false;
  let lastMousePosition: [number, number] | null = null;

  const mousePositionStore = createStore<[x: number, y: number] | null>(() => {
    mousePositionStore.set(null);
  });

  canvasManager.addEventListener("mouseenter", (e) => {
    lastMousePosition = [e.offsetX, getValue(mouseOffsetY) + e.offsetY];
    mousePositionStore.set([e.offsetX, getValue(mouseOffsetY) + e.offsetY]);
  });

  canvasManager.addEventListener("mouseleave", () => {
    lastMousePosition = null;
    mousePositionStore.set(null);
    isMouseDown = false;
  });

  canvasManager.addEventListener("mousemove", (e) => {
    lastMousePosition = [e.offsetX, getValue(mouseOffsetY) + e.offsetY];
    mousePositionStore.set([e.offsetX, getValue(mouseOffsetY) + e.offsetY]);
    if (isMouseDown) {
      extendSelection(...lastMousePosition);
    }
  });

  canvasManager.addEventListener("mousedown", (e) => {
    lastMousePosition = [e.offsetX, getValue(mouseOffsetY) + e.offsetY];
    mousePositionStore.set([e.offsetX, getValue(mouseOffsetY) + e.offsetY]);
    isMouseDown = true;
    resetSelection(...lastMousePosition);
  });

  canvasManager.addEventListener("dblclick", (e) => {
    const model = modelStore.value;
    if (model && paragraphStore.value) {
      lastMousePosition = [e.offsetX, getValue(mouseOffsetY) + e.offsetY];
      mousePositionStore.set([e.offsetX, getValue(mouseOffsetY) + e.offsetY]);
      const { pos } = paragraphStore.value.getGlyphPositionAtCoordinate(
        ...lastMousePosition
      );
      selectionStore.set(model.getWordIncludingPosition(pos));
    }
  });

  canvasManager.addEventListener("mouseup", (e) => {
    lastMousePosition = [e.offsetX, getValue(mouseOffsetY) + e.offsetY];
    isMouseDown = false;
  });

  canvasManager.addEventListener("wheel", (e) => {
    e.preventDefault();
    const paragraphHeight = getValue(paragraphStore).getHeight();
    const canvasHeight = canvasManager.height;
    scrollBaseY.set(
      clamp(
        getValue(scrollBaseY) + e.deltaY,
        Math.min(canvasHeight - paragraphHeight, 0),
        0
      )
    );
  });

  canvasManager.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "Backspace":
        performBackspace();
        break;
      case "Delete":
        performDelete();
        break;
      case "ArrowUp":
        performMoveUp();
        break;
      case "ArrowDown":
        performMoveDown();
        break;
      case "ArrowLeft":
        performMoveLeft();
        break;
      case "ArrowRight":
        performMoveRight();
        break;
    }
  });

  const selectionRegionsStore = createDerived(
    [modelStore, selectionStore, paragraphStore],
    (model, selection, paragraph): SelectionRegions | null => {
      if (selection === null) {
        return null;
      } else if (typeof selection === "number") {
        let low: number;
        let high: number;
        let useX1 = false;
        // Special case: caret in the beginning.
        if (selection === 0) {
          [low, high] = [0, 1];
        }
        // Special case: caret in the end.
        else if (selection === model.text.length) {
          [low, high] = [selection - 1, selection];
          useX1 = true;
        }
        // Normal case.
        else {
          [low, high] = [selection, selection + 1];
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
          return { regions: null, caret: [useX1 ? x1 : x0, y0, y1] };
        } else {
          console.warn("getRectsForRange should return at least one rectangle");
          return null;
        }
      } else {
        let [low, high] = selection;
        const useLast = low > high;
        if (low > high) {
          [high, low] = selection;
        }
        const rects = paragraph.getRectsForRange(
          low,
          high,
          kit.RectHeightStyle.Max,
          kit.RectWidthStyle.Tight
        ) as unknown as Float32Array[];
        if (rects.length > 0) {
          const rect = useLast ? rects[rects.length - 1] : rects[0];
          const [x0, y0, x1, y1] = rect;
          return {
            regions: rects,
            caret: [useLast ? x1 : x0, y0, y1],
          };
        } else {
          return null;
        }
      }
    }
  );

  selectionRegionsStore.listen((value) => {
    if (value === null) {
      textArea.hide();
    } else {
      const [x, y0, y1] = value.caret;
      textArea.height = Math.abs(y1 - y0);
      textArea.move(x, y0);
      textArea.show();
      textArea.focus();
    }
  });

  const textArea = new PhantomTextArea();

  textArea.addEventListener("insert", (event) => {
    const model = modelStore.value;
    const selection = selectionStore.value;
    if (model === undefined || selection === null || selection === undefined) {
      return;
    } else if (typeof selection === "number") {
      const [newModel, position] = model.insert(selection, event.text);
      modelStore.set(newModel);
      selectionStore.set(position);
    } else {
      let [newModel, position] = model.strip(...selection);
      [newModel, position] = newModel.insert(position, event.text);
      modelStore.set(newModel);
      selectionStore.set(position);
    }
  });
  textArea.addEventListener("backspace", performBackspace);
  textArea.addEventListener("delete", performDelete);
  textArea.addEventListener("left", performMoveLeft);
  textArea.addEventListener("right", performMoveRight);
  textArea.addEventListener("up", performMoveUp);
  textArea.addEventListener("down", performMoveDown);

  function resetSelection(x: number, y: number): void {
    if (paragraphStore.value) {
      selectionStore.set(
        paragraphStore.value.getGlyphPositionAtCoordinate(x, y).pos
      );
    }
  }

  function extendSelection(x: number, y: number): void {
    if (paragraphStore.value) {
      const { pos } = paragraphStore.value.getGlyphPositionAtCoordinate(x, y);
      const selection = selectionStore.value;
      if (selection === null || selection === undefined) {
        selectionStore.set(pos);
      } else if (typeof selection === "number") {
        selectionStore.set([selection, pos]);
      } else {
        selectionStore.set([selection[0], pos]);
      }
    }
  }

  function performBackspace(): void {
    const model = modelStore.value;
    const selection = selectionStore.value;
    if (model === undefined || selection === null || selection === undefined) {
      return;
    } else if (typeof selection === "number") {
      const [newModel, position] = model.deleteBackward(selection);
      modelStore.set(newModel);
      selectionStore.set(position);
    } else {
      const [newModel, position] = model.strip(...selection);
      modelStore.set(newModel);
      selectionStore.set(position);
    }
  }

  function performDelete(): void {
    const model = modelStore.value;
    const selection = selectionStore.value;
    if (model === undefined || selection === null || selection === undefined) {
      return;
    } else if (typeof selection === "number") {
      const [newModel, position] = model.deleteForward(selection);
      modelStore.set(newModel);
      selectionStore.set(position);
    } else {
      const [newModel, position] = model.strip(...selection);
      modelStore.set(newModel);
      selectionStore.set(position);
    }
  }

  function performMoveBetweenColumns(delta: number) {
    const model = modelStore.value;
    const selection = selectionStore.value;
    if (model === undefined || selection === null || selection === undefined) {
      return;
    } else if (typeof selection === "number") {
      selectionStore.set(model.clampPosition(selection + delta));
    } else {
      selectionStore.set(model.clampPosition(Math.min(...selection) + delta));
    }
  }

  function performMoveBetweenRows(upward: boolean): void {
    const selectionRegions = selectionRegionsStore.value;
    const fontSize = getValue(controls.fontSize);
    if (
      selectionRegions === null ||
      selectionRegions === undefined ||
      paragraphStore.value === undefined
    ) {
      return;
    }
    const [x, y0, y1] = selectionRegions.caret;
    const y = (upward ? Math.min : Math.max)(y0, y1);
    const glyphPosition = paragraphStore.value.getGlyphPositionAtCoordinate(
      x,
      upward
        ? Math.max(0, y - fontSize / 2)
        : Math.min(canvasManager.height, y + fontSize / 2)
    );
    // Update the selection.
    selectionStore.set(glyphPosition.pos);
  }

  const paints = getDefaultPaints(kit);

  const debugLayerDataStore = createDerived(
    [
      controls.showCursorPosition,
      controls.showGlyphBorders,
      shapedLinesStore,
      mousePositionStore,
    ],
    (
      showCursorPosition,
      showGlyphBorders,
      shapedLines,
      mousePosition
    ): DebugLayerData => ({
      shapedLines: showGlyphBorders ? shapedLines : null,
      lastMousePosition: showCursorPosition ? mousePosition : null,
    })
  );

  const frameDataStore = createDerived(
    [selectionRegionsStore, paragraphStore, scrollBaseY, debugLayerDataStore],
    (
      selectionRegions,
      paragraph,
      offsetY,
      debugLayerData
    ): (FrameData & DebugLayerData) | null =>
      paragraph === null
        ? null
        : { selectionRegions, paragraph, offsetY, ...debugLayerData }
  );

  frameDataStore.subscribe((data) => {
    if (data !== null) {
      canvasManager.requestAnimationFrame((canvas) => {
        renderFrame(canvasManager, canvas, data, paints);
        renderDebugLayer(canvasManager, canvas, data, paints);
      });
    }
  });
}

export type SelectionRegions = {
  regions: Float32Array[] | null;
  caret: [x: number, y0: number, y1: number];
};
