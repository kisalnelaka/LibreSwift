"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IOSBuildTaskProvider = void 0;
const vscode = require("vscode");
class IOSBuildTaskProvider {
    provideTasks() {
        return this.getTasks();
    }
    resolveTask(_task) {
        const definition = _task.definition;
        if (definition) {
            return this.getTask(definition.target);
        }
        return undefined;
    }
    getTasks() {
        return [this.getTask('arm64-apple-ios')];
    }
    getTask(target) {
        const definition = {
            type: 'ios-build',
            target
        };
        const config = vscode.workspace.getConfiguration('libreswift');
        const sdkPath = config.get('sdkPath') || '';
        // In a real scenario, this would be `xtool build -target ${target} -sdk ${sdkPath}` 
        // followed by `rcodesign sign ...`
        const commandLine = `echo "Building for ${target} using SDK ${sdkPath}" && echo "Signing app..."`;
        const execution = new vscode.ShellExecution(commandLine);
        return new vscode.Task(definition, vscode.TaskScope.Workspace, 'build', 'libreswift', execution);
    }
}
exports.IOSBuildTaskProvider = IOSBuildTaskProvider;
//# sourceMappingURL=buildTaskProvider.js.map