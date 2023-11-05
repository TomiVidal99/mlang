import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { getAllMFiles } from '.';

export function getFilesInWorkspace({
  workspace,
}: {
  workspace: string;
}): TextDocument[] {
  const files = getAllMFiles(workspace);
  const documents = files.map((file) => {
    const uri = pathToFileURL(path.resolve(file)).toString();
    console.log(`uri: ${uri}`);
    const content = fs.readFileSync(file, 'utf-8');
    const document = TextDocument.create(uri, 'octave', 1, content);
    return document;
  });

  return documents;
}
