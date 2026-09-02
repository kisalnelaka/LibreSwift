import * as fs from 'fs';
import * as path from 'path';

export interface ProjectScaffoldOptions {
    projectName: string;
    bundleId: string;
    template: 'swiftui' | 'uikit' | 'cli';
    minIOSVersion?: string;
    targetTriple?: string;
    destinationDirectory: string;
}

export class ProjectScaffolder {
    /**
     * Scaffold a new iOS project tailored for Linux cross-compilation with LibreSwift
     */
    public static async scaffoldProject(options: ProjectScaffoldOptions): Promise<string> {
        const {
            projectName,
            bundleId,
            template,
            destinationDirectory
        } = options;

        const minIOSVersion = options.minIOSVersion || '17.0';
        const targetTriple = options.targetTriple || 'arm64-apple-ios';

        const projectRoot = path.join(destinationDirectory, projectName);

        if (fs.existsSync(projectRoot)) {
            throw new Error(`Directory "${projectRoot}" already exists. Please choose a different name or path.`);
        }

        const cleanName = projectName.replace(/[^a-zA-Z0-9_]/g, '');

        // 1. Create directory structure
        fs.mkdirSync(path.join(projectRoot, 'Sources', cleanName), { recursive: true });
        fs.mkdirSync(path.join(projectRoot, 'Resources'), { recursive: true });
        fs.mkdirSync(path.join(projectRoot, '.sourcekit-lsp'), { recursive: true });
        fs.mkdirSync(path.join(projectRoot, '.vscode'), { recursive: true });

        // 2. Package.swift
        const packageSwiftContent = this.getPackageSwift(cleanName, targetTriple, minIOSVersion);
        fs.writeFileSync(path.join(projectRoot, 'Package.swift'), packageSwiftContent, 'utf8');

        // 3. Source files based on template
        if (template === 'swiftui') {
            fs.writeFileSync(path.join(projectRoot, 'Sources', cleanName, 'App.swift'), this.getSwiftUIApp(cleanName), 'utf8');
            fs.writeFileSync(path.join(projectRoot, 'Sources', cleanName, 'ContentView.swift'), this.getSwiftUIContentView(), 'utf8');
        } else if (template === 'uikit') {
            fs.writeFileSync(path.join(projectRoot, 'Sources', cleanName, 'AppDelegate.swift'), this.getUIKitAppDelegate(cleanName), 'utf8');
            fs.writeFileSync(path.join(projectRoot, 'Sources', cleanName, 'ViewController.swift'), this.getUIKitViewController(), 'utf8');
        } else {
            fs.writeFileSync(path.join(projectRoot, 'Sources', cleanName, 'main.swift'), this.getCliMain(cleanName), 'utf8');
        }

        // 4. Resources/Info.plist
        const infoPlistContent = this.getInfoPlist(cleanName, bundleId);
        fs.writeFileSync(path.join(projectRoot, 'Resources', 'Info.plist'), infoPlistContent, 'utf8');

        // 5. .sourcekit-lsp/config.json
        const lspConfigContent = JSON.stringify({
            swiftCompilerFlags: [
                "-target",
                `${targetTriple}${minIOSVersion}`,
                "-sdk",
                "~/.local/share/ios-linux-sdk/iPhoneOS.sdk"
            ]
        }, null, 4);
        fs.writeFileSync(path.join(projectRoot, '.sourcekit-lsp', 'config.json'), lspConfigContent, 'utf8');

        // 6. .vscode/tasks.json
        const tasksJsonContent = JSON.stringify({
            version: "2.0.0",
            tasks: [
                {
                    type: "ios-build",
                    problemMatcher: ["$swiftc"],
                    group: {
                        kind: "build",
                        isDefault: true
                    },
                    label: "LibreSwift: Build iOS App"
                }
            ]
        }, null, 4);
        fs.writeFileSync(path.join(projectRoot, '.vscode', 'tasks.json'), tasksJsonContent, 'utf8');

        // 7. .vscode/launch.json
        const launchJsonContent = JSON.stringify({
            version: "0.2.0",
            configurations: [
                {
                    type: "libreswift-lldb",
                    request: "launch",
                    name: "Debug on iOS Device"
                }
            ]
        }, null, 4);
        fs.writeFileSync(path.join(projectRoot, '.vscode', 'launch.json'), launchJsonContent, 'utf8');

        // 8. .gitignore
        const gitignoreContent = `.build/
.swiftpm/
*.xcodeproj
.DS_Store
DerivedData/
`;
        fs.writeFileSync(path.join(projectRoot, '.gitignore'), gitignoreContent, 'utf8');

        return projectRoot;
    }

    private static getPackageSwift(name: string, targetTriple: string, minIOSVersion: string): string {
        return `// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "${name}",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .executable(name: "${name}", targets: ["${name}"])
    ],
    targets: [
        .executableTarget(
            name: "${name}",
            path: "Sources/${name}",
            swiftSettings: [
                .unsafeFlags(["-target", "${targetTriple}${minIOSVersion}"])
            ]
        )
    ]
)
`;
    }

    private static getSwiftUIApp(name: string): string {
        return `import SwiftUI

@main
struct ${name}App: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
`;
    }

    private static getSwiftUIContentView(): string {
        return `import SwiftUI

struct ContentView: View {
    @State private var tapCount = 0

    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "swift")
                .font(.system(size: 72))
                .foregroundColor(.orange)

            Text("LibreSwift iOS")
                .font(.largeTitle)
                .fontWeight(.bold)

            Text("Native Swift developed, cross-compiled, and deployed directly from Linux.")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)
                .padding(.horizontal)

            Button(action: { tapCount += 1 }) {
                Text("Tapped \\(tapCount) times")
                    .font(.headline)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
        }
        .padding()
    }
}
`;
    }

    private static getUIKitAppDelegate(name: string): string {
        return `import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        window = UIWindow(frame: UIScreen.main.bounds)
        window?.rootViewController = ViewController()
        window?.makeKeyAndVisible()
        return true
    }
}
`;
    }

    private static getUIKitViewController(): string {
        return `import UIKit

class ViewController: UIViewController {
    private var tapCount = 0
    private let label = UILabel()
    private let button = UIButton(type: .system)

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground

        label.text = "LibreSwift UIKit on Linux"
        label.font = .systemFont(ofSize: 22, weight: .bold)
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false

        button.setTitle("Tap Me", for: .normal)
        button.titleLabel?.font = .systemFont(ofSize: 18, weight: .semibold)
        button.addTarget(self, action: #selector(buttonTapped), for: .touchUpInside)
        button.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(label)
        view.addSubview(button)

        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -30),
            button.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            button.topAnchor.constraint(equalTo: label.bottomAnchor, constant: 20)
        ])
    }

    @objc private func buttonTapped() {
        tapCount += 1
        button.setTitle("Tapped \\(tapCount) times", for: .normal)
    }
}
`;
    }

    private static getCliMain(name: string): string {
        return `import Foundation

print("🚀 Hello from ${name} running on iOS via LibreSwift!")
print("Operating System Version: \\(ProcessInfo.processInfo.operatingSystemVersionString)")
`;
    }

    private static getInfoPlist(name: string, bundleId: string): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>${name}</string>
    <key>CFBundleIdentifier</key>
    <string>${bundleId}</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>${name}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>UILaunchScreen</key>
    <dict/>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>arm64</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
</dict>
</plist>
`;
    }
}
