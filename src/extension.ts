import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const onOpen = vscode.commands.registerCommand('preview.open', () => {
		PreviewPanel.createOrShow(context.extensionUri);
	});
	const onUrl = vscode.commands.registerCommand('preview.url', async () => {
		if (PreviewPanel.currentPanel) {
			PreviewPanel.currentPanel.sendUrl();
		}
	});
	const onBack = vscode.commands.registerCommand('preview.back', () => {
		if (PreviewPanel.currentPanel) {
			PreviewPanel.currentPanel.sendPageBack();
		}
	});
	const onForward = vscode.commands.registerCommand('preview.forward', () => {
		if (PreviewPanel.currentPanel) {
			PreviewPanel.currentPanel.sendPageForward();
		}
	});
	const onRefresh = vscode.commands.registerCommand('preview.refresh', () => {
		if (PreviewPanel.currentPanel) {
			PreviewPanel.currentPanel.sendRefresh();
		}
	});
	const onResponsiveView = vscode.commands.registerCommand('preview.responsiveView', () => {
		if (PreviewPanel.currentPanel) {
			PreviewPanel.currentPanel.sendResponsiveView()
		}
	});
	const onScreenView = vscode.commands.registerCommand('preview.screenView', () => {
		if (PreviewPanel.currentPanel) {
			PreviewPanel.currentPanel.toggleScreenView()
		}
	});
	const onOpenDevTools = vscode.commands.registerCommand('preview.openDevTools', () => {
		if (PreviewPanel.currentPanel) {
			PreviewPanel.currentPanel.openDevTools()
		}
	});
	const onOpenInBrowser = vscode.commands.registerCommand('preview.openInBrowser', () => {
		if (PreviewPanel.currentPanel) {
			PreviewPanel.currentPanel.openInBrowser()
		}
	});

	context.subscriptions.push(onOpen, onUrl, onBack, onForward, onRefresh, onResponsiveView, onScreenView, onOpenDevTools, onOpenInBrowser);

	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(PreviewPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				// Reset the webview options so we use latest uri for `localResourceRoots`.
				webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
				PreviewPanel.revive(webviewPanel, context.extensionUri, state?.previewUrl);
			}
		});
	}
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,
		// And restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
	};
}

/**
 * Manages Preview webview panels
 */
class PreviewPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: PreviewPanel | undefined;
	public static readonly viewType = 'preview';
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];
	public _currentUrl: string | undefined;

	public static createOrShow(extensionUri: vscode.Uri) {
		// If we already have a panel, show it.
		if (PreviewPanel.currentPanel) {
			PreviewPanel.currentPanel._panel.reveal(PreviewPanel.currentPanel._panel.viewColumn);
			return;
		}
		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			PreviewPanel.viewType,
			'Preview',
			vscode.ViewColumn.Two,
			getWebviewOptions(extensionUri),
		);

		PreviewPanel.currentPanel = new PreviewPanel(panel, extensionUri);
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, oldUrl: string) {
		PreviewPanel.currentPanel = new PreviewPanel(panel, extensionUri);
		PreviewPanel.currentPanel._currentUrl = oldUrl;
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		vscode.commands.executeCommand('setContext', 'PreviewActive', true);
		this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
		panel.iconPath = {
			light: vscode.Uri.joinPath(extensionUri, 'media', 'icons', 'preview-light.svg'),
			dark: vscode.Uri.joinPath(extensionUri, 'media', 'icons', 'preview-dark.svg'),
		};
		// Set the webview's initial html content
		this._update();
		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(e => {
			if (this._panel.visible) {
				this._update();
			}
		},
			null,
			this._disposables
		);

		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('webPreview')) {
				this._currentUrl = undefined;
				this._update()
			}
		})

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(message => {
			if (message.command) {
				vscode.window.showInformationMessage(message.text);
				return;
			}
		},
			null,
			this._disposables
		);
	}

	public async sendUrl() {
		const url = await vscode.window.showInputBox({
			value: this._currentUrl,
			// @ts-ignore
			valueSelection: [this._currentUrl?.length, this._currentUrl?.length],
			placeHolder: 'http://localhost:3000'
		});
		if (!url) return;
		this._currentUrl = url;
		this._panel.webview.postMessage({ preview: { url } });
	}

	public sendPageBack() {
		this._panel.webview.postMessage({ preview: { back: true } });
	}

	public sendPageForward() {
		this._panel.webview.postMessage({ preview: { forward: true } });
	}

	public sendRefresh() {
		this._panel.webview.postMessage({ preview: { refresh: true } });
	}
	
	public sendResponsiveView() {
		this._panel.webview.postMessage({ preview: { responsive: true } });
	}
	
	public toggleScreenView() {
		// @ts-ignore
		if (this._panel.viewColumn > 1) {
			this._panel.reveal(vscode.ViewColumn.One);
		} else if (this._panel.viewColumn == 1) {
			this._panel.reveal(vscode.ViewColumn.Two);
		}
	}

	public openDevTools() {
		vscode.commands.executeCommand('workbench.action.webview.openDeveloperTools')
	}
	
	public openInBrowser() {
		const url = vscode.Uri.parse(`${this._currentUrl}`);
		vscode.env.openExternal(url);
	}

	public dispose() {
		PreviewPanel.currentPanel = undefined;
		vscode.commands.executeCommand('setContext', 'PreviewActive', false)
		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
		const config = vscode.workspace.getConfiguration('webPreview');
		const url = config.get('url', 'http://localhost:3000');
		if (!this._currentUrl) {
			this._currentUrl = url;
		}

		const mediaScreenOverride = config.get('mediaScreenOverride', false);
		let mediaScreen = config.get('mediaScreen', {});
		if (mediaScreenOverride) {
			const inspect = config.inspect('mediaScreen');
			// @ts-ignore
			mediaScreen = inspect.workspaceValue ? inspect.workspaceValue : inspect.globalValue ? inspect.globalValue : inspect.defaultValue
		}
		// Vary the webview's content based on where it is located in the editor.
		if (this._panel.viewColumn) {
			this._panel.webview.postMessage({ preview: { url: this._currentUrl, mediaScreen } });
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Local path to main script run in the webview
		const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js');
		// And the uri we use to load this script in the webview
		const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
		// Local path to css styles
		const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css');
		// Uri to load styles into webview
		const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);
		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta name="theme-color" content="#000000">
				<title>Preview</title>
				<link href="${stylesMainUri}" rel="stylesheet">
                <script defer="defer" nonce="${nonce}" src="${scriptUri}"></script>
			</head>
			<body class="w-full min-h-full flex text-white bg-gray-900 !p-0 overflow-hidden">
                <noscript>You need to enable JavaScript to run this app.</noscript>
                <div id="root" class="w-full flex flex-none flex-col"></div>
            </body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
