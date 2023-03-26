import { Location, TextDocument, TextDocuments } from "vscode-languageserver";
import { getDefinition, getWordRangeAtPosition } from "./utils";

interface IProps {
  params: any;
  documents: TextDocuments<TextDocument>;
}

export async function handleOnDefinition({ params, documents }: IProps ): Promise<Location | Location[] | null> {
  const documentUri = params.textDocument.uri;
  const position = params.position;

  const document = documents.get(documentUri);
  if (!document) {
    return null;
  }

  const wordRange = getWordRangeAtPosition(document, position);
  if (!wordRange) {
    return null;
  }

  const word = document.getText(wordRange);
  const locations: Location[] = [];

  // Search for definition in the current file
  const currentDefinition = getDefinition({document, word});
  if (currentDefinition) {
    locations.push(...currentDefinition);
  }

  // Search for definition in other open files
  for (const doc of documents.all()) {
    if (doc.uri === documentUri) {
      continue;
    }
    const definition = getDefinition({document: doc, word});
    if (definition) {
      locations.push(...definition);
    }
  }

  return locations.length > 0 ? locations : null;
}
