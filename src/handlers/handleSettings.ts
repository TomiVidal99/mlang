import {
  DidChangeConfigurationParams,
  TextDocuments,
  _Connection,
} from "vscode-languageserver";
import { ISettings, defaultSettings, updateGlobalSettings } from "../data";
import { documentSettings } from "../server";
import { hasConfigurationCapability, validateTextDocument } from ".";
import { TextDocument } from "vscode-languageserver-textdocument";

interface IOnDidChangeConfigurationProps {
  change: DidChangeConfigurationParams;
  documents: TextDocuments<TextDocument>;
  connection: _Connection;
}
export function handleOnDidChangeConfiguration({
  change,
  documents,
  connection,
}: IOnDidChangeConfigurationProps) {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    updateGlobalSettings(<ISettings>(change.settings.settings || defaultSettings));
  }

  // Revalidate all open text documents
  documents.all().forEach((doc) => {
    validateTextDocument(doc, hasConfigurationCapability, connection);
  });
}
