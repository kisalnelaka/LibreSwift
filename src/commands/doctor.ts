import * as vscode from 'vscode';
import { showDoctorWebview } from '../webviews/doctorWebview';

export async function runDoctorCommand(context: vscode.ExtensionContext) {
    await showDoctorWebview(context);
}
