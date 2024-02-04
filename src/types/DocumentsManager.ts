import { TextDocument } from 'vscode-languageserver-textdocument';
import { updateDocumentData } from '../server';

export class DocumentsManager {
  private readonly _documents = new Map<string, TextDocument>();

  public constructor() {}

  public set(uri: string, text: string): void {
    if (this._documents.has(uri)) return;
    const document: TextDocument = TextDocument.create(uri, 'octave', 0, text);
    this._documents.set(uri, document);
    updateDocumentData(uri, text);
  }

  public has(uri: string): boolean {
    return this._documents.has(uri);
  }

  public get(uri: string): TextDocument | undefined {
    return this._documents.get(uri);
  }

  public getAllDocuments(): TextDocument[] {
    return Array.from(this._documents, ([_, d]) => d);
  }

  public getAllUris(): string[] {
    return Array.from(this._documents, ([s, _]) => s);
  }

  public delete(uri: string): void {
    this._documents.delete(uri);
  }
}
