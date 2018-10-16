let clipperPort: chrome.runtime.Port

const windowParams: chrome.app.CreateWindowOptions = {
  id: "main",
  frame: "chrome",
  state: "fullscreen",
  resizable: true,
  outerBounds: {
    // Half-screen default for development
    // Press "square" key (F3) to toggle
    top: 0,
    left: 0,
    width: screen.width / 2,
    height: screen.height,
  },
}

function showMainWindow(cb: ((window: chrome.app.AppWindow) => void)) {
  chrome.app.window.create("index.html", windowParams, cb)
}

function maybeFullscreen(win: chrome.app.AppWindow) {
  chrome.storage.local.get(["disableFullscreen"], result => {
    if (!result.disableFullscreen) {
      win.fullscreen()
    }
  })
}

chrome.app.runtime.onLaunched.addListener(() =>
  showMainWindow((win: chrome.app.AppWindow) => {
    maybeFullscreen(win)
    win.show(true) // Passing focused: true
  }),
)

// Receive messages from the Clipper chrome extension to import content
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    console.log("Received message from external extension", request, sender)

    showMainWindow((win: chrome.app.AppWindow) => {
      //maybeFullscreen(win)
      window.addEventListener("message", event => {
        ;(event.source as Window).postMessage(
          { type: "Clipper", ...request },
          "*",
        )
        sendResponse({ contentReceived: "success" })
      })
    })
  },
)
