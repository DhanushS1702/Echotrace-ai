import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',         label: 'Home' },
  { to: '/analysis', label: 'Analysis' },
  { to: '/reports',  label: 'Reports' },
]

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white text-sm font-bold shadow-lg shadow-brand-600/30 group-hover:bg-brand-500 transition-colors">
            ET
          </span>
          <span className="text-lg font-bold text-slate-100 tracking-tight">
            Echo<span className="text-brand-500">Trace</span>
            <span className="ml-1 text-xs font-normal text-slate-500">AI</span>
          </span>
        </NavLink>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600/20 text-brand-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Status pill */}
        <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400">Live</span>
        </div>
      </div>
    </header>
  )
}
