import * as React from "react"
import * as ReactDOM from "react-dom"
import App from "../../components/App"
import Content from "../../components/Content"
import Store from "../../data/Store"

// Used for debugging from the console:
window.Content = Content

Content.store = new Store()

window.addEventListener("message", event => {
  if (typeof event.data === "string") return // setImmediate uses postMessage
  const msg = event.data

  if (msg.type === "Ready") {
    const { source }: any = event

    Content.store.send = msg => {
      source.postMessage(msg)
    }
  }

  Content.store.onMessage(event.data)
})

setTimeout(() => ReactDOM.render(<App />, document.body), 1000)
