import React, { useState } from 'react'

const SITE_COLORS = {
  amazon:   'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/25',
  snapdeal: 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/25',
  myntra:   'bg-pink-500/10 text-pink-300 border-pink-500/30 hover:bg-pink-500/25',
  nykaa:    'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30 hover:bg-fuchsia-500/25',
  meesho:   'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/25',
}
const SITE_COLORS_ACTIVE = {
  amazon:   'bg-amber-500/30 text-amber-200 border-amber-400/70 ring-1 ring-amber-400/50',
  snapdeal: 'bg-rose-500/30 text-rose-200 border-rose-400/70 ring-1 ring-rose-400/50',
  myntra:   'bg-pink-500/30 text-pink-200 border-pink-400/70 ring-1 ring-pink-400/50',
  nykaa:    'bg-fuchsia-500/30 text-fuchsia-200 border-fuchsia-400/70 ring-1 ring-fuchsia-400/50',
  meesho:   'bg-purple-500/30 text-purple-200 border-purple-400/70 ring-1 ring-purple-400/50',
}

function siteKey(s) { return (s || '').toLowerCase() }

export default function Results({
  results,
  emptyMessage,
  onFilterApply,
  onFilterClear,
  activeRange,
  isFallback,
  warning,
}) {
  const [minVal, setMinVal] = useState('')
  const [maxVal, setMaxVal] = useState('')
  const [selectedStore, setSelectedStore] = useState(null)

  function handleApply(e) {
    e?.preventDefault()
    if (!minVal && !maxVal) return
    onFilterApply?.(minVal.trim(), maxVal.trim())
  }

  function handleClear() {
    setMinVal('')
    setMaxVal('')
    onFilterClear?.()
  }

  function handleStoreToggle(store) {
    setSelectedStore((prev) => (prev === store ? null : store))
  }

  // Assertion guard: only render items with valid name
  const validResults = (results || []).filter((r) => Boolean(r && r.name && r.name.trim()))

  const isFallbackMode = Boolean(isFallback || validResults.some((r) => r.is_fallback))

  const sitesFound = Array.from(new Set(validResults.map((r) => r.site).filter(Boolean)))

  // Apply store filter on top of valid results
  const displayResults = selectedStore
    ? validResults.filter((r) => siteKey(r.site) === siteKey(selectedStore))
    : validResults

  const fallbackBanner = isFallbackMode && (
    <div className="mb-4 rounded-xl border border-amber-500/50 bg-amber-500/10 p-3.5 text-amber-200 flex items-start gap-3 shadow-md shadow-amber-500/5 animate-fadeInUp">
      <span className="text-xl leading-none mt-0.5" role="img" aria-label="warning">⚠️</span>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Local Fallback Demo Mode
          </p>
          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
            Offline Demo Data
          </span>
        </div>
        <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
          {warning || "Live browser scraping timed out or encountered anti-bot protection. Displaying local demo catalog items for demonstration purposes."}
        </p>
      </div>
    </div>
  )

  const filterBar = (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-base-900/60 border border-base-800/80 rounded-xl p-3 mb-4 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleApply} className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Price Range:
          </span>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <span className="absolute inset-y-0 left-2.5 flex items-center text-xs text-gray-500">₹</span>
              <input
                type="number"
                placeholder="Min"
                value={minVal}
                onChange={(e) => setMinVal(e.target.value)}
                className="w-20 pl-6 pr-2 py-1.5 text-xs bg-base-950/90 border border-base-700/80 rounded-lg text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
              />
            </div>
            <span className="text-gray-500 text-xs font-medium">to</span>
            <div className="relative">
              <span className="absolute inset-y-0 left-2.5 flex items-center text-xs text-gray-500">₹</span>
              <input
                type="number"
                placeholder="Max"
                value={maxVal}
                onChange={(e) => setMaxVal(e.target.value)}
                className="w-20 pl-6 pr-2 py-1.5 text-xs bg-base-950/90 border border-base-700/80 rounded-lg text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
              />
            </div>
            <button
              type="submit"
              disabled={!minVal && !maxVal}
              className="px-3 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-base-950 rounded-lg transition-colors cursor-pointer"
            >
              Apply
            </button>
          </div>
        </form>

        {/* Interactive Multi-Store Filter Badges */}
        {sitesFound.length > 0 && (
          <div className="flex items-center gap-1.5 border-l border-base-800/80 pl-3">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Stores:
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {sitesFound.map((s) => {
                const key = siteKey(s)
                const isActive = selectedStore && siteKey(selectedStore) === key
                const baseClass = isActive
                  ? (SITE_COLORS_ACTIVE[key] || 'bg-base-700 text-white border-base-500 ring-1 ring-base-400')
                  : (SITE_COLORS[key] || 'bg-base-800 text-gray-300 border-base-700 hover:bg-base-700')
                return (
                  <button
                    key={s}
                    onClick={() => handleStoreToggle(s)}
                    title={isActive ? `Clear ${s} filter` : `Show only ${s}`}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${baseClass}`}
                  >
                    {isActive && <span className="mr-0.5">✓</span>}
                    {s}
                  </button>
                )
              })}
              {selectedStore && (
                <button
                  onClick={() => setSelectedStore(null)}
                  title="Show all stores"
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition-all cursor-pointer"
                >
                  All
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active Price Filter Chip */}
      {activeRange && (activeRange.min != null || activeRange.max != null) && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full text-xs font-medium">
          <span>
            ₹{activeRange.min != null ? activeRange.min.toLocaleString() : '0'} –{' '}
            {activeRange.max != null ? `₹${activeRange.max.toLocaleString()}` : 'Any'}
          </span>
          <button
            onClick={handleClear}
            className="text-amber-400 hover:text-white transition-colors cursor-pointer ml-1 p-0.5"
            title="Clear filter"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )

  if (validResults.length === 0) {
    return (
      <div>
        {fallbackBanner}
        {activeRange && filterBar}
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
            {warning || emptyMessage || 'Results will appear here once the browser finishes searching.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {fallbackBanner}
      {filterBar}

      {/* Store filter active notice */}
      {selectedStore && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-xs text-gray-400">
            Showing <span className="font-semibold text-gray-200">{displayResults.length}</span> result{displayResults.length !== 1 ? 's' : ''} from <span className="font-semibold text-gray-200">{selectedStore}</span>
          </span>
          <button onClick={() => setSelectedStore(null)} className="text-[11px] text-gray-500 hover:text-gray-300 underline cursor-pointer transition-colors">
            show all
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayResults.map((item, i) => {
          const hasUrl = Boolean(item.url)
          const isTopPick = !selectedStore && i === 0
          const isItemFallback = Boolean(item.is_fallback || isFallbackMode)

          const cardContent = (
            <>
              {/* Image */}
              <div className="relative aspect-[4/3] bg-base-950/80 flex items-center justify-center overflow-hidden border-b border-base-800/80">
                {item.image ? (
                  <>
                    <img
                      src={item.image}
                      alt=""
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        if (e.currentTarget.nextElementSibling) {
                          e.currentTarget.nextElementSibling.style.display = 'flex'
                        }
                      }}
                      className="h-full w-full object-contain p-3 transition-transform duration-300 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div
                      style={{ display: 'none' }}
                      className="flex flex-col items-center justify-center text-gray-600 gap-1.5 p-4 text-center"
                    >
                      <svg className="h-7 w-7 text-base-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span className="text-[10px] text-gray-500 font-medium">Image unavailable</span>
                    </div>
                  </>
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

                {/* Top-Left Badges: Store + Top Pick + Bestseller */}
                <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10 max-w-[70%]">
                  {item.site && (
                    <div
                      className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold shadow-md uppercase tracking-wider ${
                        siteKey(item.site) === 'amazon'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur'
                          : siteKey(item.site) === 'snapdeal'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 backdrop-blur'
                          : siteKey(item.site) === 'myntra'
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 backdrop-blur'
                          : siteKey(item.site) === 'nykaa'
                          ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 backdrop-blur'
                          : siteKey(item.site) === 'meesho'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 backdrop-blur'
                          : 'bg-base-800 text-gray-300 border border-base-700'
                      }`}
                    >
                      {item.site}
                    </div>
                  )}
                  {isTopPick && (
                    <div className="flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-base-950 shadow-md">
                      <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      Top Pick
                    </div>
                  )}
                  {item.is_bestseller && (
                    <div className="flex items-center gap-1 rounded-md bg-gradient-to-r from-rose-500 to-pink-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                      ★ Bestseller
                    </div>
                  )}
                </div>

                {/* Top-Right Badge: Demo Catalog indicator */}
                {isItemFallback && (
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <span className="rounded bg-amber-500/90 text-base-950 px-2 py-0.5 text-[9px] font-extrabold shadow-md uppercase tracking-wider">
                      Demo
                    </span>
                  </div>
                )}

                {/* External link indicator */}
                {hasUrl && (
                  <div className="absolute top-2.5 right-2.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 rounded-md bg-base-900/80 p-1 text-gray-300 backdrop-blur z-10">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3.5 flex flex-col justify-between flex-1">
                <div>
                  <p className="text-sm font-medium text-gray-200 line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                    {item.name}
                  </p>
                  {item.rating ? (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="inline-flex items-center gap-1 rounded bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 text-[11px] font-semibold text-amber-300">
                        <span>★</span>
                        <span>{item.rating}</span>
                      </span>
                      {item.review_count ? (
                        <span className="text-[11px] text-gray-400">
                          ({item.review_count.toLocaleString()} reviews)
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-base-800/50">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-amber-400 tracking-tight">
                      {item.price}
                    </span>
                    {item.site && (
                      <span className="text-[10px] text-gray-500 font-medium">
                        on {item.site}
                      </span>
                    )}
                  </div>
                  {hasUrl && (
                    <span className="text-[11px] font-medium text-gray-500 group-hover:text-teal-400 transition-colors">
                      Buy on {item.site || 'Store'} &rarr;
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
    </div>
  )
}
