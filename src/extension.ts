import * as vscode from 'vscode';
import { setupEnvironment } from './commands/setup';
import { runOnDevice } from './commands/deploy';
import { IOSBuildTaskProvider } from './providers/buildTaskProvider';
import { checkDependencies } from './services/dependencyChecker';
import { SidebarProvider } from './providers/sidebarProvider';
import { SecretManager, promptP12Password } from './services/secretManager';
import { activateLSP, deactivateLSP } from './lsp/sourcekitClient';
import { updateLspConfig } from './lsp/lspConfig';

// Make the status bar accessible to other modules
export let libreSwiftStatusBar: vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext) {
    console.log('LibreSwift extension is now active!');

    // Initialize SecretManager
    SecretManager.initialize(context);

    const diagnosticCollection = vscode.languages.createDiagnosticCollection('libreswift');
    context.subscriptions.push(diagnosticCollection);

    // Setup Status Bar State Machine
    libreSwiftStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    libreSwiftStatusBar.text = '$(play) Run on iOS';
    libreSwiftStatusBar.command = 'libreswift.runOnDevice';
    libreSwiftStatusBar.show();
    context.subscriptions.push(libreSwiftStatusBar);

    // 1. Check Dependencies
    const dependenciesOk = await checkDependencies();
    if (!dependenciesOk) {
        vscode.window.showWarningMessage(
            'LibreSwift: Some required CLI tools are missing.',
            'Extract SDK Now'
        ).then(selection => {
            if (selection === 'Extract SDK Now') {
                vscode.commands.executeCommand('libreswift.setupEnvironment');
            }
        });
    }

    // 2. Register Commands
    const setupCommand = vscode.commands.registerCommand('libreswift.setupEnvironment', () => setupEnvironment(context));
    const deployCommand = vscode.commands.registerCommand('libreswift.runOnDevice', () => runOnDevice(context, diagnosticCollection));
    const promptPasswordCommand = vscode.commands.registerCommand('libreswift.promptP12Password', () => promptP12Password(context));
    const showLogsCommand = vscode.commands.registerCommand('libreswift.showLogs', () => {
        // Find existing output channel or create new
        const outputChannel = vscode.window.createOutputChannel('LibreSwift Device Logs');
        outputChannel.show();
    });

    context.subscriptions.push(setupCommand, deployCommand, promptPasswordCommand, showLogsCommand);

    // 3. Register Task Provider
    const taskProvider = vscode.tasks.registerTaskProvider('ios-build', new IOSBuildTaskProvider(diagnosticCollection));
    context.subscriptions.push(taskProvider);

    // 4. Sidebar Provider
    const sidebarProvider = new SidebarProvider();
    vscode.window.registerTreeDataProvider('libreswift.sidebar', sidebarProvider);
    
    const refreshCommand = vscode.commands.registerCommand('libreswift.refreshDevices', () => {
        sidebarProvider.refresh();
    });
    context.subscriptions.push(refreshCommand);

    // 5. SourceKit-LSP Setup
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        const workspacePath = workspaceFolders[0].uri.fsPath;
        await updateLspConfig(workspacePath);
        
        // React to config changes
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration('libreswift.sdkPath')) {
                    await updateLspConfig(workspacePath);
                }
            })
        );
    }
    
    await activateLSP(context);
}

export function deactivate(): Thenable<void> | undefined {
    return deactivateLSP();
}
