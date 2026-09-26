import { useState, useEffect, useCallback } from 'react'
import { getHistory, getReport, deleteAnalysis, downloadPDF } from '../api/client'
import ScoreGauge from '../components/ScoreGauge'
import RiskCard from '../components/RiskCard'
import TrustBadge from '../components/TrustBadge'
import { formatDate, downloadJSON, reportFilename } from '../utils/formatters'
import { pct } from '../utils/trustLevel'

const PAGE_SIZE = 10

// ── Report Detail Modal ───────────────────────────────────────────────────────
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="glass-card relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0B0F19] p-6 sm:p-8 flex flex-col gap-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 rounded-xl border border-white/10 bg-slate-900/80 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          ✕
        </button>

        <h2 className="text-xl font-extrabold text-white">Full Trust Analysis Report</h2>

        {loading && <p className="text-slate-400 text-sm animate-pulse">Loading report details…</p>}
        {error   && <p className="text-rose-400 text-sm font-semibold">{error}</p>}

        {data && (
          <>
            <div className="flex items-center gap-6 flex-wrap">
              <ScoreGauge score={data.trust_engine?.trust_score ?? 0} size={140} />
              <div className="flex flex-col gap-2">
                <TrustBadge score={data.trust_engine?.trust_score ?? 0} />
                <span className="text-xs font-semibold text-slate-400">Date: {formatDate(data.created_at)}</span>
                <span className="text-xs font-mono text-slate-500">ID: {data.id}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block mb-1">Executive Summary</span>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{data.summary}</p>
            </div>

            {/* Score Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">Actionable Recommendations</h4>
                <ul className="flex flex-col gap-1.5">
                  {data.trust_engine.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-cyan-400 mt-0.5">›</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bias Flags */}
            {data.bias_flags?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Bias Flags</h4>
                {data.bias_flags.map((f, i) => (
                  <div key={i} className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-300 mb-1.5 flex items-center gap-2">
                    <span>⚖️</span> {f}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-4 flex-wrap pt-2">
              <button
                onClick={() => downloadJSON(data, reportFilename(data.id, data.created_at))}
                className="btn-glow-secondary rounded-xl px-5 py-3 text-xs font-bold text-slate-200 uppercase tracking-wider"
              >
                ⬇ Export JSON
              </button>
              <button
                onClick={handlePDF}
                disabled={pdfLoading}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 text-xs font-bold text-rose-300 uppercase tracking-wider transition-colors flex items-center gap-2"
              >
                {pdfLoading ? 'Generating…' : '📄 Download PDF Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── History Row ───────────────────────────────────────────────────────────────
function HistoryRow({ item, onView, onDelete }) {
  const teScore = item.trust_score != null ? Math.round(item.trust_score * 100) : 0
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 border border-white/10 flex flex-col sm:flex-row items-center gap-5 justify-between">
      {/* Mini Gauge */}
      <div className="shrink-0">
        <ScoreGauge score={teScore} size={70} />
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1 flex-1 min-w-0 text-left">
        <div className="flex items-center gap-3 flex-wrap">
          <TrustBadge score={teScore} />
          <span className="text-xs font-semibold text-slate-400">{formatDate(item.created_at)}</span>
        </div>
        <p className="text-xs text-slate-300 truncate font-normal mt-1">{item.summary}</p>
        <div className="flex gap-4 text-[11px] text-slate-400 mt-1">
          <span>Hallucination Risk: <span className="font-semibold text-slate-200">{item.hallucination_risk}</span></span>
          <span>Confidence: <span className="font-semibold text-cyan-400">{pct(item.confidence_score)}</span></span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2.5 shrink-0">
        <button
          onClick={() => onView(item.id)}
          className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition-all"
        >
          View Full Report
        </button>
        {confirming ? (
          <div className="flex gap-1.5 items-center">
            <span className="text-xs text-slate-400">Sure?</span>
            <button
              onClick={() => { setConfirming(false); onDelete(item.id) }}
              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 transition-colors"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-3.5 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/15 transition-all"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

// ── Reports Page Main Component ───────────────────────────────────────────────
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300 uppercase tracking-widest w-max mb-2">
            Audit Records History
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Trust Reports
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {data ? `${data.total} historical evaluation record${data.total !== 1 ? 's' : ''}` : 'Loading records…'}
          </p>
        </div>

        <button
          onClick={load}
          className="btn-glow-secondary rounded-2xl px-5 py-3 text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2"
        >
          <span>↻ Refresh History</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm font-semibold text-rose-400">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className="flex flex-col gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-900/60 animate-pulse border border-white/5" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && data?.items?.length === 0 && (
        <div className="glass-card flex flex-col items-center gap-4 rounded-3xl border border-white/10 py-20 px-6 text-center">
          <span className="text-5xl p-4 rounded-2xl bg-slate-900 border border-white/10">📭</span>
          <h3 className="text-lg font-bold text-white">No Evaluation Records Found</h3>
          <p className="text-slate-400 text-xs sm:text-sm max-w-sm">
            Run your first AI response analysis in the workspace to see generated trust reports here.
          </p>
        </div>
      )}

      {/* History List */}
      {data?.items?.length > 0 && (
        <div className="flex flex-col gap-4">
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
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 disabled:opacity-30 hover:bg-slate-800 transition-colors"
          >
            ← Previous
          </button>
          <span className="text-xs font-semibold text-slate-400">Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 disabled:opacity-30 hover:bg-slate-800 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Report Modal */}
      {modalId && <ReportModal id={modalId} onClose={() => setModalId(null)} />}

    </div>
  )
}
