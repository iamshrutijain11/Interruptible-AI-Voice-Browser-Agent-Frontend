import React from 'react'

const STATE_META = {
  IDLE: {
    label: 'Idle',
    dot: 'bg-base-600',
    badge: 'bg-base-800/80 text-gray-400 border-base-700/60',
    hint: 'Ready for your request',
  },
  LISTENING: {
    label: 'Listening',
    dot: 'bg-teal-400 animate-ping',
    badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    hint: 'Listening to your voice...',
  },
  THINKING: {
    label: 'Thinking',
    dot: 'bg-amber-400 animate-pulse',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    hint: 'Parsing search constraints',
  },
  BROWSING: {
    label: 'Browsing',
    dot: 'bg-teal-400 animate-pulse',
    badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    hint: 'Automating browser search',
  },
  SPEAKING: {
    label: 'Speaking',
    dot: 'bg-amber-400 animate-pulse',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    hint: 'Synthesizing voice response',
  },
  INTERRUPTED: {
    label: 'Interrupted',
    dot: 'bg-coral-400',
    badge: 'bg-coral-500/20 text-coral-300 border-coral-500/40',
    hint: 'Task superseded by new command',
  },
  COMPLETED: {
    label: 'Completed',
    dot: 'bg-teal-400',
    badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    hint: 'Search finished successfully',
  },
  ERROR: {
    label: 'Error',
    dot: 'bg-coral-400',
    badge: 'bg-coral-500/20 text-coral-300 border-coral-500/40',
    hint: 'An issue occurred during execution',
  },
}

export default function StatusIndicator({ state, taskId }) {
  const meta = STATE_META[state] || STATE_META.IDLE

  return (
    <div className="rounded-xl border border-base-800 bg-base-900/70 p-4 backdrop-blur-sm transition-all duration-300">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            System State
          </span>
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors duration-200 ${meta.badge}`}
        >
          {meta.label}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between pt-2 border-t border-base-800/80">
        <span className="text-xs text-gray-400">{meta.hint}</span>
        {taskId ? (
          <span className="font-mono-data rounded bg-base-950/80 px-2 py-0.5 text-[11px] text-gray-400 border border-base-800">
            {taskId}
          </span>
        ) : (
          <span className="font-mono-data text-[11px] text-gray-600">no active task</span>
        )}
      </div>
    </div>
  )
}
