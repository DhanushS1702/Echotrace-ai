import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10">
        {children}
      </main>
      <footer className="mt-20 border-t border-slate-800 py-6 text-center text-xs text-slate-600">
        EchoTrace AI · IBM Bob 2.0 Hackathon · Built with FastAPI + React
      </footer>
    </div>
  )
}
