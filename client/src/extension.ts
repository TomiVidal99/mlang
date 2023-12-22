import { workspace, type ExtensionContext } from 'vscode';
import * as vscode from 'vscode';
import path = require('path');

import {
  LanguageClient,
  type LanguageClientOptions,
  type ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;

export function activate(context: ExtensionContext): void {
  const serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
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
      fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
    },
  };

  client = new LanguageClient(
    'mlang',
    'Octave/Matlab LSP server',
    serverOptions,
    clientOptions,
  );

  // Register the "extension.restartServer" command
  context.subscriptions.push(
    vscode.commands.registerCommand('mlang.restart', () => {
      if (client === undefined) return;
      if (!client.isRunning()) {
        client.start().catch((err) => {
          throw new Error(err);
        });
      } else {
        client.restart().catch((err) => {
          throw new Error(err);
        });
      }
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('mlang.stop', () => {
      if (client === undefined) return;
      if (client?.isRunning()) {
        client.stop().catch((err) => {
          throw new Error(err);
        });
      }
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('mlang.start', () => {
      if (client === undefined) return;
      if (!client?.isRunning()) {
        client.start().catch((err) => {
          throw new Error(err);
        });
      }
    }),
  );

  client.start().catch((err) => {
    throw new Error(err);
  });
}

export function deactivate(): Thenable<void> | undefined {
  if (client === undefined) return undefined;
  return client.stop();
}
