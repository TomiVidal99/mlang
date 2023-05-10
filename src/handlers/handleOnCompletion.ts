import {
  CompletionItem,
  CompletionItemKind,
  MarkupKind,
  TextDocumentPositionParams,
  TextDocuments,
} from "vscode-languageserver";
import * as path from "path";
import {
  getAllFunctionDefinitions,
  getAllVariableDefinitions,
  getFunctionReferenceMessage,
  getPathFromURI,
} from "../utils";
import { documentData, log } from "../server";
import { Position, TextDocument } from "vscode-languageserver-textdocument";
import { completionData, defaultSettings } from "../data";

const PREVIEW_LINES = 7;

interface IUpdateCompletionListProps {
  document: TextDocument;
}
export function updateCompletionList({ document }: IUpdateCompletionListProps) {
  // const text = document.getText();
  // const definedFunctions = grabFunctionsFromDocument({text});
  // updateFunctionList({documents: [document]});
}

export function handleOnCompletion({
  params,
}: {
  params: TextDocumentPositionParams;
}): CompletionItem[] {
  return [
    ...completionData,
    ...getCompletionVariables(),
    ...getCompletionFunctions({
      uri: params.textDocument.uri,
      position: params.position,
    }),
    ...getDocumentsToBeExecutable({
      currentDocument: params.textDocument.uri,
    }),
  ];
}

function getCompletionVariables(): CompletionItem[] {
  return getAllVariableDefinitions().map((v) => {
    return {
      label: v.name,
      documentation: `from: ${getPathFromURI(v.uri)}`,
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
  // TODO: have in count the current position to import in the right context
  // TODO: fix this to use map
  const completionFuncs: CompletionItem[] = [];
  getAllFunctionDefinitions(uri).forEach((funcDef) => {
    const newCompletionItem: CompletionItem = {
      label: funcDef.name,
      kind: CompletionItemKind.Function,
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
      label: path.basename(data.getDocumentPath(), ".m"),
      kind: CompletionItemKind.File,
      // documentation: {
      //   kind: MarkupKind.Markdown,
      //   value: `file: "${getPathFromURI(data.getDocumentPath())}"\n\n${data.getLines().splice(0, PREVIEW_LINES)}`,
      // },
    };
    documentsReferences.push(newCompletionItem);
  });
  // log("documentsReferences: " + JSON.stringify(documentsReferences));
  return documentsReferences;
}
