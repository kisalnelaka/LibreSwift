"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.libreSwiftStatusBar = void 0;
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const setup_1 = require("./commands/setup");
const deploy_1 = require("./commands/deploy");
const buildTaskProvider_1 = require("./providers/buildTaskProvider");
const dependencyChecker_1 = require("./services/dependencyChecker");
const sidebarProvider_1 = require("./providers/sidebarProvider");
const secretManager_1 = require("./services/secretManager");
const sourcekitClient_1 = require("./lsp/sourcekitClient");
const lspConfig_1 = require("./lsp/lspConfig");
const bootstrap_1 = require("./commands/bootstrap");
const feedbackWebview_1 = require("./webviews/feedbackWebview");
async function activate(context) {
    console.log('LibreSwift extension is now active!');
    // Initialize SecretManager
    secretManager_1.SecretManager.initialize(context);
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('libreswift');
    context.subscriptions.push(diagnosticCollection);
    // Setup Status Bar State Machine
    exports.libreSwiftStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    exports.libreSwiftStatusBar.text = '$(play) Run on iOS';
    exports.libreSwiftStatusBar.command = 'libreswift.runOnDevice';
    exports.libreSwiftStatusBar.show();
    context.subscriptions.push(exports.libreSwiftStatusBar);
    // 1. Check Dependencies
    const dependenciesOk = await (0, dependencyChecker_1.checkDependencies)();
    if (!dependenciesOk) {
        vscode.window.showWarningMessage('LibreSwift: Some required CLI tools are missing.', 'Extract SDK Now').then(selection => {
            if (selection === 'Extract SDK Now') {
                vscode.commands.executeCommand('libreswift.setupEnvironment');
            }
        });
    }
    // 2. Register Commands
    const setupCommand = vscode.commands.registerCommand('libreswift.setupEnvironment', () => (0, setup_1.setupEnvironment)(context));
    const bootstrapCommand = vscode.commands.registerCommand('libreswift.bootstrapEnvironment', () => (0, bootstrap_1.bootstrapEnvironment)(context));
    const deployCommand = vscode.commands.registerCommand('libreswift.runOnDevice', () => (0, deploy_1.runOnDevice)(context, diagnosticCollection));
    const promptPasswordCommand = vscode.commands.registerCommand('libreswift.promptP12Password', () => (0, secretManager_1.promptP12Password)(context));
    const showLogsCommand = vscode.commands.registerCommand('libreswift.showLogs', () => {
        const outputChannel = vscode.window.createOutputChannel('LibreSwift Device Logs');
        outputChannel.show();
    });
    const feedbackCommand = vscode.commands.registerCommand('libreswift.showFeedback', () => (0, feedbackWebview_1.showFeedbackWebview)(context));
    context.subscriptions.push(setupCommand, bootstrapCommand, deployCommand, promptPasswordCommand, showLogsCommand, feedbackCommand);
    // 3. Register Task Provider
    const taskProvider = vscode.tasks.registerTaskProvider('ios-build', new buildTaskProvider_1.IOSBuildTaskProvider(diagnosticCollection));
    context.subscriptions.push(taskProvider);
    // 4. Sidebar Provider
    const sidebarProvider = new sidebarProvider_1.SidebarProvider();
    vscode.window.registerTreeDataProvider('libreswift.sidebar', sidebarProvider);
    const refreshCommand = vscode.commands.registerCommand('libreswift.refreshDevices', () => {
        sidebarProvider.refresh();
    });
    context.subscriptions.push(refreshCommand);
    // 5. SourceKit-LSP Setup
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        const workspacePath = workspaceFolders[0].uri.fsPath;
        await (0, lspConfig_1.updateLspConfig)(workspacePath);
        // React to config changes
        context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(async (e) => {
            if (e.affectsConfiguration('libreswift.sdkPath')) {
                await (0, lspConfig_1.updateLspConfig)(workspacePath);
            }
        }));
    }
    await (0, sourcekitClient_1.activateLSP)(context);
}
function deactivate() {
    return (0, sourcekitClient_1.deactivateLSP)();
}
//# sourceMappingURL=extension.js.map