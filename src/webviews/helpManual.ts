import * as vscode from 'vscode';
import * as path from 'path';

export function showHelpManual(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'libreswiftHelp',
        'LibreSwift Help & Manual',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    panel.webview.html = getHelpContent();
}

function getHelpContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LibreSwift Help & Manual</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            display: flex;
            height: 100vh;
            overflow: hidden;
        }
        nav {
            width: 220px;
            min-width: 220px;
            background: var(--vscode-sideBar-background);
            border-right: 1px solid var(--vscode-panel-border);
            padding: 24px 0;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        nav h2 {
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            opacity: 0.5;
            padding: 8px 16px 4px;
        }
        nav a {
            display: block;
            padding: 7px 20px;
            color: var(--vscode-foreground);
            text-decoration: none;
            font-size: 0.9rem;
            border-left: 3px solid transparent;
            transition: background 0.15s;
            cursor: pointer;
        }
        nav a:hover {
            background: var(--vscode-list-hoverBackground);
        }
        nav a.active {
            background: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
            border-left-color: var(--vscode-focusBorder);
        }
        main {
            flex: 1;
            overflow-y: auto;
            padding: 40px 48px;
            max-width: 860px;
        }
        section { display: none; }
        section.visible { display: block; }
        h1 {
            font-size: 1.8rem;
            margin-bottom: 8px;
            color: var(--vscode-editor-foreground);
        }
        .subtitle {
            opacity: 0.6;
            margin-bottom: 32px;
            font-size: 0.95rem;
        }
        h2 {
            font-size: 1.15rem;
            margin: 28px 0 10px;
            padding-bottom: 6px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        p, li { line-height: 1.7; margin-bottom: 10px; font-size: 0.95rem; }
        ul, ol { padding-left: 20px; margin-bottom: 12px; }
        code {
            background: var(--vscode-textCodeBlock-background);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            font-size: 0.88rem;
        }
        pre {
            background: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 16px;
            margin: 12px 0 20px;
            overflow-x: auto;
        }
        pre code { background: none; padding: 0; }
        .callout {
            background: var(--vscode-inputValidation-infoBackground, #1a3a52);
            border-left: 4px solid var(--vscode-inputValidation-infoBorder, #3794ff);
            padding: 12px 16px;
            border-radius: 0 4px 4px 0;
            margin: 16px 0;
            font-size: 0.9rem;
        }
        .callout.warn {
            background: var(--vscode-inputValidation-warningBackground, #3d2e00);
            border-left-color: var(--vscode-inputValidation-warningBorder, #cca700);
        }
        .cmd-table { width: 100%; border-collapse: collapse; margin: 12px 0 24px; }
        .cmd-table th, .cmd-table td {
            text-align: left;
            padding: 8px 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
            font-size: 0.9rem;
        }
        .cmd-table th { opacity: 0.7; font-weight: 600; }
        .badge {
            display: inline-block;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.75rem;
            margin-left: 6px;
        }
    </style>
</head>
<body>
<nav>
    <h2>Getting Started</h2>
    <a class="active" data-target="welcome" onclick="show(this)">👋 Welcome</a>
    <a data-target="quickstart" onclick="show(this)">🚀 Quick Start</a>
    <a data-target="oneclicksetup" onclick="show(this)">⚙️ One-Click Setup</a>
    <h2>Core Guides</h2>
    <a data-target="sdk" onclick="show(this)">📦 SDK Extraction</a>
    <a data-target="signing" onclick="show(this)">🔐 Code Signing</a>
    <a data-target="devices" onclick="show(this)">📱 Device Connection</a>
    <a data-target="wsl" onclick="show(this)">🪟 WSL Setup</a>
    <h2>Advanced</h2>
    <a data-target="intellisense" onclick="show(this)">✨ IntelliSense</a>
    <a data-target="logs" onclick="show(this)">📋 Device Logs</a>
    <a data-target="troubleshooting" onclick="show(this)">🔧 Troubleshooting</a>
    <h2>Reference</h2>
    <a data-target="commands" onclick="show(this)">⌨️ All Commands</a>
    <a data-target="settings" onclick="show(this)">🔩 Settings Reference</a>
</nav>
<main>

<section id="welcome" class="visible">
    <h1>LibreSwift Help &amp; Manual</h1>
    <p class="subtitle">Version 1.3.0 — Native iOS development on Linux, without macOS.</p>
    <div class="callout">
        <strong>First time here?</strong> Start with the <a data-target="quickstart" onclick="show(document.querySelector('[data-target=quickstart]'))" style="color:var(--vscode-textLink-foreground);cursor:pointer">Quick Start guide →</a>
    </div>
    <h2>What is LibreSwift?</h2>
    <p>LibreSwift is a VS Code extension that turns your Linux machine into a full iOS development workstation. It integrates with a set of open-source tools to give you the entire Apple development pipeline without needing macOS or Xcode.</p>
    <h2>How it works</h2>
    <ul>
        <li><strong>IntelliSense:</strong> <code>sourcekit-lsp</code> provides Swift autocompletion, go-to-definition, and inline diagnostics, configured for cross-compilation to <code>arm64-apple-ios</code>.</li>
        <li><strong>Build:</strong> <code>xtool</code> drives the Swift compiler targeting your iPhone's architecture.</li>
        <li><strong>Sign:</strong> <code>rcodesign</code> cryptographically signs your app bundle with your Apple Developer certificate — no Keychain required.</li>
        <li><strong>Deploy:</strong> <code>libimobiledevice</code> and <code>usbmuxd</code> push the signed <code>.ipa</code> to your physical device over USB.</li>
    </ul>
</section>

<section id="quickstart">
    <h1>🚀 Quick Start</h1>
    <p class="subtitle">From a fresh Linux machine to running app on iPhone in minutes.</p>
    <ol>
        <li><strong>Run the One-Click Setup Engine</strong> — open the Command Palette (<code>Ctrl+Shift+P</code>), search for <code>LibreSwift: One-Click Automated Setup Engine</code> and run it. This will install all Linux dependencies automatically.</li>
        <li><strong>Get a Xcode .xip file</strong> — download Xcode from <a href="https://developer.apple.com/download/more/" style="color:var(--vscode-textLink-foreground)">developer.apple.com</a>. You need an Apple ID (free).</li>
        <li><strong>Extract the SDK</strong> — run <code>LibreSwift: Setup iOS Environment (Extract SDK)</code> and point it to your <code>.xip</code> file.</li>
        <li><strong>Set your certificate</strong> — in extension settings, set <code>libreswift.p12Path</code> and run <code>LibreSwift: Set P12 Password</code>.</li>
        <li><strong>Connect your iPhone</strong> — plug in via USB, trust the computer on your device, and click <code>Refresh Devices</code> in the sidebar.</li>
        <li><strong>Deploy!</strong> — open a Swift project and click the <code>▶ Run on iOS</code> button in the status bar.</li>
    </ol>
    <div class="callout warn"><strong>Note:</strong> libimobiledevice requires your device to be in "trusted" state. If it shows "Not Trusted", unlock your iPhone and tap Trust when prompted.</div>
</section>

<section id="oneclicksetup">
    <h1>⚙️ One-Click Setup Engine</h1>
    <p class="subtitle">Automatic installation of all LibreSwift dependencies.</p>
    <p>The setup engine detects your Linux distribution and installs all required system packages using your package manager. Run it via:</p>
    <pre><code>Ctrl+Shift+P → LibreSwift: One-Click Automated Setup Engine</code></pre>
    <h2>What it installs</h2>
    <ul>
        <li><code>usbmuxd</code> — USB daemon for iPhone communication</li>
        <li><code>libimobiledevice-utils</code> — command line tools for iOS interaction</li>
        <li><code>xar</code>, <code>cpio</code>, <code>curl</code> — archive and download utilities</li>
        <li><code>xtool</code> — cross-compiler for Swift (downloaded from GitHub Releases)</li>
        <li><code>rcodesign</code> — code signing tool (downloaded from GitHub Releases)</li>
    </ul>
    <div class="callout">The setup engine requires <code>sudo</code> for APT package installation. The terminal will prompt you for your password.</div>
</section>

<section id="sdk">
    <h1>📦 SDK Extraction</h1>
    <p class="subtitle">Extracting the iPhoneOS.sdk from an official Xcode archive.</p>
    <p>LibreSwift needs the <code>iPhoneOS.sdk</code> from Xcode to compile Swift code for iOS. The SDK is extracted automatically from an official Xcode <code>.xip</code> file.</p>
    <h2>Steps</h2>
    <ol>
        <li>Download Xcode from <a href="https://developer.apple.com/download/more/" style="color:var(--vscode-textLink-foreground)">developer.apple.com/download/more</a> (requires a free Apple ID).</li>
        <li>Run <code>LibreSwift: Setup iOS Environment (Extract SDK)</code> from the Command Palette.</li>
        <li>Select your downloaded <code>Xcode_xx.x.xip</code> file when prompted.</li>
        <li>Wait for extraction to complete (this can take several minutes).</li>
    </ol>
    <h2>Extraction internals</h2>
    <pre><code>xar -xf Xcode.xip -C /tmp/xcode_unpack
pbzx -d /tmp/xcode_unpack/Content | cpio -idmv -D ~/.local/share/ios-linux-sdk/</code></pre>
    <p>The SDK will be installed to <code>~/.local/share/ios-linux-sdk/iPhoneOS.sdk</code> by default. You can override this path in settings.</p>
</section>

<section id="signing">
    <h1>🔐 Code Signing</h1>
    <p class="subtitle">Signing your app with an Apple Developer certificate.</p>
    <h2>Requirements</h2>
    <ul>
        <li>An Apple Developer account (free tier works for personal devices)</li>
        <li>A <code>.p12</code> certificate exported from Xcode or Keychain Access</li>
        <li>A <code>.mobileprovision</code> provisioning profile from developer.apple.com</li>
    </ul>
    <h2>Configuration</h2>
    <ol>
        <li>Set <code>libreswift.p12Path</code> to the absolute path of your <code>.p12</code> file.</li>
        <li>Set <code>libreswift.mobileprovisionPath</code> to your <code>.mobileprovision</code> file.</li>
        <li>Run <code>LibreSwift: Set P12 Password</code> to store your certificate password securely (never stored in plain text).</li>
    </ol>
    <div class="callout">Passwords are stored using VS Code's built-in <code>SecretStorage</code> API, which uses the OS keychain (libsecret on Linux).</div>
</section>

<section id="devices">
    <h1>📱 Device Connection</h1>
    <p class="subtitle">Connecting your iPhone for deployment.</p>
    <h2>USB Connection</h2>
    <ol>
        <li>Connect your iPhone via USB.</li>
        <li>Unlock your device and tap <strong>Trust</strong> when prompted.</li>
        <li>Ensure <code>usbmuxd</code> service is running: <pre><code>sudo systemctl start usbmuxd</code></pre></li>
        <li>Click <strong>Refresh Devices</strong> in the LibreSwift sidebar.</li>
    </ol>
    <div class="callout warn">If your device shows as untrusted or not visible, try running <code>idevice_id -l</code> in a terminal to verify it is detected by libimobiledevice.</div>
</section>

<section id="wsl">
    <h1>🪟 WSL Setup</h1>
    <p class="subtitle">Using LibreSwift under Windows Subsystem for Linux 2.</p>
    <p>WSL2 does not pass through USB devices by default. You need to use <code>usbipd-win</code> to forward your iPhone's USB connection to the Linux subsystem.</p>
    <h2>Steps</h2>
    <ol>
        <li>Install <a href="https://github.com/dorssel/usbipd-win" style="color:var(--vscode-textLink-foreground)">usbipd-win</a> on Windows.</li>
        <li>Open <strong>PowerShell as Administrator</strong> and list devices:<pre><code>usbipd list</code></pre></li>
        <li>Bind your iPhone (find its busid in the list):<pre><code>usbipd bind --busid &lt;busid&gt;</code></pre></li>
        <li>Attach to WSL:<pre><code>usbipd attach --wsl --busid &lt;busid&gt;</code></pre></li>
        <li>In your WSL terminal, verify: <code>idevice_id -l</code></li>
    </ol>
    <div class="callout">You may need to repeat the <code>attach</code> step every time you unplug and replug your device.</div>
</section>

<section id="intellisense">
    <h1>✨ Swift IntelliSense</h1>
    <p class="subtitle">Native Swift autocompletion configured for iOS cross-compilation.</p>
    <p>LibreSwift automatically configures <code>sourcekit-lsp</code> for iOS development by writing a <code>.sourcekit-lsp/config.json</code> file at your workspace root on activation:</p>
    <pre><code>{
  "swiftPM": {
    "swiftCompilerFlags": [
      "-sdk", "~/.local/share/ios-linux-sdk/iPhoneOS.sdk",
      "-target", "arm64-apple-ios17.0"
    ]
  }
}</code></pre>
    <p>If IntelliSense is not working, try restarting the language server via <code>LibreSwift: Restart SourceKit-LSP</code> from the Command Palette.</p>
    <div class="callout warn"><strong>Prerequisite:</strong> <code>sourcekit-lsp</code> must be installed and on your <code>$PATH</code>. Install it via the Swift toolchain: <a href="https://swift.org/install" style="color:var(--vscode-textLink-foreground)">swift.org/install</a>.</div>
</section>

<section id="logs">
    <h1>📋 Device Logs</h1>
    <p class="subtitle">Streaming real-time logs from your iPhone.</p>
    <p>After a successful deployment, LibreSwift automatically starts streaming logs from your connected device using <code>idevicesyslog</code>. Logs are filtered to your app's bundle identifier and appear in the <strong>LibreSwift Device Logs</strong> output channel.</p>
    <p>To open the log channel manually, run <code>LibreSwift: Show Device Logs</code> from the Command Palette.</p>
</section>

<section id="troubleshooting">
    <h1>🔧 Troubleshooting</h1>
    <h2>SourceKit-LSP fails to start</h2>
    <p>Ensure <code>sourcekit-lsp</code> is installed and on your PATH: <code>which sourcekit-lsp</code>. Install the Swift toolchain from <a href="https://swift.org/install" style="color:var(--vscode-textLink-foreground)">swift.org/install</a>.</p>
    <h2>CLI tools missing warning on startup</h2>
    <p>Run the <strong>One-Click Automated Setup Engine</strong> to install all dependencies automatically.</p>
    <h2>No devices detected</h2>
    <ol>
        <li>Ensure <code>usbmuxd</code> is running: <code>sudo systemctl start usbmuxd</code></li>
        <li>Trust the computer on your iPhone.</li>
        <li>WSL users: run <code>usbipd attach --wsl --busid &lt;busid&gt;</code> in PowerShell.</li>
        <li>Run <code>idevice_id -l</code> in terminal to verify detection.</li>
    </ol>
    <h2>Code signing fails</h2>
    <p>Verify your <code>.p12</code> file path is correct and the password is set via <code>LibreSwift: Set P12 Password</code>. Ensure your provisioning profile matches the bundle identifier in settings.</p>
</section>

<section id="commands">
    <h1>⌨️ All Commands</h1>
    <p class="subtitle">All commands available in the Command Palette (<code>Ctrl+Shift+P</code>).</p>
    <table class="cmd-table">
        <tr><th>Command</th><th>Description</th></tr>
        <tr><td><code>LibreSwift: One-Click Automated Setup Engine</code></td><td>Installs all system dependencies</td></tr>
        <tr><td><code>LibreSwift: Setup iOS Environment (Extract SDK)</code></td><td>Extracts iPhoneOS.sdk from Xcode .xip</td></tr>
        <tr><td><code>LibreSwift: Run on Connected iOS Device</code></td><td>Build, sign, and deploy</td></tr>
        <tr><td><code>LibreSwift: Set P12 Password</code></td><td>Stores .p12 password securely</td></tr>
        <tr><td><code>LibreSwift: Refresh Devices</code></td><td>Re-scans for connected iOS devices</td></tr>
        <tr><td><code>LibreSwift: Restart SourceKit-LSP</code></td><td>Restarts the Swift language server</td></tr>
        <tr><td><code>LibreSwift: SourceKit-LSP Status</code></td><td>Shows LSP running state</td></tr>
        <tr><td><code>LibreSwift: Show Device Logs</code></td><td>Opens device log output channel</td></tr>
        <tr><td><code>LibreSwift: Provide Feedback / Rate</code></td><td>Opens in-app rating &amp; feedback</td></tr>
        <tr><td><code>LibreSwift: Help &amp; Manual</code></td><td>Opens this help panel</td></tr>
    </table>
</section>

<section id="settings">
    <h1>🔩 Settings Reference</h1>
    <table class="cmd-table">
        <tr><th>Setting</th><th>Default</th><th>Description</th></tr>
        <tr><td><code>libreswift.sdkPath</code></td><td><code>~/.local/share/ios-linux-sdk/iPhoneOS.sdk</code></td><td>Path to extracted iPhoneOS.sdk</td></tr>
        <tr><td><code>libreswift.p12Path</code></td><td><em>empty</em></td><td>Path to your .p12 developer certificate</td></tr>
        <tr><td><code>libreswift.mobileprovisionPath</code></td><td><em>empty</em></td><td>Path to your .mobileprovision file</td></tr>
        <tr><td><code>libreswift.bundleIdentifier</code></td><td><code>com.example.App</code></td><td>Bundle ID of your iOS application</td></tr>
    </table>
</section>

</main>
<script>
    function show(el) {
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        document.querySelectorAll('section').forEach(s => s.classList.remove('visible'));
        const target = el.getAttribute('data-target');
        el.classList.add('active');
        document.getElementById(target).classList.add('visible');
    }
</script>
</body>
</html>`;
}
