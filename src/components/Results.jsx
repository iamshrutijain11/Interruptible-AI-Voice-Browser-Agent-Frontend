import React from 'react'

export default function Results({ results, emptyMessage }) {
  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-base-800 bg-base-900/30 px-4 py-12 text-center">
        <svg
          className="h-9 w-9 text-base-600 mb-2.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <p className="text-sm text-gray-500 max-w-sm">
          {emptyMessage || 'Results will appear here once the browser finishes searching.'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {results.map((item, i) => {
        const hasUrl = Boolean(item.url)
        const isTopPick = i === 0

        const cardContent = (
          <>
            {/* Image Container with Consistent Aspect Ratio & Framing */}
            <div className="relative aspect-[4/3] bg-base-950/80 flex items-center justify-center overflow-hidden border-b border-base-800/80">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-contain p-3 transition-transform duration-300 ease-out group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-600 gap-1">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span className="text-xs">No image</span>
                </div>
              )}

              {/* Top Pick Badge */}
              {isTopPick && (
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-base-950 shadow-md">
                  <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Top Pick
                </div>
              )}

              {/* External Link Indicator */}
              {hasUrl && (
                <div className="absolute top-2.5 right-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 rounded-md bg-base-900/80 p-1 text-gray-300 backdrop-blur">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </div>
              )}
            </div>

            {/* Content Details */}
            <div className="p-3.5 flex flex-col justify-between flex-1">
              <p className="text-sm font-medium text-gray-200 line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                {item.name}
              </p>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-base font-bold text-amber-400 tracking-tight">
                  {item.price}
                </span>
                {hasUrl && (
                  <span className="text-[11px] font-medium text-gray-500 group-hover:text-teal-400 transition-colors">
                    View &rarr;
                  </span>
                )}
              </div>
            </div>
          </>
        )

        const containerClasses = `group relative flex flex-col rounded-xl border bg-base-900/80 overflow-hidden transition-all duration-200 ease-out animate-fadeInUp ${
          isTopPick
            ? 'border-amber-500/40 hover:border-amber-500 shadow-md shadow-amber-500/5'
            : 'border-base-800 hover:border-base-700 hover:shadow-lg'
        } hover:-translate-y-1`

        if (hasUrl) {
          return (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              style={{ animationDelay: `${i * 60}ms` }}
              className={`${containerClasses} cursor-pointer`}
            >
              {cardContent}
            </a>
          )
        }

        return (
          <div
            key={i}
            style={{ animationDelay: `${i * 60}ms` }}
            className={`${containerClasses} cursor-default`}
          >
            {cardContent}
          </div>
        )
      })}
    </div>
  )
}
