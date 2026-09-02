import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ProjectScaffolder } from '../services/projectScaffolder';

export async function createNewProjectCommand(context: vscode.ExtensionContext): Promise<string | undefined> {
    // 1. Pick Template
    const templateChoice = await vscode.window.showQuickPick([
        {
            label: '$(device-mobile) SwiftUI iOS App',
            description: 'Modern declarative SwiftUI iOS app (Recommended)',
            detail: 'Generates @main App.swift, ContentView.swift, and Package.swift with dynamic flags',
            value: 'swiftui' as const
        },
        {
            label: '$(layout) UIKit iOS App',
            description: 'Programmatic UIKit application',
            detail: 'Generates AppDelegate.swift, ViewController.swift with AutoLayout, and Package.swift',
            value: 'uikit' as const
        },
        {
            label: '$(terminal) Swift CLI Tool',
            description: 'Native Darwin/iOS executable',
            detail: 'Generates main.swift executable targeting arm64-apple-ios',
            value: 'cli' as const
        }
    ], {
        placeHolder: 'Select project template for LibreSwift'
    });

    if (!templateChoice) {
        return undefined;
    }

    // 2. Project Name
    const projectName = await vscode.window.showInputBox({
        prompt: 'Enter project name',
        placeHolder: 'MyiOSApp',
        value: 'MyiOSApp',
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Project name cannot be empty';
            }
            if (!/^[a-zA-Z0-9_]+$/.test(value.trim())) {
                return 'Project name should only contain alphanumeric characters and underscores';
            }
            return null;
        }
    });

    if (!projectName) {
        return undefined;
    }

    const cleanProjectName = projectName.trim();

    // 3. Bundle Identifier
    const bundleId = await vscode.window.showInputBox({
        prompt: 'Enter Bundle Identifier',
        placeHolder: `com.example.${cleanProjectName.toLowerCase()}`,
        value: `com.example.${cleanProjectName.toLowerCase()}`,
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Bundle identifier cannot be empty';
            }
            if (!/^[a-zA-Z0-9.\-_]+$/.test(value.trim())) {
                return 'Invalid bundle identifier format';
            }
            return null;
        }
    });

    if (!bundleId) {
        return undefined;
    }

    // 4. Target iOS Version
    const versionChoice = await vscode.window.showQuickPick([
        { label: 'iOS 17.0 (Default)', description: 'Latest standard deployment target', value: '17.0' },
        { label: 'iOS 16.0', description: 'Broader compatibility', value: '16.0' },
        { label: 'iOS 15.0', description: 'Legacy compatibility', value: '15.0' }
    ], {
        placeHolder: 'Select Minimum iOS Deployment Version'
    });

    const minIOSVersion = versionChoice ? versionChoice.value : '17.0';

    // 5. Select Destination Folder
    let defaultUri: vscode.Uri | undefined;
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        defaultUri = vscode.workspace.workspaceFolders[0].uri;
    }

    const folderUri = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        defaultUri,
        openLabel: 'Select Project Directory'
    });

    if (!folderUri || folderUri.length === 0) {
        return undefined;
    }

    const destinationDirectory = folderUri[0].fsPath;

    // 6. Scaffold Project
    try {
        const projectPath = await ProjectScaffolder.scaffoldProject({
            projectName: cleanProjectName,
            bundleId: bundleId.trim(),
            template: templateChoice.value,
            minIOSVersion,
            destinationDirectory
        });

        const action = await vscode.window.showInformationMessage(
            `Successfully created LibreSwift project "${cleanProjectName}"!`,
            'Open in Current Window',
            'Open in New Window'
        );

        const projectUri = vscode.Uri.file(projectPath);

        if (action === 'Open in Current Window') {
            await vscode.commands.executeCommand('vscode.openFolder', projectUri, false);
        } else if (action === 'Open in New Window') {
            await vscode.commands.executeCommand('vscode.openFolder', projectUri, true);
        }

        return projectPath;
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to create project: ${error.message}`);
        return undefined;
    }
}
