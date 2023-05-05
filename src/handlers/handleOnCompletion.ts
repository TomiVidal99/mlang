import { CompletionItem, CompletionItemKind, MarkupKind, TextDocumentPositionParams, TextDocuments } from "vscode-languageserver";
import * as path from "path";
import { getAllFunctionDefinitions, getPathFromURI } from "../utils";
import { log } from "../server";
import { TextDocument } from "vscode-languageserver-textdocument";

interface IUpdateCompletionListProps {
  document: TextDocument;
}
export function updateCompletionList({document}: IUpdateCompletionListProps) {
  // const text = document.getText();
  // const definedFunctions = grabFunctionsFromDocument({text});
  // updateFunctionList({documents: [document]});
}

export function handleOnCompletion({params, documents}: {params: TextDocumentPositionParams, documents: TextDocuments<TextDocument>}): CompletionItem[] {
  return [...getCompletionFunctions({uri: params.textDocument.uri})];
  // return [...completionData, ...getFunctionsFromFunctionsMap(), ...getDocumentsToBeExecutable({documents, currentDocument: documentPosition.textDocument.uri})];
}

function getCompletionFunctions({uri}: {uri: string}): CompletionItem[] {
  // TODO: fix this to use map
  const completionFuncs: CompletionItem[] = [];
  getAllFunctionDefinitions(uri).forEach((val) => {
    const newCompletionItem: CompletionItem = {
      label: val.name,
      kind: CompletionItemKind.Function,
      documentation: {
        kind: MarkupKind.Markdown,
        value: 'from "' + val.uri + '"',
      },
    };
    completionFuncs.push(newCompletionItem);
  });
  return completionFuncs;
}

function getDocumentsToBeExecutable({documents, currentDocument}:{documents: TextDocuments<TextDocument>, currentDocument: string}): CompletionItem[] {
  // TODO: fix this to use map
  const documentsReferences: CompletionItem[] = [];
  documents.all().forEach((doc) => {
    log("currentDocument: " + currentDocument + ", doc.uri: " + doc.uri);
    if (currentDocument === doc.uri) return;
    const newCompletionItem: CompletionItem = {
      label: path.basename(getPathFromURI(doc.uri), ".m"),
      kind: CompletionItemKind.File,
      documentation: {
        kind: MarkupKind.Markdown,
        value: 'file: "' + getPathFromURI(doc.uri) + '"',
      },
    };
    documentsReferences.push(newCompletionItem);
  });
  documentsReferences.forEach(function(ref) {
    log("ref: " + ref.label);
  });
  return documentsReferences;
}
