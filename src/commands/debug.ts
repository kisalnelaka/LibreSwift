import * as vscode from 'vscode';
import { checkDependencies } from '../services/dependencyChecker';
import { buildWithXtool } from '../services/xtoolWrapper';
import { signApp } from '../services/rcodesignWrapper';
import { installAppOnDevice, getConnectedDevices } from '../services/imobiledeviceWrapper';
import { libreSwiftStatusBar } from '../extension';

export async function runDebugOnDevice(context: vscode.ExtensionContext, diagnosticCollection: vscode.DiagnosticCollection) {
    libreSwiftStatusBar.text = '$(sync~spin) Preparing Debug Session...';

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Starting LibreSwift Debug Session",
        cancellable: false
    }, async (progress) => {
        try {
            // 1. Check dependencies
            progress.report({ message: "Checking dependencies..." });
            const depsOk = await checkDependencies();
            if (!depsOk) {
                vscode.window.showWarningMessage('Missing required CLI tools for debugging.', 'Run Doctor').then(s => {
                    if (s === 'Run Doctor') vscode.commands.executeCommand('libreswift.doctor');
                });
                throw new Error("Missing dependencies.");
            }

            // 2. Check devices
            const devices = await getConnectedDevices();
            if (devices.length === 0) {
                vscode.window.showWarningMessage('No iOS devices connected for debugging.', 'Refresh Devices').then(s => {
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

            // 3. Build in Debug mode
            libreSwiftStatusBar.text = '$(sync~spin) Building Debug Binary...';
            progress.report({ message: "Building Swift debug binary..." });
            const appPath = await buildWithXtool({
                sdkPath,
                workspacePath,
                diagnosticCollection,
                buildConfiguration: 'debug'
            });

            // 4. Sign
            libreSwiftStatusBar.text = '$(lock) Signing Debug App...';
            progress.report({ message: "Signing debug app..." });
            await signApp(appPath, context);

            // 5. Install on device
            libreSwiftStatusBar.text = '$(cloud-upload~spin) Installing onto device...';
            progress.report({ message: "Installing on device..." });
            await installAppOnDevice(appPath);

            // 6. Launch Debug Session
            libreSwiftStatusBar.text = '$(debug) Launching Debugger...';
            progress.report({ message: "Attaching LLDB Debugger..." });

            const debugConfig: vscode.DebugConfiguration = {
                name: 'LibreSwift: iOS Remote Debug',
                type: 'libreswift-lldb',
                request: 'launch',
                program: appPath,
                bundleIdentifier: bundleId,
                sdkPath: sdkPath.replace('~', process.env.HOME || ''),
                targetArchitecture: 'arm64'
            };

            const started = await vscode.debug.startDebugging(workspaceFolders[0], debugConfig);
            if (started) {
                libreSwiftStatusBar.text = '$(check) Debug Session Active';
                vscode.window.showInformationMessage(`Debug session started for ${bundleId}`);
            } else {
                // If no dedicated LLDB DAP extension is installed, inform user
                vscode.window.showInformationMessage(
                    `App installed on device. For interactive breakpoints, install CodeLLDB or an LLDB DAP extension.`,
                    'Show Logs'
                ).then(s => {
                    if (s === 'Show Logs') vscode.commands.executeCommand('libreswift.showLogs');
                });
            }

            setTimeout(() => {
                libreSwiftStatusBar.text = '$(play) Run on iOS';
            }, 5000);

        } catch (error: any) {
            libreSwiftStatusBar.text = '$(error) Debug Launch Failed';
            vscode.window.showErrorMessage(`Debug session failed: ${error.message}`);
            setTimeout(() => {
                libreSwiftStatusBar.text = '$(play) Run on iOS';
            }, 5000);
        }
    });
}
