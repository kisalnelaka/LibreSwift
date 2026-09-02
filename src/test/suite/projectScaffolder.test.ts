import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ProjectScaffolder } from '../../services/projectScaffolder';

export async function testProjectScaffolder() {
    console.log('  Testing iOS Project Scaffolder...');

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'libreswift-scaffold-test-'));

    try {
        // 1. Test SwiftUI Project Generation
        const swiftuiProject = await ProjectScaffolder.scaffoldProject({
            projectName: 'TestSwiftUIApp',
            bundleId: 'com.example.TestSwiftUIApp',
            template: 'swiftui',
            minIOSVersion: '17.0',
            destinationDirectory: tempDir
        });

        assert.ok(fs.existsSync(swiftuiProject), 'Project directory must be created');
        assert.ok(fs.existsSync(path.join(swiftuiProject, 'Package.swift')), 'Package.swift must exist');
        assert.ok(fs.existsSync(path.join(swiftuiProject, 'Sources', 'TestSwiftUIApp', 'App.swift')), 'App.swift must exist');
        assert.ok(fs.existsSync(path.join(swiftuiProject, 'Sources', 'TestSwiftUIApp', 'ContentView.swift')), 'ContentView.swift must exist');
        assert.ok(fs.existsSync(path.join(swiftuiProject, 'Resources', 'Info.plist')), 'Info.plist must exist');
        assert.ok(fs.existsSync(path.join(swiftuiProject, '.sourcekit-lsp', 'config.json')), 'LSP config must exist');
        assert.ok(fs.existsSync(path.join(swiftuiProject, '.vscode', 'tasks.json')), 'tasks.json must exist');
        assert.ok(fs.existsSync(path.join(swiftuiProject, '.vscode', 'launch.json')), 'launch.json must exist');

        const packageContent = fs.readFileSync(path.join(swiftuiProject, 'Package.swift'), 'utf8');
        assert.ok(packageContent.includes('TestSwiftUIApp'), 'Package.swift must include target name');
        assert.ok(packageContent.includes('arm64-apple-ios17.0'), 'Package.swift must configure compiler target triple');

        const appContent = fs.readFileSync(path.join(swiftuiProject, 'Sources', 'TestSwiftUIApp', 'App.swift'), 'utf8');
        assert.ok(appContent.includes('@main'), 'SwiftUI App must declare @main');
        assert.ok(appContent.includes('struct TestSwiftUIAppApp: App'), 'SwiftUI App structure should match');

        // 2. Test UIKit Project Generation
        const uikitProject = await ProjectScaffolder.scaffoldProject({
            projectName: 'TestUIKitApp',
            bundleId: 'com.example.TestUIKitApp',
            template: 'uikit',
            destinationDirectory: tempDir
        });

        assert.ok(fs.existsSync(path.join(uikitProject, 'Sources', 'TestUIKitApp', 'AppDelegate.swift')), 'AppDelegate.swift must exist');
        assert.ok(fs.existsSync(path.join(uikitProject, 'Sources', 'TestUIKitApp', 'ViewController.swift')), 'ViewController.swift must exist');

        // 3. Test CLI Tool Generation
        const cliProject = await ProjectScaffolder.scaffoldProject({
            projectName: 'TestCLIApp',
            bundleId: 'com.example.cli',
            template: 'cli',
            destinationDirectory: tempDir
        });

        assert.ok(fs.existsSync(path.join(cliProject, 'Sources', 'TestCLIApp', 'main.swift')), 'main.swift must exist');

        console.log('    ✓ Passed: Project Scaffolder successfully generated SwiftUI, UIKit, and CLI projects');
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}
