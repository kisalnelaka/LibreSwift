import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { updateLspConfig } from '../../lsp/lspConfig';

export async function testLspConfig() {
    console.log('  Testing SourceKit-LSP Configuration Generator...');
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'libreswift-lsp-test-'));

    try {
        await updateLspConfig(tmpDir);

        const configPath = path.join(tmpDir, '.sourcekit-lsp', 'config.json');
        const exists = await fs.stat(configPath).then(s => s.isFile()).catch(() => false);
        assert.ok(exists, 'LSP config.json file should be generated');

        const raw = await fs.readFile(configPath, 'utf8');
        const parsed = JSON.parse(raw);

        assert.ok(parsed.swiftPM, 'swiftPM configuration block must exist');
        assert.ok(Array.isArray(parsed.swiftPM.swiftCompilerFlags), 'swiftCompilerFlags must be an array');
        assert.ok(parsed.swiftPM.swiftCompilerFlags.includes('-sdk'), 'Flags must contain -sdk');
        assert.ok(parsed.swiftPM.swiftCompilerFlags.includes('-target'), 'Flags must contain -target');

        const targetIndex = parsed.swiftPM.swiftCompilerFlags.indexOf('-target');
        const targetValue = parsed.swiftPM.swiftCompilerFlags[targetIndex + 1];
        assert.ok(targetValue.startsWith('arm64-apple-ios'), `Target flag should start with arm64-apple-ios, got ${targetValue}`);

        console.log(`    ✓ Passed: LSP config generated with target ${targetValue}`);
    } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
    }
}
