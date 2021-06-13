import clamp from "lodash/clamp";

export default class TextModel {
  private _text: string;
  private _onChanges: (() => void)[] = [];

  private _clampByRange(position: number): number {
    return clamp(position, 0, this._text.length);
  }

  private _setText(newText: string): void {
    this._text = newText;
    for (const onChange of this._onChanges) {
      onChange();
    }
  }

  public constructor(initialText: string) {
    this._text = initialText;
  }

  public get text(): string {
    return this._text;
  }

  public set text(newText: string) {
    this._setText(newText);
  }

  public deleteBackward(position: number): number {
    position = this._clampByRange(position);
    this.strip(position - 1, position);
    return this._clampByRange(position - 1);
  }

  public deleteForward(position: number): number {
    position = this._clampByRange(position);
    this.strip(position, position + 1);
    return position;
  }

  public strip(begin: number, end: number): number {
    [begin, end] = sortedCouple(
      this._clampByRange(begin),
      this._clampByRange(end)
    );
    this._setText(this._text.slice(0, begin) + this._text.slice(end));
    return begin;
  }

  public onChange(callback: () => void): void {
    this._onChanges.push(callback);
  }

  public clampPosition(position: number): number {
    return this._clampByRange(position);
  }

  public clampRange([a, b]: [number, number]): [number, number] {
    return sortedCouple(this._clampByRange(a), this._clampByRange(b));
  }
}

function sortedCouple(a: number, b: number): [number, number] {
  return a > b ? [b, a] : [a, b];
}
