import EventTarget from "./EventTarget";

export type PhantomTextAreaEventMap = {
  insert: { type: "insert"; text: string };
  backspace: { type: "backspace" };
  delete: { type: "delete" };
  up: { type: "up" };
  down: { type: "down" };
  left: { type: "left" };
  right: { type: "right" };
};

export default class PhantomTextArea extends EventTarget<PhantomTextAreaEventMap> {
  private _element = document.createElement("textarea");
  private _container = document.querySelector(".canvaskit-editor");
  private _isCompositionStarted = false;
  private _heightInPixel = 24;
  private _widthInPixel = 0;

  private _initializeAttributes(): void {
    this._element.style.width = `${this._widthInPixel}px`;
    this._element.style.height = `${this._heightInPixel}px`;
  }

  public constructor() {
    super();

    this._element.classList.add("phantom");
    this._element.setAttribute("autocorrect", "off");
    this._element.autocapitalize = "none";
    this._element.autocomplete = "off";
    this._element.spellcheck = false;
    this._element.tabIndex = 0;
    this._element.wrap = "off";
    this._element.setAttribute("role", "textbox");
    this._element.setAttribute("aria-multiline", "true");
    this._element.setAttribute("aria-haspopup", "false");
    this._element.setAttribute("aria-autocomplete", "both");

    this._initializeAttributes();

    this._element.addEventListener("compositionstart", (e) => {
      this._isCompositionStarted = true;
    });
    this._element.addEventListener("compositionend", (e) => {
      if (e.data.length > 0) {
        this.dispatchEvent({ type: "insert", text: e.data });
      }
      this._element.value = "";
      this._isCompositionStarted = false;
    });
    this._element.addEventListener("input", () => {
      if (this._isCompositionStarted) {
        return;
      }
      this.dispatchEvent({ type: "insert", text: this._element.value });
      this._element.value = "";
    });
    this._element.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "Backspace":
          this.dispatchEvent({ type: "backspace" });
          break;
        case "Delete":
          this.dispatchEvent({ type: "delete" });
          break;
        case "ArrowUp":
          this.dispatchEvent({ type: "up" });
          break;
        case "ArrowDown":
          this.dispatchEvent({ type: "down" });
          break;
        case "ArrowLeft":
          this.dispatchEvent({ type: "left" });
          break;
        case "ArrowRight":
          this.dispatchEvent({ type: "right" });
          break;
      }
    });

    this._container?.appendChild(this._element);
  }

  public get height(): number {
    return this._heightInPixel;
  }

  public set height(value: number) {
    this._heightInPixel = value;
    this._element.style.height = `${value}px`;
  }

  public move(x: number, y: number): void {
    this._element.style.top = `${y}px`;
    this._element.style.left = `${x}px`;
  }

  public focus(): void {
    this._element.focus();
  }

  public show(): void {
    this._element.style.display = "block";
  }

  public hide(): void {
    this._element.style.display = "";
  }
}
