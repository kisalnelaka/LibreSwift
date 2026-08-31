# Contributing to LibreSwift

Thank you for your interest in contributing to **LibreSwift**! We aim to build a robust, production-ready toolchain for native iOS development on Linux.

---

## 🏛️ Branching Strategy & Source of Truth (SoT)

To preserve production stability across VS Code Marketplace and Open VSX releases, LibreSwift adheres to a strict branching model:

* **`master`** (Source of Truth):
  - Strictly production-grade code.
  - Every commit on `master` represents a verified, packaged, or tagged release.
  - Direct pushes to `master` are restricted.
* **`development`**:
  - Main active branch for integrating new features, fixes, and improvements.
  - All feature branches and pull requests must be based on and target `development`.
* **`feat/*` / `fix/*`**:
  - Ephemeral branches created from `development` for individual features, refactors, or bug fixes.

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Node.js**: v18.x or v20.x
- **npm**: v9+
- **VS Code**: v1.85.0+

### 2. Setup Repository
```bash
# Clone repository
git clone https://github.com/kisalnelaka/LibreSwift.git
cd LibreSwift

# Switch to development branch
git checkout development

# Install dependencies
npm install

# Build TypeScript
npm run compile
```

### 3. Running & Debugging the Extension
1. Open the repository in VS Code.
2. Press `F5` (or run `Launch Extension` from the Run & Debug pane).
3. A new **Extension Development Host** window will open with LibreSwift loaded.

---

## 🧪 Testing Guidelines

Before committing or submitting a PR, verify that all test suites pass:

```bash
# Compile and run test suite
npm run compile && node ./out/test/runTest.js
```

### Test Suites Included:
- **Doctor Diagnostics Engine**: Validates 5-layer health check checks and fixes.
- **SourceKit-LSP Configuration**: Validates `.sourcekit-lsp/config.json` generation and target triples.
- **LLDB Debug Provider**: Verifies debugger configuration and architecture resolution.
- **Dependency Checker**: Tests system CLI detection and path resolution.
- **Feedback & Review Service**: Verifies marketplace URLs and prompt state tracking.

---

## 📝 Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description |
|---|---|
| `feat:` | A new feature or capability |
| `fix:` | A bug fix or patch |
| `refactor:` | Code changes that neither fix a bug nor add a feature |
| `docs:` | Documentation changes only |
| `test:` | Adding or updating tests |
| `chore:` | Build tasks, package updates, or configuration |

---

## 📬 Submitting a Pull Request

1. Ensure your branch is rebased on latest `development`.
2. Ensure `npm run compile && node ./out/test/runTest.js` passes with zero errors.
3. Open a PR against `development` with a clear description of:
   - What problem was solved or feature added.
   - Any manual testing performed with physical iOS devices or WSL environments.
