import React from 'react'

// ─── Activity state config ───────────────────────────────────────────────────
const ACTIVITY_CONFIG = {
  idle:             { label: 'Idle',                  icon: '◉',  color: 'text-gray-500',   dot: 'bg-gray-600',    pulse: false },
  listening:        { label: 'Listening',              icon: '🎙️', color: 'text-teal-300',   dot: 'bg-teal-400',    pulse: true  },
  understanding:    { label: 'Understanding',          icon: '🧠', color: 'text-amber-300',  dot: 'bg-amber-400',   pulse: true  },
  planning:         { label: 'Planning',               icon: '🗺️', color: 'text-violet-300', dot: 'bg-violet-400',  pulse: true  },
  browsing:         { label: 'Browsing',               icon: '🌐', color: 'text-teal-300',   dot: 'bg-teal-400',    pulse: true  },
  extracting:       { label: 'Extracting data',        icon: '📦', color: 'text-blue-300',   dot: 'bg-blue-400',    pulse: true  },
  processing:       { label: 'Processing',             icon: '📊', color: 'text-cyan-300',   dot: 'bg-cyan-400',    pulse: true  },
  reasoning:        { label: 'Reasoning',              icon: '✨', color: 'text-violet-300', dot: 'bg-violet-400',  pulse: true  },
  waiting_approval: { label: 'Waiting for approval',  icon: '✋', color: 'text-sky-300',    dot: 'bg-sky-400',     pulse: true  },
  executing:        { label: 'Executing',              icon: '🚀', color: 'text-amber-300',  dot: 'bg-amber-400',   pulse: true  },
  completed:        { label: 'Completed',              icon: '✅', color: 'text-teal-300',   dot: 'bg-teal-400',    pulse: false },
  interrupted:      { label: 'Interrupted',            icon: '⚡', color: 'text-coral-300',  dot: 'bg-coral-400',   pulse: false },
  error:            { label: 'Error',                  icon: '⚠️', color: 'text-coral-300',  dot: 'bg-coral-400',   pulse: false },
}

// ─── Metric tile ─────────────────────────────────────────────────────────────
function MetricTile({ label, value, icon, accent = 'teal', highlight = false }) {
  const accents = {
    teal:   'border-teal-500/20  bg-teal-500/5  text-teal-300',
    amber:  'border-amber-500/20 bg-amber-500/5 text-amber-300',
    violet: 'border-violet-500/20 bg-violet-500/5 text-violet-300',
    coral:  'border-coral-500/20 bg-coral-500/5 text-coral-300',
    blue:   'border-blue-500/20  bg-blue-500/5  text-blue-300',
    sky:    'border-sky-500/20   bg-sky-500/5   text-sky-300',
  }
  const cls = accents[accent] || accents.teal

  return (
    <div className={`flex flex-col gap-1 rounded-xl border p-3 transition-all duration-300
      ${highlight ? cls : 'border-base-800 bg-base-900/60'}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </span>
        <span className="text-base leading-none">{icon}</span>
      </div>
      <span className={`text-2xl font-bold tabular-nums tracking-tight
        ${highlight ? cls.split(' ').find(c => c.startsWith('text-')) : 'text-gray-100'}`}>
        {value ?? 0}
      </span>
    </div>
  )
}

// ─── Activity indicator row ───────────────────────────────────────────────────
function ActivityRow({ activity, currentAction }) {
  const cfg = ACTIVITY_CONFIG[activity] || ACTIVITY_CONFIG.idle

  return (
    <div className="flex items-start gap-3">
      <div className="relative flex h-3 w-3 items-center justify-center mt-0.5 shrink-0">
        <span className={`absolute inline-flex h-3 w-3 rounded-full ${cfg.dot} opacity-40
          ${cfg.pulse ? 'animate-ping' : ''}`} />
        <span className={`relative h-2 w-2 rounded-full ${cfg.dot}`} />
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${cfg.color} transition-colors duration-300`}>
          {cfg.label}
        </p>
        {currentAction && (
          <p className="mt-0.5 text-xs text-gray-400 leading-snug truncate" title={currentAction}>
            {currentAction}
          </p>
        )}
      </div>
      <span className="ml-auto text-lg leading-none shrink-0 mt-0.5">{cfg.icon}</span>
    </div>
  )
}

// ─── Main panel ──────────────────────────────────────────────────────────────
export default function ActivityPanel({ metrics }) {
  if (!metrics) {
    return (
      <div className="rounded-xl border border-dashed border-base-800 p-5 text-center text-xs text-gray-500">
        Agent activity will appear here once a task starts.
      </div>
    )
  }

  const {
    activity        = 'idle',
    current_task    = '',
    current_action  = '',
    websites_visited  = 0,
    pages_analyzed    = 0,
    actions_performed = 0,
    records_extracted = 0,
    interruptions     = 0,
    replans           = 0,
  } = metrics

  const isActive = !['idle', 'completed', 'error'].includes(activity)

  return (
    <div className={`rounded-xl border overflow-hidden transition-all duration-500
      ${isActive
        ? 'border-teal-500/30 shadow-lg shadow-teal-500/5'
        : 'border-base-800'
      } bg-base-900/70 backdrop-blur-sm`}>

      {/* Header */}
      <div className={`px-4 py-3 border-b border-base-800/80 flex items-center justify-between
        ${isActive ? 'bg-gradient-to-r from-teal-500/5 to-transparent' : ''}`}>
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-teal-400" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
          </svg>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Agent Activity
          </h3>
        </div>
        {isActive && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30
            bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-300">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">

        {/* Current task */}
        {current_task && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Current Task
            </p>
            <p className="text-sm font-medium text-gray-200 leading-snug line-clamp-2"
               title={current_task}>
              {current_task}
            </p>
          </div>
        )}

        {/* Activity indicator */}
        <div className="rounded-xl border border-base-800 bg-base-950/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Current Action
          </p>
          <ActivityRow activity={activity} currentAction={current_action} />
        </div>

        {/* Metrics grid */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Session Metrics
          </p>
          <div className="grid grid-cols-2 gap-2">
            <MetricTile
              label="Websites"
              value={websites_visited}
              icon="🌐"
              accent="teal"
              highlight={websites_visited > 0}
            />
            <MetricTile
              label="Products"
              value={records_extracted}
              icon="📦"
              accent="blue"
              highlight={records_extracted > 0}
            />
            <MetricTile
              label="Pages"
              value={pages_analyzed}
              icon="📄"
              accent="sky"
              highlight={pages_analyzed > 0}
            />
            <MetricTile
              label="Actions"
              value={actions_performed}
              icon="⚙️"
              accent="violet"
              highlight={actions_performed > 0}
            />
            <MetricTile
              label="Interruptions"
              value={interruptions}
              icon="⚡"
              accent="coral"
              highlight={interruptions > 0}
            />
            <MetricTile
              label="Re-plans"
              value={replans}
              icon="🔄"
              accent="amber"
              highlight={replans > 0}
            />
          </div>
        </div>

      </div>
    </div>
  )
}
