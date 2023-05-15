import {
  CompletionItem,
  CompletionItemKind,
  MarkupKind,
  TextDocumentPositionParams,
} from "vscode-languageserver";
import {
  getAllFunctionDefinitions,
  getAllVariableDefinitions,
  getFunctionReferenceMessage,
  getPathFromURI,
} from "../utils";
import { documentData } from "../server";
import { Position } from "vscode-languageserver-textdocument";
import { completionData, defaultSettings } from "../data";

export function handleOnCompletion({
  params,
}: {
  params: TextDocumentPositionParams;
}): CompletionItem[] {
  return [
    ...completionData(params.position),
    ...getCompletionVariables(params.position, params.textDocument.uri),
    ...getCompletionFunctions({
      uri: params.textDocument.uri,
      position: params.position,
    }),
    ...getDocumentsToBeExecutable({
      currentDocument: params.textDocument.uri,
    }),
  ];
}

function getCompletionVariables(position: Position, currentDocURI: string): CompletionItem[] {
  return getAllVariableDefinitions(position.line, currentDocURI).map((v) => {
    return {
      label: v.name,
      documentation: `${v.lineContent}\n\nfrom: ${getPathFromURI(v.uri)}`,
      kind: CompletionItemKind.Variable,
    } as CompletionItem;
  });
}

function getCompletionFunctions({
  uri,
  position,
}: {
  uri: string;
  position: Position;
}): CompletionItem[] {
  // TODO: fix this to use map
  const completionFuncs: CompletionItem[] = [];
  getAllFunctionDefinitions(uri, position.line).forEach((funcDef) => {
    const newCompletionItem: CompletionItem = {
      label: funcDef.name,
      kind: CompletionItemKind.Function,
      insertText: `${funcDef.name}()`, // TODO: make this completion complaint with the arguments
      documentation: {
        kind: MarkupKind.Markdown,
        // value: 'from "' + val.uri + '"',
        value: getFunctionReferenceMessage(funcDef),
      },
    };
    completionFuncs.push(newCompletionItem);
  });
  return completionFuncs;
}

export function getDocumentsToBeExecutable({
  currentDocument,
}: {
  currentDocument: string;
}): CompletionItem[] {
  // TODO: fix this to use map
  const documentsReferences: CompletionItem[] = [];
  documentData.forEach((data) => {
    // log("currentDocument: " + currentDocument + ", doc.uri: " + data.getURI());
    if (currentDocument === data.getURI() || data.getDocumentPath() === defaultSettings.defaultInitFile) return;
    const newCompletionItem: CompletionItem = {
      label: data.getFileName(),
      kind: CompletionItemKind.File,
      insertText: `${data.getFileName()};`
    };
    documentsReferences.push(newCompletionItem);
  });
  return documentsReferences;
}
