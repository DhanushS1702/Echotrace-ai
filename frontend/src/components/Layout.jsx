import Navbar from './Navbar'
import { Link } from 'react-router-dom'

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 flex flex-col overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-cyan-500/10 via-indigo-600/10 to-transparent blur-3xl opacity-60 z-0" />
      <div className="pointer-events-none absolute top-40 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl z-0" />
      <div className="pointer-events-none absolute top-96 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl z-0" />
      
      {/* Background grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.15] z-0" />

      {/* Main header */}
      <Navbar />

      {/* Main page content */}
      <main className="relative z-10 flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>

      {/* Enterprise Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#050816]/90 backdrop-blur-xl mt-24 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
            
            {/* Brand column */}
            <div className="md:col-span-2 flex flex-col gap-4">
              <Link to="/" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20">
                  <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#0B0F19] text-xs font-black text-cyan-400">
                    ET
                  </div>
                </div>
                <span className="text-xl font-extrabold text-white tracking-tight">
                  Echo<span className="gradient-text-cyan">Trace</span> <span className="text-xs font-medium text-slate-400">AI</span>
                </span>
              </Link>

              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                The next-generation AI transparency and trust evaluation platform. Detect hallucination risk, confidence shifts, bias, missing citations, and prompt injection in under 50ms.
              </p>

              <div className="flex items-center gap-3 mt-2">
                <span className="rounded-full bg-slate-800/80 border border-slate-700/60 px-3 py-1 text-xs text-slate-400">
                  ⚡ 50ms Latency
                </span>
                <span className="rounded-full bg-slate-800/80 border border-slate-700/60 px-3 py-1 text-xs text-slate-400">
                  🔒 Zero External LLM Calls
                </span>
              </div>
            </div>

            {/* Links column 1 */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Platform</h4>
              <ul className="flex flex-col gap-2 text-sm text-slate-400">
                <li><Link to="/analysis" className="hover:text-cyan-400 transition-colors">Live Analysis</Link></li>
                <li><Link to="/reports" className="hover:text-cyan-400 transition-colors">Trust Reports</Link></li>
                <li><a href="#features" className="hover:text-cyan-400 transition-colors">Detector Engines</a></li>
                <li><a href="#pricing" className="hover:text-cyan-400 transition-colors">Pricing Plans</a></li>
              </ul>
            </div>

            {/* Links column 2 */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Tech Stack</h4>
              <ul className="flex flex-col gap-2 text-sm text-slate-400">
                <li><span className="text-slate-300 font-medium">FastAPI</span> (Async Backend)</li>
                <li><span className="text-slate-300 font-medium">React 18 + Vite</span></li>
                <li><span className="text-slate-300 font-medium">SQLite + SQLAlchemy</span></li>
                <li><span className="text-slate-300 font-medium">ReportLab PDF Engine</span></li>
              </ul>
            </div>

            {/* Hackathon Badge Column */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Hackathon Project</h4>
              <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-indigo-500/5 p-4 flex flex-col gap-2">
                <span className="text-xs font-bold text-cyan-400">Built with IBM Bob 2.0</span>
                <p className="text-xs text-slate-400">Architected, generated, audited, and deployed with Bob — IBM's autonomous AI engineer.</p>
              </div>
            </div>

          </div>

          <div className="border-t border-slate-800/80 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} EchoTrace AI. All rights reserved. Built for IBM Bob 2.0 Hackathon.</p>
            <div className="flex items-center gap-6">
              <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
              <span className="hover:text-slate-300 cursor-pointer">API Specs</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
