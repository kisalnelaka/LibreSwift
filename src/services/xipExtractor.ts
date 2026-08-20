import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export async function extractXip(xipPath: string, destPath: string): Promise<void> {
    return vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Extracting iOS SDK",
        cancellable: false
    }, async (progress) => {
        try {
            const tmpDir = '/tmp/xcode_unpack';
            
            // Clean up and create temp dir
            progress.report({ increment: 0, message: "Preparing temporary directory..." });
            await execAsync(`rm -rf ${tmpDir} && mkdir -p ${tmpDir}`);
            
            // Step 1: xar extraction
            progress.report({ increment: 10, message: "Extracting XIP container (xar)..." });
            await execAsync(`xar -xf "${xipPath}" -C ${tmpDir}`);
            
            const contentPath = path.join(tmpDir, 'Content');
            
            // Ensure target directory exists
            progress.report({ increment: 40, message: "Creating destination directory..." });
            const resolvedDest = destPath.replace('~', process.env.HOME || '');
            await execAsync(`mkdir -p "${resolvedDest}"`);
            
            // Step 2: pbzx and cpio extraction
            progress.report({ increment: 50, message: "Unpacking payload (pbzx | cpio)..." });
            await execAsync(`pbzx -d "${contentPath}" | cpio -idmv -D "${resolvedDest}"`);
            
            // Cleanup
            progress.report({ increment: 95, message: "Cleaning up..." });
            await execAsync(`rm -rf ${tmpDir}`);
            
            progress.report({ increment: 100, message: "Done!" });
        } catch (error: any) {
            throw new Error(`SDK Extraction failed: ${error.message}`);
        }
    });
}
