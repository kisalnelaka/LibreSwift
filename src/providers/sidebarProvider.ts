import * as vscode from 'vscode';
import { checkDependencies } from '../services/dependencyChecker';
import { SecretManager } from '../services/secretManager';
import { getConnectedDevices } from '../services/imobiledeviceWrapper';

export class SidebarProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        if (!element) {
            return [
                new CategoryItem('Environment & SDK'),
                new CategoryItem('Build & Target Configuration'),
                new CategoryItem('Signing & Credentials'),
                new CategoryItem('Connected Devices'),
                new CategoryItem('Support & Community')
            ];
        }

        if (element.label === 'Environment & SDK') {
            const config = vscode.workspace.getConfiguration('libreswift');
            const sdkPath = config.get<string>('sdkPath') || '~/.local/share/ios-linux-sdk/iPhoneOS.sdk';
            const depsOk = await checkDependencies();

            return [
                new DetailItem('Run Doctor Diagnostics', 'System health & fixes', 'libreswift.doctor', 'pulse'),
                new DetailItem('SDK Path', sdkPath, 'libreswift.setupEnvironment', 'folder'),
                new DetailItem('CLI Tools Health', depsOk ? 'Ready' : 'Missing Dependencies', 'libreswift.doctor', depsOk ? 'check' : 'warning')
            ];
        }

        if (element.label === 'Build & Target Configuration') {
            const config = vscode.workspace.getConfiguration('libreswift');
            const targetTriple = config.get<string>('targetTriple') || 'arm64-apple-ios';
            const minIOSVersion = config.get<string>('minIOSVersion') || '17.0';
            const buildConfig = config.get<string>('buildConfiguration') || 'debug';
            const appName = config.get<string>('appName') || '(Auto-detected)';

            return [
                new DetailItem('Target Architecture', `${targetTriple}${minIOSVersion}`, undefined, 'symbol-property'),
                new DetailItem('Build Configuration', buildConfig.toUpperCase(), undefined, 'gear'),
                new DetailItem('Target App Bundle', appName, undefined, 'package'),
                new DetailItem('Debug on Device', 'Start LLDB Session', 'libreswift.debugOnDevice', 'debug')
            ];
        }

        if (element.label === 'Signing & Credentials') {
            const config = vscode.workspace.getConfiguration('libreswift');
            const p12Path = config.get<string>('p12Path') || 'Not Set';
            const provisionPath = config.get<string>('mobileprovisionPath') || 'Not Set';

            const password = await SecretManager.getInstance().getP12Password();

            return [
                new DetailItem('P12 Certificate', p12Path, undefined, 'key'),
                new DetailItem('Mobile Provision', provisionPath, undefined, 'file'),
                new DetailItem('P12 Password', password ? 'Stored Securely' : 'Not Set', 'libreswift.promptP12Password', password ? 'lock' : 'unlock')
            ];
        }

        if (element.label === 'Connected Devices') {
            const devices = await getConnectedDevices();
            if (devices.length === 0) {
                return [new DetailItem('No Devices Connected', 'Connect via USB', 'libreswift.refreshDevices', 'device-mobile')];
            }
            return devices.map(d => new DetailItem(d.name || 'iOS Device', d.udid, undefined, 'device-mobile'));
        }

        if (element.label === 'Support & Community') {
            return [
                new DetailItem('Rate on Marketplace', '⭐ Leave a review', 'libreswift.rateMarketplace', 'star-full'),
                new DetailItem('Provide Feedback', 'Share ideas & bugs', 'libreswift.showFeedback', 'feedback'),
                new DetailItem('Help & Documentation', 'In-app manual', 'libreswift.showHelp', 'book'),
                new DetailItem('Star on GitHub', 'kisalnelaka/LibreSwift', 'libreswift.openGitHub', 'github')
            ];
        }

        return [];
    }
}

class CategoryItem extends vscode.TreeItem {
    constructor(label: string) {
        super(label, vscode.TreeItemCollapsibleState.Expanded);
    }
}

class DetailItem extends vscode.TreeItem {
    constructor(label: string, description: string, commandId?: string, icon?: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = description;
        if (commandId) {
            this.command = {
                command: commandId,
                title: label
            };
            this.contextValue = commandId;
        }
        if (icon) {
            this.iconPath = new vscode.ThemeIcon(icon);
        }
    }
}
