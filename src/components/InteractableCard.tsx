import * as React from "react"
import Interactable from "./Interactable"
import Card from "./Card"
import { omit } from "lodash"
import * as Link from "../data/Link"
import * as DataTransfer from "../logic/DataTransfer"
import Pinchable from "./Pinchable"
import { DEFAULT_CARD_DIMENSION } from "../logic/SizeUtils"
import { Zoomable } from "./ZoomNav"

export interface CardModel {
  id: string
  x: number
  y: number
  z: number
  width: number
  height: number
  url: string
}

export interface State {
  currentSize: Size
}

export interface Props {
  noZoom?: true
  card: CardModel
  onDragStart?: (id: string) => void
  onDragStop?: (x: number, y: number, id: string) => void
  onRemoved?: (id: string) => void
  onResizeStop?: (newSize: Size, id: string) => void
  onDoubleTap?: (id: string) => void
}

export default class InteractableCard extends React.Component<Props, State> {
  node?: Element

  constructor(props: Props) {
    super(props)

    this.state = {
      currentSize: { width: props.card.width, height: props.card.height },
    }
  }

  start = () => {
    this.props.onDragStart && this.props.onDragStart(this.props.card.id)
  }

  dragStop = (x: number, y: number) => {
    this.props.onDragStop && this.props.onDragStop(x, y, this.props.card.id)
  }

  dragOut = (): DataTransfer => {
    const { url, width, height } = this.props.card
    return DataTransfer.createFromMap({
      "text/plain+capstone": Link.set(url, {
        params: { width, height },
      }),
    })
  }

  removed = () => {
    this.props.onRemoved && this.props.onRemoved(this.props.card.id)
  }

  onResize = (newSize: Size) => {
    this.setState({ currentSize: newSize })
  }

  resizeStop = (newSize: Size) => {
    this.props.onResizeStop &&
      this.props.onResizeStop(newSize, this.props.card.id)
  }

  onDoubleTap = () => {
    this.props.onDoubleTap && this.props.onDoubleTap(this.props.card.id)
  }

  render() {
    const {
      noZoom,
      card: { url, x, y, z, width, height },
      children,
      ...rest
    } = this.props

    const { currentSize } = this.state
    const type = Link.parse(this.props.card.url).type
    const style = {
      width: currentSize.width,
      height: currentSize.height,
    }

    return (
      <Pinchable onDoubleTap={this.onDoubleTap}>
        <Interactable
          position={{ x, y }}
          originalSize={{ width, height }}
          preserveAspectRatio={true}
          minDimensionForLongestSide={
            type === "Text"
              ? DEFAULT_CARD_DIMENSION
              : DEFAULT_CARD_DIMENSION / 2
          }
          onStart={this.start}
          onDragStop={this.dragStop}
          onDragOut={this.dragOut}
          onRemoved={this.removed}
          onResize={this.onResize}
          onResizeStop={this.resizeStop}
          z={z}>
          {noZoom ? (
            <Card
              cardId={this.props.card.id}
              url={this.props.card.url}
              style={style}
              {...omit(rest, [
                "onDoubleTap",
                "onDragStop",
                "onResizeStop",
                "onPinchStart",
                "onPinchMove",
                "onPinchOutEnd",
                "onRemoved",
              ])}>
              {children}
            </Card>
          ) : (
            <Zoomable url={url} position={{ x, y }} size={{ width, height }}>
              <Card
                cardId={this.props.card.id}
                url={this.props.card.url}
                style={style}
                {...omit(rest, [
                  "onDoubleTap",
                  "onDragStop",
                  "onResizeStop",
                  "onPinchStart",
                  "onPinchMove",
                  "onPinchOutEnd",
                  "onRemoved",
                ])}>
                {children}
              </Card>
            </Zoomable>
          )}
        </Interactable>
      </Pinchable>
    )
  }
}
