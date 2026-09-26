import { useState, useEffect, useCallback } from 'react'
import { getHistory, getReport, deleteAnalysis, downloadPDF } from '../api/client'
import ScoreGauge from '../components/ScoreGauge'
import RiskCard from '../components/RiskCard'
import TrustBadge from '../components/TrustBadge'
import { formatDate, downloadJSON, reportFilename } from '../utils/formatters'
import { pct } from '../utils/trustLevel'

const PAGE_SIZE = 10

// ── Report detail modal ───────────────────────────────────────────────────────
function ReportModal({ id, onClose }) {
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  async function handlePDF() {
    if (!data?.id) return
    setPdfLoading(true)
    try {
      await downloadPDF(data.id, reportFilename(data.id, data.created_at).replace('.json', '.pdf'))
    } catch (e) {
      setError(`PDF failed: ${e.message}`)
    } finally {
      setPdfLoading(false)
    }
  }

  useEffect(() => {
    getReport(id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 flex flex-col gap-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition-colors"
        >
          ✕
        </button>

        <h2 className="text-lg font-bold text-slate-100">Full Report</h2>

        {loading && <p className="text-slate-400 text-sm">Loading…</p>}
        {error   && <p className="text-red-400 text-sm">{error}</p>}

        {data && (
          <>
            <div className="flex items-center gap-4 flex-wrap">
              <ScoreGauge score={data.trust_engine?.trust_score ?? 0} size={120} />
              <div className="flex flex-col gap-2">
                <TrustBadge score={data.trust_engine?.trust_score ?? 0} />
                <span className="text-xs text-slate-500">{formatDate(data.created_at)}</span>
                <span className="text-xs text-slate-500">ID: {data.id}</span>
              </div>
            </div>

            <p className="text-sm text-slate-400">{data.summary}</p>

            {/* Score cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.scores && Object.entries(data.scores).map(([key, s]) => (
                <RiskCard
                  key={key}
                  title={key.replace(/_/g, ' ')}
                  score={s.score}
                  explanation={s.explanation}
                  invert={key !== 'confidence'}
                  icon={key === 'confidence' ? '🎯' : key === 'hallucination_risk' ? '⚠️' : key === 'bias' ? '⚖️' : key === 'prompt_injection' ? '🛡️' : '🔎'}
                />
              ))}
            </div>

            {/* Recommendations */}
            {data.trust_engine?.recommendations?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Recommendations</h4>
                <ul className="flex flex-col gap-1.5">
                  {data.trust_engine.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="text-brand-400 mt-0.5">›</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bias flags */}
            {data.bias_flags?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Bias Flags</h4>
                {data.bias_flags.map((f, i) => (
                  <div key={i} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-300 mb-1.5">⚖️ {f}</div>
                ))}
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => downloadJSON(data, reportFilename(data.id, data.created_at))}
                className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors"
              >
                ⬇ JSON
              </button>
              <button
                onClick={handlePDF}
                disabled={pdfLoading}
                className="rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-medium text-red-300 transition-colors flex items-center gap-2"
              >
                {pdfLoading ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Generating…
                  </>
                ) : '⬇ PDF Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── History row ───────────────────────────────────────────────────────────────
function HistoryRow({ item, onView, onDelete }) {
  const teScore    = item.trust_score != null ? Math.round(item.trust_score * 100) : 0
  // Q7: inline confirm state — avoids blocking window.confirm
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-700/60 bg-slate-800/40 px-5 py-4 hover:border-slate-600 transition-colors">
      {/* Mini gauge */}
      <div className="shrink-0">
        <ScoreGauge score={teScore} size={64} />
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <TrustBadge score={teScore} />
          <span className="text-xs text-slate-500">{formatDate(item.created_at)}</span>
        </div>
        <p className="text-xs text-slate-400 truncate">{item.summary}</p>
        <div className="flex gap-4 text-xs text-slate-500 mt-0.5">
          <span>Hallucination: <span className="text-slate-300">{item.hallucination_risk}</span></span>
          <span>Confidence: <span className="text-slate-300">{pct(item.confidence_score)}</span></span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onView(item.id)}
          className="rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-400 hover:bg-brand-500/20 transition-colors"
        >
          View
        </button>
        {confirming ? (
          <div className="flex gap-1 items-center">
            <span className="text-xs text-slate-400">Sure?</span>
            <button
              onClick={() => { setConfirming(false); onDelete(item.id) }}
              className="rounded-lg bg-red-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-600 transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-400 hover:bg-slate-700 transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/15 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

// ── Reports page ──────────────────────────────────────────────────────────────
export default function Reports() {
  const [page,     setPage]     = useState(1)
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [modalId,  setModalId]  = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getHistory(page, PAGE_SIZE)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    try {
      await deleteAnalysis(id)
      load()
    } catch (e) {
      setError(e.message)
    }
  }

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-50">Reports</h1>
          <p className="text-slate-400 text-sm mt-1">
            {data ? `${data.total} analysis record${data.total !== 1 ? 's' : ''}` : 'Loading…'}
          </p>
        </div>
        <button
          onClick={load}
          className="rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 px-5 py-2.5 text-sm text-slate-300 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && data?.items?.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-700/40 bg-slate-800/20 py-20 text-center">
          <span className="text-5xl">📭</span>
          <p className="text-slate-400 text-sm">No analyses yet. Run your first analysis to see reports here.</p>
        </div>
      )}

      {/* History list */}
      {data?.items?.length > 0 && (
        <div className="flex flex-col gap-3">
          {data.items.map((item) => (
            <HistoryRow
              key={item.id}
              item={item}
              onView={setModalId}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 disabled:opacity-30 hover:bg-slate-800 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-slate-500">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 disabled:opacity-30 hover:bg-slate-800 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Modal */}
      {modalId && <ReportModal id={modalId} onClose={() => setModalId(null)} />}
    </div>
  )
}
