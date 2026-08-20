"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupEnvironment = setupEnvironment;
const vscode = require("vscode");
const xipExtractor_1 = require("../services/xipExtractor");
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
    try {
        await (0, xipExtractor_1.extractXip)(xipPath, sdkDestPath);
        vscode.window.showInformationMessage(`Successfully extracted iOS SDK to ${sdkDestPath}`);
    }
    catch (error) {
        vscode.window.showErrorMessage(error.message);
    }
}
//# sourceMappingURL=setup.js.map