import React, { useEffect, useRef, useState } from 'react'
import { VoiceSocket } from './websocket'
import { resetTask } from './api'
import VoiceButton from './components/VoiceButton'
import StatusIndicator from './components/StatusIndicator'
import Transcript from './components/Transcript'
import Results from './components/Results'
import TaskTimeline from './components/TaskTimeline'
import PlanPanel from './components/PlanPanel'
import RecommendationPanel from './components/RecommendationPanel'
import ActivityPanel from './components/ActivityPanel'

export default function App() {
  const [connected, setConnected]               = useState(false)
  const [state, setState]                       = useState('IDLE')
  const [taskId, setTaskId]                     = useState(null)
  const [userText, setUserText]                 = useState('')
  const [agentText, setAgentText]               = useState('')
  const [results, setResults]                   = useState([])
  const [timeline, setTimeline]                 = useState([])
  const [justInterrupted, setJustInterrupted]   = useState(false)
  const [errorMsg, setErrorMsg]                 = useState(null)
  const [typedText, setTypedText]               = useState('')
  const [activeRange, setActiveRange]           = useState(null)
  const [detectedLanguage, setDetectedLanguage] = useState('')
  // Plan panel state
  const [plan, setPlan]                         = useState([])
  const [isReplan, setIsReplan]                 = useState(false)
  // Recommendation state
  const [recommendation, setRecommendation]     = useState(null)
  const [awaitingApproval, setAwaitingApproval] = useState(false)
  const [metrics, setMetrics]                   = useState(null)
  const [isFallback, setIsFallback]             = useState(false)
  const [searchWarning, setSearchWarning]       = useState(null)

  const socketRef = useRef(null)

  useEffect(() => {
    const socket = new VoiceSocket()
    socketRef.current = socket

    socket.on('_connected',    () => setConnected(true))
    socket.on('_disconnected', () => setConnected(false))

    socket.on('metrics.updated', (ev) => {
      if (ev.metrics) setMetrics(ev.metrics)
    })

    socket.on('transcript.updated', (ev) => {
      setUserText(ev.text)
      if (ev.language) setDetectedLanguage(ev.language)
    })

    socket.on('task.started', (ev) => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      setTaskId(ev.task_id)
      setResults([])
      setRecommendation(null)
      setAwaitingApproval(false)
      setErrorMsg(null)
      setJustInterrupted(false)
      setIsFallback(false)
      setSearchWarning(null)
      if (ev.constraints && (ev.constraints.min_price != null || ev.constraints.max_price != null)) {
        setActiveRange({ min: ev.constraints.min_price, max: ev.constraints.max_price })
      } else {
        setActiveRange(null)
      }
      setTimeline((t) => [...t, ev])
    })

    // Plan events
    socket.on('plan.created', (ev) => {
      setPlan(ev.steps || [])
      setIsReplan(ev.is_replan || false)
    })

    socket.on('step.changed', (ev) => {
      setPlan((prev) =>
        prev.map((s) =>
          s.id === ev.step_id
            ? { ...s, status: ev.status, detail: ev.detail ?? s.detail }
            : s
        )
      )
    })

    // Recommendation + approval events
    socket.on('recommendation.ready', (ev) => {
      setRecommendation(ev.recommendation)
    })

    socket.on('approval.required', (ev) => {
      setAwaitingApproval(true)
      // Also update agent text to the recommendation prompt
      if (ev.text) setAgentText(ev.text)
    })

    socket.on('approval.done', (ev) => {
      setAwaitingApproval(false)
      setTimeline((t) => [...t, ev])
    })

    socket.on('task.interrupted', (ev) => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      setJustInterrupted(true)
      setAwaitingApproval(false)
      setTimeline((t) => [...t, ev])
      setTimeout(() => setJustInterrupted(false), 2500)
    })

    socket.on('state.changed', (ev) => setState(ev.state))

    socket.on('browser.result', (ev) => {
      setResults(ev.results || [])
      setIsFallback(Boolean(ev.is_fallback))
      setSearchWarning(ev.warning || null)
      setTimeline((t) => [...t, ev])
    })

    socket.on('speech.started', (ev) => {
      setAgentText(ev.text)
      if ('speechSynthesis' in window && ev.text) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(ev.text)
        if (ev.language) {
          const langMap = {
            hi: 'hi-IN',
            es: 'es-ES',
            fr: 'fr-FR',
            de: 'de-DE',
            it: 'it-IT',
            pt: 'pt-BR',
            ar: 'ar-SA',
            ja: 'ja-JP',
            en: 'en-IN',
          }
          utterance.lang = langMap[ev.language] || ev.language
        }
        utterance.rate = 1.0
        window.speechSynthesis.speak(utterance)
      }
    })

    socket.on('task.completed', (ev) => setTimeline((t) => [...t, ev]))

    socket.on('task.error', (ev) => {
      setErrorMsg(ev.error)
      setTimeline((t) => [...t, ev])
    })

    socket.connect()
    return () => socket.close()
  }, [])

  async function handleReset() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    await resetTask()
    setState('IDLE')
    setTaskId(null)
    setUserText('')
    setAgentText('')
    setResults([])
    setTimeline([])
    setPlan([])
    setIsReplan(false)
    setRecommendation(null)
    setAwaitingApproval(false)
    setJustInterrupted(false)
    setErrorMsg(null)
    setActiveRange(null)
    setDetectedLanguage('')
    setMetrics(null)
    setIsFallback(false)
    setSearchWarning(null)
  }

  function handleFilterApply(min, max) {
    let utterance = ''
    if (min && max)  utterance = `between ${min} and ${max}`
    else if (max)    utterance = `under ${max}`
    else if (min)    utterance = `above ${min}`
    if (utterance)   socketRef.current?.sendUtterance(utterance)
  }

  function handleFilterClear() {
    setActiveRange(null)
    socketRef.current?.sendUtterance('under 1000000')
  }

  function handleTypedSubmit(e) {
    e.preventDefault()
    if (!typedText.trim()) return
    socketRef.current?.sendUtterance(typedText.trim(), detectedLanguage || 'und')
    setTypedText('')
  }

  function handleApprove() {
    setAwaitingApproval(false)
    socketRef.current?.ws?.send(JSON.stringify({ action: 'approval', approved: true }))
  }

  function handleReject() {
    setAwaitingApproval(false)
    socketRef.current?.ws?.send(JSON.stringify({ action: 'approval', approved: false }))
  }

  return (
    <div className="min-h-screen text-gray-100 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl space-y-8 sm:space-y-10">

        {/* Global Brand Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-base-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-violet-500/20 border border-amber-500/30 text-amber-400 shadow-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Voice Browser Agent
              </h1>
            </div>
            <p className="text-sm text-gray-400 mt-1 pl-12">
              Interruptible · Explainable · Multi-site · Multilingual
            </p>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm transition-colors duration-300 ${
              connected
                ? 'border-teal-500/30 bg-teal-500/10 text-teal-300'
                : 'border-coral-500/30 bg-coral-500/10 text-coral-300'
            }`}>
              <span className={`h-2 w-2 rounded-full ${connected ? 'bg-teal-400 shadow-[0_0_8px_rgba(79,209,197,0.7)]' : 'bg-coral-400'}`} />
              {connected ? 'Live Connected' : 'Disconnected'}
            </span>
          </div>
        </header>

        {/* 2-Zone Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Primary Zone */}
          <main className="lg:col-span-8 space-y-8">

            {/* Voice Centerpiece Card */}
            <div className="relative overflow-hidden rounded-2xl border border-base-800 bg-gradient-to-b from-base-900/90 via-base-900/50 to-base-950/80 p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-8">

              <div className="flex flex-col items-center justify-center pt-2 pb-4">
                <VoiceButton
                  onRecordingStart={() => setState('LISTENING')}
                  onRecordingSent={(res) => { if (res?.transcript) setUserText(res.transcript) }}
                  onSpeechText={(text, lang) => {
                    if (text?.trim()) {
                      setUserText(text.trim())
                      socketRef.current?.sendUtterance(text.trim(), lang)
                    }
                  }}
                  onError={(msg) => setErrorMsg(msg)}
                />
              </div>

              {/* Typed Command Bar */}
              <form onSubmit={handleTypedSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={typedText}
                    onChange={(e) => setTypedText(e.target.value)}
                    placeholder="Or type a command (e.g. dior perfumes under 15000)..."
                    className="w-full rounded-xl border border-base-800 bg-base-950/80 pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl border border-base-700 bg-base-800/90 px-5 py-2.5 text-sm font-medium text-gray-200 hover:border-amber-500/60 hover:bg-base-700 hover:text-white transition-all cursor-pointer"
                >
                  Send
                </button>
              </form>

              {/* Transcript */}
              <div className="pt-2 border-t border-base-800/80">
                <Transcript
                  userText={userText}
                  agentText={agentText}
                  interrupted={justInterrupted}
                  detectedLanguage={detectedLanguage}
                />
              </div>
            </div>

            {/* Recommendation Panel */}
            {recommendation && (
              <RecommendationPanel
                recommendation={recommendation}
                awaitingApproval={awaitingApproval}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            )}

            {/* Results Grid */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-semibold tracking-tight text-gray-100">
                    Search Results
                  </h2>
                  {results?.length > 0 && (
                    <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                      {results.length} found
                    </span>
                  )}
                </div>
              </div>

              <Results
                results={results}
                activeRange={activeRange}
                isFallback={isFallback}
                warning={searchWarning}
                onFilterApply={handleFilterApply}
                onFilterClear={handleFilterClear}
              />
            </section>
          </main>

          {/* Side Rail */}
          <aside className="lg:col-span-4 space-y-4">

            {/* Interrupt Alert */}
            {justInterrupted && (
              <div className="flex items-start gap-3 rounded-xl border border-coral-500/60 bg-coral-500/10 p-4 text-sm text-coral-300 shadow-lg shadow-coral-500/5 animate-fadeInUp">
                <svg className="h-5 w-5 text-coral-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <div>
                  <p className="font-semibold text-coral-300">Interrupted — Re-planning</p>
                  <p className="text-xs text-coral-400/90 mt-0.5">
                    Context preserved. Agent is re-planning from your new instruction.
                  </p>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div className="flex items-start gap-3 rounded-xl border border-coral-500/60 bg-coral-500/10 p-4 text-sm text-coral-300 shadow-lg animate-fadeInUp">
                <svg className="h-5 w-5 text-coral-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>
                  <p className="font-semibold text-coral-300">Notice</p>
                  <p className="text-xs text-coral-400/90 mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Status Indicator */}
            <StatusIndicator state={state} taskId={taskId} />

            {/* Real-time Agent Activity & Observability Panel */}
            <ActivityPanel metrics={metrics} />

            {/* Live Plan Panel */}
            <PlanPanel plan={plan} isReplan={isReplan} taskId={taskId} />

            {/* Task History Timeline */}
            <div className="rounded-xl border border-base-800 bg-base-900/70 p-5 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between border-b border-base-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Task History
                  </h3>
                </div>
                {timeline?.length > 0 && (
                  <span className="font-mono-data text-[11px] text-gray-500">
                    {timeline.length} events
                  </span>
                )}
              </div>
              <TaskTimeline events={timeline} />
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-base-800 bg-base-900/50 py-3 px-4 text-xs font-medium text-gray-400 hover:border-base-700 hover:bg-base-800 hover:text-gray-200 transition-all cursor-pointer"
            >
              <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              Reset Session / New Task
            </button>
          </aside>
        </div>

      </div>
    </div>
  )
}
