import { TextDocument } from "vscode-languageserver-textdocument";
import { IKeyword } from "./getFunctionDefinitions";
import { getPathFromURI } from "./getPathFromURI";
import { addDocumentsFromPath, documentData, log } from "../server";
import {
  IFunctionDefinition,
  IFunctionReference,
  IReference,
  IVariableDefinition,
  Parser,
} from "../parser";
import { Diagnostic, PublishDiagnosticsParams } from "vscode-languageserver";
import { parseToIKeyword } from "./parseToIKeyword";
import * as path from "path";

export function addNewDocument(document: TextDocument): void {
  const data = new DocumentData(document);
  data.updateDocumentData();
  documentData.push(data);
  // log("adding: " + data.getDocumentPath());
  data.postUpdateHooks();
}

/**
 * Updates the text and all the data of a document.
 */
export function updateDocumentData(
  document: TextDocument,
  postUpdateCallback: (data: DocumentData) => void
): void {
  let foundFlag = false;
  // const doc = TextDocument.create(document.uri, document.languageId, document.version, document.getText());
  documentData.forEach((data) => {
    if (data.getURI() === document.uri) {
      foundFlag = true;
      data.setDocument(document);
      data.updateDocumentData();
      postUpdateCallback(data);
    }
  });
  if (!foundFlag) {
    addNewDocument(document);
  }
}

/**
 * Gets the variable definitions of all the documents registered.
 */
export function getAllVariableDefinitions(lineNumber: number, currentDocURI: string): IVariableDefinition[] {
  return documentData.flatMap((data) =>
    data
      .getVariableDefinitions(lineNumber, data.getURI() === currentDocURI)
      .map((d) => {
        return {
          uri: data.getURI(),
          ...d,
        } as IVariableDefinition;
      })
  );
}

export function getAllFunctionDefinitions(
  uri: string,
  lineNumber: number
): IFunctionDefinition[] {
  const d = documentData.flatMap((data) => {
    return data
      .getFunctionsDefinitions(lineNumber, uri === data.getURI())
      .map((def) => {
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
  return documentData.flatMap((data) =>
    data.getFunctionsReferences(uri && uri === data.getURI())
  );
}

export class DocumentData {
  private functionsDefinitions: IFunctionDefinition[];
  private functionsReferences: IFunctionReference[];
  private document: TextDocument;
  private diagnostics: Diagnostic[];
  private parser: Parser;

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
    this.parser = new Parser(this.document);
    this.functionsDefinitions = this.parser.getFunctionsDefinitions();
    this.functionsReferences = this.parser.getFunctionsReferences();
    this.updateDiagnostics(this.parser.getDiagnostics());
  }

  /**
   * Returns the variable definitions of the document.
   */
  public getVariableDefinitions(lineNumber?: number, currentDoc?: boolean): IVariableDefinition[] {
    if (currentDoc) {
      const dep = this.parser.getCursorDepth(lineNumber);
      log("--------------------" + JSON.stringify(lineNumber));
      log("dep current: " + JSON.stringify(dep));
      return this.parser.getVariableDefinitions().filter((v) => dep.includes(v.depth));
    }
    return this.parser.getVariableDefinitions().filter((v) => v.depth === "");
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
      return this.functionsReferences.map((fn) =>
        parseToIKeyword(fn, this.getURI())
      );
    }
    return this.functionsReferences
      .filter((fn) => fn.depth.at(-1) === "")
      .map((fn) => parseToIKeyword(fn, this.getURI()));
  }

  /**
   * Returns the definitions based on weather the definitions are
   * local for the current file or the depth it's file level.
   */
  public getFunctionsDefinitions(
    lineNumber?: number,
    currentDoc?: boolean,
  ): IFunctionDefinition[] {
    if (currentDoc) {
      const dep = this.parser.getCursorDepth(lineNumber);
      // log("current context: " + JSON.stringify(dep));
      return this.functionsDefinitions.filter((fn) => dep.includes(fn.depth));
    }
    return this.functionsDefinitions.filter((fn) => fn.depth === "");
  }

  /**
   * Sends the updated diagnostics to the client.
   */
  private updateDiagnostics(diagnostics: Diagnostic[]): void {
    this.diagnostics = diagnostics;
  }

  public getDiagnostics({
    allFilesInProject,
    functionsDefinitions,
    variablesDefinitions,
    references,
  }: {
    allFilesInProject: string[];
    functionsDefinitions: IFunctionDefinition[];
    variablesDefinitions: string[];
    references: string[];
  }): PublishDiagnosticsParams {
    return {
      uri: this.getURI(),
      diagnostics: [
        ...this.diagnostics,
        ...this.parser.validateReferences({
          uris: allFilesInProject,
          functionsDefinitions,
          variablesDefinitions,
          references
        }),
      ],
    };
  }

  /**
   * Returns the content of the document splitted by '\n'
   */
  public getLines(): string[] {
    return this.parser.getLines();
  }

  public getFileName(): string {
    return path.basename(this.getDocumentPath(), ".m");
  }

  public getLocallyReferencedPaths(): string[] {
    return this.parser.getAddedPaths();
  }

  /**
   * Returns the directory of the current document.
   */
  public getDocumentDirectory(): string {
    return path.dirname(this.getDocumentPath());
  }

  /**
   * Returns weather the current document references a path or not
   */
  public referencesHasThisPath(path: string): boolean {
    return this.getLocallyReferencedPaths().includes(path);
  }

  public getExportedFunctions(): IFunctionDefinition[] {
    // log(`file ${this.getFileName()}: ${JSON.stringify(this.getFunctionsDefinitions().map((def) => def.name))}`);
    return this.getFunctionsDefinitions().filter(
      (def) => def.name === this.getFileName()
    );
  }

  /**
   * Returns the references in the current file.
   * This references are variables and files. NOT functions.
   * @returns {IReference[]} - variables and files references.
   */
  public getReferences(): IReference[] {
    return this.parser.getReferences();
  }

  /**
   * Sends diagnostics when a referenced argument it's not valid.
   * TODO: make this
   */
  private checkCorrectArguments(): void {
    return;
  }

  /**
   * Methods that must be ran after updating the document and pushing it to the array.
   */
  public postUpdateHooks(): void {
    this.getLocallyReferencedPaths()
      .filter((p) => p !== this.getDocumentPath())
      .forEach((p) => {
        // log("p: " + p);
        // this must be executed after pushing data to the documentData array
        // TODO: consider when the path it's updated and the document it's not longer considered.
        // what happens when multiple files references to the same files?
        addDocumentsFromPath(p);
      });

    this.checkCorrectArguments();
  }

}
