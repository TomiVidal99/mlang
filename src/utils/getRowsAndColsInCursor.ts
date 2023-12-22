/**
 * Returns the number of line and number of character
 * corresponding to a position in a string.
 * TODO: can have an error if the character '\n' it's consider part of a text string.
 * @returns Array - [[ROWS, COLUMNS]]
 */
export function getRowsAndColsInCursor({
  text,
  characterPosition,
}: {
  text: string;
  characterPosition: number;
}): [number, number] {
  let currentRow = 0;
  let currentColumn = 0;
  let insideSingleQuotes = false;
  let insideDoubleQuotes = false;

  if (characterPosition > text.length) {
    return [0, text.length - 1];
  }

  for (let i = 0; i < characterPosition; i++) {
    const char = text[i];
    if (char === '\n' && !insideSingleQuotes && !insideDoubleQuotes) {
      currentRow++;
      currentColumn = 0;
    } else if (char === "'") {
      insideSingleQuotes = !insideSingleQuotes;
    } else if (char === '"') {
      insideDoubleQuotes = !insideDoubleQuotes;
    } else {
      currentColumn++;
    }
  }

  return [currentRow, currentColumn];
}
