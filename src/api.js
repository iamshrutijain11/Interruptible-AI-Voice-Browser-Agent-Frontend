/**
 * api.js
 * ------
 * Thin wrapper around the backend's REST endpoints. Actual live updates
 * (state changes, results, interrupts) arrive over the WebSocket
 * (see websocket.js) -- these calls just kick things off or fetch a
 * one-time snapshot.
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

const API_URL = import.meta.env.VITE_API_URL || (
  isLocal
    ? `http://${localHost}:8000`
    : 'https://interruptible-ai-voice-browser-agent.onrender.com'
)

export async function sendAudioCommand(audioBlob) {
  const form = new FormData()
  form.append('file', audioBlob, 'recording.webm')
  const res = await fetch(`${API_URL}/api/voice-command`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Voice command failed: ${detail}`)
  }
  return res.json()
}

export async function sendTextCommand(text) {
  const res = await fetch(`${API_URL}/api/text-command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Text command failed: ${detail}`)
  }
  return res.json()
}

export async function resetTask() {
  const res = await fetch(`${API_URL}/api/reset`, { method: 'POST' })
  return res.json()
}

export async function getState() {
  const res = await fetch(`${API_URL}/api/state`)
  return res.json()
}

export { API_URL }
