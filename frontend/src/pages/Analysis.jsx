import { useState } from 'react'
import { analyzeText, downloadPDF } from '../api/client'
import ScoreGauge from '../components/ScoreGauge'
import RiskCard from '../components/RiskCard'
import TrustBadge from '../components/TrustBadge'
import { pct } from '../utils/trustLevel'
import { downloadJSON, reportFilename } from '../utils/formatters'

const RISK_CARDS = [
  { key: 'confidence',        title: 'Confidence',       icon: '🎯', invert: false },
  { key: 'hallucination_risk',title: 'Hallucination Risk',icon: '⚠️', invert: true  },
  { key: 'missing_evidence',  title: 'Missing Evidence', icon: '🔎', invert: true  },
  { key: 'bias',              title: 'Bias',             icon: '⚖️', invert: true  },
  { key: 'prompt_injection',  title: 'Prompt Injection', icon: '🛡️', invert: true  },
]

export default function Analysis() {
  const [prompt,   setPrompt]   = useState('')
  const [response, setResponse] = useState('')
  const [result,   setResult]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  async function handleAnalyze() {
    if (!prompt.trim() || !response.trim()) {
      setError('Both prompt and response are required.')
      return
    }
    // Q6: enforce length limits client-side before the network round-trip
    if (prompt.length > 8000) {
      setError('Prompt exceeds 8,000 character limit.')
      return
    }
    if (response.length > 16000) {
      setError('Response exceeds 16,000 character limit.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await analyzeText(prompt, response)
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleDownloadJSON() {
    if (!result) return
    downloadJSON(result, reportFilename(result.id, result.created_at))
  }

  const [pdfLoading, setPdfLoading] = useState(false)

  async function handleDownloadPDF() {
    if (!result?.id) return
    setPdfLoading(true)
    try {
      const filename = reportFilename(result.id, result.created_at).replace('.json', '.pdf')
      await downloadPDF(result.id, filename)
    } catch (e) {
      setError(`PDF generation failed: ${e.message}`)
    } finally {
      setPdfLoading(false)
    }
  }

  const teScore = result?.trust_engine?.trust_score ?? null

  return (
    <div className="flex flex-col gap-10">

      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-slate-50">Analyze Response</h1>
        <p className="text-slate-400 text-sm">Paste your prompt and the AI-generated response below.</p>
      </div>

      {/* Input form ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Prompt */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Original Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={7}
            placeholder="Paste the prompt you sent to the AI…"
            className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none transition-colors"
          />
          <span className="text-right text-xs text-slate-600">{prompt.length} / 8000</span>
        </div>

        {/* Response */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            AI-Generated Response
          </label>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={7}
            placeholder="Paste the AI response to analyze…"
            className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none transition-colors"
          />
          <span className="text-right text-xs text-slate-600">{response.length} / 16000</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Analyze button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:shadow-brand-500/40 hover:-translate-y-0.5 flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Analyzing…
            </>
          ) : 'Analyze →'}
        </button>

        {result && (
          <button
            onClick={handleDownloadJSON}
            className="rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 px-6 py-3 text-sm font-medium text-slate-300 transition-colors flex items-center gap-2"
          >
            ⬇ JSON
          </button>
        )}

        {result && (
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 text-sm font-medium text-red-300 transition-colors flex items-center gap-2"
          >
            {pdfLoading ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Generating PDF…
              </>
            ) : '⬇ PDF Report'}
          </button>
        )}

        {result && (
          <button
            onClick={() => { setResult(null); setPrompt(''); setResponse('') }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors ml-auto"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Results ──────────────────────────────────────────────────── */}
      {result && (
        <div className="flex flex-col gap-8 border-t border-slate-800 pt-8">

          {/* Trust score header */}
          <div className="flex flex-col sm:flex-row items-center gap-8 rounded-2xl border border-slate-700/60 bg-slate-800/40 p-8">
            <ScoreGauge score={teScore} size={180} />

            <div className="flex flex-col gap-4 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-slate-100">Trust Analysis</h2>
                <TrustBadge score={teScore} />
              </div>

              <p className="text-sm text-slate-400 leading-relaxed">{result.trust_engine?.summary}</p>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Trust Score',        value: `${teScore} / 100` },
                  { label: 'Hallucination Risk',  value: result.hallucination_risk },
                  { label: 'Confidence',          value: pct(result.confidence_score) },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5">
                    <div className="text-xs text-slate-500">{label}</div>
                    <div className="text-sm font-semibold text-slate-200 mt-0.5">{value}</div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {result.trust_engine?.recommendations?.length > 0 && (
                <ul className="flex flex-col gap-1.5 mt-1">
                  {result.trust_engine.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="mt-0.5 text-brand-400">›</span>
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Risk cards grid */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Signal Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {RISK_CARDS.map(({ key, title, icon, invert }) => {
                const s = result.scores?.[key]
                if (!s) return null
                return (
                  <RiskCard
                    key={key}
                    title={title}
                    icon={icon}
                    score={s.score}
                    explanation={s.explanation}
                    invert={invert}
                  />
                )
              })}
            </div>
          </div>

          {/* Trust Engine signals detail */}
          {result.trust_engine?.signals && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Trust Engine · Detailed Signals</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(result.trust_engine.signals).map(([key, sig]) => (
                  <div key={key} className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className={`text-xs font-bold tabular-nums ${sig.penalty >= 40 ? 'text-red-400' : sig.penalty >= 20 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                        -{sig.penalty} pts
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{sig.explanation}</p>
                    {sig.matches?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sig.matches.slice(0, 6).map((m, i) => (
                          <span key={i} className="rounded-md bg-slate-700/60 px-2 py-0.5 text-xs text-slate-300">{m}</span>
                        ))}
                        {sig.matches.length > 6 && (
                          <span className="rounded-md bg-slate-700/40 px-2 py-0.5 text-xs text-slate-500">+{sig.matches.length - 6} more</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bias flags */}
          {result.bias_flags?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Bias Flags</h3>
              <div className="flex flex-col gap-2">
                {result.bias_flags.map((flag, i) => (
                  <div key={i} className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-2.5 text-xs text-yellow-300">
                    ⚖️ {flag}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
