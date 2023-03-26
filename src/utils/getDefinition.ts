import { Location, Position, Range, TextDocument } from "vscode-languageserver";
import { getWordInDocument } from "./getWordInDocument";

// const functionRegex = new RegExp(`function\\s+${word}\\s*\\(`);

interface ISyntax {
  name: string;
  format: (arg0: string) => string;
}

const synatx: ISyntax[] = [
  {
    "name": "function definition",
    "format": (keyword) => `function ${keyword}`
  },
];

interface IParams {
  document: TextDocument;
  word: string;
}

export function getDefinition({ document, word }: IParams): Location[] | null {
  const definitionsLocations: Location[] = [];
  const matches = getWordInDocument({ document, word });

  if (matches.length === 0) {
    return null;
  }

  matches.forEach(([line, lineNumber]) => {
    if (line.includes("function " + word + "(")) {
      // match for function definition
      const wordStart = line.split(word)[0].length;
      const defPos = Position.create(lineNumber, wordStart);
      const defRange = Range.create(defPos, defPos);
      definitionsLocations.push(Location.create(document.uri, defRange));
    }
  });

  return definitionsLocations.length > 0 ? definitionsLocations : null;
}
