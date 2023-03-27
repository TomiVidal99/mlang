import { CompletionItem, TextDocument, TextDocumentPositionParams, TextDocuments } from "vscode-languageserver";
import { completionData } from "../data";
import { log } from "console";

interface IUpdateCompletionListProps {
  document: TextDocument;
}
export function updateCompletionList({document}: IUpdateCompletionListProps) {
  const text = document.getText();
  const definedFunctions = grabFunctionsFromDocument({text});
}

export function handleOnCompletion(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] {
  // The pass parameter contains the position of the text document in
  // which code complete got requested. For the example we ignore this
  // info and always provide the same completion items.
  return completionData;
}

function grabFunctionsFromDocument({text}: {text: string}) {
  const FUNCTION_REGEX = /function\s+(\w+)\s*\([\w\s,]*\)\s*.*?(endfunction|end)\b/gms;
  const matches = FUNCTION_REGEX.exec(text);
  log("TEST!");
  matches.forEach((match) => {
    log("function: " + match);
  });
}
