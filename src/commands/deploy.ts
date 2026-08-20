import * as vscode from 'vscode';
import { checkDependencies } from '../services/dependencyChecker';
import { buildWithXtool } from '../services/xtoolWrapper';
import { signApp } from '../services/rcodesignWrapper';
import { installAppOnDevice, streamDeviceLogs, getConnectedDevices } from '../services/imobiledeviceWrapper';
import { libreSwiftStatusBar } from '../extension';

export async function runOnDevice(context: vscode.ExtensionContext, diagnosticCollection: vscode.DiagnosticCollection) {
    libreSwiftStatusBar.text = '$(sync~spin) Starting Deployment...';
    
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
                vscode.window.showWarningMessage('Missing required CLI tools.', 'Extract SDK Now').then(s => {
                    if (s === 'Extract SDK Now') vscode.commands.executeCommand('libreswift.setupEnvironment');
                });
                throw new Error("Missing dependencies.");
            }

            const devices = await getConnectedDevices();
            if (devices.length === 0) {
                vscode.window.showWarningMessage('No iOS devices connected.', 'Refresh Devices').then(s => {
                    if (s === 'Refresh Devices') vscode.commands.executeCommand('libreswift.refreshDevices');
                });
                throw new Error("No device connected.");
            }

            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) throw new Error("No workspace folder open.");
            const workspacePath = workspaceFolders[0].uri.fsPath;

            const config = vscode.workspace.getConfiguration('libreswift');
            const sdkPath = config.get<string>('sdkPath') || '~/.local/share/ios-linux-sdk/iPhoneOS.sdk';
            const bundleId = config.get<string>('bundleIdentifier') || 'com.example.App';

            // 2. Build with xtool
            libreSwiftStatusBar.text = '$(sync~spin) Building Swift...';
            progress.report({ message: "Building with xtool..." });
            const appPath = await buildWithXtool('arm64-apple-ios', sdkPath, workspacePath, diagnosticCollection);

            // 3. Sign with rcodesign
            libreSwiftStatusBar.text = '$(lock) Signing App...';
            progress.report({ message: "Signing app..." });
            try {
                await signApp(appPath, context);
            } catch (e: any) {
                if (e.message.includes("password")) {
                    vscode.window.showErrorMessage('Code signing failed due to missing password.', 'Enter Password').then(s => {
                        if (s === 'Enter Password') vscode.commands.executeCommand('libreswift.promptP12Password');
                    });
                }
                throw e;
            }

            // 4. Install over USB
            libreSwiftStatusBar.text = '$(cloud-upload~spin) Installing over USB...';
            progress.report({ message: "Installing on device..." });
            await installAppOnDevice(appPath);

            // 5. Stream logs
            progress.report({ message: "Streaming logs..." });
            const outputChannel = vscode.window.createOutputChannel('LibreSwift Device Logs');
            streamDeviceLogs(bundleId, outputChannel);
            
            libreSwiftStatusBar.text = '$(check) Deployed to Device';
            vscode.window.showInformationMessage('App deployed successfully!');
            
            setTimeout(() => {
                libreSwiftStatusBar.text = '$(play) Run on iOS';
            }, 5000);
            
        } catch (error: any) {
            libreSwiftStatusBar.text = '$(error) Build Failed';
            vscode.window.showErrorMessage(`Deployment failed: ${error.message}`, 'Show Logs').then(s => {
                if (s === 'Show Logs') vscode.commands.executeCommand('libreswift.showLogs');
            });
            
            setTimeout(() => {
                libreSwiftStatusBar.text = '$(play) Run on iOS';
            }, 5000);
        }
    });
}
