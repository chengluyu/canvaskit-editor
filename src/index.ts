import "normalize.css";
import { CanvasKitInit } from "./canvaskit";
import { preloadFonts } from "./fonts";
import { render } from "./render";

preloadFonts();
CanvasKitInit().then(render);
