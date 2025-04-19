/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from "path";
import { workspace, ExtensionContext, window } from "vscode";
import * as fs from "fs";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  StreamInfo,
  TransportKind,
} from "vscode-languageclient/node";
import * as vscode from "vscode";
import * as net from "net";
import * as WebSocket from "ws";

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  // Get configuration
  const config = workspace.getConfiguration("duwaLanguageServer");
  const isDebugMode =
    process.env.VSCODE_DEBUG_MODE === "true" || vscode.debug.activeDebugSession;
  const serverExecutable: string =
    "U:\\projects\\skybox\\duwa\\chewa\\bin\\duwa-tools.exe";
  const websocketUrl =
    config.get<string>("websocketUrl") || "ws://localhost:4389";

  let serverOptions: ServerOptions;

  if (isDebugMode) {
    // In debug mode, use WebSocket connection
    console.log("Duwa LSP: Using WebSocket connection in debug mode");

    serverOptions = () => {
      return new Promise<StreamInfo>((resolve, reject) => {
        const ws = new WebSocket(websocketUrl);

        ws.on("open", () => {
          console.log(`Connected to WebSocket server at ${websocketUrl}`);

          // Create duplex stream from the WebSocket
          const reader = WebSocket.createWebSocketStream(ws);

          resolve({
            reader: reader,
            writer: reader,
          });
        });

        ws.on("error", (error) => {
          console.error(`WebSocket connection error: ${error.message}`);
          reject(error);
        });

        ws.on("close", (code, reason) => {
          console.log(`WebSocket connection closed: ${code} - ${reason}`);
        });
      });
    };
  } else {
    // In normal mode, use standard process-based connection
    serverOptions = {
      run: {
        command: serverExecutable,
        args: ["lsp", "-f", "U:\\projects\\skybox\\duwa\\chewa\\bin\\out.txt"],
      },
      debug: {
        command: serverExecutable,
        args: ["lsp", "-f", "U:\\projects\\skybox\\duwa\\chewa\\bin\\out.txt"],
      },
    };
  }

  let jj: Number

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: [{ scheme: "file", language: "duwa" }],
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher("**/.duwa"),
    },
    outputChannelName: "Duwa Language Server",
    // Enable logging of communication between client and server
    traceOutputChannel: window.createOutputChannel("Duwa LSP Trace"),
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    "DuwaServer",
    "Duwa Language Server",
    serverOptions,
    clientOptions
  );

  // Register commands for connection management
  context.subscriptions.push(
    vscode.commands.registerCommand("duwa.restartLspServer", async () => {
      if (client) {
        await client.stop();
        client.start();
        vscode.window.showInformationMessage("Duwa Language Server restarted");
      }
    })
  );

  // Start the client. This will also launch the server
  client.start();

  // Add status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = isDebugMode
    ? "$(bug) Duwa LSP (WebSocket)"
    : "$(check) Duwa LSP";
  statusBarItem.tooltip = isDebugMode
    ? `Connected to WebSocket LSP server at ${websocketUrl}`
    : "Using standard LSP connection";
  statusBarItem.command = "duwa.restartLspServer";
  statusBarItem.show();

  context.subscriptions.push(statusBarItem);
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
