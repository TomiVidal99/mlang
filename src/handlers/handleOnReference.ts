import { HandlerResult, Location, ReferenceParams, TextDocuments } from "vscode-languageserver";
import {getAllFunctionReferences, getAllVariableReferences, getWordRangeAtPosition} from "../utils";
import { TextDocument } from "vscode-languageserver-textdocument";

export function handleOnReference({ params, documents }: { params: ReferenceParams, documents: TextDocuments<TextDocument> }): HandlerResult<Location[], void> {
  return new Promise((resolve, _reject) => { 
    const locations: Location[] = [];

    const documentUri = params.textDocument.uri;
    const position = params.position;

    const document = documents.get(documentUri);
    if (!document) {
      return null;
    }

    const wordRange = getWordRangeAtPosition(document, position);
    if (!wordRange) {
      return null;
    }

    const word = document.getText(wordRange);

    const allFunctionsReferences = getAllFunctionReferences(document.uri);
    allFunctionsReferences.forEach((func) => {
      // log(`func name: ${func.name}, word: ${word}`);
      if (func.name === word) {
        const loc: Location = {
          range: func.range,
          uri: func.uri,
        };
        locations.push(loc);
      }
    });

    const allVariableReferences = getAllVariableReferences(document.uri);
    allVariableReferences.forEach((v) => {
      // log(`func name: ${func.name}, word: ${word}`);
      if (v.name === word) {
        const loc: Location = {
          range: v.range,
          uri: v.uri,
        };
        locations.push(loc);
      }
    });

    resolve(locations);
  });
}
