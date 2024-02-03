import {
  type CompletionParams,
  type Location,
  type TextDocuments,
} from 'vscode-languageserver';
import { type TextDocument } from 'vscode-languageserver-textdocument';
import { getWordRangeAtPosition } from '../utils';
import { docManager, visitors } from '../server';
import { type Visitor } from '../parser';

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
  const definitions = visitor?.definitions;

  // LOCAL DEFINITIONS
  if (definitions) {
    locations.push(
      ...definitions
        .filter((def) => def.name === word)
        .map((def) => {
          return {
            range: def.position,
            uri,
          };
        }),
    );
  }

  // OTHER FILES DEFINITIONS
  const otherDocuments = docManager
    .getAllUris()
    .filter((uri) => uri !== params.textDocument.uri);

  otherDocuments.forEach((_uri) => {
    visitors
      .get(_uri)
      ?.definitions.filter((def) => def.context === '0')
      .filter((def) => def.name === word)
      .forEach((def) => {
        locations.push({
          uri: _uri,
          range: def.position,
        });
      });
  });

  return locations.length > 0 ? locations : null;
}
