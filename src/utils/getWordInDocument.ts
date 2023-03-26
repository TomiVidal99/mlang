import { Range, TextDocument } from "vscode-languageserver";

// TODO: ignore lines in block comments

function isLineCommented(line: string): boolean {
  return line.startsWith("%") || line.startsWith("#");
}

interface IParams {
  document: TextDocument;
  word: string;
}

export function getWordInDocument({ document, word }: IParams): [string, number][] {
  const references: [string, number][] = [];
  const text = document.getText();

  let i = 0;
  text.split("\n").forEach((line) => {
    if (isLineCommented(line)) return;
    if (line.includes(word)) {
      references.push([line, i]);
    }
    i++;
  });

  return references;
}
