import * as vscode from 'vscode';
import { setupEnvironment } from './commands/setup';
import { runOnDevice } from './commands/deploy';
import { IOSBuildTaskProvider } from './providers/buildTaskProvider';
import { checkDependencies } from './services/dependencyChecker';

export async function activate(context: vscode.ExtensionContext) {
    console.log('LibreSwift extension is now active!');

    // 1. Check Dependencies
    const dependenciesOk = await checkDependencies();
    if (!dependenciesOk) {
        vscode.window.showWarningMessage('LibreSwift: Some required CLI tools are missing. Extension may not function correctly.');
    }

    // 2. Register Commands
    const setupCommand = vscode.commands.registerCommand('libreswift.setupEnvironment', () => setupEnvironment(context));
    const deployCommand = vscode.commands.registerCommand('libreswift.runOnDevice', () => runOnDevice(context));

    context.subscriptions.push(setupCommand, deployCommand);

    // 3. Register Task Provider
    const taskProvider = vscode.tasks.registerTaskProvider('ios-build', new IOSBuildTaskProvider());
    context.subscriptions.push(taskProvider);

    // 4. Setup Status Bar (Device Connectivity)
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = '$(device-mobile) iOS Device: Checking...';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    
    // TODO: Phase 3/4 - periodically check usbmuxd to update device status
    // TODO: Phase 4 - spin up SourceKit-LSP
}

export function deactivate() {}
