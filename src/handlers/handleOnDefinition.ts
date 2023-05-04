import { Location, Position, Range, TextDocument, TextDocuments } from "vscode-languageserver";
import { formatURI, getAllFunctionDefinitions, getPathFromURI, getWordRangeAtPosition } from "../utils";
import * as path from "path";
import { log } from "../server";

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

  // handle functions definitions
  const allFunctionsDefinitions = getAllFunctionDefinitions(document.uri);
  // log(JSON.stringify(allFunctionsDefinitions));
  allFunctionsDefinitions.forEach((func) => {
    if (func.name === word) {
      // log("func.uri: " + func.uri + "\n\nformatted: " + formatURI(func.uri));
      const loc: Location = {
        range: func.range,
        uri: func.uri
      };
      locations.push(loc);
    }
  });

  // handle files definitions
  documents.all().forEach((doc) => {
    const filename = path.basename(getPathFromURI(doc.uri), ".m");
    if (filename === word) {
      const loc: Location = {
        range: Range.create(Position.create(0,0), Position.create(0,0)),
        uri: doc.uri
      };
      locations.push(loc);
    }
  });

  return locations.length > 0 ? locations : null;
}
