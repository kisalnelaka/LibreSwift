import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import { SecretManager, promptP12Password } from './secretManager';
import { AppleIdSigner } from './appleIdSigner';

const execAsync = promisify(exec);

export async function signApp(appPath: string, context: vscode.ExtensionContext): Promise<void> {
    const config = vscode.workspace.getConfiguration('libreswift');
    const signingMode = config.get<string>('signingMode') || 'auto';
    const manualP12Path = config.get<string>('p12Path');
    const manualProvisionPath = config.get<string>('mobileprovisionPath');
    const bundleId = config.get<string>('bundleIdentifier') || 'com.example.App';

    // Mode 1: Explicit Manual P12 mode or valid manual paths configured
    if ((signingMode === 'p12' || (manualP12Path && manualProvisionPath)) && manualP12Path && manualProvisionPath) {
        let password = await SecretManager.getInstance().getP12Password();
        if (!password) {
            await promptP12Password(context);
            password = await SecretManager.getInstance().getP12Password();
            if (!password) {
                throw new Error('Code signing requires the .p12 certificate password.');
            }
        }

        const env = { ...process.env, RCODESIGN_P12_PASSWORD: password };
        const command = `rcodesign sign --p12-file "${manualP12Path}" --p12-password "$RCODESIGN_P12_PASSWORD" --provisioning-profile "${manualProvisionPath}" "${appPath}"`;

        try {
            await execAsync(command, { env });
            return;
        } catch (error: any) {
            throw new Error(`Manual .p12 signing failed: ${error.message}`);
        }
    }

    // Mode 2: Automated Free Apple ID / Managed Self-Signing Mode
    let certStatus = AppleIdSigner.getCertificateStatus();

    // Check if certificate has expired or doesn't exist
    if (!certStatus.exists || !certStatus.valid) {
        const choice = await vscode.window.showInformationMessage(
            certStatus.exists
                ? 'Your 7-day Free Apple ID signing certificate has expired.'
                : 'No iOS code signing identity found. How would you like to sign your app?',
            'Sign with Free Apple ID (Recommended)',
            'Generate Ad-Hoc / Self-Signed Certificate',
            'Configure Manual .p12'
        );

        if (choice === 'Sign with Free Apple ID (Recommended)') {
            const success = await AppleIdSigner.promptConfigureAppleId(context);
            if (!success) {
                throw new Error('Apple ID configuration was cancelled.');
            }
        } else if (choice === 'Generate Ad-Hoc / Self-Signed Certificate') {
            await AppleIdSigner.generateDevelopmentCertificate('adhoc@libreswift.local', 'iPhone Developer: LibreSwift AdHoc');
        } else if (choice === 'Configure Manual .p12') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'libreswift.p12Path');
            throw new Error('Please configure libreswift.p12Path and libreswift.mobileprovisionPath in settings.');
        } else {
            throw new Error('Code signing cancelled by user.');
        }

        certStatus = AppleIdSigner.getCertificateStatus();
    }

    // Ensure the provisioning profile exists and has target bundle ID
    const provisionPath = AppleIdSigner.generateProvisioningProfile(bundleId);
    const keyPath = AppleIdSigner.getKeyPath();
    const certPath = AppleIdSigner.getCertPath();

    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
        throw new Error('Managed signing keypair is missing. Please re-run: LibreSwift: Configure Apple ID Signing.');
    }

    // Sign using rcodesign with the managed PEM credentials
    const command = `rcodesign sign --pem-source "${keyPath}" --provisioning-profile "${provisionPath}" "${appPath}"`;

    try {
        await execAsync(command);
    } catch (error: any) {
        // Fallback to ad-hoc code signature if full profile validation fails
        const fallbackCommand = `rcodesign sign --pem-source "${keyPath}" "${appPath}"`;
        try {
            await execAsync(fallbackCommand);
        } catch (fallbackError: any) {
            throw new Error(`Code signing failed: ${error.message} (Fallback: ${fallbackError.message})`);
        }
    }
}
