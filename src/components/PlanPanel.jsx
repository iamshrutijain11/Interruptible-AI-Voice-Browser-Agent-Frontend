import React from 'react'

// Icon per step id
const STEP_ICONS = {
  understand:  '🧠',
  plan:        '🗺️',
  browse:      '🌐',
  extract:     '📦',
  analyze:     '📊',
  recommend:   '✨',
  approve:     '✋',
  act:         '🚀',
}

const STATUS_STYLES = {
  pending:     { ring: 'border-base-700',         dot: 'bg-base-600',        text: 'text-gray-500' },
  running:     { ring: 'border-amber-500/60',      dot: 'bg-amber-400',       text: 'text-amber-300' },
  completed:   { ring: 'border-teal-500/50',       dot: 'bg-teal-400',        text: 'text-teal-300'  },
  failed:      { ring: 'border-coral-500/60',      dot: 'bg-coral-400',       text: 'text-coral-300' },
  interrupted: { ring: 'border-amber-500/40',      dot: 'bg-amber-500',       text: 'text-amber-400' },
  skipped:     { ring: 'border-base-700',          dot: 'bg-base-700',        text: 'text-gray-600'  },
}

function StepRow({ step, isLast }) {
  const st = STATUS_STYLES[step.status] || STATUS_STYLES.pending
  const icon = STEP_ICONS[step.id] || '•'
  const isRunning     = step.status === 'running'
  const isInterrupted = step.status === 'interrupted'

  return (
    <li className="flex gap-2.5 group">
      {/* Timeline spine */}
      <div className="relative flex flex-col items-center shrink-0" style={{ width: 20 }}>
        <span
          className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full border text-[10px]
            ${st.ring} ${isRunning ? 'animate-pulse shadow-[0_0_8px] shadow-amber-500/40' : ''}
            ${step.status === 'completed' ? 'bg-teal-500/10' : 'bg-base-950'}
            transition-all duration-300`}
        >
          {isInterrupted ? '⚡' : isRunning ? '⟳' : step.status === 'completed' ? '✓' : icon}
        </span>
        {!isLast && (
          <span className={`absolute top-5 bottom-0 w-px ${
            step.status === 'completed' ? 'bg-teal-500/30' : 'bg-base-800'
          }`} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-3 pt-0.5 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-xs font-medium ${st.text} transition-colors duration-200`}>
            {step.label}
          </span>
          {isRunning && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30
              bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400 animate-pulse">
              LIVE
            </span>
          )}
          {isInterrupted && (
            <span className="inline-flex items-center rounded-full border border-amber-500/30
              bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
              ⚡ INT
            </span>
          )}
          {step.status === 'completed' && (
            <span className="text-[9px] text-teal-500">✓</span>
          )}
          {step.status === 'failed' && (
            <span className="text-[9px] text-coral-400">✗</span>
          )}
        </div>
        {step.detail && (
          <p className="mt-0.5 text-[10px] text-gray-500 truncate" title={step.detail}>
            {step.detail}
          </p>
        )}
      </div>
    </li>
  )
}

export default function PlanPanel({ plan, isReplan, taskId }) {
  if (!plan || plan.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-base-800 p-5 text-center text-xs text-gray-500">
        Speak a command to see the agent's live plan.
      </div>
    )
  }

  const completedCount = plan.filter(s => s.status === 'completed').length
  const progress = Math.round((completedCount / plan.length) * 100)

  return (
    <div className="rounded-xl border border-base-800 bg-base-900/70 p-4 backdrop-blur-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-base-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">🗂️</span>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Agent Plan
          </h3>
          {isReplan && (
            <span className="inline-flex items-center rounded-full border border-amber-500/30
              bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
              🔄 Re-planning
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 rounded-full bg-base-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-amber-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 font-mono-data">{progress}%</span>
        </div>
      </div>

      {/* Steps */}
      <ol className="space-y-0">
        {plan.map((step, i) => (
          <StepRow key={step.id} step={step} isLast={i === plan.length - 1} />
        ))}
      </ol>
    </div>
  )
}
