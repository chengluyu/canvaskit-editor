import "normalize.css";
import { CanvasKitInit } from "./canvaskit";
import { render } from "./render";

CanvasKitInit().then(render);
