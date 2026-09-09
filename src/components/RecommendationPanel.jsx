import React from 'react'

function ScoreBar({ label, value, color = 'teal' }) {
  const pct = Math.round((value || 0) * 100)
  const colorMap = {
    teal:   'from-teal-500 to-teal-400',
    amber:  'from-amber-500 to-amber-400',
    violet: 'from-violet-500 to-violet-400',
  }
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-bold text-gray-300">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-base-800 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colorMap[color] || colorMap.teal}
            transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function SiteChip({ site }) {
  const siteColors = {
    amazon:   'bg-amber-500/10 text-amber-300 border-amber-500/30',
    snapdeal: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    myntra:   'bg-pink-500/10 text-pink-300 border-pink-500/30',
    nykaa:    'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30',
    meesho:   'bg-purple-500/10 text-purple-300 border-purple-500/30',
  }
  const cls = siteColors[(site || '').toLowerCase()] || 'bg-base-800 text-gray-300 border-base-700'
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {site}
    </span>
  )
}

export default function RecommendationPanel({
  recommendation,
  awaitingApproval,
  onApprove,
  onReject,
}) {
  if (!recommendation) return null

  const topScore = recommendation.scores?.[recommendation.top_pick_index]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-500/30
      bg-gradient-to-b from-violet-500/5 to-base-900/80 p-5 sm:p-6 space-y-5
      shadow-xl shadow-violet-500/5 backdrop-blur-md animate-fadeInUp">

      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5
        bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl
          bg-violet-500/20 border border-violet-500/30 text-sm">
          ✨
        </span>
        <div>
          <h3 className="text-sm font-bold text-violet-200 tracking-tight">
            AI Recommendation
          </h3>
          <p className="text-[10px] text-gray-500">
            Analyzed {recommendation.total_found} products across{' '}
            {recommendation.sources_searched?.length || 1} site(s)
          </p>
        </div>
        <div className="ml-auto flex gap-1.5 flex-wrap justify-end">
          {(recommendation.sources_searched || []).map(s => (
            <SiteChip key={s} site={s} />
          ))}
        </div>
      </div>

      {/* Top Pick or No Results */}
      {recommendation.top_pick_name ? (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500
                  px-1.5 py-0.5 text-[10px] font-bold text-base-950">
                  ★ Top Pick
                </span>
                {recommendation.top_pick_site && (
                  <SiteChip site={recommendation.top_pick_site} />
                )}
              </div>
              <p className="text-sm font-semibold text-gray-100 leading-snug line-clamp-2">
                {recommendation.top_pick_name}
              </p>
            </div>
            {recommendation.top_pick_price && (
              <span className="text-xl font-bold text-amber-400 shrink-0 tabular-nums">
                {recommendation.top_pick_price}
              </span>
            )}
          </div>

          {/* Reason */}
          {recommendation.reason && (
            <p className="text-xs text-gray-300 leading-relaxed border-t border-violet-500/10 pt-2">
              💡 {recommendation.reason}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-base-800 bg-base-900/60 p-4 text-center space-y-1">
          <p className="text-sm font-semibold text-gray-300">No matching products found</p>
          <p className="text-xs text-gray-500">
            {recommendation.reason || 'Try searching with different keywords or widening your price filters.'}
          </p>
        </div>
      )}

      {/* Score breakdown for top pick */}
      {topScore && recommendation.top_pick_name && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Score Breakdown
          </p>
          <div className="space-y-2">
            <ScoreBar label="Price Fit"   value={topScore.price_fit}    color="teal"   />
            <ScoreBar label="Rating"      value={topScore.rating_score}  color="amber"  />
            <ScoreBar label="Value Score" value={topScore.value_score}   color="violet" />
          </div>
        </div>
      )}

      {/* Comparison summary */}
      {recommendation.comparison_summary && (
        <div className="rounded-lg border border-base-800 bg-base-900/60 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            📊 Comparison
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">
            {recommendation.comparison_summary}
          </p>
        </div>
      )}

      {/* Approval buttons */}
      {awaitingApproval && recommendation.top_pick_name && (
        <div className="border-t border-base-800/80 pt-4 space-y-2">
          <p className="text-xs text-center text-gray-400 font-medium">
            ✋ Agent is waiting — approve to open the product, or reject to refine
          </p>
          <div className="flex gap-3">
            <button
              id="btn-approve"
              onClick={onApprove}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl
                bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500
                py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-500/20
                transition-all duration-200 active:scale-95 cursor-pointer"
            >
              ✓ Approve
            </button>
            <button
              id="btn-reject"
              onClick={onReject}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl
                border border-base-700 bg-base-800/80 hover:bg-base-700 hover:border-base-600
                py-2.5 text-sm font-medium text-gray-300 hover:text-white
                transition-all duration-200 active:scale-95 cursor-pointer"
            >
              ✗ Reject
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
