import * as vscode from 'vscode';
import { checkDependencies } from '../services/dependencyChecker';
import { SecretManager } from '../services/secretManager';
import { getConnectedDevices } from '../services/imobiledeviceWrapper';
import { AppleIdSigner } from '../services/appleIdSigner';

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
                new CategoryItem('Project & Scaffolding'),
                new CategoryItem('Environment & SDK'),
                new CategoryItem('Build & Target Configuration'),
                new CategoryItem('Signing & Credentials'),
                new CategoryItem('Connected Devices'),
                new CategoryItem('Support & Community')
            ];
        }

        if (element.label === 'Project & Scaffolding') {
            return [
                new DetailItem('Create New iOS Project', 'SwiftUI / UIKit / CLI template wizard', 'libreswift.createProject', 'plus'),
                new DetailItem('Setup iOS Environment', 'Extract iPhoneOS.sdk from Xcode', 'libreswift.setupEnvironment', 'folder')
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
            const signingMode = config.get<string>('signingMode') || 'auto';
            const p12Path = config.get<string>('p12Path');
            const provisionPath = config.get<string>('mobileprovisionPath');
            const certStatus = AppleIdSigner.getCertificateStatus();

            const items: DetailItem[] = [];

            // Display Signing Mode
            items.push(new DetailItem(
                'Signing Mode',
                signingMode === 'p12' ? 'Manual .p12 & Profile' : 'Free Apple ID (Automated)',
                undefined,
                'shield'
            ));

            if (signingMode === 'p12' || (p12Path && provisionPath)) {
                const password = await SecretManager.getInstance().getP12Password();
                items.push(new DetailItem('P12 Certificate', p12Path || 'Not Set', undefined, 'key'));
                items.push(new DetailItem('Mobile Provision', provisionPath || 'Not Set', undefined, 'file'));
                items.push(new DetailItem('P12 Password', password ? 'Stored Securely' : 'Not Set', 'libreswift.promptP12Password', password ? 'lock' : 'unlock'));
            } else {
                // Free Apple ID / Managed Self-Signing Mode
                items.push(new DetailItem(
                    'Apple ID Account',
                    certStatus.email || 'Not Configured (Click to set up)',
                    'libreswift.configureAppleId',
                    'account'
                ));

                const certDesc = certStatus.valid
                    ? `Valid (${certStatus.daysRemaining}d ${certStatus.hoursRemaining % 24}h remaining)`
                    : (certStatus.exists ? 'Expired (Click to renew)' : 'Not Generated');

                items.push(new DetailItem(
                    '7-Day Certificate',
                    certDesc,
                    'libreswift.renewCertificate',
                    certStatus.valid ? 'verified' : 'warning'
                ));

                items.push(new DetailItem(
                    'Renew 7-Day Certificate',
                    '1-Click Refresh',
                    'libreswift.renewCertificate',
                    'sync'
                ));
            }

            return items;
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
