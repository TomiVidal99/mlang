import { TextDocument } from "vscode-languageserver-textdocument";
import {
  IKeyword,
  getFunctionDefinitions,
} from "./getFunctionDefinitions";
import { getPathFromURI } from "./getPathFromURI";
import { documentData, log } from "../server";
import { Parser } from "../parser";

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

export class DocumentData {
  private functionsDefinitions: IKeyword[];
  private functionsReferences: IKeyword[];
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
    const parser = new Parser(this.document);
    const definitions = parser.getFunctionsDefinitions();
    this.functionsDefinitions = definitions;
    // log(JSON.stringify(this.functionsDefinitions));
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
}
