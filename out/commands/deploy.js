"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOnDevice = runOnDevice;
const vscode = require("vscode");
const dependencyChecker_1 = require("../services/dependencyChecker");
const xtoolWrapper_1 = require("../services/xtoolWrapper");
const rcodesignWrapper_1 = require("../services/rcodesignWrapper");
const imobiledeviceWrapper_1 = require("../services/imobiledeviceWrapper");
async function runOnDevice(context, diagnosticCollection) {
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
                throw new Error("Missing required CLI tools. Check logs.");
            }
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders)
                throw new Error("No workspace folder open.");
            const workspacePath = workspaceFolders[0].uri.fsPath;
            const config = vscode.workspace.getConfiguration('libreswift');
            const sdkPath = config.get('sdkPath') || '~/.local/share/ios-linux-sdk/iPhoneOS.sdk';
            const bundleId = config.get('bundleIdentifier') || 'com.example.App';
            // 2. Build with xtool
            progress.report({ message: "Building with xtool..." });
            const appPath = await (0, xtoolWrapper_1.buildWithXtool)('arm64-apple-ios', sdkPath, workspacePath, diagnosticCollection);
            // 3. Sign with rcodesign
            progress.report({ message: "Signing app..." });
            await (0, rcodesignWrapper_1.signApp)(appPath, context);
            // 4. Install over USB
            progress.report({ message: "Installing on device..." });
            await (0, imobiledeviceWrapper_1.installAppOnDevice)(appPath);
            // 5. Stream logs
            progress.report({ message: "Streaming logs..." });
            const outputChannel = vscode.window.createOutputChannel('LibreSwift Device Logs');
            (0, imobiledeviceWrapper_1.streamDeviceLogs)(bundleId, outputChannel);
            vscode.window.showInformationMessage('App deployed successfully!');
        }
        catch (error) {
            vscode.window.showErrorMessage(`Deployment failed: ${error.message}`);
        }
    });
}
//# sourceMappingURL=deploy.js.map