import { HandlerResult, Location, Position } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getWordRangeAtPosition } from "../utils";
import { visitors } from "../server";

export function handleReferences(document: TextDocument, position: Position): HandlerResult<Location[], void> {
  const locations: Location[] = [];

  const uri = document.uri;

  const wordRange = getWordRangeAtPosition(document, position);
  if (!wordRange) {
    return null;
  }

  const visitor = visitors.get(uri);
  if (!visitor || !(visitor?.definitions)) return [];
  const {references} = visitor;

  const word = document.getText(wordRange);

  // push references
  locations.push(
    ...references
    .filter(ref => ref.name === word)
    .map((ref) => {
      return {
        range: ref.position,
        uri,
      };
    }));

  return locations;
}
