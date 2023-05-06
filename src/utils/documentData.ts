import { TextDocument } from "vscode-languageserver-textdocument";
import {
  IKeyword,
} from "./getFunctionDefinitions";
import { getPathFromURI } from "./getPathFromURI";
import { connection, documentData, log } from "../server";
import { IFunctionDefinition, IFunctionReference, Parser } from "../parser";
import { Diagnostic, PublishDiagnosticsParams } from "vscode-languageserver";
import { parseToIKeyword } from "./parseToIKeyword";

export function addNewDocument(document: TextDocument): void {
  const data = new DocumentData(document);
  data.updateDocumentData();
  documentData.push(data);
}

export function updateDocumentData(document: TextDocument): void {
  let foundFlag = false;
  // const doc = TextDocument.create(document.uri, document.languageId, document.version, document.getText());
  documentData.forEach((data) => {
    if (data.getURI() === document.uri) {
      foundFlag = true;
      data.setDocument(document);
      data.updateDocumentData();
      connection.sendDiagnostics(data.getDiagnostics());
    }
  });
  if (!foundFlag) {
    addNewDocument(document);
  }
}

export function getAllFunctionDefinitions(uri: string): IFunctionDefinition[] {
  const d = documentData.flatMap((data) => { 
    return data.getFunctionsDefinitions(uri === data.getURI()).map((def) => {
      return {
        ...def,
        uri: data.getURI(),
      };
    });
  });
  // log("d: " + JSON.stringify(d));
  return d;
}

/**
 * Returns all functions references
 * if given a uri, only returns the valid references for that uri.
 */
export function getAllFunctionReferences(uri: string): IKeyword[] {
  return documentData.flatMap((data) => data.getFunctionsReferences(uri && uri === data.getURI()));
}

export class DocumentData {
  private functionsDefinitions: IFunctionDefinition[];
  private functionsReferences: IFunctionReference[];
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

  /**
   * Returns the functions references of the current document
   */
  public getFunctionsReferences(currentDoc?: boolean): IKeyword[] {
    // log("URI: " + JSON.stringify(this.getURI()));
    if (currentDoc) {
      return this.functionsReferences.map((fn) => parseToIKeyword(fn, this.getURI()));
    }
    return this.functionsReferences.filter((fn) => fn.depth === 0).map((fn) => parseToIKeyword(fn, this.getURI()));
  }

  /**
   * Returns the definitions based on weather the definitions are
   * local for the current file or the depth it's file level.
   */
  public getFunctionsDefinitions(currentDoc?: boolean): IFunctionDefinition[] {
    if (currentDoc) {
      return this.functionsDefinitions;
    } 
    return this.functionsDefinitions.filter((fn) => fn.depth === 0);
  }

  /**
  * Sends the updated diagnostics to the client.
  */
  public updateDiagnostics(diagnostics: Diagnostic[]): void {
    this.diagnostics = diagnostics;
  }

  public getDiagnostics(): PublishDiagnosticsParams {
    return {
      uri: this.getURI(),
      diagnostics: this.diagnostics
    };
  }
}
