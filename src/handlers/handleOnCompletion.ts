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
    ...completionData(params.position),
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
      // TODO: this throws an error
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
