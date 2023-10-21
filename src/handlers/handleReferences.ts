import { HandlerResult, Location, Position } from "vscode-languageserver";
import { Parser, Tokenizer, Visitor } from "../parser";
import { TextDocument } from "vscode-languageserver-textdocument";
import { getWordRangeAtPosition } from "../utils";

export function handleReferences(document: TextDocument, position: Position): HandlerResult<Location[], void> {
  return new Promise((resolve, _reject) => {
    const locations: Location[] = [];

    const uri = document.uri;
    const text = document.getText();

    const wordRange = getWordRangeAtPosition(document, position);
    if (!wordRange) {
      return null;
    }

    const word = document.getText(wordRange);

    const tokenizer = new Tokenizer(text);
    const tokens = tokenizer.getAllTokens();
    const parser = new Parser(tokens);
    const ast = parser.makeAST();
    const visitor = new Visitor();
    visitor.visitProgram(ast);
    const references = visitor.references;

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

    resolve(locations);
  });
}