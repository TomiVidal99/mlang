import {
  type CompletionParams,
  type Location,
  Position,
  Range,
  type TextDocuments,
} from 'vscode-languageserver';
import * as path from 'path';
import { type TextDocument } from 'vscode-languageserver-textdocument';
import { getWordRangeAtPosition } from '../utils';
import { log, visitors } from '../server';

interface IProps {
  params: CompletionParams;
  documents: TextDocuments<TextDocument>;
}

export async function handleDefinitions({
  params,
  documents,
}: IProps): Promise<Location | Location[] | null> {
  const uri = params.textDocument.uri;
  const position = params.position;

  const document = documents.get(uri);
  if (!document) {
    return null;
  }

  const wordRange = getWordRangeAtPosition(document, position);
  if (!wordRange) {
    return null;
  }

  const word = document.getText(wordRange);
  const locations: Location[] = [];

  const visitor = visitors.get(uri);
  const { definitions } = visitor;

  locations.push(
    ...definitions
      .filter((def) => def.name === word)
      .map((ref) => {
        return {
          range: ref.position,
          uri,
        };
      }),
  );

  return locations.length > 0 ? locations : null;
}
