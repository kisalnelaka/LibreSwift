import * as vscode from 'vscode';
import { extractXip } from '../services/xipExtractor';

export async function setupEnvironment(context: vscode.ExtensionContext) {
    const xipUris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: 'Select Xcode .xip',
        filters: { 'Xcode Archive': ['xip'] }
    });

    if (!xipUris || xipUris.length === 0) {
        return;
    }

    const xipPath = xipUris[0].fsPath;
    const sdkDestPath = vscode.workspace.getConfiguration('libreswift').get<string>('sdkPath') || '~/.local/share/ios-linux-sdk/iPhoneOS.sdk';

    try {
        await extractXip(xipPath, sdkDestPath);
        vscode.window.showInformationMessage(`Successfully extracted iOS SDK to ${sdkDestPath}`);
    } catch (error: any) {
        vscode.window.showErrorMessage(error.message);
    }
}
