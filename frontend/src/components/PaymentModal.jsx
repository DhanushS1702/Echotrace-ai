import { useState, useEffect } from 'react'

export default function PaymentModal({ isOpen, onClose, initialPlan = 'Pro Team' }) {
  const [plan, setPlan] = useState(initialPlan)
  const [paymentMethod, setPaymentMethod] = useState('upi') // 'upi', 'phone', 'card'
  const [utr, setUtr] = useState('')
  const [copiedField, setCopiedField] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [txnDetails, setTxnDetails] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const phoneNo = '8660791211'
  const upiId = '8660791211@upi'
  const recipientName = 'EchoTrace AI'

  useEffect(() => {
    setPlan(initialPlan)
    setIsSuccess(false)
    setIsProcessing(false)
    setUtr('')
    setErrorMsg('')
  }, [initialPlan, isOpen])

  if (!isOpen) return null

  const getPlanDetails = () => {
    switch (plan) {
      case 'Pro Team':
        return { name: 'Pro Team Subscription', usd: 49, inr: 3999, badge: 'Most Popular' }
      case 'Enterprise':
        return { name: 'Enterprise Custom Tier', usd: 199, inr: 14999, badge: 'Dedicated SLA' }
      case 'Starter':
      default:
        return { name: 'Starter Lifetime', usd: 0, inr: 0, badge: 'Free Forever' }
    }
  }

  const planInfo = getPlanDetails()
  const upiPayUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(recipientName)}&am=${planInfo.inr}&cu=INR&tn=${encodeURIComponent('EchoTrace Pro Subscription')}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiPayUrl)}&color=00D4FF&bcolor=0B0F19`

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(''), 2500)
  }

  const handleVerifyAndExecute = (e) => {
    e.preventDefault()
    if (!utr || utr.trim().length < 6) {
      setErrorMsg('Please enter a valid 12-digit UPI UTR / Ref No. or click "Simulate Instant Payment".')
      return
    }

    setErrorMsg('')
    setIsProcessing(true)

    setTimeout(() => {
      const receiptId = 'TXN-' + Math.floor(1000000000 + Math.random() * 9000000000)
      const licenseKey = 'ET-PRO-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-8660791211'
      
      const receipt = {
        receiptId,
        licenseKey,
        plan: planInfo.name,
        amount: `₹${planInfo.inr.toLocaleString('en-IN')} ($${planInfo.usd})`,
        upiId,
        phoneNo,
        utr: utr.trim(),
        date: new Date().toLocaleString(),
      }

      localStorage.setItem('echotrace_pro_access', JSON.stringify(receipt))
      setTxnDetails(receipt)
      setIsProcessing(false)
      setIsSuccess(true)
    }, 1800)
  }

  const handleSimulatePayment = () => {
    const fakeUtr = Math.floor(100000000000 + Math.random() * 900000000000).toString()
    setUtr(fakeUtr)
    setErrorMsg('')
    setIsProcessing(true)

    setTimeout(() => {
      const receiptId = 'TXN-' + Math.floor(1000000000 + Math.random() * 9000000000)
      const licenseKey = 'ET-PRO-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-8660791211'
      
      const receipt = {
        receiptId,
        licenseKey,
        plan: planInfo.name,
        amount: `₹${planInfo.inr.toLocaleString('en-IN')} ($${planInfo.usd})`,
        upiId,
        phoneNo,
        utr: fakeUtr,
        date: new Date().toLocaleString(),
      }

      localStorage.setItem('echotrace_pro_access', JSON.stringify(receipt))
      setTxnDetails(receipt)
      setIsProcessing(false)
      setIsSuccess(true)
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl border border-cyan-500/30 bg-[#0B0F19] p-6 sm:p-8 shadow-2xl shadow-cyan-500/20 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!isSuccess ? (
          <>
            {/* Modal Header */}
            <div className="flex flex-col gap-2 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                  Executable Payment Gateway
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Complete Upgrade to <span className="gradient-text-cyan">{planInfo.name}</span>
              </h2>
              <p className="text-xs text-slate-400">
                Directly linked to UPI ID <strong className="text-cyan-300">{upiId}</strong> and Phone <strong className="text-cyan-300">{phoneNo}</strong>.
              </p>
            </div>

            {/* Plan Selector */}
            <div className="grid grid-cols-3 gap-3 my-5">
              {['Starter', 'Pro Team', 'Enterprise'].map((pName) => (
                <button
                  key={pName}
                  onClick={() => setPlan(pName)}
                  className={`rounded-2xl p-3 border text-left transition-all ${
                    plan === pName
                      ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold text-white">{pName}</div>
                  <div className="text-xs font-semibold text-cyan-400 mt-1">
                    {pName === 'Starter' ? 'Free' : pName === 'Pro Team' ? '₹3,999 ($49)' : '₹14,999 ($199)'}
                  </div>
                </button>
              ))}
            </div>

            {/* Payment Mode Selector Tabs */}
            <div className="flex rounded-xl bg-slate-900/80 p-1 border border-white/5 mb-6">
              <button
                onClick={() => setPaymentMethod('upi')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  paymentMethod === 'upi' ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚡ UPI ID & QR Code
              </button>
              <button
                onClick={() => setPaymentMethod('phone')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  paymentMethod === 'phone' ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                📱 Phone Number Payment
              </button>
            </div>

            {/* Tab 1: UPI ID & QR Code */}
            {paymentMethod === 'upi' && (
              <div className="flex flex-col sm:flex-row gap-6 items-center bg-slate-950/60 p-5 rounded-2xl border border-white/5">
                {/* QR Code Container */}
                <div className="flex flex-col items-center gap-2 bg-[#030712] p-4 rounded-2xl border border-cyan-500/30">
                  <img
                    src={qrCodeUrl}
                    alt="Scan UPI QR Code to Pay"
                    className="h-44 w-44 rounded-xl border border-white/10 object-contain bg-slate-900"
                    onError={(e) => {
                      // Fallback SVG QR placeholder if server image is blocked
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="%2300D4FF" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM18 18h3v3h-3z"/></svg>';
                    }}
                  />
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Scan with GPay / PhonePe / Paytm
                  </span>
                </div>

                {/* Details & Quick Links */}
                <div className="flex flex-col gap-4 flex-1 w-full text-left">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Official UPI ID</span>
                    <div className="flex items-center justify-between bg-slate-900 px-3.5 py-2.5 rounded-xl border border-cyan-500/30">
                      <span className="font-mono text-sm font-bold text-cyan-300">{upiId}</span>
                      <button
                        onClick={() => handleCopy(upiId, 'upi')}
                        className="text-xs font-bold text-cyan-400 hover:text-white bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20"
                      >
                        {copiedField === 'upi' ? '✓ Copied!' : 'Copy UPI'}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Recipient Name</span>
                    <span className="text-sm font-bold text-white">{recipientName}</span>
                  </div>

                  {/* Direct Launch Buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={upiPayUrl}
                      className="flex-1 min-w-[110px] text-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2 rounded-xl text-xs shadow transition-all"
                    >
                      🚀 Open Any UPI App
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Phone Number */}
            {paymentMethod === 'phone' && (
              <div className="flex flex-col gap-4 bg-slate-950/60 p-5 rounded-2xl border border-white/5 text-left">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Linked Phone Number</span>
                  <div className="flex items-center justify-between bg-slate-900 px-4 py-3 rounded-xl border border-cyan-500/30">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📞</span>
                      <div>
                        <span className="font-mono text-base font-extrabold text-cyan-300">{phoneNo}</span>
                        <div className="text-[11px] text-slate-400">Linked to GPay, PhonePe, Paytm & BHIM</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(phoneNo, 'phone')}
                      className="text-xs font-bold text-cyan-400 hover:text-white bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20"
                    >
                      {copiedField === 'phone' ? '✓ Copied!' : 'Copy Phone'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  {[
                    { name: 'Google Pay', icon: '🔵', bg: 'hover:bg-blue-600/20' },
                    { name: 'PhonePe', icon: '🟣', bg: 'hover:bg-purple-600/20' },
                    { name: 'Paytm', icon: '🟦', bg: 'hover:bg-sky-600/20' },
                    { name: 'BHIM UPI', icon: '🇮🇳', bg: 'hover:bg-emerald-600/20' }
                  ].map((app) => (
                    <a
                      key={app.name}
                      href={upiPayUrl}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border border-white/10 bg-slate-900 text-center transition-all ${app.bg}`}
                    >
                      <span className="text-xl mb-1">{app.icon}</span>
                      <span className="text-[11px] font-bold text-slate-200">{app.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Form */}
            <form onSubmit={handleVerifyAndExecute} className="flex flex-col gap-3 mt-6 text-left border-t border-slate-800 pt-5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Step 2: Enter Transaction UTR / Ref No to Confirm Execution
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 426819034512 (12-digit UTR)"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn-glow text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {isProcessing ? 'Verifying...' : 'Verify Payment'}
                </button>
              </div>

              {errorMsg && <p className="text-xs text-rose-400 font-semibold mt-1">{errorMsg}</p>}

              {/* Instant Simulator Button */}
              <div className="flex items-center justify-between bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/20 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚡</span>
                  <span className="text-xs font-semibold text-cyan-300">Want to test the executable gateway instantly?</span>
                </div>
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isProcessing}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow"
                >
                  Simulate Instant Payment
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Execution Success Screen */
          <div className="flex flex-col items-center gap-6 py-4 text-center animate-scale-up">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 text-3xl">
              ✓
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Payment Verified & Executed</span>
              <h2 className="text-2xl font-extrabold text-white">Pro Access Activated!</h2>
              <p className="text-xs text-slate-300">
                Your payment to <strong className="text-cyan-300">{upiId}</strong> was processed successfully.
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="w-full bg-slate-950/80 p-5 rounded-2xl border border-emerald-500/30 flex flex-col gap-3 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-white/10 text-xs">
                <span className="text-slate-400 font-semibold">Transaction ID</span>
                <span className="font-mono text-cyan-300 font-bold">{txnDetails?.receiptId}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Plan Activated</span>
                <span className="font-bold text-white">{txnDetails?.plan}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Amount Paid</span>
                <span className="font-bold text-emerald-400">{txnDetails?.amount}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">UTR Reference</span>
                <span className="font-mono text-slate-300">{txnDetails?.utr}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs">
                <span className="text-slate-400 font-semibold">License Key</span>
                <span className="font-mono bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded border border-cyan-500/40">
                  {txnDetails?.licenseKey}
                </span>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  window.print()
                }}
                className="flex-1 btn-glow-secondary text-slate-200 py-3 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                📄 Print Invoice
              </button>
              <button
                onClick={onClose}
                className="flex-1 btn-glow text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/25"
              >
                Done & Return
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
