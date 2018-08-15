import * as Preact from "preact"
import Widget, { AnyDoc } from "./Widget"
import * as Reify from "../data/Reify"
import Content from "./Content"
import { Doc } from "automerge"

export interface Model {
  boardUrl: string
  archiveUrl: string
}

export default class Workspace extends Widget<Model> {
  static reify(doc: AnyDoc): Model {
    return {
      boardUrl: Reify.link(doc.boardUrl, () => Content.create("Board")),
      archiveUrl: Reify.link(doc.archiveUrl, () => Content.create("Archive")),
    }
  }

  show({ boardUrl, archiveUrl }: Doc<Model>) {
    return (
      <div class="Workspace">
        <Content mode={this.mode} url={boardUrl} />
        <Content mode={this.mode} url={archiveUrl} />
      </div>
    )
  }
}

Content.register("Workspace", Workspace)
