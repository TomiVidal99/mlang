import { Location, TextDocument, TextDocuments } from "vscode-languageserver";
import { formatURI, getAllFunctionDefinitions, getWordRangeAtPosition } from "../utils";

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

  getAllFunctionDefinitions().forEach((func) => {
    if (func.name === word) {
      const loc: Location = {
        range: func.range,
        uri: formatURI(func.uri)
      };
      locations.push(loc);
    }
  });

  return locations.length > 0 ? locations : null;
}
