import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePrices } from '../hooks/usePrices'
import { useIsMobile } from '../hooks/useIsMobile'

const NAV = [
  { path: '/',               icon: '◈',  label: 'Dashboard' },
  { path: '/ai',            icon: '🤖', label: 'AI Guidata' },
  { path: '/journal',       icon: '📒', label: 'Journal' },
  { path: '/conversations', icon: '💬', label: 'Chat' },
  { path: '/settings',      icon: '⚙️', label: 'Settings' },
]

const SYMBOLS = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','AVAXUSDT']

export default function Layout({ children, stats }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { prices, connected } = usePrices(SYMBOLS)
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => { setDrawerOpen(false) }, [pathname])

  const currentLabel = NAV.find(n => n.path === pathname)?.label || 'NEXUS'

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--paper)' }}>

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside style={{
          width:220, flexShrink:0, background:'var(--dark2)',
          borderRight:'1px solid rgba(255,255,255,.06)',
          display:'flex', flexDirection:'column',
        }}>
          <div style={{ padding:'20px 18px 16px', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:800, letterSpacing:4, color:'#f5f1ea' }}>NEXUS</div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,.2)', letterSpacing:2, marginTop:2 }}>TRADE INTELLIGENCE</div>
          </div>
          <nav style={{ flex:1, padding:'10px', display:'flex', flexDirection:'column', gap:2 }}>
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
                  {path === '/journal' && (stats?.open || 0) > 0 && (
                    <span style={{ marginLeft:'auto', background:'rgba(255,255,255,.15)', borderRadius:10, padding:'1px 7px', fontSize:10 }}>{stats.open}</span>
                  )}
                </button>
              )
            })}
          </nav>
          <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div className="live-dot" style={{ background: connected ? 'var(--green-d)' : 'var(--amber-d)' }} />
              <span style={{ fontSize:9, color:'rgba(255,255,255,.2)' }}>{connected ? 'WebSocket · Live' : 'Prezzi simulati'}</span>
            </div>
          </div>
        </aside>
      )}

      {/* Mobile Drawer */}
      {isMobile && drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:60 }} />
          <aside style={{
            position:'fixed', top:0, left:0, height:'100vh', width:240,
            background:'var(--dark2)', zIndex:70,
            display:'flex', flexDirection:'column',
            animation:'slide-in-left .22s ease',
          }}>
            <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:800, letterSpacing:3, color:'#f5f1ea' }}>NEXUS</div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,.2)', letterSpacing:1.5, marginTop:1 }}>TRADE INTELLIGENCE</div>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{ background:'rgba(255,255,255,.06)', border:'none', color:'rgba(255,255,255,.5)', fontSize:16, cursor:'pointer', padding:'6px 8px', borderRadius:7, lineHeight:1 }}>✕</button>
            </div>
            <nav style={{ flex:1, padding:'10px', display:'flex', flexDirection:'column', gap:2 }}>
              {NAV.map(({ path, icon, label }) => {
                const active = pathname === path
                return (
                  <button key={path} onClick={() => navigate(path)} style={{
                    display:'flex', alignItems:'center', gap:12, padding:'13px 14px',
                    borderRadius:8, border:'none', cursor:'pointer', textAlign:'left',
                    background: active ? 'rgba(255,255,255,.08)' : 'transparent',
                    color: active ? '#f5f1ea' : 'rgba(255,255,255,.4)',
                    fontFamily:'var(--font-display)', fontSize:13, fontWeight:600, width:'100%',
                  }}>
                    <span style={{ fontSize:17, width:22, textAlign:'center' }}>{icon}</span>
                    <span>{label}</span>
                  </button>
                )
              })}
            </nav>
            <div style={{ padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div className="live-dot" style={{ background: connected ? 'var(--green-d)' : 'var(--amber-d)' }} />
                <span style={{ fontSize:9, color:'rgba(255,255,255,.2)' }}>{connected ? 'WebSocket · Live' : 'Prezzi simulati'}</span>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main column */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Header */}
        <header style={{ background:'var(--dark)', borderBottom:'2px solid rgba(255,255,255,.06)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', height:46 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {isMobile && (
                <button onClick={() => setDrawerOpen(true)} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,.5)', fontSize:20, cursor:'pointer', padding:'2px 6px', lineHeight:1 }}>☰</button>
              )}
              <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:800, letterSpacing: isMobile ? 1.5 : 3, color:'#f5f1ea' }}>
                {isMobile ? currentLabel.toUpperCase() : 'NEXUS TRADE'}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:8, fontWeight:700, color:'var(--amber-d)', background:'rgba(240,192,64,.08)', border:'1px solid rgba(240,192,64,.15)', borderRadius:6, padding:'3px 7px', fontFamily:'var(--font-display)' }}>
                <div className="live-dot" style={{ background:'var(--amber-d)', boxShadow:'none', animation:'none', width:4, height:4 }} />
                BYBIT
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:8, fontWeight:700, color:'var(--green-d)', background:'rgba(0,217,126,.06)', border:'1px solid rgba(0,217,126,.12)', borderRadius:6, padding:'3px 7px', fontFamily:'var(--font-display)' }}>
                <div className="live-dot" style={{ width:4, height:4 }} />
                LIVE
              </div>
            </div>
          </div>

          {/* Ticker */}
          <div style={{
            background:'rgba(0,0,0,.25)', borderTop:'1px solid rgba(255,255,255,.04)',
            padding:'5px 14px', display:'flex', gap:12,
            overflowX:'auto', alignItems:'center',
            WebkitOverflowScrolling:'touch',
          }} className="no-scrollbar">
            {SYMBOLS.map(sym => {
              const p = prices[sym]
              if (!p) return null
              const up = p.change >= 0
              return (
                <div key={sym} style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:8, fontWeight:600, color:'rgba(255,255,255,.3)', letterSpacing:1 }}>{sym.replace('USDT','')}</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:600, color:'rgba(255,255,255,.85)' }}>
                    ${p.price.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}
                  </span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:8, fontWeight:700, color: up ? 'var(--green-d)' : 'var(--red-d)', background: up ? 'rgba(0,217,126,.1)' : 'rgba(255,68,102,.1)', padding:'1px 4px', borderRadius:3 }}>
                    {up ? '+' : ''}{p.change.toFixed(2)}%
                  </span>
                </div>
              )
            })}
          </div>
        </header>

        {/* Content */}
        <main style={{
          flex:1, overflowY:'auto', overflowX:'hidden',
          paddingBottom: isMobile ? 62 : 0,
          WebkitOverflowScrolling:'touch',
        }}>
          {children}
        </main>

        {/* Mobile Bottom Nav */}
        {isMobile && (
          <nav style={{
            position:'fixed', bottom:0, left:0, right:0,
            background:'var(--dark)', borderTop:'1px solid rgba(255,255,255,.1)',
            display:'flex', zIndex:20,
          }}>
            {NAV.map(({ path, icon, label }) => {
              const active = pathname === path
              return (
                <button key={path} onClick={() => navigate(path)} style={{
                  flex:1, display:'flex', flexDirection:'column', alignItems:'center',
                  gap:3, padding:'9px 0 11px',
                  border:'none', cursor:'pointer', background:'transparent',
                  color: active ? '#f5f1ea' : 'rgba(255,255,255,.3)',
                  fontFamily:'var(--font-display)', fontSize:7, fontWeight:700,
                  letterSpacing:.3, textTransform:'uppercase', transition:'color .15s',
                }}>
                  <span style={{ fontSize:17, lineHeight:1 }}>{icon}</span>
                  {label.slice(0, 7)}
                </button>
              )
            })}
          </nav>
        )}
      </div>

      <style>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
