import * as vscode from 'vscode';

export function showFeedbackWebview(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'libreswiftFeedback',
        'Rate LibreSwift',
        vscode.ViewColumn.One,
        {
            enableScripts: true
        }
    );

    panel.webview.html = getWebviewContent();

    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'submitFeedback':
                    // In a real app, send this to an API or GitHub
                    console.log(`Received Feedback: Rating ${message.rating}, Text: ${message.text}`);
                    vscode.window.showInformationMessage('Thank you for your feedback! It has been submitted.');
                    panel.dispose();
                    return;
                case 'openMarketplace':
                    vscode.env.openExternal(vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=libreswift.libreswift'));
                    panel.dispose();
                    return;
            }
        },
        undefined,
        context.subscriptions
    );
}

function getWebviewContent() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rate LibreSwift</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            text-align: center;
        }
        h1 { margin-bottom: 0.5rem; }
        p { opacity: 0.8; margin-bottom: 2rem; max-width: 400px; }
        .stars {
            display: flex;
            gap: 10px;
            font-size: 2rem;
            cursor: pointer;
            margin-bottom: 2rem;
        }
        .star {
            color: var(--vscode-editorGhostText-foreground);
            transition: color 0.2s ease;
        }
        .star:hover, .star.active {
            color: #e3a826;
        }
        #feedback-area, #marketplace-area {
            display: none;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 400px;
        }
        textarea {
            width: 100%;
            height: 100px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 10px;
            font-family: var(--vscode-font-family);
            resize: none;
            margin-bottom: 1rem;
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 1rem;
            border-radius: 2px;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <h1>Enjoying LibreSwift?</h1>
    <p>Your feedback helps us build the ultimate Linux iOS development experience.</p>
    
    <div class="stars" id="star-container">
        <span class="star" data-val="1">★</span>
        <span class="star" data-val="2">★</span>
        <span class="star" data-val="3">★</span>
        <span class="star" data-val="4">★</span>
        <span class="star" data-val="5">★</span>
    </div>

    <div id="feedback-area">
        <textarea id="feedback-text" placeholder="What can we improve?"></textarea>
        <button id="submit-btn">Submit Feedback</button>
    </div>

    <div id="marketplace-area">
        <p>Awesome! Would you mind leaving us a quick review on the VS Code Marketplace?</p>
        <button id="market-btn">Rate on Marketplace</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const stars = document.querySelectorAll('.star');
        const feedbackArea = document.getElementById('feedback-area');
        const marketplaceArea = document.getElementById('marketplace-area');
        let currentRating = 0;

        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                currentRating = parseInt(e.target.dataset.val);
                
                // Update visuals
                stars.forEach(s => {
                    if (parseInt(s.dataset.val) <= currentRating) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });

                // Show appropriate area
                if (currentRating === 5) {
                    feedbackArea.style.display = 'none';
                    marketplaceArea.style.display = 'flex';
                } else {
                    marketplaceArea.style.display = 'none';
                    feedbackArea.style.display = 'flex';
                }
            });
        });

        document.getElementById('submit-btn').addEventListener('click', () => {
            const text = document.getElementById('feedback-text').value;
            vscode.postMessage({
                command: 'submitFeedback',
                rating: currentRating,
                text: text
            });
        });

        document.getElementById('market-btn').addEventListener('click', () => {
            vscode.postMessage({
                command: 'openMarketplace'
            });
        });
    </script>
</body>
</html>
    `;
}
