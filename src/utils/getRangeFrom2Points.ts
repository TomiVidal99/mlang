import { Range, Position } from "vscode-languageserver";

/**
 * Returns a Range from "vscode-languageserver", given 2 points
 */
export function getRangeFrom2Points(
  a: number | Position,
  b: number | Position,
  c?: number,
  d?: number
): Range {
  if (c && d && typeof a === "number" && typeof b === "number") {
    return Range.create(Position.create(a, b), Position.create(c, d));
  } else if (typeof a === "object" && typeof b === "object") {
    return Range.create(a, b);
  }
}
