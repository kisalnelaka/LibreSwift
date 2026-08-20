import * as vscode from 'vscode';
import { checkDependencies } from '../services/dependencyChecker';
import { buildWithXtool } from '../services/xtoolWrapper';
import { signApp } from '../services/rcodesignWrapper';
import { installAppOnDevice, streamDeviceLogs } from '../services/imobiledeviceWrapper';

export async function runOnDevice(context: vscode.ExtensionContext, diagnosticCollection: vscode.DiagnosticCollection) {
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Deploying to iOS Device",
        cancellable: false
    }, async (progress) => {
        try {
            // 1. Dependency Check
            progress.report({ message: "Checking dependencies..." });
            const depsOk = await checkDependencies();
            if (!depsOk) {
                throw new Error("Missing required CLI tools. Check logs.");
            }

            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) throw new Error("No workspace folder open.");
            const workspacePath = workspaceFolders[0].uri.fsPath;

            const config = vscode.workspace.getConfiguration('libreswift');
            const sdkPath = config.get<string>('sdkPath') || '~/.local/share/ios-linux-sdk/iPhoneOS.sdk';
            const bundleId = config.get<string>('bundleIdentifier') || 'com.example.App';

            // 2. Build with xtool
            progress.report({ message: "Building with xtool..." });
            const appPath = await buildWithXtool('arm64-apple-ios', sdkPath, workspacePath, diagnosticCollection);

            // 3. Sign with rcodesign
            progress.report({ message: "Signing app..." });
            await signApp(appPath, context);

            // 4. Install over USB
            progress.report({ message: "Installing on device..." });
            await installAppOnDevice(appPath);

            // 5. Stream logs
            progress.report({ message: "Streaming logs..." });
            const outputChannel = vscode.window.createOutputChannel('LibreSwift Device Logs');
            streamDeviceLogs(bundleId, outputChannel);
            
            vscode.window.showInformationMessage('App deployed successfully!');
        } catch (error: any) {
            vscode.window.showErrorMessage(`Deployment failed: ${error.message}`);
        }
    });
}
