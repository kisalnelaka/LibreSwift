"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDependencies = checkDependencies;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const REQUIRED_TOOLS = [
    'xtool', // Build wrapper
    'rcodesign', // Code signing
    'usbmuxd', // Device connection daemon
    'ideviceinstaller', // App installer
    'idevicesyslog' // Log streaming
];
async function checkDependencies() {
    let allOk = true;
    for (const tool of REQUIRED_TOOLS) {
        try {
            // Using 'which' to check if tool is in PATH
            await execAsync(`which ${tool}`);
        }
        catch (e) {
            console.warn(`Dependency missing: ${tool}`);
            allOk = false;
        }
    }
    return allOk;
}
//# sourceMappingURL=dependencyChecker.js.map