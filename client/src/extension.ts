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

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  let serverExecutable: string =
    "U:\\projects\\skybox\\duwa\\chewa\\bin\\duwa-tools.exe"; // Default to duwa-tools in PATH

  //   const executableName = "";
  //   serverExecutable = context.asAbsolutePath(
  //     path.join("server", executableName)
  //   );

  //   // Make sure the file exists and is executable (not needed on Windows)
  //   if (process.platform !== "win32") {
  //     if (!fs.existsSync(serverExecutable)) {
  //       window.showErrorMessage(
  //         `Server executable not found: ${serverExecutable}`
  //       );
  //       return;
  //     }

  //     try {
  //       fs.chmodSync(serverExecutable, "755");
  //     } catch (error) {
  //       window.showErrorMessage(`Failed to set executable permissions: ${error}`);
  //       return;
  //     }
  //   }

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: {
      command: serverExecutable,
      args: [
        "lsp",
        "-v",
        "-l",
        "U:\\projects\\skybox\\duwa\\chewa\\bin\\out.txt",
      ],
    },
    debug: {
      command: serverExecutable,
      args: [
        "lsp",
        "-v",
        "-l",
        "U:\\projects\\skybox\\duwa\\chewa\\bin\\out.txt",
      ],
    },
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: [{ scheme: "file", language: "duwa" }],
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher("**/.duwa"),
    },
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    "DuwaServer",
    "Duwa Language Server",
    serverOptions,
    clientOptions
  );

  // Start the client. This will also launch the server
  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
