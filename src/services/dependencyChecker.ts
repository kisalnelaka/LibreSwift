import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const REQUIRED_TOOLS = [
    'xtool',          // Build wrapper
    'rcodesign',      // Code signing
    'usbmuxd',        // Device connection daemon
    'ideviceinstaller',// App installer
    'idevicesyslog'   // Log streaming
];

export async function checkDependencies(): Promise<boolean> {
    let allOk = true;
    for (const tool of REQUIRED_TOOLS) {
        try {
            // Using 'which' to check if tool is in PATH
            await execAsync(`which ${tool}`);
        } catch (e) {
            console.warn(`Dependency missing: ${tool}`);
            allOk = false;
        }
    }
    return allOk;
}
