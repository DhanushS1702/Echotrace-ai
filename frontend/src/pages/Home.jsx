import { Link } from 'react-router-dom'

const features = [
  { icon: '🎯', title: 'Confidence Score',     desc: 'Measures how certain the AI sounds using hedge-word and passive-voice analysis.' },
  { icon: '⚠️', title: 'Hallucination Risk',   desc: 'Flags specific numbers, dates, and named entities without supporting citations.' },
  { icon: '🔎', title: 'Missing Evidence',      desc: 'Identifies factual claims that lack any source, citation, or reference.' },
  { icon: '⚖️', title: 'Bias Detection',        desc: 'Detects politically charged language, emotional amplifiers, and broad generalisations.' },
  { icon: '🛡️', title: 'Prompt Injection',      desc: 'Catches attempts to override, jailbreak, or manipulate the AI system.' },
  { icon: '📋', title: 'Trust Report',          desc: 'Aggregates all signals into a 0–100 score with actionable recommendations.' },
]

export default function Home() {
  return (
    <div className="flex flex-col gap-20">

      {/* Hero ──────────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center text-center gap-6 pt-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-medium text-brand-400 uppercase tracking-wider">
          IBM Bob 2.0 Hackathon
        </div>

        <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-slate-50 max-w-3xl">
          AI Transparency &amp;{' '}
          <span className="text-brand-500">Trust Analysis</span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
          Paste any AI-generated response. EchoTrace analyses confidence, hallucination
          risk, bias, missing evidence, and prompt injection — in milliseconds.
        </p>

        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            to="/analysis"
            className="rounded-xl bg-brand-600 hover:bg-brand-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:shadow-brand-500/40 hover:-translate-y-0.5"
          >
            Start Analyzing →
          </Link>
          <Link
            to="/reports"
            className="rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/60 px-7 py-3 text-sm font-semibold text-slate-300 transition-colors"
          >
            View Reports
          </Link>
        </div>

        {/* Stat row */}
        <div className="flex gap-10 flex-wrap justify-center mt-4">
          {[['5', 'Analysis Engines'], ['0–100', 'Trust Score'], ['<1s', 'Analysis Time'], ['100%', 'Privacy — no data sent to LLMs']].map(([val, lbl]) => (
            <div key={lbl} className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-bold text-brand-400">{val}</span>
              <span className="text-xs text-slate-500">{lbl}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid ─────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-100">What EchoTrace Detects</h2>
          <p className="mt-2 text-slate-400 text-sm">Six independent signals — no external API calls, fully deterministic.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-6 flex flex-col gap-3 hover:border-brand-500/40 hover:bg-slate-800/70 transition-all"
            >
              <span className="text-2xl">{icon}</span>
              <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works ─────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-100">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Paste Response', desc: 'Copy any AI-generated text and paste it into the analysis form.' },
            { step: '02', title: 'Run Analysis',   desc: 'Five heuristic engines analyse the text simultaneously in under a second.' },
            { step: '03', title: 'Get Trust Score',desc: 'Review the 0–100 trust score, per-signal breakdown, and recommendations.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="rounded-xl border border-slate-700/40 bg-slate-800/30 p-6 flex flex-col gap-3">
              <span className="text-3xl font-black text-brand-500/40">{step}</span>
              <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA ──────────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-10 flex flex-col items-center gap-5 text-center">
        <h2 className="text-2xl font-bold text-slate-100">Ready to evaluate an AI response?</h2>
        <p className="text-slate-400 text-sm max-w-md">Paste your prompt and the AI's answer. Get a full transparency report in seconds.</p>
        <Link
          to="/analysis"
          className="rounded-xl bg-brand-600 hover:bg-brand-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition-all hover:shadow-brand-500/40 hover:-translate-y-0.5"
        >
          Analyze Now →
        </Link>
      </section>
    </div>
  )
}
