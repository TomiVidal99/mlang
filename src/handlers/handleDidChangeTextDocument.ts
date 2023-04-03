import { TextDocument, TextDocumentChangeEvent } from "vscode-languageserver";
import { log } from "../server";

export function handleOnDidChangeContent({change}: {change: TextDocumentChangeEvent<TextDocument>}): void {
  const document = change.document;
  log("changed " + document.uri);
}
