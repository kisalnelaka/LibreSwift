import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
    Executable
} from 'vscode-languageclient/node';

let client: LanguageClient;

export async function activateLSP(context: vscode.ExtensionContext) {
    // For now, we assume sourcekit-lsp is in the system PATH.
    // In a production extension, you might want to resolve it via Swift toolchain paths.
    const serverExecutable: Executable = {
        command: 'sourcekit-lsp',
        args: []
    };

    const serverOptions: ServerOptions = serverExecutable;

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'swift' }],
        synchronize: {
            // Notify the server about file changes to '.sourcekit-lsp/config.json'
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.sourcekit-lsp/config.json')
        }
    };

    client = new LanguageClient(
        'sourcekit-lsp',
        'SourceKit-LSP',
        serverOptions,
        clientOptions
    );

    try {
        await client.start();
        vscode.window.showInformationMessage('LibreSwift: SourceKit-LSP activated successfully.');
    } catch (error: any) {
        // If it fails to start (e.g. sourcekit-lsp not found), show an error but don't crash.
        vscode.window.showErrorMessage(`Failed to start SourceKit-LSP: ${error.message}`);
    }

    const restartCmd = vscode.commands.registerCommand('libreswift.restartLSP', async () => {
        if (client) {
            await client.stop();
            await client.start();
            vscode.window.showInformationMessage('SourceKit-LSP restarted.');
        }
    });

    const statusCmd = vscode.commands.registerCommand('libreswift.statusLSP', () => {
        if (client && client.isRunning()) {
            vscode.window.showInformationMessage('SourceKit-LSP is running.');
        } else {
            vscode.window.showWarningMessage('SourceKit-LSP is not running.');
        }
    });

    context.subscriptions.push(restartCmd, statusCmd);
}

export function deactivateLSP(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
