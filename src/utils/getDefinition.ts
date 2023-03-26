import { Location, MessageType, Position, Range, TextDocument } from "vscode-languageserver";
import { getWordInDocument } from "./getWordInDocument";
import { getWordRangeAtPosition } from "./getWordRageAtPosition";

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
  connection: any;
}

export function getDefinition({ document, word, connection }: IParams): Location[] | null {
  const definitionsLocations: Location[] = [];
  const matches = getWordInDocument({ document, word });

  function log(message: string): void {
    connection.sendRequest("window/showMessage", {
      type: MessageType.Info,
      message,
    });
  }

  if (matches.length === 0) {
    return null;
  }

  matches.forEach(([line, lineNumber]) => {
    if (line.includes("function " + word + "(")) {
      // match for function definition
      log(`word: ${word}: ` + JSON.stringify(line.split(word)));
      const wordStart = line.split(word)[0].length;
      const defPos = Position.create(lineNumber, wordStart);
      const defRange = Range.create(defPos, defPos);
      definitionsLocations.push(Location.create(document.uri, defRange));
    }
  });

  return definitionsLocations.length > 0 ? definitionsLocations : null;
}
