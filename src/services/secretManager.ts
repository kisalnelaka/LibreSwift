import * as vscode from 'vscode';

const P12_PASSWORD_KEY = 'libreswift.p12password';

export class SecretManager {
    private static instance: SecretManager;
    private secretStorage: vscode.SecretStorage;

    private constructor(context: vscode.ExtensionContext) {
        this.secretStorage = context.secrets;
    }

    public static initialize(context: vscode.ExtensionContext): void {
        if (!SecretManager.instance) {
            SecretManager.instance = new SecretManager(context);
        }
    }

    public static getInstance(): SecretManager {
        if (!SecretManager.instance) {
            throw new Error('SecretManager not initialized. Call initialize() first.');
        }
        return SecretManager.instance;
    }

    public async storeP12Password(password: string): Promise<void> {
        await this.secretStorage.store(P12_PASSWORD_KEY, password);
    }

    public async getP12Password(): Promise<string | undefined> {
        return await this.secretStorage.get(P12_PASSWORD_KEY);
    }

    public async clearP12Password(): Promise<void> {
        await this.secretStorage.delete(P12_PASSWORD_KEY);
    }
}

export async function promptP12Password(context: vscode.ExtensionContext): Promise<void> {
    const password = await vscode.window.showInputBox({
        prompt: 'Enter the password for your Apple Developer .p12 certificate',
        password: true,
        ignoreFocusOut: true
    });

    if (password !== undefined) {
        await SecretManager.getInstance().storeP12Password(password);
        vscode.window.showInformationMessage('P12 password stored securely.');
    }
}
