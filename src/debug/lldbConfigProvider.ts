import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

export class IOSDebugConfigurationProvider implements vscode.DebugConfigurationProvider {
    /**
     * Massage a debug configuration just before a debug session is being launched,
     * e.g. with all variables substituted.
     */
    async resolveDebugConfiguration(
        folder: vscode.WorkspaceFolder | undefined,
        config: vscode.DebugConfiguration,
        token?: vscode.CancellationToken
    ): Promise<vscode.DebugConfiguration | undefined> {
        // If launch.json is missing or empty
        if (!config.type && !config.request && !config.name) {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'swift') {
                config.type = 'libreswift-lldb';
                config.name = 'LibreSwift: Debug on iOS Device';
                config.request = 'launch';
            } else {
                return undefined;
            }
        }

        const workspacePath = folder ? folder.uri.fsPath : (vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : '');
        const globalConfig = vscode.workspace.getConfiguration('libreswift');
        const sdkPath = (globalConfig.get<string>('sdkPath') || '~/.local/share/ios-linux-sdk/iPhoneOS.sdk').replace('~', process.env.HOME || '');
        const targetTriple = globalConfig.get<string>('targetTriple') || 'arm64-apple-ios';
        const bundleId = globalConfig.get<string>('bundleIdentifier') || 'com.example.App';

        if (!config.program) {
            const buildDir = path.join(workspacePath, '.build', 'debug');
            let detectedBinary = '';

            try {
                const entries = await fs.readdir(buildDir, { withFileTypes: true });
                const appDir = entries.find(e => e.isDirectory() && e.name.endsWith('.app'));
                if (appDir) {
                    const appBaseName = path.basename(appDir.name, '.app');
                    detectedBinary = path.join(buildDir, appDir.name, appBaseName);
                }
            } catch { }

            config.program = detectedBinary || path.join(buildDir, 'App.app', 'App');
        }

        if (!config.sdkPath) {
            config.sdkPath = sdkPath;
        }

        if (!config.targetArchitecture) {
            config.targetArchitecture = 'arm64';
        }

        if (!config.bundleIdentifier) {
            config.bundleIdentifier = bundleId;
        }

        if (!config.targetTriple) {
            config.targetTriple = targetTriple;
        }

        if (!config.initCommands) {
            config.initCommands = [
                `platform select remote-ios`,
                `platform settings sysroot "${config.sdkPath}"`,
                `target create "${config.program}" --arch ${config.targetArchitecture}`
            ];
        }

        return config;
    }

    /**
     * Provide initial debug configurations when generating launch.json.
     */
    provideDebugConfigurations(folder?: vscode.WorkspaceFolder): vscode.DebugConfiguration[] {
        return [
            {
                name: 'LibreSwift: Debug on iOS Device',
                type: 'libreswift-lldb',
                request: 'launch',
                preLaunchTask: 'libreswift: build'
            }
        ];
    }
}
