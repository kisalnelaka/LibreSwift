"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const setup_1 = require("./commands/setup");
const deploy_1 = require("./commands/deploy");
const buildTaskProvider_1 = require("./providers/buildTaskProvider");
const dependencyChecker_1 = require("./services/dependencyChecker");
const sidebarProvider_1 = require("./providers/sidebarProvider");
const secretManager_1 = require("./services/secretManager");
async function activate(context) {
    console.log('LibreSwift extension is now active!');
    // Initialize SecretManager
    secretManager_1.SecretManager.initialize(context);
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('libreswift');
    context.subscriptions.push(diagnosticCollection);
    // 1. Check Dependencies
    const dependenciesOk = await (0, dependencyChecker_1.checkDependencies)();
    if (!dependenciesOk) {
        vscode.window.showWarningMessage('LibreSwift: Some required CLI tools are missing. Extension may not function correctly.');
    }
    // 2. Register Commands
    const setupCommand = vscode.commands.registerCommand('libreswift.setupEnvironment', () => (0, setup_1.setupEnvironment)(context));
    const deployCommand = vscode.commands.registerCommand('libreswift.runOnDevice', () => (0, deploy_1.runOnDevice)(context, diagnosticCollection));
    const promptPasswordCommand = vscode.commands.registerCommand('libreswift.promptP12Password', () => (0, secretManager_1.promptP12Password)(context));
    context.subscriptions.push(setupCommand, deployCommand, promptPasswordCommand);
    // 3. Register Task Provider
    const taskProvider = vscode.tasks.registerTaskProvider('ios-build', new buildTaskProvider_1.IOSBuildTaskProvider(diagnosticCollection));
    context.subscriptions.push(taskProvider);
    // 4. Setup Status Bar (Device Connectivity)
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = '$(play) Run on iOS';
    statusBarItem.command = 'libreswift.runOnDevice';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    // 5. Sidebar Provider
    const sidebarProvider = new sidebarProvider_1.SidebarProvider();
    vscode.window.registerTreeDataProvider('libreswift.sidebar', sidebarProvider);
    const refreshCommand = vscode.commands.registerCommand('libreswift.refreshDevices', () => {
        sidebarProvider.refresh();
    });
    context.subscriptions.push(refreshCommand);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map