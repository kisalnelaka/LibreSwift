import * as vscode from 'vscode';

const P12_PASSWORD_KEY = 'libreswift.p12password';
const APPLE_ID_EMAIL_KEY = 'libreswift.appleIdEmail';
const APPLE_ID_PASSWORD_KEY = 'libreswift.appleIdPassword';
const APPLE_ID_SESSION_KEY = 'libreswift.appleIdSession';

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

    // P12 Certificate Password
    public async storeP12Password(password: string): Promise<void> {
        await this.secretStorage.store(P12_PASSWORD_KEY, password);
    }

    public async getP12Password(): Promise<string | undefined> {
        return await this.secretStorage.get(P12_PASSWORD_KEY);
    }

    public async clearP12Password(): Promise<void> {
        await this.secretStorage.delete(P12_PASSWORD_KEY);
    }

    // Apple ID Email
    public async storeAppleId(email: string): Promise<void> {
        await this.secretStorage.store(APPLE_ID_EMAIL_KEY, email);
    }

    public async getAppleId(): Promise<string | undefined> {
        return await this.secretStorage.get(APPLE_ID_EMAIL_KEY);
    }

    public async clearAppleId(): Promise<void> {
        await this.secretStorage.delete(APPLE_ID_EMAIL_KEY);
    }

    // Apple ID Password / App-Specific Password
    public async storeApplePassword(password: string): Promise<void> {
        await this.secretStorage.store(APPLE_ID_PASSWORD_KEY, password);
    }

    public async getApplePassword(): Promise<string | undefined> {
        return await this.secretStorage.get(APPLE_ID_PASSWORD_KEY);
    }

    public async clearApplePassword(): Promise<void> {
        await this.secretStorage.delete(APPLE_ID_PASSWORD_KEY);
    }

    // Apple ID Session Token
    public async storeSessionToken(token: string): Promise<void> {
        await this.secretStorage.store(APPLE_ID_SESSION_KEY, token);
    }

    public async getSessionToken(): Promise<string | undefined> {
        return await this.secretStorage.get(APPLE_ID_SESSION_KEY);
    }

    public async clearSessionToken(): Promise<void> {
        await this.secretStorage.delete(APPLE_ID_SESSION_KEY);
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
