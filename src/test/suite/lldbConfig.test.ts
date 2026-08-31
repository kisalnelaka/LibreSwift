import * as assert from 'assert';
import { IOSDebugConfigurationProvider } from '../../debug/lldbConfigProvider';

export async function testLldbConfigProvider() {
    console.log('  Testing LLDB Debug Configuration Provider...');
    const provider = new IOSDebugConfigurationProvider();

    const initialConfigs = provider.provideDebugConfigurations();
    assert.ok(Array.isArray(initialConfigs), 'Initial configs must be an array');
    assert.strictEqual(initialConfigs.length, 1);
    assert.strictEqual(initialConfigs[0].type, 'libreswift-lldb');
    assert.strictEqual(initialConfigs[0].request, 'launch');

    // Test resolution of empty config
    const resolved = await provider.resolveDebugConfiguration(undefined, {
        type: 'libreswift-lldb',
        name: 'Debug on iOS Device',
        request: 'launch'
    });

    assert.ok(resolved, 'Resolved configuration should be returned');
    assert.strictEqual(resolved!.type, 'libreswift-lldb');
    assert.strictEqual(resolved!.targetArchitecture, 'arm64');
    assert.ok(resolved!.sdkPath, 'SDK path should be populated');
    assert.ok(Array.isArray(resolved!.initCommands), 'Init commands should be populated');
    assert.ok(resolved!.initCommands.some((c: string) => c.includes('remote-ios')), 'Should select remote-ios platform');

    console.log('    ✓ Passed: LLDB configuration provider resolved target architecture and platform commands');
}
