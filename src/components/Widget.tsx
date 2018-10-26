import * as React from "react"
import { Doc, AnyDoc, ChangeFn } from "automerge/frontend"
import ErrorBoundary from "./ErrorBoundary"
import * as Env from "../data/Env"
import Content, {
  WidgetProps,
  Message,
  Mode,
  MessageHandlerClass,
} from "./Content"
import Handle from "../data/Handle"

export interface Props<T = {}, M = never> {
  doc: Doc<T>
  url: string
  mode: Mode
  env: Env.Env
  emit: (message: M) => void
  change: (cb: ChangeFn<T>) => void
}

interface State<T> {
  doc?: Doc<T>
}

// TODO: This is necessary to avoid Typescript warning, must be a better way.
interface WrappedComponent<T, M = never>
  extends React.Component<Props<T, M>, any> {}
type WrappedComponentClass<T, M = never> = {
  new (...k: any[]): WrappedComponent<T, M>
}

export function create<T, M extends Message = never>(
  type: string,
  WrappedComponent: WrappedComponentClass<T, M>,
  reify: (doc: AnyDoc) => T,
  messageHandler?: MessageHandlerClass,
) {
  const WidgetClass = class extends React.Component<WidgetProps<T>, State<T>> {
    // TODO: update register fn to not need static reify.
    static reify = reify
    handle?: Handle<T>

    constructor(props: WidgetProps<T>, ctx: any) {
      super(props, ctx)
      this.state = {}
    }

    componentDidMount() {
      this.handle = Content.open<T>(this.props.url).subscribe(doc => {
        this.setState({ doc })
      })
    }

    componentWillUnmount() {
      this.handle && this.handle.close()
    }

    emit = (message: M) => {
      Content.send(
        Object.assign({ to: this.props.url }, message, {
          from: this.props.url,
        }),
      )
    }

    change = (cb: ChangeFn<T>) => {
      this.handle && this.handle.change(cb)
    }

    render() {
      if (this.state.doc) {
        return (
          <ErrorBoundary>
            <WrappedComponent
              {...this.props}
              doc={this.state.doc}
              emit={this.emit}
              change={this.change}
            />
          </ErrorBoundary>
        )
      } else {
        return this.loading()
      }
    }

    loading() {
      return "Loading..."
    }
  }

  // Register the widget with the Content registry.
  // XXX: Should we do this here?
  Content.registerWidget(type, WidgetClass)
  if (messageHandler) {
    Content.registerMessageHandler(type, messageHandler)
  }

  return WidgetClass
}
