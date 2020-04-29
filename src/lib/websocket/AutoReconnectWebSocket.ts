import { WebSocketCommand } from '.'

export interface Options {
  maxReconnectionDelay: number
  minReconnectionDelay: number
  connectionTimeout: number
}

const defaultOptions: Options = {
  maxReconnectionDelay: 10000,
  minReconnectionDelay: 1000,
  connectionTimeout: 4000
}

interface EventMap {
  message: CustomEvent<any>
  reconnect: Event
}
type EventListener<T extends keyof EventMap> = (ev: EventMap[T]) => any

const wait = (ms: number) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

export default class AutoReconnectWebSocket {
  _ws?: WebSocket
  eventTarget: EventTarget

  readonly url: string
  readonly protocols: string | string[] | undefined
  readonly options: Options

  sendQueue = new Map<WebSocketCommand, string[]>()
  isInitialized = false
  reconnecting = false

  constructor(
    url: string,
    protocols: string | string[] | undefined,
    options: Readonly<Partial<Options>>
  ) {
    this.url = url
    this.protocols = protocols
    this.options = { ...options, ...defaultOptions }

    // SafariでEventTargetのコンストラクタ使えないので`<span>`で代用
    this.eventTarget = document.createElement('span')
  }

  get isOpen() {
    return this._ws?.readyState === WebSocket.OPEN
  }

  _sendCommand(commands: readonly [WebSocketCommand, ...string[]]) {
    this._ws!.send(commands.join(':'))
  }

  sendCommand(...commands: readonly [WebSocketCommand, ...string[]]) {
    if (this.isOpen) {
      this._sendCommand(commands)
    } else {
      this.sendQueue.set(commands[0], commands.slice(1))
    }
  }

  _getDelay(count: number) {
    const { minReconnectionDelay, maxReconnectionDelay } = this.options
    return Math.min(minReconnectionDelay * 1.3 ** count, maxReconnectionDelay)
  }

  _setupWs() {
    return new Promise(resolve => {
      this._ws = new WebSocket(this.url, this.protocols)

      this._ws.addEventListener(
        'open',
        () => {
          resolve()
          if (this.isInitialized) {
            this.eventTarget.dispatchEvent(new Event('reconnect'))
          } else {
            this.isInitialized = true
          }

          this.sendQueue.forEach((args, command) => {
            this._sendCommand([command, ...args])
          })
          this.sendQueue.clear()
        },
        { once: true }
      )
      this._ws.addEventListener(
        'error',
        () => {
          resolve()
        },
        { once: true }
      )

      this._ws.addEventListener('message', e => {
        this.eventTarget.dispatchEvent(
          new CustomEvent('message', { detail: e.data })
        )
      })

      this._ws.addEventListener(
        'close',
        () => {
          this.reconnect()
        },
        { once: true }
      )
    })
  }

  addEventListener<T extends keyof EventMap>(
    type: T,
    listener: EventListener<T>,
    options?: boolean | AddEventListenerOptions
  ): void {
    this.eventTarget.addEventListener(type, listener as any, options)
  }
  removeEventListener<T extends keyof EventMap>(
    type: T,
    listener: EventListener<T>,
    options?: boolean | AddEventListenerOptions
  ): void {
    this.eventTarget.removeEventListener(type, listener as any, options)
  }

  connect() {
    this._setupWs()
  }

  async reconnect() {
    if (this.reconnecting) return
    this.reconnecting = true

    let count = 1
    while (true) {
      const delay = this._getDelay(count)
      await wait(delay)

      if (this.isOpen) break

      await this._setupWs()

      if (this.isOpen) break

      count++
    }

    this.reconnecting = false
  }
}
