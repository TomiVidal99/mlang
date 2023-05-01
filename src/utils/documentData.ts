import { TextDocument } from "vscode-languageserver-textdocument";
import {
  IKeyword,
} from "./getFunctionDefinitions";
import { getPathFromURI } from "./getPathFromURI";
import { connection, documentData, log } from "../server";
import { Parser } from "../parser";
import { Diagnostic, PublishDiagnosticsParams } from "vscode-languageserver";
import { formatURI } from "./formatURI";

export function addNewDocument(document: TextDocument): void {
  const data = new DocumentData(document);
  data.updateDocumentData();
  documentData.push(data);
}

export function updateDocumentData(document: TextDocument): void {
  let foundFlag = false;
  const doc = TextDocument.create(getPathFromURI(document.uri), document.languageId, document.version, document.getText());
  documentData.forEach((data) => {
    if (data.getURI() === doc.uri) {
      foundFlag = true;
      data.setDocument(doc);
      data.updateDocumentData();
      connection.sendDiagnostics(data.getDiagnostics());
    }
  });
  if (!foundFlag) {
    addNewDocument(doc);
  }
}

export function getAllFunctionDefinitions(): IKeyword[] {
  const functions: IKeyword[] = documentData.flatMap((data) =>
    data.getFunctionsDefinitionsNames()
  ).map((d) => d[1]);
  return functions;
}

export function getAllFunctionReferences(): IKeyword[] {
  const functions: IKeyword[] = documentData.flatMap((data) =>
    data.getFunctionsReferencesNames()
  ).map((d) => d[1]);
  return functions;
}

export class DocumentData {
  private functionsDefinitions: IKeyword[];
  private functionsReferences: IKeyword[];
  private document: TextDocument;
  private diagnostics: Diagnostic[];

  constructor(document: TextDocument) {
    this.functionsDefinitions = [];
    this.functionsReferences = [];
    this.document = document;
    this.diagnostics = [];
  }

  public setDocument(document: TextDocument): void {
    this.document = document;
  }

  /**
   * Updates the list of references, definitions, etc. of the current document.
   */
  public updateDocumentData(): void {
    // TODO: get the other data
    const parser = new Parser(this.document);
    this.functionsDefinitions = parser.getFunctionsDefinitions(); 
    this.functionsReferences = parser.getFunctionsReferences();
    this.updateDiagnostics(parser.getDiagnostics());
  }

  /**
   * Returns the documents uri, formatted with a prefix of 'path://'
   */
  public getURI(): string {
    return this.document.uri;
  }

  /**
   * Returns the documents uri as a common path.
   */
  public getDocumentPath(): string {
    return getPathFromURI(this.document.uri);
  }

  public getFunctionsReferencesNames(): [string, IKeyword][] {
    return this.functionsReferences.map((fn) => [fn.name, fn]);
  }

  public getFunctionsDefinitionsNames(): [string, IKeyword][] {
    return this.functionsDefinitions.map((fn) => [fn.name, fn]);
  }

  /**
  * Sends the updated diagnostics to the client.
  */
  public updateDiagnostics(diagnostics: Diagnostic[]): void {
    this.diagnostics = diagnostics;
  }

  public getDiagnostics(): PublishDiagnosticsParams {
    return {
      uri: formatURI(this.document.uri),
      diagnostics: this.diagnostics
    };
  }
}
