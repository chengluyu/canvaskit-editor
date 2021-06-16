// Adapted from https://github.com/component/rope

import { ParagraphBuilder } from "./canvaskit";

export default class Rope {
  private data: string | [Rope, Rope];
  private length: number;

  private checkPosition(position: number): void {
    if (position < 0 || position > this.length) {
      throw new RangeError("position is not within rope bounds.");
    }
  }

  private checkRange(start: number, end: number): void {
    if (start < 0 || start > this.length) {
      throw new RangeError("Start is not within rope bounds.");
    }
    if (end < 0 || end > this.length) {
      throw new RangeError("End is not within rope bounds.");
    }
    if (start > end) {
      throw new RangeError("Start is greater than end.");
    }
  }

  /**
   * Creates a rope data structure
   *
   * @param {String} value - String to populate the rope.
   * @api public
   */
  public constructor(value: string);
  public constructor(left: Rope, right: Rope);
  public constructor(a: string | Rope, b?: Rope) {
    if (typeof a === "string") {
      this.data = a;
      this.length = a.length;
      this.adjust();
    } else if (a instanceof Rope && b instanceof Rope) {
      this.data = [a, b];
      this.length = a.length + b.length;
      this.adjust();
    } else {
      throw new TypeError("invalid constructor arguments");
    }
  }

  /**
   * Adjusts the tree structure, so that very long nodes are split
   * and short ones are joined
   *
   * @api private
   */
  private adjust(): this {
    if (typeof this.data === "string") {
      if (this.length > Rope.SPLIT_LENGTH) {
        const divide = Math.floor(this.length / 2);
        this.data = [
          new Rope(this.data.substring(0, divide)),
          new Rope(this.data.substring(divide)),
        ];
      }
    } else {
      if (this.length < Rope.JOIN_LENGTH) {
        const [left, right] = this.data;
        this.data = left.toString() + right.toString();
      }
    }
    return this;
  }

  /**
   * Converts the rope to a JavaScript String.
   *
   * @api public
   */
  public toString(): string {
    if (typeof this.data === "string") {
      return this.data;
    } else {
      const [left, right] = this.data;
      return left.toString() + right.toString();
    }
  }

  /**
   * Removes text from the rope between the `start` and `end` positions.
   * The character at `start` gets removed, but the character at `end` is
   * not removed.
   *
   * @param {Number} start - Initial position (inclusive)
   * @param {Number} end - Final position (not-inclusive)
   * @api public
   */
  public remove(start: number, end: number): Rope {
    this.checkRange(start, end);
    if (start === end) {
      return this;
    }
    if (typeof this.data === "string") {
      return new Rope(this.data.substring(0, start) + this.data.substring(end));
    } else {
      const [left, right] = this.data;
      const leftLength = left.length;
      const leftStart = Math.min(start, leftLength);
      const leftEnd = Math.min(end, leftLength);
      const rightLength = right.length;
      const rightStart = Math.max(0, Math.min(start - leftLength, rightLength));
      const rightEnd = Math.max(0, Math.min(end - leftLength, rightLength));
      return new Rope(
        leftStart < leftLength ? left.remove(leftStart, leftEnd) : left,
        rightEnd > 0 ? right.remove(rightStart, rightEnd) : right
      );
    }
  }

  /**
   * Inserts text into the rope on the specified position.
   *
   * @param {Number} position - Where to insert the text
   * @param {String} value - Text to be inserted on the rope
   * @api public
   */
  public insert(position: number, value: string): Rope {
    if (value.length === 0) {
      return this;
    }
    this.checkPosition(position);
    if (typeof this.data === "string") {
      return new Rope(
        this.data.substring(0, position) +
          value.toString() +
          this.data.substring(position)
      );
    } else {
      const [left, right] = this.data;
      const leftLength = left.length;
      return position < leftLength
        ? new Rope(left.insert(position, value), right)
        : new Rope(left, right.insert(position - leftLength, value));
    }
  }

  /**
   * Rebuilds the entire rope structure, producing a balanced tree.
   *
   * @api public
   */
  public rebuild(): void {
    if (typeof this.data !== "string") {
      const [left, right] = this.data;
      this.data = left.toString() + right.toString();
      this.adjust();
    }
  }

  /**
   * Finds unbalanced nodes in the tree and rebuilds them.
   *
   * @api public
   */
  public rebalance(): void {
    if (typeof this.data !== "string") {
      const [left, right] = this.data;
      if (
        left.length / right.length > Rope.REBALANCE_RATIO ||
        right.length / left.length > Rope.REBALANCE_RATIO
      ) {
        this.rebuild();
      } else {
        left.rebalance();
        right.rebalance();
      }
    }
  }

  /**
   * Returns text from the rope between the `start` and `end` positions.
   * The character at `start` gets returned, but the character at `end` is
   * not returned.
   *
   * @param {Number} start - Initial position (inclusive)
   * @param {Number} end - Final position (not-inclusive)
   * @api public
   */
  public substring(start: number, end?: number): string {
    if (typeof end == "undefined") {
      end = this.length;
    }
    if (start < 0 || isNaN(start)) {
      start = 0;
    } else if (start > this.length) {
      start = this.length;
    }
    if (end < 0 || isNaN(end)) {
      end = 0;
    } else if (end > this.length) {
      end = this.length;
    }
    if (typeof this.data === "string") {
      return this.data.substring(start, end);
    } else {
      const [left, right] = this.data;
      const leftLength = left.length;
      const leftStart = Math.min(start, leftLength);
      const leftEnd = Math.min(end, leftLength);
      const rightLength = right.length;
      const rightStart = Math.max(0, Math.min(start - leftLength, rightLength));
      const rightEnd = Math.max(0, Math.min(end - leftLength, rightLength));
      if (leftStart != leftEnd) {
        if (rightStart != rightEnd) {
          return (
            left.substring(leftStart, leftEnd) +
            right.substring(rightStart, rightEnd)
          );
        } else {
          return left.substring(leftStart, leftEnd);
        }
      } else {
        if (rightStart != rightEnd) {
          return right.substring(rightStart, rightEnd);
        } else {
          return "";
        }
      }
    }
  }

  /**
   * Returns a string of `length` characters from the rope, starting
   * at the `start` position.
   *
   * @param {Number} start - Initial position (inclusive)
   * @param {Number} length - Size of the string to return
   * @api public
   */
  public substr(start: number, length: number): string {
    let end;
    if (start < 0) {
      start = this.length + start;
      if (start < 0) {
        start = 0;
      }
    }
    if (typeof length == "undefined") {
      end = this.length;
    } else {
      if (length < 0) {
        length = 0;
      }
      end = start + length;
    }
    return this.substring(start, end);
  }

  /**
   * Returns the character at `position`
   *
   * @param {Number} position
   * @api public
   */
  public charAt(position: number): string {
    return this.substring(position, position + 1);
  }

  /**
   * Returns the code of the character at `position`
   *
   * @param {Number} position
   * @api public
   */
  public charCodeAt(position: number): number {
    return this.substring(position, position + 1).charCodeAt(0);
  }

  public buildParagraph(builder: ParagraphBuilder): void {
    if (typeof this.data === "string") {
      builder.addText(this.data);
    } else {
      const [left, right] = this.data;
      left.buildParagraph(builder);
      right.buildParagraph(builder);
    }
  }

  /**
   * The threshold used to split a leaf node into two child nodes.
   *
   * @api public
   */
  public static SPLIT_LENGTH = 1000;
  /**
   * The threshold used to join two child nodes into one leaf node.
   *
   * @api public
   */
  public static JOIN_LENGTH = 500;
  /**
   * The threshold used to trigger a tree node rebuild when rebalancing the rope.
   *
   * @api public
   */
  public static REBALANCE_RATIO = 1.2;
}
