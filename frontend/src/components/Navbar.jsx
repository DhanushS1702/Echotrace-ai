import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import PaymentModal from './PaymentModal'

const links = [
  { to: '/',         label: 'Home' },
  { to: '/analysis', label: 'Live Analysis' },
  { to: '/reports',  label: 'Reports & History' },
]

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#030712]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
            <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#0B0F19] text-sm font-black tracking-wider text-cyan-400">
              ET
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
              Echo<span className="gradient-text-cyan">Trace</span>
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                AI
              </span>
            </span>
          </div>
        </NavLink>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 border border-white/5 rounded-full p-1.5 backdrop-blur-md">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `relative rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 shadow-inner'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right CTA & Status Pill */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={() => setPaymentModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/20 to-indigo-600/20 px-3.5 py-2 text-xs font-bold text-cyan-300 hover:border-cyan-400 transition-all hover:scale-[1.02]"
          >
            <span>💳 Payment Gateway</span>
          </button>

          <NavLink
            to="/analysis"
            className="btn-glow rounded-xl px-5 py-2 text-xs font-bold text-white uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02]"
          >
            Run Analysis
          </NavLink>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-300 hover:text-white"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#0B0F19]/95 px-6 py-4 flex flex-col gap-3">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `rounded-xl px-4 py-3 text-sm font-semibold ${
                  isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:bg-slate-800'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <button
            onClick={() => {
              setMobileMenuOpen(false)
              setPaymentModalOpen(true)
            }}
            className="rounded-xl px-4 py-3 text-sm font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-left flex items-center justify-between"
          >
            <span>💳 Executable Payment Gateway</span>
            <span className="text-xs text-cyan-400">UPI / Phone</span>
          </button>
          <NavLink
            to="/analysis"
            onClick={() => setMobileMenuOpen(false)}
            className="btn-glow text-center rounded-xl py-3 text-sm font-bold text-white uppercase tracking-wider mt-2"
          >
            Run Analysis
          </NavLink>
        </div>
      )}

      {/* Payment Gateway Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        initialPlan="Pro Team"
      />
    </header>
  )
}
