import React, { useRef, useState } from 'react'
import { sendAudioCommand } from '../api'

// All 9 languages supported by Rime's Coda TTS model.
// Each entry: [ISO-639-1, BCP-47 for Web Speech API, display label, flag]
const SUPPORTED_LANGUAGES = [
  { code: 'en', bcp47: 'en-IN', label: 'English',    flag: '🇮🇳' },
  { code: 'hi', bcp47: 'hi-IN', label: 'हिंदी',     flag: '🇮🇳' },
  { code: 'es', bcp47: 'es-ES', label: 'Español',    flag: '🇪🇸' },
  { code: 'fr', bcp47: 'fr-FR', label: 'Français',   flag: '🇫🇷' },
  { code: 'de', bcp47: 'de-DE', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'it', bcp47: 'it-IT', label: 'Italiano',   flag: '🇮🇹' },
  { code: 'pt', bcp47: 'pt-BR', label: 'Português',  flag: '🇧🇷' },
  { code: 'ar', bcp47: 'ar-SA', label: 'العربية',    flag: '🇸🇦' },
  { code: 'ja', bcp47: 'ja-JP', label: '日本語',     flag: '🇯🇵' },
]

// Detect mobile devices to adapt SpeechRecognition behavior
const isMobileBrowser = () => {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '')
}

/**
 * Safely parses Web Speech API SpeechRecognitionResultList across Desktop and Mobile.
 * Prevents mobile Chrome cumulative word duplication stutter (e.g. "fine fine black fine black running...").
 */
function parseSpeechRecognitionResults(results) {
  if (!results || results.length === 0) {
    return { final: '', current: '' }
  }

  const finalSegments = []
  let interim = ''

  for (let i = 0; i < results.length; ++i) {
    const res = results[i]
    if (!res || !res[0]) continue
    const text = (res[0].transcript || '').trim()
    if (!text) continue

    if (res.isFinal) {
      if (finalSegments.length > 0) {
        const prev = finalSegments[finalSegments.length - 1].trim().toLowerCase()
        const curr = text.toLowerCase()

        if (curr === prev) {
          // Exact duplicate segment emitted by mobile Web Speech API, skip
          continue
        } else if (curr.startsWith(prev)) {
          // Cumulative segment (Android Chrome sends previous segment + new words)
          finalSegments[finalSegments.length - 1] = text
        } else if (prev.startsWith(curr)) {
          // Shorter prefix of an already recorded segment, skip
          continue
        } else {
          // Distinct segment (desktop continuous speech)
          finalSegments.push(text)
        }
      } else {
        finalSegments.push(text)
      }
    } else {
      interim = text
    }
  }

  const finalStr = finalSegments.join(' ').trim()
  let currentStr = finalStr

  if (interim) {
    const normFinal = finalStr.toLowerCase()
    const normInterim = interim.toLowerCase()

    if (!normFinal) {
      currentStr = interim
    } else if (normInterim.startsWith(normFinal)) {
      currentStr = interim
    } else if (normFinal.startsWith(normInterim)) {
      currentStr = finalStr
    } else {
      currentStr = `${finalStr} ${interim}`.trim()
    }
  }

  return {
    final: finalStr,
    current: currentStr
  }
}

export default function VoiceButton({ onRecordingStart, onRecordingSent, onError, onSpeechText }) {
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const [selectedLang, setSelectedLang] = useState(SUPPORTED_LANGUAGES[0])
  const [langOpen, setLangOpen] = useState(false)
  const recognitionRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  const [liveTranscript, setLiveTranscript] = useState('')
  const transcriptRef = useRef('')
  const silenceTimerRef = useRef(null)
  const isSendingRef = useRef(false)

  function finishAndSend(text) {
    if (isSendingRef.current) return
    clearTimeout(silenceTimerRef.current)
    const cleanText = (text || transcriptRef.current || '').trim()
    transcriptRef.current = ''
    setLiveTranscript('')
    stopRecording()

    if (cleanText) {
      isSendingRef.current = true
      // Pass both text AND the ISO language code so the backend gets the hint
      onSpeechText?.(cleanText, selectedLang.code)
      setTimeout(() => {
        isSendingRef.current = false
      }, 500)
    }
  }

  function startRecording() {
    isSendingRef.current = false
    setLiveTranscript('')
    transcriptRef.current = ''
    clearTimeout(silenceTimerRef.current)
    setLangOpen(false)

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition()
        const mobile = isMobileBrowser()
        // Mobile Chrome has severe duplication bugs with continuous=true; single-utterance is stable
        recognition.continuous = !mobile
        recognition.interimResults = true
        // Use the user-selected BCP-47 language tag
        recognition.lang = selectedLang.bcp47

        recognition.onstart = () => {
          setRecording(true)
          onRecordingStart?.()
        }

        recognition.onresult = (event) => {
          const { final, current } = parseSpeechRecognitionResults(event.results)
          const textToUse = (final || current).trim()

          if (textToUse) {
            transcriptRef.current = textToUse
            setLiveTranscript(current || final)

            // Auto-send if user pauses
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = setTimeout(() => {
              finishAndSend(transcriptRef.current || textToUse)
            }, mobile ? 1200 : 1400)
          }
        }

        recognition.onerror = (event) => {
          console.warn('SpeechRecognition error:', event.error)
          if (event.error === 'no-speech') {
            return
          }
          if (event.error === 'not-allowed') {
            onError?.('Microphone permission denied. Please allow mic access in your browser.')
            setRecording(false)
            return
          }
          // Fall back to MediaRecorder on network/platform error
          fallbackMediaRecorder()
        }

        recognition.onend = () => {
          if (transcriptRef.current && !isSendingRef.current) {
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
            onSpeechText?.(result.transcript, selectedLang.code)
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
      try { recognitionRef.current.stop() } catch (e) {}
    }
    if (mediaRecorderRef.current) {
      try { mediaRecorderRef.current.stop() } catch (e) {}
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

  function handleLangSelect(lang) {
    setSelectedLang(lang)
    setLangOpen(false)
    // If currently recording, stop so user can restart with new language
    if (recording) stopRecording()
  }

  return (
    <div className="relative flex flex-col items-center gap-4 py-2">
      {/* Ambient background glow */}
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
        {/* Active Waveform Rings */}
        {recording && (
          <>
            <span className="pointer-events-none absolute h-32 w-32 rounded-full border border-amber-400/40 animate-ripple" />
            <span
              className="pointer-events-none absolute h-32 w-32 rounded-full border border-amber-500/30 animate-ripple"
              style={{ animationDelay: '0.6s' }}
            />
          </>
        )}

        {/* Busy spinner */}
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

      {/* ── Language Selector ── */}
      <div className="relative">
        <button
          onClick={() => setLangOpen((o) => !o)}
          disabled={recording || busy}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
            recording || busy
              ? 'border-base-800 text-gray-600 cursor-not-allowed opacity-60'
              : 'border-base-700 bg-base-900/70 text-gray-300 hover:border-amber-500/50 hover:text-amber-300 cursor-pointer'
          }`}
          title="Select voice language"
        >
          <span className="text-base leading-none">{selectedLang.flag}</span>
          <span>{selectedLang.label}</span>
          <svg className="h-3 w-3 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {langOpen && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50
            w-44 rounded-xl border border-base-700 bg-base-900 shadow-2xl shadow-black/60
            backdrop-blur-md overflow-hidden animate-fadeInUp">
            <div className="px-2 py-1.5 border-b border-base-800">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Voice language
              </p>
            </div>
            <div className="py-1 max-h-64 overflow-y-auto">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLangSelect(lang)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors text-left cursor-pointer ${
                    selectedLang.code === lang.code
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'text-gray-300 hover:bg-base-800 hover:text-white'
                  }`}
                >
                  <span className="text-base leading-none">{lang.flag}</span>
                  <span className="font-medium">{lang.label}</span>
                  {selectedLang.code === lang.code && (
                    <svg className="ml-auto h-3 w-3 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
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
