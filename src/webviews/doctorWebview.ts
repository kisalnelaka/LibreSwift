import * as vscode from 'vscode';
import { runDoctorDiagnostics, DoctorReport, DiagnosticItem } from '../services/doctor';

export async function showDoctorWebview(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'libreswiftDoctor',
        'LibreSwift Doctor (Diagnostics)',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = getDoctorLoadingHtml();

    const report = await runDoctorDiagnostics();
    panel.webview.html = getDoctorReportHtml(report);

    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'runCommand':
                    if (message.actionCommand) {
                        await vscode.commands.executeCommand(message.actionCommand);
                    }
                    return;
                case 'reRunDoctor':
                    panel.webview.html = getDoctorLoadingHtml();
                    const updatedReport = await runDoctorDiagnostics();
                    panel.webview.html = getDoctorReportHtml(updatedReport);
                    return;
            }
        },
        undefined,
        context.subscriptions
    );
}

function getDoctorLoadingHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LibreSwift Doctor</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            text-align: center;
        }
        .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid var(--vscode-panel-border);
            border-top: 4px solid var(--vscode-progressBar-background, #007acc);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h2 { font-weight: 500; }
        p { opacity: 0.7; font-size: 0.95rem; }
    </style>
</head>
<body>
    <div class="spinner"></div>
    <h2>Scanning LibreSwift Environment...</h2>
    <p>Checking toolchains, SDK headers, usbmuxd socket, devices, and code signing credentials.</p>
</body>
</html>`;
}

function getDoctorReportHtml(report: DoctorReport): string {
    const categories = ['Host & System', 'Toolchain & CLI', 'SDK Environment', 'Device & Daemon', 'Signing & Security'] as const;

    const renderItems = (cat: typeof categories[number]) => {
        const catItems = report.items.filter(i => i.category === cat);
        if (catItems.length === 0) return '';

        return `
        <div class="section">
            <h3 class="section-title">${cat}</h3>
            <div class="card-list">
                ${catItems.map(item => `
                    <div class="card status-${item.status}">
                        <div class="card-header">
                            <span class="badge badge-${item.status}">${getStatusIcon(item.status)} ${item.status.toUpperCase()}</span>
                            <span class="card-name">${escapeHtml(item.title)}</span>
                        </div>
                        <div class="card-message">${escapeHtml(item.message)}</div>
                        ${item.details ? `<div class="card-details">${escapeHtml(item.details)}</div>` : ''}
                        ${item.remediationAction ? `
                            <div class="card-actions">
                                <button class="action-btn" onclick="triggerAction('${item.remediationAction.command}')">
                                    ${escapeHtml(item.remediationAction.label)}
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>`;
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LibreSwift Doctor</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            padding: 32px 48px;
            max-width: 900px;
            margin: 0 auto;
            line-height: 1.5;
        }
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .header-title h1 {
            font-size: 1.6rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .header-title p {
            opacity: 0.7;
            font-size: 0.88rem;
            margin-top: 4px;
        }
        .summary-badges {
            display: flex;
            gap: 12px;
            margin-bottom: 28px;
        }
        .summary-card {
            flex: 1;
            padding: 12px 16px;
            border-radius: 6px;
            background: var(--vscode-sideBar-background);
            border: 1px solid var(--vscode-panel-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .summary-card .count {
            font-size: 1.5rem;
            font-weight: 700;
        }
        .summary-card.pass .count { color: #4ec9b0; }
        .summary-card.warn .count { color: #ce9178; }
        .summary-card.fail .count { color: #f14c4c; }

        .section {
            margin-bottom: 28px;
        }
        .section-title {
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            opacity: 0.6;
            margin-bottom: 12px;
        }
        .card-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .card {
            background: var(--vscode-sideBar-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 14px 18px;
            transition: border-color 0.2s;
        }
        .card.status-pass { border-left: 4px solid #4ec9b0; }
        .card.status-warn { border-left: 4px solid #ce9178; }
        .card.status-fail { border-left: 4px solid #f14c4c; }

        .card-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 6px;
        }
        .card-name {
            font-weight: 600;
            font-size: 0.95rem;
        }
        .badge {
            font-size: 0.72rem;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 4px;
            text-transform: uppercase;
        }
        .badge-pass { background: rgba(78, 201, 176, 0.2); color: #4ec9b0; }
        .badge-warn { background: rgba(206, 145, 120, 0.2); color: #ce9178; }
        .badge-fail { background: rgba(241, 76, 76, 0.2); color: #f14c4c; }

        .card-message {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        .card-details {
            font-size: 0.82rem;
            opacity: 0.6;
            margin-top: 4px;
            font-family: var(--vscode-editor-font-family);
        }
        .card-actions {
            margin-top: 10px;
        }
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 14px;
            font-size: 0.85rem;
            border-radius: 3px;
            cursor: pointer;
            font-weight: 500;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .re-run-btn {
            background: var(--vscode-button-secondaryBackground, #3a3d41);
            color: var(--vscode-button-secondaryForeground, #fff);
        }
        .re-run-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground, #45494e);
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-title">
            <h1>🩺 LibreSwift Doctor</h1>
            <p>Environment Diagnostics & Automated Health Checks — Scanned at ${new Date(report.timestamp).toLocaleTimeString()}</p>
        </div>
        <button class="re-run-btn" onclick="reRunDoctor()">🔄 Re-Scan</button>
    </div>

    <div class="summary-badges">
        <div class="summary-card pass">
            <div>Passed Checks</div>
            <div class="count">${report.summary.pass}</div>
        </div>
        <div class="summary-card warn">
            <div>Warnings</div>
            <div class="count">${report.summary.warn}</div>
        </div>
        <div class="summary-card fail">
            <div>Errors / Missing</div>
            <div class="count">${report.summary.fail}</div>
        </div>
    </div>

    ${categories.map(cat => renderItems(cat)).join('')}

    <script>
        const vscode = acquireVsCodeApi();

        function triggerAction(actionCommand) {
            vscode.postMessage({
                command: 'runCommand',
                actionCommand: actionCommand
            });
        }

        function reRunDoctor() {
            vscode.postMessage({
                command: 'reRunDoctor'
            });
        }
    </script>
</body>
</html>`;
}

function getStatusIcon(status: string): string {
    switch (status) {
        case 'pass': return '✓';
        case 'warn': return '⚠';
        case 'fail': return '✗';
        default: return '•';
    }
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
