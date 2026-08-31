// Mock the 'vscode' module for standalone unit testing without Electron overhead
import Module = require('module');

export function installVscodeMock() {
    const mockVscode = {
        workspace: {
            workspaceFolders: [
                {
                    uri: { fsPath: process.cwd() },
                    name: 'TestWorkspace',
                    index: 0
                }
            ],
            getConfiguration: (section?: string) => ({
                get: (key: string) => {
                    const defaults: Record<string, any> = {
                        sdkPath: '~/.local/share/ios-linux-sdk/iPhoneOS.sdk',
                        targetTriple: 'arm64-apple-ios',
                        minIOSVersion: '17.0',
                        buildConfiguration: 'debug',
                        appName: '',
                        p12Path: '',
                        mobileprovisionPath: '',
                        bundleIdentifier: 'com.example.App'
                    };
                    return defaults[key];
                }
            }),
            createFileSystemWatcher: () => ({
                onDidChange: () => ({ dispose: () => {} }),
                onDidCreate: () => ({ dispose: () => {} }),
                onDidDelete: () => ({ dispose: () => {} }),
                dispose: () => {}
            })
        },
        window: {
            createOutputChannel: (name: string) => ({
                name,
                append: () => {},
                appendLine: () => {},
                clear: () => {},
                show: () => {},
                hide: () => {},
                dispose: () => {}
            }),
            createStatusBarItem: () => ({
                text: '',
                command: '',
                show: () => {},
                hide: () => {},
                dispose: () => {}
            }),
            showInformationMessage: async () => undefined,
            showWarningMessage: async () => undefined,
            showErrorMessage: async () => undefined,
            showOpenDialog: async () => undefined,
            withProgress: async (opts: any, task: any) => {
                return await task({ report: () => {} });
            }
        },
        commands: {
            registerCommand: () => ({ dispose: () => {} }),
            executeCommand: async () => undefined
        },
        languages: {
            createDiagnosticCollection: () => ({
                clear: () => {},
                set: () => {},
                delete: () => {},
                dispose: () => {}
            })
        },
        debug: {
            registerDebugConfigurationProvider: () => ({ dispose: () => {} }),
            startDebugging: async () => true
        },
        tasks: {
            registerTaskProvider: () => ({ dispose: () => {} })
        },
        StatusBarAlignment: {
            Left: 1,
            Right: 2
        },
        ProgressLocation: {
            Notification: 15
        },
        DiagnosticSeverity: {
            Error: 0,
            Warning: 1,
            Information: 2,
            Hint: 3
        },
        Range: class {
            constructor(public startLine: number, public startCol: number, public endLine: number, public endCol: number) {}
        },
        Diagnostic: class {
            source?: string;
            constructor(public range: any, public message: string, public severity: number) {}
        },
        Uri: {
            file: (p: string) => ({ fsPath: p, path: p, scheme: 'file' }),
            parse: (s: string) => ({ fsPath: s, path: s, scheme: 'http' })
        },
        ThemeIcon: class {
            constructor(public id: string) {}
        },
        TreeItem: class {
            constructor(public label: string, public collapsibleState?: number) {}
        },
        TreeItemCollapsibleState: {
            None: 0,
            Collapsed: 1,
            Expanded: 2
        },
        EventEmitter: class {
            event = () => {};
            fire() {}
        }
    };

    // Inject into require cache
    require.cache['vscode'] = {
        id: 'vscode',
        filename: 'vscode',
        loaded: true,
        exports: mockVscode,
        children: [],
        paths: []
    } as any;

    const originalResolveFilename = (Module as any)._resolveFilename;
    (Module as any)._resolveFilename = function (request: string, parent: any, isMain: boolean, options: any) {
        if (request === 'vscode') {
            return 'vscode';
        }
        return originalResolveFilename.call(this, request, parent, isMain, options);
    };
}
