import React, { useRef, useState } from 'react'
import { sendAudioCommand } from '../api'

export default function VoiceButton({ onRecordingStart, onRecordingSent, onError, onSpeechText }) {
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const recognitionRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const [liveTranscript, setLiveTranscript] = useState('')
  const transcriptRef = useRef('')
  const silenceTimerRef = useRef(null)

  function finishAndSend(text) {
    clearTimeout(silenceTimerRef.current)
    const cleanText = (text || transcriptRef.current || '').trim()
    stopRecording()
    if (cleanText) {
      onSpeechText?.(cleanText)
      transcriptRef.current = ''
      setLiveTranscript('')
    }
  }

  function startRecording() {
    setLiveTranscript('')
    transcriptRef.current = ''
    clearTimeout(silenceTimerRef.current)

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        // Default to user locale, with English fallback
        recognition.lang = navigator.language || 'en-IN'

        recognition.onstart = () => {
          setRecording(true)
          onRecordingStart?.()
        }

        recognition.onresult = (event) => {
          let interim = ''
          let final = ''

          for (let i = 0; i < event.results.length; ++i) {
            const res = event.results[i]
            if (res.isFinal) {
              final += res[0].transcript + ' '
            } else {
              interim += res[0].transcript
            }
          }

          const current = (final + interim).trim()
          if (current) {
            transcriptRef.current = (final || current).trim()
            setLiveTranscript(current)

            // Auto-send if user pauses speaking for 1.4 seconds
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = setTimeout(() => {
              finishAndSend(transcriptRef.current || current)
            }, 1400)
          }
        }

        recognition.onerror = (event) => {
          console.warn('SpeechRecognition error:', event.error)
          if (event.error === 'no-speech') {
            // Keep listening, don't abort abruptly
            return
          }
          if (event.error === 'not-allowed') {
            onError?.('Microphone permission denied. Please allow mic access in your browser.')
            setRecording(false)
            return
          }
          // On network or platform error, fall back to MediaRecorder
          fallbackMediaRecorder()
        }

        recognition.onend = () => {
          // If we have accumulated speech, send it
          if (transcriptRef.current) {
            finishAndSend(transcriptRef.current)
          } else {
            setRecording(false)
          }
        }

        recognitionRef.current = recognition
        recognition.start()
        return
      } catch (e) {
        console.warn('SpeechRecognition failed to start, falling back to MediaRecorder:', e)
      }
    }

    fallbackMediaRecorder()
  }

  async function fallbackMediaRecorder() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setBusy(true)
        try {
          const result = await sendAudioCommand(blob)
          onRecordingSent?.(result)
          if (result?.transcript) {
            onSpeechText?.(result.transcript)
          }
        } catch (err) {
          onError?.(err.message)
        } finally {
          setBusy(false)
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
      onRecordingStart?.()
    } catch (err) {
      onError?.('Microphone access was denied or unavailable.')
    }
  }

  function stopRecording() {
    clearTimeout(silenceTimerRef.current)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {}
    }
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop()
      } catch (e) {}
    }
    setRecording(false)
  }

  function handleClick() {
    if (busy) return
    if (recording) {
      finishAndSend(transcriptRef.current)
    } else {
      startRecording()
    }
  }


  return (
    <div className="relative flex flex-col items-center gap-4 py-2">
      {/* Ambient background glow at rest and expanded during recording */}
      <div
        className={`pointer-events-none absolute h-36 w-36 rounded-full transition-all duration-700 ease-out ${
          recording
            ? 'scale-125 bg-amber-500/20 blur-2xl animate-ambientGlow'
            : busy
            ? 'scale-100 bg-teal-500/15 blur-xl'
            : 'scale-90 bg-amber-500/10 blur-xl'
        }`}
      />

      <div className="relative flex items-center justify-center">
        {/* Active Audio Waveform Staggered Rings (Recording state) */}
        {recording && (
          <>
            <span className="pointer-events-none absolute h-32 w-32 rounded-full border border-amber-400/40 animate-ripple" />
            <span
              className="pointer-events-none absolute h-32 w-32 rounded-full border border-amber-500/30 animate-ripple"
              style={{ animationDelay: '0.6s' }}
            />
          </>
        )}

        {/* Processing Spinner Ring (Busy state) */}
        {busy && (
          <span className="pointer-events-none absolute h-28 w-28 rounded-full border-2 border-dashed border-teal-400/60 animate-spin" />
        )}

        <button
          onClick={handleClick}
          disabled={busy}
          className={`relative z-10 flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full border-2 transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-4 focus-visible:ring-offset-base-950 ${
            recording
              ? 'border-amber-400 bg-gradient-to-b from-amber-500/30 to-amber-500/10 text-amber-300 shadow-[0_0_32px_rgba(232,163,61,0.45)] scale-105'
              : busy
              ? 'border-teal-500/70 bg-teal-500/10 text-teal-300 opacity-80 cursor-wait'
              : 'border-amber-500/80 bg-gradient-to-b from-amber-500/15 via-base-900/90 to-base-900 text-amber-400 shadow-lg shadow-amber-500/10 hover:border-amber-400 hover:shadow-amber-500/25 hover:scale-105 active:scale-95 cursor-pointer'
          }`}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
        >
          <MicIcon
            className={`h-9 w-9 sm:h-10 sm:w-10 transition-transform duration-300 ${
              recording ? 'scale-110' : 'group-hover:scale-105'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
            recording
              ? 'bg-amber-400 animate-ping'
              : busy
              ? 'bg-teal-400 animate-pulse'
              : 'bg-base-600'
          }`}
        />
        <span className="text-xs sm:text-sm font-medium tracking-wide text-gray-300 text-center max-w-md px-2">
          {busy
            ? 'Processing voice...'
            : recording
            ? (liveTranscript ? `Hearing: "${liveTranscript}"` : 'Listening... speak clearly')
            : 'Tap to speak'}
        </span>
      </div>

    </div>
  )
}

function MicIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  )
}
