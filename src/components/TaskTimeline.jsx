import React from 'react'

const TYPE_META = {
  'task.started': {
    label: 'Task started',
    dot: 'bg-teal-400 ring-4 ring-teal-500/10',
    color: 'text-teal-300',
  },
  'task.interrupted': {
    label: 'Task interrupted',
    dot: 'bg-coral-400 ring-4 ring-coral-500/20',
    color: 'text-coral-400',
  },
  'browser.started': {
    label: 'Browser automated',
    dot: 'bg-teal-400 ring-4 ring-teal-500/10',
    color: 'text-teal-300',
  },
  'browser.result': {
    label: 'Results received',
    dot: 'bg-teal-400 ring-4 ring-teal-500/10',
    color: 'text-teal-300',
  },
  'task.completed': {
    label: 'Task completed',
    dot: 'bg-amber-400 ring-4 ring-amber-500/15',
    color: 'text-amber-300',
  },
  'task.error': {
    label: 'Task failed',
    dot: 'bg-coral-400 ring-4 ring-coral-500/20',
    color: 'text-coral-400',
  },
}

export default function TaskTimeline({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-base-800 p-6 text-center text-xs text-gray-500">
        No task activity recorded yet.
      </div>
    )
  }

  return (
    <div className="max-h-80 overflow-y-auto pr-1">
      <ol className="relative space-y-0 pl-1">
        {events.map((ev, i) => {
          const meta = TYPE_META[ev.type] || {
            label: ev.type,
            dot: 'bg-base-600 ring-4 ring-base-700/20',
            color: 'text-gray-300',
          }
          const isLast = i === events.length - 1
          const detail =
            ev.type === 'task.interrupted'
              ? `${ev.old_task_id} → ${ev.new_task_id}`
              : ev.task_id

          return (
            <li key={i} className="flex gap-3 pb-3.5 group">
              <div className="relative flex flex-col items-center">
                <span className={`relative z-10 h-2 w-2 rounded-full ${meta.dot} mt-1.5 transition-transform duration-200 group-hover:scale-125`} />
                {!isLast && (
                  <span className="absolute top-3.5 bottom-0 w-px bg-base-800" />
                )}
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs sm:text-sm font-medium text-gray-200">
                    {meta.label}
                  </p>
                </div>
                {detail && (
                  <p className="font-mono-data mt-0.5 text-[11px] text-gray-500 tracking-tight">
                    {detail}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
