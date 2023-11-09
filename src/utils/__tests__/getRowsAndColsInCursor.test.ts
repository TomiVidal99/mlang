import { expect, it, describe } from 'bun:test';
import { getRowsAndColsInCursor } from '..';

describe('getRowsAndColsInCursor', () => {
  it('should correctly determine the row and column numbers', () => {
    const text = 'ABC\nDEF\nGHI';

    // Test for different character positions
    expect(getRowsAndColsInCursor({ text, characterPosition: 0 })).toEqual([
      0, 0,
    ]);
    expect(getRowsAndColsInCursor({ text, characterPosition: 4 })).toEqual([
      1, 0,
    ]);
    expect(getRowsAndColsInCursor({ text, characterPosition: 5 })).toEqual([
      1, 1,
    ]);
    expect(getRowsAndColsInCursor({ text, characterPosition: 8 })).toEqual([
      2, 0,
    ]);
  });

  it('should handle an empty string', () => {
    const text = '';

    expect(getRowsAndColsInCursor({ text, characterPosition: 0 })).toEqual([
      0, 0,
    ]);
  });

  it('should handle a character position beyond the text length', () => {
    const text = 'This is a sample text.';
    expect(getRowsAndColsInCursor({ text, characterPosition: 100 })).toEqual([
      0, 21,
    ]);
  });

  it('should handle multi lines text', () => {
    const text = `
# comment
`;
    expect(getRowsAndColsInCursor({ text, characterPosition: 3 })).toEqual([
      1, 2,
    ]);
  });
});
