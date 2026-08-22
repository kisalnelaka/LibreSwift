import * as vscode from 'vscode';

export async function bootstrapEnvironment(context: vscode.ExtensionContext) {
    const confirmation = await vscode.window.showInformationMessage(
        'This will automatically install system dependencies (usbmuxd, libimobiledevice-utils) and download the LibreSwift toolchain (xtool, rcodesign). Proceed?',
        'Yes, install',
        'Cancel'
    );

    if (confirmation !== 'Yes, install') {
        return;
    }

    const terminal = vscode.window.createTerminal('LibreSwift Setup Engine');
    terminal.show();

    const isWindows = process.platform === 'win32';

    if (isWindows) {
        // Running on Windows (not WSL) — guide the user to run inside WSL
        terminal.sendText('echo "LibreSwift targets Linux. Please run this extension from inside WSL2."');
        terminal.sendText('echo "Open WSL: wsl ~ then reopen this project inside WSL."');
        vscode.window.showWarningMessage(
            'LibreSwift is designed for Linux. Please reopen VS Code inside WSL2 to use the Setup Engine.',
            'Learn More'
        ).then(s => {
            if (s === 'Learn More') {
                vscode.commands.executeCommand('libreswift.showHelp');
            }
        });
        return;
    }

    // --- Linux / WSL path ---

    // Step 1: APT dependencies (each command separate to avoid && in PowerShell)
    terminal.sendText('echo "=== LibreSwift Setup Engine ==="');
    terminal.sendText('echo ""');
    terminal.sendText('echo "[Step 1/3] Installing system dependencies..."');
    terminal.sendText('bash -c "sudo apt-get update -qq && sudo apt-get install -y usbmuxd libimobiledevice-utils xar cpio curl wget unzip" || echo "APT install failed — try running manually."');

    // Step 2: Create local bin dir and download toolchains
    terminal.sendText('echo ""');
    terminal.sendText('echo "[Step 2/3] Setting up toolchain directory..."');
    terminal.sendText('mkdir -p ~/.local/bin');

    // xtool — replace URL with the actual GitHub release asset when available
    terminal.sendText('echo "Downloading xtool..."');
    terminal.sendText('bash -c \'curl -fsSL https://github.com/kabiroberai/xtool/releases/latest/download/xtool-linux.tar.gz | tar -xz -C ~/.local/bin/ 2>/dev/null || echo "xtool download failed — install manually from https://github.com/kabiroberai/xtool"\'');

    // rcodesign — replace URL with the actual GitHub release asset when available
    terminal.sendText('echo "Downloading rcodesign..."');
    terminal.sendText('bash -c \'curl -fsSL https://github.com/indygreg/apple-platform-rs/releases/latest/download/rcodesign-linux-x86_64.tar.gz | tar -xz -C ~/.local/bin/ 2>/dev/null || echo "rcodesign download failed — install manually from https://github.com/indygreg/apple-platform-rs"\'');

    // Ensure ~/.local/bin is on PATH for this session
    terminal.sendText('export PATH="$HOME/.local/bin:$PATH"');

    // Step 3: Done
    terminal.sendText('echo ""');
    terminal.sendText('echo "[Step 3/3] Verifying installation..."');
    terminal.sendText('bash -c \'which usbmuxd && echo "✓ usbmuxd" || echo "✗ usbmuxd not found"\'');
    terminal.sendText('bash -c \'which idevice_id && echo "✓ libimobiledevice" || echo "✗ libimobiledevice not found"\'');
    terminal.sendText('bash -c \'which xtool && echo "✓ xtool" || echo "✗ xtool not found"\'');
    terminal.sendText('bash -c \'which rcodesign && echo "✓ rcodesign" || echo "✗ rcodesign not found"\'');
    terminal.sendText('echo ""');
    terminal.sendText('echo "=== Setup complete! Return to VS Code and run the SDK extraction step. ==="');

    vscode.window.showInformationMessage(
        'LibreSwift Setup Engine running in terminal. Follow the prompts.',
        'Open Help'
    ).then(s => {
        if (s === 'Open Help') { vscode.commands.executeCommand('libreswift.showHelp'); }
    });
}
