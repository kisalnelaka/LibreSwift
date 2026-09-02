import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SecretManager } from './secretManager';
import { getConnectedDevices } from './imobiledeviceWrapper';
import { AppleIdSigner } from './appleIdSigner';

const execAsync = promisify(exec);

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface DiagnosticItem {
    id: string;
    category: 'Host & System' | 'Toolchain & CLI' | 'SDK Environment' | 'Device & Daemon' | 'Signing & Security';
    title: string;
    status: CheckStatus;
    message: string;
    details?: string;
    remediationAction?: {
        label: string;
        command: string;
    };
}

export interface DoctorReport {
    timestamp: string;
    items: DiagnosticItem[];
    summary: {
        pass: number;
        warn: number;
        fail: number;
    };
}

export async function runDoctorDiagnostics(): Promise<DoctorReport> {
    const items: DiagnosticItem[] = [];

    // 1. Host & System
    items.push(await checkHostOS());
    items.push(await checkWslStatus());

    // 2. Toolchain & CLI Binaries
    const tools = [
        { name: 'xtool', required: true, desc: 'Swift iOS cross-compiler' },
        { name: 'rcodesign', required: true, desc: 'Apple platform code signing' },
        { name: 'usbmuxd', required: true, desc: 'USB multiplexer daemon' },
        { name: 'idevice_id', required: true, desc: 'Device detection utility' },
        { name: 'ideviceinstaller', required: true, desc: 'iOS App installation utility' },
        { name: 'idevicesyslog', required: true, desc: 'Device log streaming utility' },
        { name: 'sourcekit-lsp', required: true, desc: 'Swift Language Server' },
        { name: 'lldb', required: false, desc: 'Debugger for interactive sessions' },
        { name: 'xar', required: false, desc: 'Archive extractor for Xcode .xip' },
        { name: 'pbzx', required: false, desc: 'Apple PBZX payload decompressor' },
        { name: 'cpio', required: false, desc: 'CPIO archive utility' }
    ];

    for (const tool of tools) {
        items.push(await checkToolBinary(tool.name, tool.desc, tool.required));
    }

    // 3. SDK Environment
    items.push(await checkSdkEnvironment());

    // 4. Device & Daemon
    items.push(await checkUsbmuxdSocket());
    items.push(await checkConnectedDevicesAndTrust());

    // 5. Signing & Security
    items.push(await checkSigningConfiguration());

    const summary = {
        pass: items.filter(i => i.status === 'pass').length,
        warn: items.filter(i => i.status === 'warn').length,
        fail: items.filter(i => i.status === 'fail').length
    };

    return {
        timestamp: new Date().toISOString(),
        items,
        summary
    };
}

async function checkHostOS(): Promise<DiagnosticItem> {
    const platform = process.platform;
    if (platform === 'linux') {
        let releaseInfo = 'Linux';
        try {
            const { stdout } = await execAsync('uname -r');
            releaseInfo = `Linux Kernel ${stdout.trim()}`;
        } catch { }

        return {
            id: 'host-os',
            category: 'Host & System',
            title: 'Operating System',
            status: 'pass',
            message: `${releaseInfo} (Supported)`,
        };
    } else {
        return {
            id: 'host-os',
            category: 'Host & System',
            title: 'Operating System',
            status: 'warn',
            message: `Current OS is ${platform}. LibreSwift is optimized for Linux/WSL2.`
        };
    }
}

async function checkWslStatus(): Promise<DiagnosticItem> {
    try {
        const { stdout } = await execAsync('cat /proc/version');
        const isWsl = stdout.toLowerCase().includes('microsoft') || stdout.toLowerCase().includes('wsl');
        if (isWsl) {
            return {
                id: 'host-wsl',
                category: 'Host & System',
                title: 'WSL2 Environment',
                status: 'pass',
                message: 'WSL2 detected. Ensure usbipd-win is attached for USB devices.',
                details: 'Run "usbipd wsl list" and "usbipd wsl attach --busid <busid>" from Windows if device is not visible.'
            };
        }
    } catch { }

    return {
        id: 'host-wsl',
        category: 'Host & System',
        title: 'Virtualization Environment',
        status: 'pass',
        message: 'Native Linux environment active.'
    };
}

async function checkToolBinary(name: string, desc: string, required: boolean): Promise<DiagnosticItem> {
    try {
        const { stdout } = await execAsync(`which ${name}`);
        const toolPath = stdout.trim();
        return {
            id: `tool-${name}`,
            category: 'Toolchain & CLI',
            title: name,
            status: 'pass',
            message: `${desc} located at ${toolPath}`
        };
    } catch {
        return {
            id: `tool-${name}`,
            category: 'Toolchain & CLI',
            title: name,
            status: required ? 'fail' : 'warn',
            message: `${desc} (${name}) was not found in PATH.`,
            details: required ? 'Required for full development and deployment workflow.' : 'Recommended for extended features.',
            remediationAction: {
                label: 'Run Setup Engine',
                command: 'libreswift.bootstrapEnvironment'
            }
        };
    }
}

async function checkSdkEnvironment(): Promise<DiagnosticItem> {
    const config = vscode.workspace.getConfiguration('libreswift');
    const sdkPath = (config.get<string>('sdkPath') || '~/.local/share/ios-linux-sdk/iPhoneOS.sdk').replace('~', process.env.HOME || '');

    try {
        const stat = await fs.stat(sdkPath);
        if (!stat.isDirectory()) {
            throw new Error('SDK path is not a directory');
        }

        const settingsPath = path.join(sdkPath, 'SDKSettings.json');
        let sdkVersion = 'iOS SDK';
        try {
            const rawSettings = await fs.readFile(settingsPath, 'utf8');
            const parsed = JSON.parse(rawSettings);
            if (parsed.Version) {
                sdkVersion = `iOS SDK ${parsed.Version}`;
            }
        } catch {
            const frameworksPath = path.join(sdkPath, 'System', 'Library', 'Frameworks');
            await fs.access(frameworksPath);
        }

        return {
            id: 'sdk-check',
            category: 'SDK Environment',
            title: 'iPhoneOS SDK',
            status: 'pass',
            message: `${sdkVersion} verified at ${sdkPath}`
        };
    } catch (e: any) {
        return {
            id: 'sdk-check',
            category: 'SDK Environment',
            title: 'iPhoneOS SDK',
            status: 'fail',
            message: `SDK directory not found or incomplete at ${sdkPath}`,
            details: 'Extract the SDK from an official Xcode .xip archive.',
            remediationAction: {
                label: 'Extract SDK (.xip)',
                command: 'libreswift.setupEnvironment'
            }
        };
    }
}

async function checkUsbmuxdSocket(): Promise<DiagnosticItem> {
    const socketPath = '/var/run/usbmuxd';
    try {
        await fs.access(socketPath);
        return {
            id: 'daemon-usbmuxd',
            category: 'Device & Daemon',
            title: 'usbmuxd Socket',
            status: 'pass',
            message: 'Active (/var/run/usbmuxd is accessible)'
        };
    } catch {
        return {
            id: 'daemon-usbmuxd',
            category: 'Device & Daemon',
            title: 'usbmuxd Socket',
            status: 'warn',
            message: 'usbmuxd socket not accessible at /var/run/usbmuxd.',
            details: 'Make sure usbmuxd service is started: sudo systemctl start usbmuxd or run sudo usbmuxd -f.'
        };
    }
}

async function checkConnectedDevicesAndTrust(): Promise<DiagnosticItem> {
    try {
        const devices = await getConnectedDevices();
        if (devices.length === 0) {
            return {
                id: 'device-status',
                category: 'Device & Daemon',
                title: 'Connected iOS Devices',
                status: 'warn',
                message: 'No iOS devices detected over USB.',
                details: 'Connect your device via USB and tap "Trust This Computer" on the screen.',
                remediationAction: {
                    label: 'Refresh Devices',
                    command: 'libreswift.refreshDevices'
                }
            };
        }

        let trustWarning = false;
        try {
            const { stdout } = await execAsync('idevicepair validate');
            if (!stdout.includes('SUCCESS')) {
                trustWarning = true;
            }
        } catch {
            trustWarning = true;
        }

        if (trustWarning) {
            return {
                id: 'device-status',
                category: 'Device & Daemon',
                title: 'Connected iOS Devices',
                status: 'warn',
                message: `${devices.length} device(s) connected, but pairing trust is unverified.`,
                details: 'Unlock your device and accept the trust prompt on screen.'
            };
        }

        return {
            id: 'device-status',
            category: 'Device & Daemon',
            title: 'Connected iOS Devices',
            status: 'pass',
            message: `${devices.length} device(s) connected and trusted (${devices.map(d => d.udid.substring(0, 8) + '...').join(', ')})`
        };
    } catch (e: any) {
        return {
            id: 'device-status',
            category: 'Device & Daemon',
            title: 'Connected iOS Devices',
            status: 'fail',
            message: `Failed to query device state: ${e.message}`
        };
    }
}

async function checkSigningConfiguration(): Promise<DiagnosticItem> {
    const config = vscode.workspace.getConfiguration('libreswift');
    const signingMode = config.get<string>('signingMode') || 'auto';
    const p12Path = config.get<string>('p12Path');
    const provisionPath = config.get<string>('mobileprovisionPath');

    // 1. Check Free Apple ID / Managed Self-Signing Status
    const managedCert = AppleIdSigner.getCertificateStatus();
    if (managedCert.exists && managedCert.valid && signingMode !== 'p12') {
        return {
            id: 'signing-assets',
            category: 'Signing & Security',
            title: 'Code Signing Assets',
            status: 'pass',
            message: `Active 7-day developer certificate for ${managedCert.email || 'Free Account'} (${managedCert.daysRemaining}d ${managedCert.hoursRemaining % 24}h remaining).`,
            remediationAction: {
                label: 'Renew Certificate',
                command: 'libreswift.renewCertificate'
            }
        };
    }

    if (managedCert.exists && !managedCert.valid && signingMode !== 'p12') {
        return {
            id: 'signing-assets',
            category: 'Signing & Security',
            title: 'Code Signing Assets',
            status: 'warn',
            message: '7-Day Free Developer Certificate has expired.',
            details: 'Apple free developer account certificates expire after 7 days and must be renewed.',
            remediationAction: {
                label: 'Renew 7-Day Certificate',
                command: 'libreswift.renewCertificate'
            }
        };
    }

    // 2. Check Manual .p12 configuration
    const missingAssets: string[] = [];

    if (!p12Path) {
        missingAssets.push('p12 certificate path not configured');
    } else {
        try {
            await fs.access(p12Path.replace('~', process.env.HOME || ''));
        } catch {
            missingAssets.push(`p12 file not found at ${p12Path}`);
        }
    }

    if (!provisionPath) {
        missingAssets.push('mobileprovision profile path not configured');
    } else {
        try {
            await fs.access(provisionPath.replace('~', process.env.HOME || ''));
        } catch {
            missingAssets.push(`mobileprovision file not found at ${provisionPath}`);
        }
    }

    let passwordPresent = false;
    try {
        const password = await SecretManager.getInstance().getP12Password();
        passwordPresent = Boolean(password && password.length > 0);
    } catch { }

    if (!passwordPresent) {
        missingAssets.push('p12 password not stored in SecretStorage');
    }

    if (missingAssets.length > 0) {
        return {
            id: 'signing-assets',
            category: 'Signing & Security',
            title: 'Code Signing Assets',
            status: 'warn',
            message: 'No active code signing identity found.',
            details: 'Configure a Free Apple ID or provide a manual .p12 certificate.',
            remediationAction: {
                label: 'Setup Free Apple ID',
                command: 'libreswift.configureAppleId'
            }
        };
    }

    return {
        id: 'signing-assets',
        category: 'Signing & Security',
        title: 'Code Signing Assets',
        status: 'pass',
        message: 'Manual certificate, provisioning profile, and keychain password verified.'
    };
}
