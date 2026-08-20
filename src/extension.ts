import * as vscode from 'vscode';
import { setupEnvironment } from './commands/setup';
import { runOnDevice } from './commands/deploy';
import { IOSBuildTaskProvider } from './providers/buildTaskProvider';
import { checkDependencies } from './services/dependencyChecker';
import { SidebarProvider } from './providers/sidebarProvider';
import { SecretManager, promptP12Password } from './services/secretManager';

export async function activate(context: vscode.ExtensionContext) {
    console.log('LibreSwift extension is now active!');

    // Initialize SecretManager
    SecretManager.initialize(context);

    const diagnosticCollection = vscode.languages.createDiagnosticCollection('libreswift');
    context.subscriptions.push(diagnosticCollection);

    // 1. Check Dependencies
    const dependenciesOk = await checkDependencies();
    if (!dependenciesOk) {
        vscode.window.showWarningMessage('LibreSwift: Some required CLI tools are missing. Extension may not function correctly.');
    }

    // 2. Register Commands
    const setupCommand = vscode.commands.registerCommand('libreswift.setupEnvironment', () => setupEnvironment(context));
    const deployCommand = vscode.commands.registerCommand('libreswift.runOnDevice', () => runOnDevice(context, diagnosticCollection));
    const promptPasswordCommand = vscode.commands.registerCommand('libreswift.promptP12Password', () => promptP12Password(context));

    context.subscriptions.push(setupCommand, deployCommand, promptPasswordCommand);

    // 3. Register Task Provider
    const taskProvider = vscode.tasks.registerTaskProvider('ios-build', new IOSBuildTaskProvider(diagnosticCollection));
    context.subscriptions.push(taskProvider);

    // 4. Setup Status Bar (Device Connectivity)
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = '$(play) Run on iOS';
    statusBarItem.command = 'libreswift.runOnDevice';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    
    // 5. Sidebar Provider
    const sidebarProvider = new SidebarProvider();
    vscode.window.registerTreeDataProvider('libreswift.sidebar', sidebarProvider);
    
    const refreshCommand = vscode.commands.registerCommand('libreswift.refreshDevices', () => {
        sidebarProvider.refresh();
    });
    context.subscriptions.push(refreshCommand);
}

export function deactivate() {}
