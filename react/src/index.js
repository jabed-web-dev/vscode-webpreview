import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);


// Handle the message inside the webview
(function () {
	const vscode = window.acquireVsCodeApi();
	window.addEventListener('message', (event) => {
		const { preview } = event.data;
		if (preview) {
			if (preview.url) {
				vscode.setState({ previewUrl: preview.url })
			}
			if (preview.back) {
				window.history.back()
			}
			if (preview.forward) {
				window.history.forward()
			}
		}
	})
})();