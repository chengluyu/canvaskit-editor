import clamp from "lodash/clamp";

export default class TextModel {
  private _text: string;

  private _clampByRange(position: number): number {
    return clamp(position, 0, this._text.length);
  }

  public constructor(text: string) {
    this._text = text;
  }

  public get text(): string {
    return this._text;
  }

  public getWordIncludingPosition(position: number): [number, number] | null {
    this._clampByRange(position);
    const codePoint = this._text.codePointAt(position);
    if (codePoint === undefined) {
      return null;
    }
    const category = categorizeCodePoint(codePoint);
    // Note: `first` is an inclusive index.
    let first = position;
    while (first - 1 >= 0) {
      const codePoint = this._text.codePointAt(first - 1);
      if (
        codePoint === undefined ||
        category !== categorizeCodePoint(codePoint)
      ) {
        break;
      }
      first -= 1;
    }
    // Note: `last` is an inclusive index.
    let last = position;
    while (last + 1 < this._text.length) {
      const codePoint = this._text.codePointAt(last + 1);
      if (
        codePoint === undefined ||
        category !== categorizeCodePoint(codePoint)
      ) {
        break;
      }
      last += 1;
    }
    // [first, last] -> [begin, end)
    return position - first < last - position
      ? [first, last + 1]
      : [last + 1, first];
  }

  public deleteBackward(
    position: number
  ): [model: TextModel, position: number] {
    position = this._clampByRange(position);
    return this.strip(position - 1, position);
  }

  public deleteForward(position: number): [model: TextModel, position: number] {
    position = this._clampByRange(position);
    return this.strip(position, position + 1);
  }

  public strip(
    begin: number,
    end: number
  ): [model: TextModel, position: number] {
    [begin, end] = sortedCouple(
      this._clampByRange(begin),
      this._clampByRange(end)
    );
    return [
      new TextModel(this._text.slice(0, begin) + this._text.slice(end)),
      begin,
    ];
  }

  public insert(
    position: number,
    text: string
  ): [model: TextModel, position: number] {
    position = this._clampByRange(position);
    return [
      new TextModel(
        this._text.slice(0, position) + text + this._text.slice(position)
      ),
      position + text.length,
    ];
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

enum CharacterCategory {
  Alphabet,
  Numeric,
  Others,
  NonAscii,
}

function categorizeCodePoint(codePoint: number): CharacterCategory {
  if (codePoint <= 255) {
    if (
      (97 <= codePoint && codePoint <= 122) ||
      (65 <= codePoint && codePoint <= 90)
    ) {
      return CharacterCategory.Alphabet;
    }
    if (48 <= codePoint && codePoint <= 57) {
      return CharacterCategory.Numeric;
    }
    return CharacterCategory.Others;
  }
  return CharacterCategory.NonAscii;
}
