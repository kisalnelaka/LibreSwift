"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const setup_1 = require("./commands/setup");
const deploy_1 = require("./commands/deploy");
const buildTaskProvider_1 = require("./providers/buildTaskProvider");
const dependencyChecker_1 = require("./services/dependencyChecker");
async function activate(context) {
    console.log('LibreSwift extension is now active!');
    // 1. Check Dependencies
    const dependenciesOk = await (0, dependencyChecker_1.checkDependencies)();
    if (!dependenciesOk) {
        vscode.window.showWarningMessage('LibreSwift: Some required CLI tools are missing. Extension may not function correctly.');
    }
    // 2. Register Commands
    const setupCommand = vscode.commands.registerCommand('libreswift.setupEnvironment', () => (0, setup_1.setupEnvironment)(context));
    const deployCommand = vscode.commands.registerCommand('libreswift.runOnDevice', () => (0, deploy_1.runOnDevice)(context));
    context.subscriptions.push(setupCommand, deployCommand);
    // 3. Register Task Provider
    const taskProvider = vscode.tasks.registerTaskProvider('ios-build', new buildTaskProvider_1.IOSBuildTaskProvider());
    context.subscriptions.push(taskProvider);
    // 4. Setup Status Bar (Device Connectivity)
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = '$(device-mobile) iOS Device: Checking...';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    // TODO: Phase 3/4 - periodically check usbmuxd to update device status
    // TODO: Phase 4 - spin up SourceKit-LSP
}
function deactivate() { }
//# sourceMappingURL=extension.js.map