import * as Preact from "preact"
import { once } from "lodash"
import * as Widget from "./Widget"
import * as Reify from "../data/Reify"
import * as DataTransfer from "../logic/DataTransfer"
import Content from "./Content"
import { AnyDoc, AnyEditDoc } from "automerge"
import Clipboard from "./Clipboard"

interface Model {
  docs: Array<{
    url: string
  }>
}

interface Props extends Widget.Props<Model> {}

interface State {
  isDropping: boolean
}

export default class SidecarUploader extends Preact.Component<Props, State> {
  static reify(doc: AnyDoc): Model {
    return {
      docs: Reify.array(doc.docs),
    }
  }

  state = { isDropping: false }

  render() {
    const {
      doc: { docs },
    } = this.props
    const { isDropping } = this.state

    return (
      <div
        style={style.SidecarUploader}
        onDragOver={this.onDragOver}
        onDragLeave={this.onDragLeave}
        onDrop={this.onDrop}>
        <Clipboard onPaste={this.onPaste} />
        <div style={style.Status} />
        <div
          style={{
            ...style.DropArea,
            ...(isDropping ? style.DropArea_dropping : {}),
          }}>
          <div style={style.DropTitle}>Drop files here</div>
          <div style={style.Plus}>+</div>
        </div>
      </div>
    )
  }

  onDragOver = (event: DragEvent) => {
    event.preventDefault()
    this.setState({ isDropping: true })
  }

  onDragLeave = (event: DragEvent) => {
    this.setState({ isDropping: false })
  }

  onDrop = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()

    this.setState({ isDropping: false })
    this.importData(event.dataTransfer)
  }

  onPaste = (event: ClipboardEvent) => {
    event.preventDefault()
    event.stopPropagation()

    this.importData(event.clipboardData)
  }

  importData(data: DataTransfer) {
    DataTransfer.extractEntries(data).forEach(async ({ type, asString }) => {
      if (type.startsWith("image/")) {
        this.addImage(await asString())
      } else if (type.startsWith("text/")) {
        this.addText(await asString())
      }
    })
  }

  async addText(content: string) {
    const url = await Content.create("Text")
    const onOpen = (doc: AnyEditDoc) => {
      doc.content = content.split("")
      replace(doc)
    }

    const replace = Content.open(url, once(onOpen))

    this.props.change(doc => {
      doc.docs.push({ url })
      return doc
    })
  }

  async addImage(src: string) {
    const url = await Content.create("Image")
    const onOpen = (doc: AnyEditDoc) => {
      doc.src = src
      replace(doc)
    }

    const replace = Content.open(url, once(onOpen))

    this.props.change(doc => {
      doc.docs.push({ url })
      return doc
    })
  }
}

Widget.create("SidecarUploader", SidecarUploader, SidecarUploader.reify)

const style = {
  SidecarUploader: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    display: "grid",
    gridTemplateAreas: `"status" "drop"`,
    gridTemplateRows: "auto 1fr",
  },

  Status: {
    gridArea: "status",
  },

  DropArea: {
    margin: 10,
    border: "3px #D0D0D0 dashed",
    gridArea: "drop",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  DropArea_dropping: {
    borderColor: "#73BE8D",
  },

  DropTitle: {
    fontSize: 30,
    color: "#848484",
  },

  Plus: {
    fontSize: 50,
    color: "#D0D0D0",
  },
}
