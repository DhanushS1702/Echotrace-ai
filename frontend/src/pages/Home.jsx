import { useState } from 'react'
import { Link } from 'react-router-dom'

const features = [
  { icon: '🎯', title: 'Confidence Score', desc: 'Measures certainty level using hedge-word frequency, modal verb density, and passive-voice syntax trees.' },
  { icon: '⚠️', title: 'Hallucination Risk', desc: 'Detects unsourced numeric values, dates, and named entities lacking verifiable citations.' },
  { icon: '🔎', title: 'Missing Evidence', desc: 'Identifies assertive factual claims made without supporting references or evidence markers.' },
  { icon: '⚖️', title: 'Bias Detection', desc: 'Scans for politically loaded phrasing, emotional amplifiers, and ungrounded generalisations.' },
  { icon: '🛡️', title: 'Prompt Injection', desc: 'Uncovers system override instructions, jailbreak payloads, and hidden adversarial triggers.' },
  { icon: '🔁', title: 'Contradictions Engine', desc: 'Identifies conflicting or mutually exclusive assertions within the same AI response.' },
  { icon: '📢', title: 'Overconfidence Detector', desc: 'Flags absolute certainty language ("100% proven", "undeniable") lacking factual foundation.' },
  { icon: '📋', title: 'PDF Report Streaming', desc: 'Compiles multi-engine findings into styled executive PDF reports in milliseconds.' },
]

const stats = [
  { value: '5', label: 'Analysis Engines' },
  { value: '0–100', label: 'Trust Score Metric' },
  { value: '<50ms', label: 'Evaluation Latency' },
  { value: '100%', label: 'Deterministic & Private' },
]

const logos = ['IBM', 'Microsoft', 'Google Cloud', 'AWS', 'Vercel', 'OpenAI']

const testimonials = [
  {
    name: 'Elena Rostova',
    role: 'Lead AI Safety Engineer @ Nexus AI',
    avatar: '👩‍💻',
    quote: 'EchoTrace AI gives our team instant, deterministic confidence scores without calling external LLM APIs. It saved us hundreds of audit hours.',
  },
  {
    name: 'Marcus Vance',
    role: 'VP of Product @ Enterprise Stack',
    avatar: '👨‍💼',
    quote: 'The hallucination risk and missing citation signals are essential for our enterprise deployment. The downloadable PDF reports are executive-ready.',
  },
  {
    name: 'Dr. Aris Thorne',
    role: 'Principal LLM Researcher',
    avatar: '🔬',
    quote: 'Pure mathematical rigor without non-deterministic LLM evaluation loops. Exactly what the AI safety industry needed.',
  }
]

const pricingPlans = [
  {
    name: 'Starter',
    price: '$0',
    period: 'forever',
    desc: 'Perfect for individual developers and AI safety testing.',
    features: ['Unlimited text analyses', 'All 5 core analysis engines', 'JSON report export', 'Community support'],
    cta: 'Start Free',
    highlight: false,
  },
  {
    name: 'Pro Team',
    price: '$49',
    period: 'per month',
    desc: 'Designed for engineering teams scaling production AI apps.',
    features: [
      'Everything in Starter',
      'Executive PDF report streaming',
      'Trust Engine v2 detailed signals',
      'API rate limit: 10,000 req/min',
      'Priority email support',
    ],
    cta: 'Get Pro Access',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'billed annually',
    desc: 'Dedicated infrastructure, custom rules, and SLA guarantees.',
    features: [
      'Everything in Pro',
      'Self-hosted / On-premise deployment',
      'Custom detector rule composer',
      'Dedicated support engineer',
      '99.99% Uptime SLA',
    ],
    cta: 'Contact Sales',
    highlight: false,
  }
]

const faqs = [
  {
    q: 'Does EchoTrace AI send my prompt or response data to external LLMs?',
    a: 'No. EchoTrace uses 100% deterministic, in-process heuristic engines. Your sensitive prompt and output data never leave your server or privacy boundary.',
  },
  {
    q: 'How fast is the evaluation speed?',
    a: 'Every analysis runs asynchronously across ThreadPool workers and completes in under 50 milliseconds.',
  },
  {
    q: 'Can I generate PDF reports for compliance?',
    a: 'Yes. Every analysis can be streamed directly as a styled PDF report containing trust score gauges, signal breakdowns, and recommendations.',
  },
  {
    q: 'What AI models are supported?',
    a: 'EchoTrace is model-agnostic. It works with output from GPT-4o, Claude 3.5, Gemini 1.5, Llama 3, DeepSeek, or any custom fine-tuned LLM.',
  }
]

export default function Home() {
  const [activeFaq, setActiveFaq] = useState(null)
  const [previewTab, setPreviewTab] = useState('score')

  return (
    <div className="flex flex-col gap-24 sm:gap-32">

      {/* Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative pt-6 sm:pt-12 flex flex-col items-center text-center gap-8">
        
        {/* Hackathon Badge Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-bold text-cyan-300 uppercase tracking-widest shadow-inner backdrop-blur-md animate-pulse">
          <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
          IBM Bob 2.0 Hackathon Submission
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] max-w-5xl">
          Evaluate AI Responses with <br className="hidden sm:inline" />
          <span className="gradient-text-cyan">Enterprise Precision</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-xl text-slate-300 max-w-3xl leading-relaxed font-normal">
          Detect hallucination risk, confidence shifts, bias, missing evidence, contradictions, and prompt injection in under 50ms — with 0% external LLM reliance.
        </p>

        {/* Hero CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center mt-2">
          <Link
            to="/analysis"
            className="btn-glow rounded-2xl px-8 py-4 text-base font-bold text-white shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.03] flex items-center justify-center gap-2"
          >
            <span>Start Live Analysis</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <Link
            to="/reports"
            className="btn-glow-secondary rounded-2xl px-8 py-4 text-base font-semibold text-slate-200 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <span>View Trust Reports</span>
          </Link>
        </div>

        {/* Animated Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 w-full max-w-4xl mt-6">
          {stats.map(({ value, label }) => (
            <div key={label} className="glass-card rounded-2xl p-5 border border-white/10 flex flex-col items-center justify-center gap-1 shadow-lg">
              <span className="text-2xl sm:text-4xl font-extrabold gradient-text-cyan">{value}</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
            </div>
          ))}
        </div>

        {/* Interactive Floating Preview Mockup */}
        <div className="w-full max-w-5xl mt-8 glass-card rounded-3xl border border-white/15 p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />
          
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-slate-400 ml-2">echotrace-trust-engine-v2.0</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setPreviewTab('score')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${previewTab === 'score' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                Trust Gauge (94/100)
              </button>
              <button
                onClick={() => setPreviewTab('signals')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${previewTab === 'signals' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                Detected Signals (6)
              </button>
            </div>
          </div>

          {previewTab === 'score' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-left">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Sample AI Output</span>
                <p className="text-xs sm:text-sm text-slate-300 font-mono bg-slate-950/80 p-4 rounded-xl border border-white/5 leading-relaxed">
                  "Python was created by Guido van Rossum and released in 1991. It emphasizes code readability with indentation..."
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-slate-900/40 rounded-2xl border border-white/5">
                <div className="text-4xl font-extrabold text-cyan-400 font-display">94</div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">HIGH TRUST LEVEL</span>
                <span className="text-[10px] text-emerald-400 mt-2 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  ✓ Low Hallucination Risk
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified Metrics</span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300"><span>Confidence Level</span><span className="font-bold text-cyan-400">100%</span></div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-cyan-400 w-full" /></div>
                  <div className="flex justify-between text-slate-300"><span>Hallucination Risk</span><span className="font-bold text-emerald-400">0%</span></div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-emerald-400 w-0" /></div>
                  <div className="flex justify-between text-slate-300"><span>Bias Level</span><span className="font-bold text-emerald-400">0%</span></div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden"><div className="h-full bg-emerald-400 w-0" /></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {[
                { title: 'Confidence Engine', val: '0 Hedging Phrases', status: 'PASS' },
                { title: 'Hallucination Engine', val: '0 Unsourced Claims', status: 'PASS' },
                { title: 'Bias Engine', val: '0 Emotional Amplifiers', status: 'PASS' },
                { title: 'Prompt Injection', val: '0 Adversarial Triggers', status: 'PASS' },
              ].map(({ title, val, status }) => (
                <div key={title} className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-200">{title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{val}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{status}</span>
                </div>
              ))}
            </div>
          )}

        </div>

      </section>

      {/* Trusted Logos Section ─────────────────────────────────────────── */}
      <section className="flex flex-col items-center gap-6 text-center border-y border-white/5 py-10">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Built with architecture standards trusted by AI Engineering Teams
        </span>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {logos.map((logo) => (
            <span key={logo} className="text-lg sm:text-xl font-bold tracking-tight text-slate-300 font-display">
              {logo}
            </span>
          ))}
        </div>
      </section>

      {/* Feature Grid ─────────────────────────────────────────────────── */}
      <section id="features" className="flex flex-col gap-12">
        <div className="text-center flex flex-col items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Six Independent Detectors</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Complete AI Response Audit
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Every response is evaluated simultaneously across multiple heuristic engines without non-deterministic LLM calls.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col gap-4 border border-white/10 group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 text-2xl shadow-inner group-hover:scale-110 transition-transform">
                {icon}
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-normal">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Workflow ────────────────────────────────────────── */}
      <section className="flex flex-col gap-12">
        <div className="text-center flex flex-col items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">3-Step Execution Pipeline</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            How EchoTrace Evaluates AI
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {[
            { step: '01', title: 'Paste Output', desc: 'Copy any AI response and original prompt into the live evaluation form.' },
            { step: '02', title: 'Run Deterministic Audit', desc: 'Five async Python engines analyze syntax, citations, hedging, and injection patterns.' },
            { step: '03', title: 'Export Trust PDF', desc: 'Review 0–100 trust score, flag indicators, and export executive PDF reports.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="glass-card rounded-3xl p-8 border border-white/10 flex flex-col gap-4 relative">
              <span className="text-5xl font-black text-cyan-500/20 font-display">{step}</span>
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials ─────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-12">
        <div className="text-center flex flex-col items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Testimonials</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Loved by AI Engineers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(({ name, role, avatar, quote }) => (
            <div key={name} className="glass-card glass-card-hover rounded-3xl p-6 border border-white/10 flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex text-amber-400 text-sm">★★★★★</div>
                <p className="text-xs text-slate-300 leading-relaxed italic">"{quote}"</p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <div className="text-2xl p-2 rounded-xl bg-slate-800 border border-white/10">{avatar}</div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">{name}</span>
                  <span className="text-[11px] text-slate-400">{role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Cards ───────────────────────────────────────────────── */}
      <section id="pricing" className="flex flex-col gap-12">
        <div className="text-center flex flex-col items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Transparent Pricing</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Plans for Every AI Team
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {pricingPlans.map(({ name, price, period, desc, features, cta, highlight }) => (
            <div
              key={name}
              className={`glass-card rounded-3xl p-8 border flex flex-col justify-between gap-8 relative transition-all duration-300 ${
                highlight
                  ? 'border-cyan-500/50 shadow-glow bg-gradient-to-b from-cyan-500/10 via-slate-900/90 to-slate-950 scale-[1.02]'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {highlight && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-1 text-[10px] font-extrabold text-white uppercase tracking-widest shadow-md">
                  Most Popular
                </span>
              )}

              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-bold text-white">{name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white font-display">{price}</span>
                  <span className="text-xs text-slate-400">{period}</span>
                </div>

                <ul className="flex flex-col gap-3 pt-4 border-t border-white/5">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-xs text-slate-300">
                      <span className="text-cyan-400 font-bold">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to="/analysis"
                className={`w-full text-center rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                  highlight
                    ? 'btn-glow text-white shadow-lg shadow-cyan-500/25 hover:scale-[1.02]'
                    : 'btn-glow-secondary text-slate-200 hover:text-white'
                }`}
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion Section ────────────────────────────────────────── */}
      <section className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
        <div className="text-center flex flex-col items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Frequently Asked Questions</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Got Questions? We Have Answers.
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map(({ q, a }, idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl border border-white/10 overflow-hidden transition-all"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
              >
                <span className="text-sm font-bold text-white">{q}</span>
                <span className="text-cyan-400 text-lg font-bold">{activeFaq === idx ? '−' : '+'}</span>
              </button>
              {activeFaq === idx && (
                <div className="p-5 pt-0 text-xs text-slate-300 leading-relaxed border-t border-white/5 bg-slate-950/40">
                  {a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner ──────────────────────────────────────────────────── */}
      <section className="relative rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-indigo-600/10 to-purple-600/10 p-8 sm:p-14 flex flex-col items-center gap-6 text-center shadow-2xl overflow-hidden">
        <div className="pointer-events-none absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-2xl">
          Ready to evaluate AI responses in real-time?
        </h2>
        <p className="text-slate-300 text-sm sm:text-base max-w-lg leading-relaxed">
          Paste your prompt and AI response. Get a comprehensive 0–100 trust score and PDF report in seconds.
        </p>
        <Link
          to="/analysis"
          className="btn-glow rounded-2xl px-10 py-4 text-sm font-bold text-white uppercase tracking-wider shadow-xl shadow-cyan-500/30 transition-all hover:scale-[1.03]"
        >
          Analyze AI Output Now →
        </Link>
      </section>

    </div>
  )
}
