import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

export async function updateLspConfig(workspacePath: string): Promise<void> {
    const config = vscode.workspace.getConfiguration('libreswift');
    const sdkPathConfig = config.get<string>('sdkPath') || '~/.local/share/ios-linux-sdk/iPhoneOS.sdk';
    const resolvedSdkPath = sdkPathConfig.replace('~', process.env.HOME || '');

    const lspDir = path.join(workspacePath, '.sourcekit-lsp');
    const lspConfigPath = path.join(lspDir, 'config.json');

    const configContent = {
        swiftPM: {
            swiftCompilerFlags: [
                "-sdk",
                resolvedSdkPath,
                "-target",
                "arm64-apple-ios17.0"
            ]
        }
    };

    try {
        await fs.mkdir(lspDir, { recursive: true });
        await fs.writeFile(lspConfigPath, JSON.stringify(configContent, null, 2), 'utf8');
        console.log(`Updated SourceKit-LSP config at ${lspConfigPath}`);
    } catch (error) {
        console.error(`Failed to update SourceKit-LSP config: ${error}`);
    }
}
