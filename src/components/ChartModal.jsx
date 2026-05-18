import { useEffect, useRef } from 'react'

export default function ChartModal({ ticker, onClose }) {
  const containerRef = useRef()

  useEffect(() => {
    if (!containerRef.current) return

    // Clean up any previous widget
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `BYBIT:${ticker}.P`,
      interval: 'W',
      timezone: 'Europe/Rome',
      theme: 'dark',
      style: '1',
      locale: 'it',
      backgroundColor: '#111008',
      gridColor: 'rgba(255,255,255,0.04)',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
      studies: ['MASimple@tv-scriptstd;length=7', 'MASimple@tv-scriptstd;length=14', 'MASimple@tv-scriptstd;length=28'],
    })
    containerRef.current.appendChild(script)

    return () => { if (containerRef.current) containerRef.current.innerHTML = '' }
  }, [ticker])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 1100,
        height: '80vh', minHeight: 500,
        background: '#111008',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,.1)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,.6)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,.08)',
          background: '#1a1610', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: '#f5f1ea', letterSpacing: 2 }}>
              {ticker}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', background: 'rgba(255,255,255,.06)', borderRadius: 5, padding: '2px 8px', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              PERPETUAL · BYBIT
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,.2)', fontFamily: 'var(--font-display)' }}>
              Powered by TradingView
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 8, color: 'rgba(255,255,255,.5)',
            padding: '6px 12px', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
          }}>✕ Chiudi</button>
        </div>

        {/* TradingView Widget */}
        <div
          ref={containerRef}
          className="tradingview-widget-container"
          style={{ flex: 1, minHeight: 0 }}
        >
          <div className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
    </div>
  )
}
