# Changelog

All notable changes to the **LibreSwift** extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.8.0] - 2026-09-03

### Added
- **iOS Project Scaffolding Wizard (`libreswift.createProject`)**:
  - Interactive template generator supporting **SwiftUI iOS App**, **UIKit iOS App**, and **Swift CLI Tool**.
  - Generates cross-compilation ready `Package.swift`, `Info.plist`, `.sourcekit-lsp/config.json`, and `.vscode/tasks.json` & `launch.json`.
- **Free Apple ID Automated Self-Signing (`libreswift.configureAppleId`)**:
  - Zero-Mac requirement: Automates 7-day development certificate and `.mobileprovision` generation using a standard free Apple ID.
  - Generates local 2048-bit RSA keypairs and integrates seamlessly with `rcodesign`.
  - Added 1-click certificate renewal command (`libreswift.renewCertificate`).
  - Secure credential storage in OS Keychain via VS Code `SecretStorage`.
- **Sidebar Scaffolding & Provisioning Integration**:
  - Added **Project & Scaffolding** category to the sidebar tree view.
  - Added real-time certificate validity countdown and active signing mode indicator in **Signing & Credentials**.
- **Enhanced Doctor Diagnostics**:
  - Validates Free Apple ID certificate state, days remaining, and provides 1-click renewal remediation.
- **Automated Test Coverage**:
  - Added unit test suites for `ProjectScaffolder` and `AppleIdSigner` (total 7 passing test suites).

---

## [1.7.2] - 2026-09-01

### Fixed
- **Marketplace Review Link**: Corrected extension publisher ID in rating webview and routed directly to the review tab (`#review-details`).
- **Feedback Loop**: Integrated direct GitHub Issue template generation when submitting constructive feedback or bug reports.

### Added
- **Direct Review Prompts**: Streamlined non-intrusive feedback prompts upon successful device deployments and interactive debug sessions.
- **Support & Community Sidebar**: Added quick-access items for rating on the VS Code Marketplace, submitting feedback, accessing the in-app manual, and starring the repository on GitHub.
- **Community Standards**: Added `CONTRIBUTING.md`, GitHub issue templates (`bug_report.md`, `feature_request.md`), and branching model documentation.

---

## [1.7.0] - 2026-08-31

### Added
- **LibreSwift Doctor Diagnostics**: Automated 5-layer system health check and interactive webview.
- **LLDB Remote Debugging**: Remote debugging bridge with architecture and target resolution.
- **Dynamic Target Triple & Configuration**: Support for custom deployment targets and Release vs. Debug profiles.
- **Headless Test Runner**: Custom automated test runner with mock VS Code environment.

---

## [1.6.0] - 2026-08-22

### Added
- Automated `.xip` Xcode SDK extraction engine.
- Real-time `idevicesyslog` device log streaming.
- SourceKit-LSP dynamic target configuration.
