import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SecretManager, promptP12Password } from './secretManager';

const execAsync = promisify(exec);

export async function signApp(appPath: string, context: vscode.ExtensionContext): Promise<void> {
    const config = vscode.workspace.getConfiguration('libreswift');
    const p12Path = config.get<string>('p12Path');
    const provisionPath = config.get<string>('mobileprovisionPath');
    
    if (!p12Path || !provisionPath) {
        throw new Error('Code signing requires both a .p12 certificate and a .mobileprovision file configured in LibreSwift settings.');
    }
    
    let password = await SecretManager.getInstance().getP12Password();
    if (!password) {
        await promptP12Password(context);
        password = await SecretManager.getInstance().getP12Password();
        if (!password) {
            throw new Error('Code signing requires the .p12 certificate password.');
        }
    }
    
    // We pass the password securely via stdin or a temporary environment variable,
    // depending on what rcodesign supports. For this implementation, we will assume 
    // it supports passing the password via an environment variable or flag.
    // Caution: Passing passwords via CLI flags can leak them to the process list.
    // Using environment variables is slightly safer if the tool supports it.
    
    const env = { ...process.env, RCODESIGN_P12_PASSWORD: password };
    
    // Example command: rcodesign sign --p12-file <p12Path> --p12-password <password> --provisioning-profile <provisionPath> <appPath>
    // Adjust according to actual rcodesign usage.
    const command = `rcodesign sign --p12-file "${p12Path}" --p12-password "$RCODESIGN_P12_PASSWORD" --provisioning-profile "${provisionPath}" "${appPath}"`;
    
    try {
        await execAsync(command, { env });
    } catch (error: any) {
        throw new Error(`Code signing failed: ${error.message}`);
    }
}
