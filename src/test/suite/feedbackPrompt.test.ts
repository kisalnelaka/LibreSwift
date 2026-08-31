import * as assert from 'assert';
import { FeedbackPromptService, MARKETPLACE_REVIEW_URL, GITHUB_REPO_URL } from '../../services/feedbackPrompt';

export async function testFeedbackPromptService() {
    console.log('  Testing Feedback Prompt Service & URLs...');

    assert.ok(MARKETPLACE_REVIEW_URL.includes('KisalNelaka.libreswift'), 'Marketplace URL must have correct publisher ID');
    assert.ok(MARKETPLACE_REVIEW_URL.includes('#review-details'), 'Marketplace URL must target review section');
    assert.strictEqual(GITHUB_REPO_URL, 'https://github.com/kisalnelaka/LibreSwift');

    const stateMap = new Map<string, any>();
    const mockContext: any = {
        globalState: {
            get: (key: string, defaultVal?: any) => stateMap.has(key) ? stateMap.get(key) : defaultVal,
            update: async (key: string, val: any) => { stateMap.set(key, val); }
        }
    };

    // Track initial operation
    await FeedbackPromptService.trackSuccessfulOperation(mockContext, 'deploy');
    assert.strictEqual(stateMap.get('libreswift.successOperationCount'), 1, 'Should record first successful operation');

    console.log('    ✓ Passed: Feedback Prompt correctly formats review URLs and tracks success state');
}
