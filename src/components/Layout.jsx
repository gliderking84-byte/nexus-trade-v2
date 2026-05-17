import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePrices } from '../hooks/usePrices'

const NAV = [
  { path: '/',              icon: '◈',  label: 'Dashboard' },
  { path: '/ai',           icon: '🤖', label: 'AI Guidata' },
  { path: '/journal',      icon: '📒', label: 'Journal' },
  { path: '/conversations',icon: '💬', label: 'Conversazioni' },
  { path: '/settings',     icon: '⚙️', label: 'Impostazioni' },
]

const SYMBOLS = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','AVAXUSDT','DOTUSDT']

export default function Layout({ children, stats }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { prices, connected } = usePrices(SYMBOLS)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // close sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  const tickerSyms = SYMBOLS.slice(0, 5)

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>

      {/* ── Sidebar ── */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.4)',
          zIndex:40, display: window.innerWidth < 768 ? 'block' : 'none'
        }} />
      )}
      <aside style={{
        width: 220, flexShrink:0,
        background: 'var(--dark2)', borderRight: '1px solid rgba(255,255,255,.06)',
        display:'flex', flexDirection:'column', zIndex:50,
        position: window.innerWidth < 768 ? 'fixed' : 'relative',
        top:0, left:0, height:'100vh',
        transform: window.innerWidth < 768
          ? sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'
          : 'none',
        transition:'transform .25s ease',
      }}>
        {/* Logo */}
        <div style={{ padding:'20px 18px 16px', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:800, letterSpacing:4, color:'#f5f1ea' }}>NEXUS</div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,.2)', letterSpacing:2, marginTop:2 }}>TRADE INTELLIGENCE</div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'10px 10px', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV.map(({ path, icon, label }) => {
            const active = pathname === path
            return (
              <button key={path} onClick={() => navigate(path)} style={{
                display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                borderRadius:8, border:'none', cursor:'pointer', textAlign:'left',
                background: active ? 'rgba(255,255,255,.08)' : 'transparent',
                color: active ? '#f5f1ea' : 'rgba(255,255,255,.35)',
                fontFamily:'var(--font-display)', fontSize:12, fontWeight:600,
                transition:'all .15s', width:'100%',
              }}>
                <span style={{ fontSize:14, width:18, textAlign:'center' }}>{icon}</span>
                <span>{label}</span>
                {path === '/journal' && stats?.open > 0 && (
                  <span style={{ marginLeft:'auto', background:'rgba(255,255,255,.15)', borderRadius:10, padding:'1px 7px', fontSize:10 }}>
                    {stats.open}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div className="live-dot" style={{ background: connected ? 'var(--green-d)' : 'var(--amber-d)', boxShadow: connected ? '0 0 5px var(--green-d)' : 'none' }} />
            <span style={{ fontSize:9, color:'rgba(255,255,255,.2)', letterSpacing:.5 }}>
              {connected ? 'Bybit WebSocket · Live' : 'Prezzi simulati'}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Topbar */}
        <header style={{
          background:'var(--dark)', borderBottom:'2px solid var(--dark2)',
          flexShrink:0, zIndex:30,
        }}>
          {/* Brand row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', height:46 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {window.innerWidth < 768 && (
                <button onClick={() => setSidebarOpen(true)} style={{
                  background:'transparent', border:'none', color:'rgba(255,255,255,.4)',
                  fontSize:18, cursor:'pointer', padding:'4px',
                }}>☰</button>
              )}
              <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:800, letterSpacing:4, color:'#f5f1ea' }}>
                {NAV.find(n => n.path === pathname)?.label || 'NEXUS'}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:9, fontWeight:700, color:'var(--amber-d)', background:'rgba(240,192,64,.08)', border:'1px solid rgba(240,192,64,.15)', borderRadius:8, padding:'3px 9px', fontFamily:'var(--font-display)', letterSpacing:1 }}>
                <div className="live-dot" style={{ background:'var(--amber-d)', boxShadow:'0 0 5px var(--amber-d)', animation:'none' }} />
                BYBIT
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:9, fontWeight:700, color:'var(--green-d)', background:'rgba(0,217,126,.06)', border:'1px solid rgba(0,217,126,.12)', borderRadius:8, padding:'3px 9px', fontFamily:'var(--font-display)', letterSpacing:1 }}>
                <div className="live-dot" />
                LIVE
              </div>
            </div>
          </div>

          {/* Ticker strip */}
          <div style={{
            background:'rgba(0,0,0,.3)', borderTop:'1px solid rgba(255,255,255,.04)',
            padding:'5px 20px', display:'flex', gap:20,
            overflowX:'auto', alignItems:'center',
          }} className="no-scrollbar">
            {tickerSyms.map(sym => {
              const p = prices[sym]
              if (!p) return null
              const up = p.change >= 0
              return (
                <div key={sym} style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:9, fontWeight:600, color:'rgba(255,255,255,.3)', letterSpacing:1.5 }}>
                    {sym.replace('USDT','')}
                  </span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600, color:'rgba(255,255,255,.85)' }}>
                    ${p.price.toLocaleString('en-US', { minimumFractionDigits: p.price < 10 ? 4 : p.price < 100 ? 3 : 2, maximumFractionDigits: p.price < 10 ? 4 : p.price < 100 ? 3 : 2 })}
                  </span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:9, fontWeight:700, color: up ? 'var(--green-d)' : 'var(--red-d)', background: up ? 'rgba(0,217,126,.1)' : 'rgba(255,68,102,.1)', padding:'1px 5px', borderRadius:4 }}>
                    {up ? '+' : ''}{p.change.toFixed(2)}%
                  </span>
                </div>
              )
            })}
            <div style={{ marginLeft:'auto', fontSize:9, color:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', gap:4, flexShrink:0, fontFamily:'var(--font-mono)' }}>
              <div className="live-dot" style={{ width:4, height:4 }} />
              30s
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
          {children}
        </main>

        {/* Mobile bottom nav */}
        {window.innerWidth < 768 && (
          <nav style={{
            background:'var(--dark)', borderTop:'1px solid rgba(255,255,255,.08)',
            display:'flex', flexShrink:0,
          }}>
            {NAV.slice(0,4).map(({ path, icon, label }) => (
              <button key={path} onClick={() => navigate(path)} style={{
                flex:1, display:'flex', flexDirection:'column', alignItems:'center',
                gap:3, padding:'8px 0 10px', border:'none', cursor:'pointer',
                background:'transparent',
                color: pathname === path ? '#f5f1ea' : 'rgba(255,255,255,.25)',
                fontFamily:'var(--font-display)', fontSize:7, fontWeight:700,
                letterSpacing:.5, textTransform:'uppercase',
              }}>
                <span style={{ fontSize:16 }}>{icon}</span>
                {label}
              </button>
            ))}
            <button onClick={() => navigate('/settings')} style={{
              flex:1, display:'flex', flexDirection:'column', alignItems:'center',
              gap:3, padding:'8px 0 10px', border:'none', cursor:'pointer',
              background:'transparent',
              color: pathname === '/settings' ? '#f5f1ea' : 'rgba(255,255,255,.25)',
              fontFamily:'var(--font-display)', fontSize:7, fontWeight:700,
              letterSpacing:.5, textTransform:'uppercase',
            }}>
              <span style={{ fontSize:16 }}>⚙️</span>
              Settings
            </button>
          </nav>
        )}
      </div>
    </div>
  )
}
