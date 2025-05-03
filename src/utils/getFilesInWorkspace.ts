import { pathToFileURL } from 'url';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getAllMFiles } from '.';

const fs = require('fs');
const path = require('path');

export function getFilesInWorkspace({
  workspace,
}: {
  workspace: string;
}): TextDocument[] {
  const files = getAllMFiles(workspace);
  const documents = files.map((file) => {
    const uri = pathToFileURL(path.resolve(file)).toString();
    const content = fs.readFileSync(file, 'utf-8');
    const document = TextDocument.create(uri, 'octave', 1, content);
    return document;
  });

  return documents;
}
