import { installVscodeMock } from './mockVscode';
installVscodeMock();

async function main() {
    console.log('====================================================');
    console.log('       LibreSwift Test Suite Runner                ');
    console.log('====================================================\n');

    // Dynamic imports after mock is registered
    const { testDoctorDiagnostics } = await import('./suite/doctor.test');
    const { testLspConfig } = await import('./suite/lspConfig.test');
    const { testLldbConfigProvider } = await import('./suite/lldbConfig.test');
    const { testDependencyChecker } = await import('./suite/dependencyChecker.test');

    let passed = 0;
    let failed = 0;

    const tests = [
        { name: 'Doctor Diagnostics Engine', fn: testDoctorDiagnostics },
        { name: 'SourceKit-LSP Configuration Generator', fn: testLspConfig },
        { name: 'LLDB Debug Configuration Provider', fn: testLldbConfigProvider },
        { name: 'Dependency Health Checker', fn: testDependencyChecker }
    ];

    for (const t of tests) {
        try {
            await t.fn();
            passed++;
        } catch (err: any) {
            console.error(`  ✗ FAILED: ${t.name}`);
            console.error(`    ${err.stack || err.message}\n`);
            failed++;
        }
    }

    console.log('\n====================================================');
    console.log(`Results: ${passed} passed, ${failed} failed (${tests.length} total)`);
    console.log('====================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

main().catch((err) => {
    console.error('Fatal error running tests:', err);
    process.exit(1);
});
