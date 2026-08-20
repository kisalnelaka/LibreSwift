"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOnDevice = runOnDevice;
const vscode = require("vscode");
const dependencyChecker_1 = require("../services/dependencyChecker");
const xtoolWrapper_1 = require("../services/xtoolWrapper");
const rcodesignWrapper_1 = require("../services/rcodesignWrapper");
const imobiledeviceWrapper_1 = require("../services/imobiledeviceWrapper");
const extension_1 = require("../extension");
async function runOnDevice(context, diagnosticCollection) {
    extension_1.libreSwiftStatusBar.text = '$(sync~spin) Starting Deployment...';
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Deploying to iOS Device",
        cancellable: false
    }, async (progress) => {
        try {
            // 1. Dependency Check
            progress.report({ message: "Checking dependencies..." });
            const depsOk = await (0, dependencyChecker_1.checkDependencies)();
            if (!depsOk) {
                vscode.window.showWarningMessage('Missing required CLI tools.', 'Extract SDK Now').then(s => {
                    if (s === 'Extract SDK Now')
                        vscode.commands.executeCommand('libreswift.setupEnvironment');
                });
                throw new Error("Missing dependencies.");
            }
            const devices = await (0, imobiledeviceWrapper_1.getConnectedDevices)();
            if (devices.length === 0) {
                vscode.window.showWarningMessage('No iOS devices connected.', 'Refresh Devices').then(s => {
                    if (s === 'Refresh Devices')
                        vscode.commands.executeCommand('libreswift.refreshDevices');
                });
                throw new Error("No device connected.");
            }
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders)
                throw new Error("No workspace folder open.");
            const workspacePath = workspaceFolders[0].uri.fsPath;
            const config = vscode.workspace.getConfiguration('libreswift');
            const sdkPath = config.get('sdkPath') || '~/.local/share/ios-linux-sdk/iPhoneOS.sdk';
            const bundleId = config.get('bundleIdentifier') || 'com.example.App';
            // 2. Build with xtool
            extension_1.libreSwiftStatusBar.text = '$(sync~spin) Building Swift...';
            progress.report({ message: "Building with xtool..." });
            const appPath = await (0, xtoolWrapper_1.buildWithXtool)('arm64-apple-ios', sdkPath, workspacePath, diagnosticCollection);
            // 3. Sign with rcodesign
            extension_1.libreSwiftStatusBar.text = '$(lock) Signing App...';
            progress.report({ message: "Signing app..." });
            try {
                await (0, rcodesignWrapper_1.signApp)(appPath, context);
            }
            catch (e) {
                if (e.message.includes("password")) {
                    vscode.window.showErrorMessage('Code signing failed due to missing password.', 'Enter Password').then(s => {
                        if (s === 'Enter Password')
                            vscode.commands.executeCommand('libreswift.promptP12Password');
                    });
                }
                throw e;
            }
            // 4. Install over USB
            extension_1.libreSwiftStatusBar.text = '$(cloud-upload~spin) Installing over USB...';
            progress.report({ message: "Installing on device..." });
            await (0, imobiledeviceWrapper_1.installAppOnDevice)(appPath);
            // 5. Stream logs
            progress.report({ message: "Streaming logs..." });
            const outputChannel = vscode.window.createOutputChannel('LibreSwift Device Logs');
            (0, imobiledeviceWrapper_1.streamDeviceLogs)(bundleId, outputChannel);
            extension_1.libreSwiftStatusBar.text = '$(check) Deployed to Device';
            vscode.window.showInformationMessage('App deployed successfully!');
            setTimeout(() => {
                extension_1.libreSwiftStatusBar.text = '$(play) Run on iOS';
            }, 5000);
        }
        catch (error) {
            extension_1.libreSwiftStatusBar.text = '$(error) Build Failed';
            vscode.window.showErrorMessage(`Deployment failed: ${error.message}`, 'Show Logs').then(s => {
                if (s === 'Show Logs')
                    vscode.commands.executeCommand('libreswift.showLogs');
            });
            setTimeout(() => {
                extension_1.libreSwiftStatusBar.text = '$(play) Run on iOS';
            }, 5000);
        }
    });
}
//# sourceMappingURL=deploy.js.map