"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.libreSwiftStatusBar = void 0;
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const setup_1 = require("./commands/setup");
const deploy_1 = require("./commands/deploy");
const debug_1 = require("./commands/debug");
const doctor_1 = require("./commands/doctor");
const buildTaskProvider_1 = require("./providers/buildTaskProvider");
const dependencyChecker_1 = require("./services/dependencyChecker");
const sidebarProvider_1 = require("./providers/sidebarProvider");
const secretManager_1 = require("./services/secretManager");
const sourcekitClient_1 = require("./lsp/sourcekitClient");
const lspConfig_1 = require("./lsp/lspConfig");
const bootstrap_1 = require("./commands/bootstrap");
const feedbackWebview_1 = require("./webviews/feedbackWebview");
const helpManual_1 = require("./webviews/helpManual");
const lldbConfigProvider_1 = require("./debug/lldbConfigProvider");
const feedbackPrompt_1 = require("./services/feedbackPrompt");
const scaffold_1 = require("./commands/scaffold");
const appleIdSigner_1 = require("./services/appleIdSigner");
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
    // 1. First-run onboarding: auto-open walkthrough on fresh install, skip silently on subsequent activations
    const isFirstRun = !context.globalState.get('libreswift.hasLaunched');
    if (isFirstRun) {
        context.globalState.update('libreswift.hasLaunched', true);
        setTimeout(() => {
            // Must pass an object with 'category' key — plain string opens the generic welcome screen
            vscode.commands.executeCommand('workbench.action.openWalkthrough', { category: 'kisalnelaka.libreswift#libreswift.welcome' }, false);
        }, 1500);
    }
    // 2. Check Dependencies — on first run, skip the warning (walkthrough will guide them)
    const dependenciesOk = await (0, dependencyChecker_1.checkDependencies)();
    if (!dependenciesOk && !isFirstRun) {
        vscode.window.showWarningMessage('LibreSwift: Some required CLI tools are missing.', 'Run Doctor', 'Run Setup Engine', 'Show Help').then(selection => {
            if (selection === 'Run Doctor') {
                vscode.commands.executeCommand('libreswift.doctor');
            }
            else if (selection === 'Run Setup Engine') {
                vscode.commands.executeCommand('libreswift.bootstrapEnvironment');
            }
            else if (selection === 'Show Help') {
                vscode.commands.executeCommand('libreswift.showHelp');
            }
        });
    }
    // 3. Register Commands
    const setupCommand = vscode.commands.registerCommand('libreswift.setupEnvironment', () => (0, setup_1.setupEnvironment)(context));
    const bootstrapCommand = vscode.commands.registerCommand('libreswift.bootstrapEnvironment', () => (0, bootstrap_1.bootstrapEnvironment)(context));
    const deployCommand = vscode.commands.registerCommand('libreswift.runOnDevice', () => (0, deploy_1.runOnDevice)(context, diagnosticCollection));
    const debugCommand = vscode.commands.registerCommand('libreswift.debugOnDevice', () => (0, debug_1.runDebugOnDevice)(context, diagnosticCollection));
    const doctorCommand = vscode.commands.registerCommand('libreswift.doctor', () => (0, doctor_1.runDoctorCommand)(context));
    const promptPasswordCommand = vscode.commands.registerCommand('libreswift.promptP12Password', () => (0, secretManager_1.promptP12Password)(context));
    const showLogsCommand = vscode.commands.registerCommand('libreswift.showLogs', () => {
        const outputChannel = vscode.window.createOutputChannel('LibreSwift Device Logs');
        outputChannel.show();
    });
    const feedbackCommand = vscode.commands.registerCommand('libreswift.showFeedback', () => (0, feedbackWebview_1.showFeedbackWebview)(context));
    const helpCommand = vscode.commands.registerCommand('libreswift.showHelp', () => (0, helpManual_1.showHelpManual)(context));
    const rateMarketplaceCommand = vscode.commands.registerCommand('libreswift.rateMarketplace', () => feedbackPrompt_1.FeedbackPromptService.openMarketplaceReview());
    const openGitHubCommand = vscode.commands.registerCommand('libreswift.openGitHub', () => feedbackPrompt_1.FeedbackPromptService.openGitHub());
    const createProjectCommand = vscode.commands.registerCommand('libreswift.createProject', () => (0, scaffold_1.createNewProjectCommand)(context));
    const configureAppleIdCommand = vscode.commands.registerCommand('libreswift.configureAppleId', () => appleIdSigner_1.AppleIdSigner.promptConfigureAppleId(context));
    const renewCertCommand = vscode.commands.registerCommand('libreswift.renewCertificate', () => appleIdSigner_1.AppleIdSigner.renewCertificate(context));
    context.subscriptions.push(setupCommand, bootstrapCommand, deployCommand, debugCommand, doctorCommand, promptPasswordCommand, showLogsCommand, feedbackCommand, helpCommand, rateMarketplaceCommand, openGitHubCommand, createProjectCommand, configureAppleIdCommand, renewCertCommand);
    // 4. Register Task Provider
    const taskProvider = vscode.tasks.registerTaskProvider('ios-build', new buildTaskProvider_1.IOSBuildTaskProvider(diagnosticCollection));
    context.subscriptions.push(taskProvider);
    // 5. Register Debug Configuration Provider
    const debugConfigProvider = vscode.debug.registerDebugConfigurationProvider('libreswift-lldb', new lldbConfigProvider_1.IOSDebugConfigurationProvider());
    context.subscriptions.push(debugConfigProvider);
    // 6. Sidebar Provider
    const sidebarProvider = new sidebarProvider_1.SidebarProvider();
    vscode.window.registerTreeDataProvider('libreswift.sidebar', sidebarProvider);
    const refreshCommand = vscode.commands.registerCommand('libreswift.refreshDevices', () => {
        sidebarProvider.refresh();
    });
    context.subscriptions.push(refreshCommand);
    // 7. SourceKit-LSP Setup
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
        const workspacePath = workspaceFolders[0].uri.fsPath;
        await (0, lspConfig_1.updateLspConfig)(workspacePath);
        // React to config changes
        context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(async (e) => {
            if (e.affectsConfiguration('libreswift.sdkPath') ||
                e.affectsConfiguration('libreswift.targetTriple') ||
                e.affectsConfiguration('libreswift.minIOSVersion')) {
                await (0, lspConfig_1.updateLspConfig)(workspacePath);
            }
        }));
    }
    // Only start LSP if dependencies are met — suppress the noisy error on fresh installs
    if (dependenciesOk) {
        await (0, sourcekitClient_1.activateLSP)(context);
    }
}
function deactivate() {
    return (0, sourcekitClient_1.deactivateLSP)();
}
//# sourceMappingURL=extension.js.map