import * as vscode from 'vscode';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface IOSDevice {
    udid: string;
    name?: string;
}

export async function getConnectedDevices(): Promise<IOSDevice[]> {
    try {
        const { stdout } = await execAsync('idevice_id -l');
        const udids = stdout.split('\n').filter(line => line.trim().length > 0);
        return udids.map(udid => ({ udid }));
    } catch (e) {
        return [];
    }
}

export async function installAppOnDevice(appPath: string, udid?: string): Promise<void> {
    const udidArg = udid ? `-u ${udid}` : '';
    try {
        await execAsync(`ideviceinstaller ${udidArg} -i "${appPath}"`);
    } catch (error: any) {
        throw new Error(`Failed to install app on device: ${error.message}`);
    }
}

let syslogProcess: ChildProcess | undefined;

export function streamDeviceLogs(bundleId: string, outputChannel: vscode.OutputChannel, udid?: string): void {
    if (syslogProcess) {
        syslogProcess.kill();
    }
    
    outputChannel.clear();
    outputChannel.show();
    outputChannel.appendLine(`--- Starting Log Stream for ${bundleId} ---`);
    
    const args = [];
    if (udid) {
        args.push('-u', udid);
    }
    
    // idevicesyslog streams ALL logs. We need to filter by bundle ID/process name.
    // For simplicity, we grep the output for the bundle ID.
    // In a robust implementation, we might parse the structured syslog.
    syslogProcess = spawn('idevicesyslog', args);
    
    syslogProcess.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
            if (line.includes(bundleId)) {
                outputChannel.appendLine(line);
            }
        }
    });
    
    syslogProcess.stderr?.on('data', (data) => {
        // Output channel doesn't distinguish stderr by default, but we could format it
        outputChannel.appendLine(`[STDERR] ${data.toString()}`);
    });
    
    syslogProcess.on('close', (code) => {
        outputChannel.appendLine(`--- Log Stream Ended (Code: ${code}) ---`);
    });
}
