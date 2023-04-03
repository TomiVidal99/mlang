import { TextDocument } from "vscode-languageserver-textdocument";
import {
  FunctionDefinition,
  getFunctionDefinitions,
} from "./getFunctionDefinitions";
import { getPathFromURI } from "./getPathFromURI";
import { documentData } from "../server";
import { log } from "console";

export function addNewDocument(document: TextDocument): void {
  const data = new DocumentData(document);
  data.updateDocumentData();
  documentData.push(data);
}

export function updateDocumentData(document: TextDocument): void {
  let foundFlag = false;
  documentData.forEach((data) => {
    if (data.getURI() === document.uri) {
      foundFlag = true;
      log("updating " + data.getURI());
      data.setDocument(document);
      data.updateDocumentData();
    }
  });
  if (!foundFlag) {
    addNewDocument(document);
  }
}

export function getAllFunctionDefinitions(): FunctionDefinition[] {
  const functions: FunctionDefinition[] = documentData.flatMap((data) =>
    data.getFunctionsDefinitionsNames()
  ).map((d) => d[1]);
  return functions;
}

export class DocumentData {
  private functionsDefinitions: FunctionDefinition[];
  private functionsReferences: FunctionDefinition[];
  private document: TextDocument;

  constructor(document: TextDocument) {
    this.functionsDefinitions = [];
    this.functionsReferences = [];
    this.document = document;
  }

  public setDocument(document: TextDocument): void {
    this.document = document;
  }

  /**
   * Updates the list of references, definitions, etc. of the current document.
   */
  public updateDocumentData(): void {
    // TODO: get the other data
    this.functionsDefinitions = getFunctionDefinitions(this.document);
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

  public getFunctionsReferencesNames(): [string, FunctionDefinition][] {
    return this.functionsReferences.map((fn) => [fn.name, fn]);
  }

  public getFunctionsDefinitionsNames(): [string, FunctionDefinition][] {
    return this.functionsDefinitions.map((fn) => [fn.name, fn]);
  }
}
