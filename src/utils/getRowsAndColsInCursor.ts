/**
 * Returns the number of line and number of character
 * corresponding to a position in a string.
 * TODO: can have an error if the character '\n' it's consider part of a text string.
 */
export function getRowsAndColsInCursor({ text, characterPosition }: { text: string, characterPosition: number }): [number, number] {
  const position = characterPosition > text.length ? text.length-1 : characterPosition;
  const textUntilCurrentPosition = text.slice(0, position);
  const rows = textUntilCurrentPosition.split('\n');
  const currentRow = rows.length;
  const currentColumn = position - textUntilCurrentPosition.lastIndexOf('\n');
  
  return [currentRow, currentColumn];
}
