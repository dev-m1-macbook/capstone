import StoreBackend from "../../data/StoreBackend"
import { Hypermerge } from "../../modules/hypermerge"
import CloudClient from "../../modules/discovery-cloud/Client"
import { setupControlPanel, toggleDebug, setDebugPanel } from "./command"
import * as Link from "../../data/Link"
import * as React from "react"
import * as ReactDOM from "react-dom"

let racf = require("random-access-chrome-file")

process.hrtime = require("browser-process-hrtime")

const webview = document.getElementById("webview")! as HTMLIFrameElement

const hm = new Hypermerge({ storage: racf })
const store = new StoreBackend(hm)

hm.joinSwarm(
  new CloudClient({
    url: "wss://discovery-cloud.herokuapp.com",
    // url: "ws://localhost:8080",
    id: hm.id,
    stream: hm.stream,
  }),
)

window.addEventListener("message", ({ data: msg }) => {
  if (typeof msg !== "object") return

  if (msg.type === "Clipper") {
    return store.sendToFrontend(msg)
  }

  if (msg.type === "ToggleDebug") {
    toggleDebug()
  }

  store.onMessage(msg)
})

window.addEventListener("keydown", event => {
  if (event.code === "ShiftRight") {
    toggleDebug()
  }
})

let loadStopped = false
webview.addEventListener("loadstop", () => {
  if (loadStopped) {
    return
  }
  loadStopped = true

  webview.focus()

  store.sendQueue.subscribe(msg => {
    webview.contentWindow!.postMessage(msg, "*")
  })

  store.sendToFrontend({ type: "Ready" })

  setDebugPanel()

  setupControlPanel(store)
})

// Receive messages from the Clipper chrome extension to import content
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (sender.id == "blocklistedExtension") return

    console.log("Received message from external extension", request, sender)

    store.sendToFrontend({ type: "Clipper", ...request })

    sendResponse({ contentReceived: "success" })
  },
)
