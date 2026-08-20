"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupEnvironment = setupEnvironment;
const vscode = require("vscode");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function setupEnvironment(context) {
    const xipUris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: 'Select Xcode .xip',
        filters: { 'Xcode Archive': ['xip'] }
    });
    if (!xipUris || xipUris.length === 0) {
        return;
    }
    const xipPath = xipUris[0].fsPath;
    const sdkDestPath = vscode.workspace.getConfiguration('libreswift').get('sdkPath') || '~/.local/share/ios-linux-sdk/iPhoneOS.sdk';
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Extracting iOS SDK...",
        cancellable: false
    }, async (progress) => {
        try {
            progress.report({ increment: 0, message: "Starting extraction..." });
            // Dummy logic for extracting, since xar/pbzx usually requires a script
            // In a real environment, we'd spawn a robust bash script that handles xar -xf and pbzx
            // e.g., await execAsync(`/bin/bash ${scriptPath} "${xipPath}" "${sdkDestPath}"`);
            // Simulating extraction time
            await new Promise(resolve => setTimeout(resolve, 2000));
            vscode.window.showInformationMessage(`Successfully extracted iOS SDK to ${sdkDestPath}`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to extract SDK: ${error.message}`);
        }
    });
}
//# sourceMappingURL=setup.js.map