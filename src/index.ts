import "./index.css";
import { CanvasKitInit } from "./canvaskit";
import { preloadFonts } from "./fonts";
import { ignite } from "./dataflow";

preloadFonts();
CanvasKitInit().then(ignite);
