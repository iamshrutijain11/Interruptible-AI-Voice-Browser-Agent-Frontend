/**
 * websocket.js
 * ------------
 * Thin wrapper around the backend's /ws event stream. Connects once,
 * dispatches every incoming { type, ... } event to whatever handlers are
 * registered for that type via .on(type, handler). See events.py on the
 * backend for the exact shapes.
 */

const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '0.0.0.0' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.') ||
  window.location.hostname.endsWith('.local')
)

const localHost = typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== '0.0.0.0'
  ? window.location.hostname
  : 'localhost'

const WS_URL = import.meta.env.VITE_WS_URL || (
  isLocal
    ? `ws://${localHost}:8000/ws`
    : 'wss://interruptible-ai-voice-browser-agent.onrender.com/ws'
)

export class VoiceSocket {
  constructor() {
    this.ws = null
    this.handlers = {}
    this.reconnectDelay = 1000
  }

  connect() {
    this.ws = new WebSocket(WS_URL)

    this.ws.onopen = () => {
      this.reconnectDelay = 1000
      this._emit('_connected', {})
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this._emit(data.type, data)
      } catch (e) {
        console.error('Failed to parse WS message', e)
      }
    }

    this.ws.onclose = () => {
      this._emit('_disconnected', {})
      setTimeout(() => this.connect(), this.reconnectDelay)
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 10000)
    }

    this.ws.onerror = () => {
      // onclose fires right after; reconnection is handled there.
    }
  }

  on(type, handler) {
    if (!this.handlers[type]) this.handlers[type] = []
    this.handlers[type].push(handler)
    return () => {
      this.handlers[type] = this.handlers[type].filter((h) => h !== handler)
    }
  }

  _emit(type, data) {
    (this.handlers[type] || []).forEach((h) => h(data))
  }

  send(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj))
    }
  }

  sendUtterance(text) {
    this.send({ action: 'utterance', text })
  }

  close() {
    if (this.ws) this.ws.close()
  }
}
