import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';

export async function buildWithXtool(
    target: string = 'arm64-apple-ios',
    sdkPath: string,
    workspacePath: string,
    diagnosticCollection: vscode.DiagnosticCollection
): Promise<string> {
    return new Promise((resolve, reject) => {
        const resolvedSdk = sdkPath.replace('~', process.env.HOME || '');
        const args = ['build', '-target', target, '-sdk', resolvedSdk];
        
        const child = spawn('xtool', args, { cwd: workspacePath });
        
        let stdoutData = '';
        let stderrData = '';
        
        child.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            stderrData += data.toString();
        });
        
        child.on('close', (code) => {
            parseDiagnostics(stderrData + stdoutData, diagnosticCollection, workspacePath);
            
            if (code === 0) {
                // Return path to the built .app
                // This is a naive assumption that xtool outputs the .app in .build/debug
                // In reality, this might need more robust path resolution based on stdout
                resolve(path.join(workspacePath, '.build', 'debug', 'App.app'));
            } else {
                reject(new Error(`xtool build failed with code ${code}\n${stderrData}`));
            }
        });
    });
}

function parseDiagnostics(output: string, collection: vscode.DiagnosticCollection, workspacePath: string) {
    collection.clear();
    
    // Regex to match Swift compiler output format: <file>:<line>:<col>: <error|warning>: <message>
    const regex = /^(.*?):(\d+):(\d+):\s+(error|warning):\s+(.*)$/gm;
    let match;
    
    const diagnosticsMap = new Map<string, vscode.Diagnostic[]>();
    
    while ((match = regex.exec(output)) !== null) {
        const [, file, line, col, severityStr, message] = match;
        
        const uri = vscode.Uri.file(path.resolve(workspacePath, file));
        const severity = severityStr === 'error' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;
        
        const lineNum = parseInt(line, 10) - 1;
        const colNum = parseInt(col, 10) - 1;
        
        const range = new vscode.Range(lineNum, colNum, lineNum, colNum + 1);
        const diagnostic = new vscode.Diagnostic(range, message, severity);
        diagnostic.source = 'xtool';
        
        if (!diagnosticsMap.has(uri.fsPath)) {
            diagnosticsMap.set(uri.fsPath, []);
        }
        diagnosticsMap.get(uri.fsPath)!.push(diagnostic);
    }
    
    for (const [fsPath, diagnostics] of diagnosticsMap.entries()) {
        collection.set(vscode.Uri.file(fsPath), diagnostics);
    }
}
