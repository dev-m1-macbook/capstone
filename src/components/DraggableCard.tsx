import * as Preact from "preact"
import Draggable from "../modules/draggable/index"
import Card from "./Card"
import { DraggableData } from "../modules/draggable/types"
import { Glyph } from "../data/Glyph"
import Touch, { TouchEvent } from "./Touch"
import StrokeRecognizer, { GlyphEvent } from "./StrokeRecognizer"

interface CardModel {
  id: string
  x: number
  y: number
  z: number
  url: string
}

export interface Props {
  card: CardModel
  onDragStart: (id: string) => void
  onDragStop?: (x: number, y: number, id: string) => void
  onPinchEnd?: (url: string) => void
}

export default class DraggableCard extends Preact.Component<Props> {
  render() {
    const {
      card: { x, y, z },
      children,
      ...rest
    } = this.props

    return (
      <Touch onPinchEnd={this.onPinchEnd}>
        <Draggable
          defaultPosition={{ x, y }}
          onStart={this.start}
          onStop={this.stop}
          onCancel={this.cancel}
          z={z}
          enableUserSelectHack={false}>
          <Card cardId={this.props.card.id} {...rest}>
            {children}
          </Card>
        </Draggable>
      </Touch>
    )
  }

  onPinchEnd = (event: TouchEvent) => {
    if (event.scale < 1) return // TODO: maybe build this into Touch
    const { onPinchEnd, card } = this.props
    onPinchEnd && onPinchEnd(card.url)
  }

  start = () => {
    this.props.onDragStart(this.props.card.id)
  }

  stop = (e: PointerEvent, data: DraggableData) => {
    this.props.onDragStop &&
      this.props.onDragStop(data.x, data.y, this.props.card.id)
  }

  cancel = (data: DraggableData) => {
    this.props.onDragStop &&
      this.props.onDragStop(data.x, data.y, this.props.card.id)
  }
}
