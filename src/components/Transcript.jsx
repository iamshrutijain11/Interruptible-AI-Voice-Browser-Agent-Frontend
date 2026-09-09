import React from 'react'

// ISO 639-1 -> display label for the language badge
const LANG_LABELS = {
  en: 'EN', es: 'ES', hi: 'हि', fr: 'FR', de: 'DE',
  ja: '日本語', pt: 'PT', ar: 'AR', it: 'IT',
}

function LanguageBadge({ lang }) {
  if (!lang || lang === 'en' || lang === 'und' || lang === '') return null
  const label = LANG_LABELS[lang] || lang.toUpperCase()
  return (
    <span
      title={`Detected language: ${lang}`}
      className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-400 tracking-wide select-none"
    >
      🌐 {label}
    </span>
  )
}

export default function Transcript({ userText, agentText, interrupted, detectedLanguage }) {
  const hasUser = Boolean(userText)
  const hasAgent = Boolean(agentText)

  return (
    <div className="space-y-4">
      {/* User Utterance Box */}
      <div className="rounded-xl border border-base-800 bg-base-900/60 p-4 transition-all duration-200 hover:border-base-700/80">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-base-800 text-[10px] font-semibold text-gray-400">
            U
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
            You said
          </span>
          {/* Language badge — only shown for non-English detected languages */}
          <LanguageBadge lang={detectedLanguage} />
        </div>
        <p className={`text-sm sm:text-base ${hasUser ? 'text-gray-100 font-medium' : 'text-gray-600 italic'}`}>
          {userText || 'Nothing yet — tap the microphone or type below to begin.'}
        </p>
      </div>

      {/* Agent Response Box — Primary Visual Anchor */}
      <div
        className={`relative overflow-hidden rounded-xl border p-5 sm:p-6 transition-all duration-300 ${
          interrupted
            ? 'border-coral-500/60 bg-coral-500/10 shadow-lg shadow-coral-500/5'
            : hasAgent
            ? 'border-amber-500/40 bg-gradient-to-b from-base-900/90 to-base-900/60 shadow-xl shadow-amber-500/5'
            : 'border-base-800 bg-base-900/40'
        }`}
      >
        {/* Subtle accent line on top of active agent card */}
        {hasAgent && !interrupted && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
        )}

        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                interrupted
                  ? 'bg-coral-500/20 text-coral-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              AI
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {interrupted ? 'Response Interrupted' : 'Agent Response'}
            </span>
          </div>

          {interrupted && (
            <span className="inline-flex items-center rounded-full border border-coral-500/30 bg-coral-500/10 px-2 py-0.5 text-[11px] font-medium text-coral-400">
              Superseded
            </span>
          )}
        </div>

        {/* Scaled-up prominent agent response text */}
        <p
          className={`leading-relaxed transition-all ${
            hasAgent
              ? 'text-base sm:text-lg lg:text-xl font-medium text-gray-100'
              : 'text-sm sm:text-base text-gray-600 italic'
          }`}
        >
          {agentText || 'Waiting for a voice command...'}
        </p>
      </div>
    </div>
  )
}
