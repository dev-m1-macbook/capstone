import StoreBackend from "../../data/StoreBackend"
import { Hypermerge } from "../../modules/hypermerge"
import CloudClient from "../../modules/discovery-cloud/Client"
let racf = require("random-access-chrome-file")

process.hrtime = require("browser-process-hrtime")

const webview = document.getElementById("webview")! as HTMLIFrameElement
const DebugPane = document.getElementById("DebugPane")!

const hm = new Hypermerge({ storage: racf })
const store = new StoreBackend(hm)

store.sendQueue.subscribe(msg => {
  webview.contentWindow!.postMessage(msg, "*")
})

window.addEventListener("message", event => {
  if (event.data.type === "Clipper") {
    setTimeout(() => store.sendToFrontend(event.data), 1000)
  }
  if (event.data.type === "ToggleDebug") {
    toggleDebug()
  }

  store.onMessage(event.data)
})

window.addEventListener("keydown", event => {
  if (event.code === "ShiftRight") {
    toggleDebug()
  }
})

webview.addEventListener("loadstop", () => {
  webview.focus()

  hm.joinSwarm(
    new CloudClient({
      url: "wss://discovery-cloud.herokuapp.com",
      // url: "ws://localhost:8080",
      id: hm.id,
      stream: hm.stream,
    }),
  )

  store.sendToFrontend({ type: "Ready" })

  setDebugPannel()
})

function setDebugPannel() {
  chrome.storage.local.get("debugPannel", data => {
    DebugPane.style.display = data.debugPannel
  })
  DebugPane.style.display =
    DebugPane.style.display === "block" ? "none" : "block"
}

function toggleDebug() {
  console.log("Toggling debug pane")
  const mode = DebugPane.style.display === "block" ? "none" : "block"
  chrome.storage.local.set({ debugPannel: mode })
  setDebugPannel()
}

window.opener.postMessage({ loaded: true }, "*")
