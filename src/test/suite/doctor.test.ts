import * as assert from 'assert';
import { runDoctorDiagnostics } from '../../services/doctor';

export async function testDoctorDiagnostics() {
    console.log('  Testing Doctor Diagnostics Engine...');
    const report = await runDoctorDiagnostics();

    assert.ok(report, 'Doctor report should be defined');
    assert.ok(report.timestamp, 'Report should have a timestamp');
    assert.ok(Array.isArray(report.items), 'Report items should be an array');
    assert.ok(report.items.length >= 10, `Expected at least 10 diagnostic items, got ${report.items.length}`);

    // Check categories
    const categories = new Set(report.items.map(i => i.category));
    assert.ok(categories.has('Host & System'), 'Should contain Host & System category');
    assert.ok(categories.has('Toolchain & CLI'), 'Should contain Toolchain & CLI category');
    assert.ok(categories.has('SDK Environment'), 'Should contain SDK Environment category');
    assert.ok(categories.has('Device & Daemon'), 'Should contain Device & Daemon category');
    assert.ok(categories.has('Signing & Security'), 'Should contain Signing & Security category');

    // Summary checks
    assert.strictEqual(
        report.summary.pass + report.summary.warn + report.summary.fail,
        report.items.length,
        'Sum of summary counts must equal total items'
    );

    console.log(`    ✓ Passed: ${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail out of ${report.items.length} checks`);
}
