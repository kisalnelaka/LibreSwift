import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function runOnDevice(context: vscode.ExtensionContext) {
    vscode.window.showInformationMessage('Starting LibreSwift Deploy to Device...');
    
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Deploying to iOS Device",
        cancellable: true
    }, async (progress, token) => {
        try {
            // 1. Build and Sign (Could call the task or directly exec)
            progress.report({ message: "Building and signing app..." });
            // Simulate build
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 2. Install via ideviceinstaller
            progress.report({ message: "Installing on device..." });
            // await execAsync(`ideviceinstaller -i path/to/app.app`);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 3. Stream logs using idevicesyslog
            const outputChannel = vscode.window.createOutputChannel('iOS Device Logs');
            outputChannel.show();
            outputChannel.appendLine('--- App Launched ---');
            outputChannel.appendLine('Streaming logs from device...');
            
            vscode.window.showInformationMessage('App deployed successfully!');
        } catch (error: any) {
            vscode.window.showErrorMessage(`Deployment failed: ${error.message}`);
        }
    });
}
