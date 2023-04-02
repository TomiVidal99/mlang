import { CompletionItem, CompletionItemKind, MarkupKind, TextDocument, TextDocumentPositionParams, TextDocuments } from "vscode-languageserver";
import { completionData } from "../data";
import { log } from "console";
import * as path from "path";
import { getAllFunctionDefinitions, getPathFromURI } from "../utils";

interface IUpdateCompletionListProps {
  document: TextDocument;
}
export function updateCompletionList({document}: IUpdateCompletionListProps) {
  // const text = document.getText();
  // const definedFunctions = grabFunctionsFromDocument({text});
  // updateFunctionList({documents: [document]});
}

export function handleOnCompletion({documentPosition, documents}: {documentPosition: TextDocumentPositionParams, documents: TextDocuments<TextDocument>}): CompletionItem[] {
  return [...completionData, ...getFunctionsFromFunctionsMap(), ...getDocumentsToBeExacutable({documents, currentDocument: documentPosition.textDocument.uri})];
}

function getFunctionsFromFunctionsMap(): CompletionItem[] {
  // TODO: fix this to use map
  const functionsReferences: CompletionItem[] = [];
  getAllFunctionDefinitions().forEach((val) => {
    log("test");
    const newCompletionItem: CompletionItem = {
      label: val.name,
      kind: CompletionItemKind.Function,
      documentation: {
        kind: MarkupKind.Markdown,
        value: 'from "' + val.uri + '"',
      },
    };
    functionsReferences.push(newCompletionItem);
  });
  return functionsReferences;
}

function getDocumentsToBeExacutable({documents, currentDocument}:{documents: TextDocuments<TextDocument>, currentDocument: string}): CompletionItem[] {
  // TODO: fix this to use map
  const documentsReferences: CompletionItem[] = [];
  documents.all().forEach((doc) => {
    if (currentDocument === doc.uri) return;
    const newCompletionItem: CompletionItem = {
      label: path.basename(getPathFromURI(doc.uri)),
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
