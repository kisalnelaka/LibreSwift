import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface XtoolBuildOptions {
    targetTriple?: string;
    minIOSVersion?: string;
    buildConfiguration?: 'debug' | 'release';
    appName?: string;
    sdkPath: string;
    workspacePath: string;
    diagnosticCollection: vscode.DiagnosticCollection;
}

export async function buildWithXtool(
    options: XtoolBuildOptions | string,
    legacySdkPath?: string,
    legacyWorkspacePath?: string,
    legacyDiagnosticCollection?: vscode.DiagnosticCollection
): Promise<string> {
    let targetTriple = 'arm64-apple-ios';
    let minIOSVersion = '17.0';
    let buildConfig: 'debug' | 'release' = 'debug';
    let appName = '';
    let sdkPath = '';
    let workspacePath = '';
    let diagnosticCollection: vscode.DiagnosticCollection;

    if (typeof options === 'string') {
        // Backwards compatibility for task provider & legacy callers
        targetTriple = options;
        sdkPath = legacySdkPath || '';
        workspacePath = legacyWorkspacePath || '';
        diagnosticCollection = legacyDiagnosticCollection!;
    } else {
        targetTriple = options.targetTriple || 'arm64-apple-ios';
        minIOSVersion = options.minIOSVersion || '17.0';
        buildConfig = options.buildConfiguration || 'debug';
        appName = options.appName || '';
        sdkPath = options.sdkPath;
        workspacePath = options.workspacePath;
        diagnosticCollection = options.diagnosticCollection;
    }

    // Read workspace configuration overrides if not explicitly passed
    const config = vscode.workspace.getConfiguration('libreswift');
    if (!appName) {
        appName = config.get<string>('appName') || '';
    }
    if (typeof options !== 'string') {
        buildConfig = (config.get<'debug' | 'release'>('buildConfiguration')) || buildConfig;
        minIOSVersion = config.get<string>('minIOSVersion') || minIOSVersion;
        targetTriple = config.get<string>('targetTriple') || targetTriple;
    }

    const fullTarget = minIOSVersion ? `${targetTriple}${minIOSVersion}` : targetTriple;
    const resolvedSdk = sdkPath.replace('~', process.env.HOME || '');

    return new Promise((resolve, reject) => {
        const args = ['build', '-target', fullTarget, '-sdk', resolvedSdk, '-c', buildConfig];

        const child = spawn('xtool', args, { cwd: workspacePath });

        let stdoutData = '';
        let stderrData = '';

        child.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        child.on('close', async (code) => {
            parseDiagnostics(stderrData + stdoutData, diagnosticCollection, workspacePath);

            if (code === 0) {
                try {
                    const resolvedAppPath = await resolveAppBundlePath(workspacePath, buildConfig, appName);
                    resolve(resolvedAppPath);
                } catch (err: any) {
                    reject(new Error(`Build succeeded, but failed to locate output .app bundle: ${err.message}`));
                }
            } else {
                reject(new Error(`xtool build failed with exit code ${code}\n${stderrData}`));
            }
        });
    });
}

/**
 * Dynamically resolves the built .app bundle path.
 * 1. Checks explicit appName if specified
 * 2. Scans .build/${buildConfig} for any *.app directories
 * 3. Scans Package.swift for product/target executable name
 * 4. Fallback to App.app
 */
async function resolveAppBundlePath(workspacePath: string, buildConfig: string, appName?: string): Promise<string> {
    const buildDir = path.join(workspacePath, '.build', buildConfig);

    // 1. Explicit appName
    if (appName) {
        const explicitAppPath = path.join(buildDir, appName.endsWith('.app') ? appName : `${appName}.app`);
        try {
            const stat = await fs.stat(explicitAppPath);
            if (stat.isDirectory()) return explicitAppPath;
        } catch { }
    }

    // 2. Scan .build/${buildConfig} directory for .app bundles
    try {
        const entries = await fs.readdir(buildDir, { withFileTypes: true });
        const appBundle = entries.find(e => e.isDirectory() && e.name.endsWith('.app'));
        if (appBundle) {
            return path.join(buildDir, appBundle.name);
        }
    } catch { }

    // 3. Inspect Package.swift for target/product executable names
    try {
        const packageSwiftPath = path.join(workspacePath, 'Package.swift');
        const packageContent = await fs.readFile(packageSwiftPath, 'utf8');

        // Match .executable(name: "Foo", ...) or executableTarget(name: "Foo", ...) or name: "Foo"
        const productMatch = packageContent.match(/\.executable\s*\(\s*name\s*:\s*"([^"]+)"/i)
            || packageContent.match(/executableTarget\s*\(\s*name\s*:\s*"([^"]+)"/i)
            || packageContent.match(/name\s*:\s*"([^"]+)"/i);

        if (productMatch && productMatch[1]) {
            const candidate = path.join(buildDir, `${productMatch[1]}.app`);
            try {
                const stat = await fs.stat(candidate);
                if (stat.isDirectory()) return candidate;
            } catch { }
        }
    } catch { }

    // 4. Default fallback
    const fallbackPath = path.join(buildDir, 'App.app');
    return fallbackPath;
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
