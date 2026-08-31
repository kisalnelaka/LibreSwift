import * as vscode from 'vscode';

export const MARKETPLACE_REVIEW_URL = 'https://marketplace.visualstudio.com/items?itemName=KisalNelaka.libreswift&ssr=false#review-details';
export const GITHUB_REPO_URL = 'https://github.com/kisalnelaka/LibreSwift';

export class FeedbackPromptService {
    private static readonly KEY_SUCCESS_COUNT = 'libreswift.successOperationCount';
    private static readonly KEY_PROMPT_DISMISSED = 'libreswift.ratingPromptDismissed';
    private static readonly KEY_HAS_RATED = 'libreswift.hasRated';

    /**
     * Track a high-value user success (e.g. successful deploy, test build, debug session)
     * and trigger a direct high-converting marketplace review prompt.
     */
    public static async trackSuccessfulOperation(context: vscode.ExtensionContext, _reason: string): Promise<void> {
        const hasRated = context.globalState.get<boolean>(this.KEY_HAS_RATED, false);
        const isDismissed = context.globalState.get<boolean>(this.KEY_PROMPT_DISMISSED, false);

        if (hasRated || isDismissed) {
            return;
        }

        const count = (context.globalState.get<number>(this.KEY_SUCCESS_COUNT, 0)) + 1;
        await context.globalState.update(this.KEY_SUCCESS_COUNT, count);

        // Prompt on the 1st successful operation and every 3rd success milestone
        if (count === 1 || count % 3 === 0) {
            setTimeout(async () => {
                const selection = await vscode.window.showInformationMessage(
                    'Enjoying LibreSwift? If it saved you time, please consider rating us on the VS Code Marketplace! ⭐',
                    '⭐ Rate on Marketplace',
                    '💬 Give Feedback',
                    'Don\'t Ask Again'
                );

                if (selection === '⭐ Rate on Marketplace') {
                    await context.globalState.update(this.KEY_HAS_RATED, true);
                    this.openMarketplaceReview();
                } else if (selection === '💬 Give Feedback') {
                    vscode.commands.executeCommand('libreswift.showFeedback');
                } else if (selection === 'Don\'t Ask Again') {
                    await context.globalState.update(this.KEY_PROMPT_DISMISSED, true);
                }
            }, 1000);
        }
    }

    public static openMarketplaceReview(): void {
        vscode.env.openExternal(vscode.Uri.parse(MARKETPLACE_REVIEW_URL));
    }

    public static openGitHub(): void {
        vscode.env.openExternal(vscode.Uri.parse(GITHUB_REPO_URL));
    }
}
