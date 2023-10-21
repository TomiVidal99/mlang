import { Position, Range } from "vscode-languageserver";
import {TextDocument} from 'vscode-languageserver-textdocument';

export function getWordRangeAtPosition(document: TextDocument, position: Position): Range | undefined {
  const text = document.getText();
  const wordRegex = /[\w]+/g; // regular expression to match words
  let match;
  while ((match = wordRegex.exec(text))) {
    const startPos = match.index;
    const endPos = match.index + match[0].length;
    const range = Range.create(document.positionAt(startPos), document.positionAt(endPos));
    if (
      position.line === range.start.line &&
      position.character >= range.start.character &&
      position.character <= range.end.character
    ) {
      return range;
    }
  }
  return undefined;
}
