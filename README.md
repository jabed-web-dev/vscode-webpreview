# VScode Web Preview
⚠️ WARNING: This extension is still under development! ⚠️

An extension for you to preview your web projects on!

This is not a live-server it's live-preview. You can use any local server like http://localhost:3000. You can change url.


## Keyboard Shortcuts

`ctrl+shift+p` command **Open Web Preview** and **Web Preview Url**

`ctrl+alt+p` **Open Web Preview** and `ctrl+alt+u` open **Web Preview Url** input box. Open **Web Preview URL** when web preview is active.

### Live preview in vscode

<video src="https://raw.githubusercontent.com/jabed-dev/vscode-webpreview/main/demo.mp4" autoplay loop controls muted title="Live web preview in vscode"></video>

<br>

Set default screen size and url in settings.json (example)
```json
    "webPreview.url": "http://localhost:3000",
    "webPreview.mediaScreenOverride": true, // Override default screen object
    "webPreview.mediaScreen": {
        "Mobile": "380x796", // width and height
        "Tablet": 768,       // width
        "Laptop": 1024,      // width
    }
```

<br>

Creator: **Jabed Hossain**\
https://github.com/jabed-dev

![creator](https://avatars.githubusercontent.com/u/59810760?s=180&v=4)