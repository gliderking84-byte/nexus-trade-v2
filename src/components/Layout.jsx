import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePrices } from '../hooks/usePrices'
import { useIsMobile } from '../hooks/useIsMobile'
import { useBalance } from '../hooks/useBalance'

const NAV = [
  { path:'/',               icon:'▦',  label:'Dashboard' },
  { path:'/ai',            icon:'◈',  label:'AI Guidata' },
  { path:'/journal',       icon:'⊟',  label:'Journal' },
  { path:'/conversations', icon:'⊡',  label:'Storico' },
  { path:'/settings',      icon:'⊕',  label:'Settings' },
]

const SYMBOLS = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','AVAXUSDT','DOTUSDT','LINKUSDT','ADAUSDT','XRPUSDT','DOGEUSDT']

export default function Layout({ children, stats, settings }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { prices, connected } = usePrices(SYMBOLS)
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { balance } = useBalance(settings)

  useEffect(() => { setDrawerOpen(false) }, [pathname])

  const currentPage = NAV.find(n => n.path === pathname)

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding:'22px 20px 18px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:32, height:32, borderRadius:8,
            background:'linear-gradient(135deg, var(--cyan2), var(--cyan))',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:16, fontWeight:800, color:'#000',
            boxShadow:'0 4px 12px rgba(0,212,255,.3)',
          }}>N</div>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:800, letterSpacing:3, color:'var(--t1)' }}>NEXUS</div>
            <div style={{ fontSize:8, color:'var(--t4)', letterSpacing:2, marginTop:1 }}>TRADE AI</div>
          </div>
        </div>
      </div>

      {/* Balance pill */}
      {balance && (
        <div style={{ margin:'12px 14px 4px', padding:'10px 14px', background:'rgba(0,212,255,.06)', border:'1px solid rgba(0,212,255,.15)', borderRadius:10 }}>
          <div style={{ fontSize:9, color:'var(--t4)', fontFamily:'var(--font-display)', fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>Disponibile</div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:16, fontWeight:600, color:'var(--cyan)' }}>
            ${parseFloat(balance).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}
            <span style={{ fontSize:10, color:'var(--t4)', marginLeft:4 }}>USDT</span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex:1, padding:'8px 10px', display:'flex', flexDirection:'column', gap:2, marginTop:4 }}>
        {NAV.map(({ path, icon, label }) => {
          const active = pathname === path
          return (
            <button key={path} onClick={() => navigate(path)} style={{
              display:'flex', alignItems:'center', gap:12, padding:'11px 14px',
              borderRadius:10, border:'none', cursor:'pointer', textAlign:'left',
              background: active ? 'rgba(0,212,255,.1)' : 'transparent',
              color: active ? 'var(--cyan)' : 'var(--t3)',
              fontFamily:'var(--font-display)', fontSize:12, fontWeight:600,
              transition:'all .15s', width:'100%',
              boxShadow: active ? 'inset 0 0 0 1px rgba(0,212,255,.2)' : 'none',
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background='rgba(255,255,255,.04)'; e.currentTarget.style.color='var(--t2)' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--t3)' } }}
            >
              <span style={{ fontSize:15, width:20, textAlign:'center', opacity: active ? 1 : .6 }}>{icon}</span>
              <span>{label}</span>
              {path === '/journal' && (stats?.open || 0) > 0 && (
                <span style={{ marginLeft:'auto', background:'var(--cyan)', color:'#000', borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:800 }}>
                  {stats.open}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding:'14px 16px', borderTop:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div className="live-dot" style={{
            background: connected ? 'var(--green)' : 'var(--amber)',
            boxShadow: connected ? '0 0 6px var(--green)' : 'none',
          }} />
          <span style={{ fontSize:9, color:'var(--t4)', fontFamily:'var(--font-display)', fontWeight:600, letterSpacing:.5 }}>
            {connected ? 'Bybit WebSocket · Live' : 'Prezzi offline'}
          </span>
        </div>
      </div>
    </>
  )

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside style={{
          width:220, flexShrink:0,
          background:'var(--bg2)',
          borderRight:'1px solid var(--border)',
          display:'flex', flexDirection:'column',
        }}>
          <SidebarContent />
        </aside>
      )}

      {/* Mobile drawer */}
      {isMobile && drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:60, backdropFilter:'blur(4px)' }} />
          <aside style={{
            position:'fixed', top:0, left:0, height:'100vh', width:260,
            background:'var(--bg2)', zIndex:70,
            display:'flex', flexDirection:'column',
            animation:'slide-in-left .22s ease',
            boxShadow:'4px 0 32px rgba(0,0,0,.5)',
          }}>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Header */}
        <header style={{
          background:'var(--bg2)',
          borderBottom:'1px solid var(--border)',
          flexShrink:0, zIndex:20,
        }}>
          {/* Top bar */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', height:48 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {isMobile && (
                <button onClick={() => setDrawerOpen(true)} style={{
                  background:'var(--bg3)', border:'1px solid var(--border)',
                  borderRadius:8, color:'var(--t3)', fontSize:16,
                  cursor:'pointer', padding:'6px 10px', lineHeight:1,
                }}>☰</button>
              )}
              <div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:800, color:'var(--t1)', letterSpacing: isMobile ? 1 : 2 }}>
                  {isMobile ? currentPage?.label?.toUpperCase() || 'NEXUS' : currentPage?.label?.toUpperCase() || 'NEXUS TRADE'}
                </div>
              </div>
            </div>

            {/* Right pills */}
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              {balance && isMobile && (
                <div style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:600, color:'var(--cyan)', background:'rgba(0,212,255,.08)', border:'1px solid rgba(0,212,255,.15)', borderRadius:7, padding:'4px 9px' }}>
                  ${parseFloat(balance).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}
                  <span style={{ fontSize:8, color:'var(--t4)', marginLeft:3 }}>USDT</span>
                </div>
              )}
              <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:8, fontWeight:700, color:'var(--amber)', background:'rgba(240,192,64,.08)', border:'1px solid rgba(240,192,64,.15)', borderRadius:6, padding:'4px 8px', fontFamily:'var(--font-display)', letterSpacing:.5 }}>
                <div className="live-dot" style={{ background:'var(--amber)', boxShadow:'none', animation:'none', width:4, height:4 }} />
                BYBIT
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:8, fontWeight:700, color:'var(--green)', background:'rgba(0,217,126,.06)', border:'1px solid rgba(0,217,126,.12)', borderRadius:6, padding:'4px 8px', fontFamily:'var(--font-display)', letterSpacing:.5 }}>
                <div className="live-dot" style={{ width:4, height:4 }} />
                LIVE
              </div>
            </div>
          </div>

          {/* Ticker strip */}
          <div style={{
            background:'rgba(0,0,0,.2)',
            borderTop:'1px solid var(--border)',
            padding:'6px 16px',
            display:'flex', gap:16,
            overflowX:'auto', alignItems:'center',
            WebkitOverflowScrolling:'touch',
          }} className="no-scrollbar">
            {SYMBOLS.map(sym => {
              const p = prices[sym]
              if (!p) return null
              const up = p.change >= 0
              return (
                <div key={sym} style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'var(--t4)', letterSpacing:1 }}>
                    {sym.replace('USDT','')}
                  </span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:600, color:'var(--t2)' }}>
                    ${p.price.toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })}
                  </span>
                  <span style={{
                    fontFamily:'var(--font-mono)', fontSize:9, fontWeight:700,
                    color: up ? 'var(--green)' : 'var(--red)',
                    background: up ? 'rgba(0,217,126,.1)' : 'rgba(255,68,102,.1)',
                    padding:'1px 5px', borderRadius:4,
                  }}>
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
          paddingBottom: isMobile ? 64 : 0,
          WebkitOverflowScrolling:'touch',
        }}>
          {children}
        </main>

        {/* Mobile bottom nav */}
        {isMobile && (
          <nav style={{
            position:'fixed', bottom:0, left:0, right:0,
            background:'var(--bg2)',
            borderTop:'1px solid var(--border)',
            display:'flex', zIndex:20,
            paddingBottom:'env(safe-area-inset-bottom)',
          }}>
            {NAV.map(({ path, icon, label }) => {
              const active = pathname === path
              return (
                <button key={path} onClick={() => navigate(path)} style={{
                  flex:1, display:'flex', flexDirection:'column', alignItems:'center',
                  gap:4, padding:'9px 0 10px',
                  border:'none', cursor:'pointer',
                  background: active ? 'rgba(0,212,255,.06)' : 'transparent',
                  color: active ? 'var(--cyan)' : 'var(--t4)',
                  fontFamily:'var(--font-display)', fontSize:7, fontWeight:700,
                  letterSpacing:.3, textTransform:'uppercase', transition:'color .15s',
                  borderTop: active ? '2px solid var(--cyan)' : '2px solid transparent',
                }}>
                  <span style={{ fontSize:17, lineHeight:1 }}>{icon}</span>
                  {label.slice(0,7)}
                </button>
              )
            })}
          </nav>
        )}
      </div>
    </div>
  )
}
