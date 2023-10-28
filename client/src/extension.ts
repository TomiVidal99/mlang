import { workspace, ExtensionContext } from 'vscode';
import * as vscode from "vscode";
import path = require('path');

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  const serverModule = context.asAbsolutePath(
		path.join('server', 'server.js')
	);
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.stdio },
    debug: {
      module: serverModule,
      transport: TransportKind.stdio,
    },
  };
  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: 'file', language: 'octave' },
      { scheme: 'file', language: 'matlab' },
      { scheme: 'file', language: 'm' },
    ],
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
    }
  };

  client = new LanguageClient(
    'mlang',
    'Octave/Matlab LSP server',
    serverOptions,
    clientOptions
  );

  // Register the "extension.restartServer" command
  context.subscriptions.push(vscode.commands.registerCommand('mlang.restart', () => {
    if (!client || !client.isRunning()) {
      client.start();
    } else {
      client.restart();
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('mlang.stop', () => {
    if (client?.isRunning()) {
      client.stop();
    }
  }));
  context.subscriptions.push(vscode.commands.registerCommand('mlang.start', () => {
    if (!client?.isRunning()) {
      client.start();
    }
  }));

  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
