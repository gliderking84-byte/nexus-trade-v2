import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNews } from '../hooks/useNews'
import { usePrices } from '../hooks/usePrices'
import { useIsMobile } from '../hooks/useIsMobile'
import { callClaude, SYSTEM_DASHBOARD, fmt } from '../utils/index.js'
import BybitPanel from '../components/BybitPanel.jsx'
import ChartModal from '../components/ChartModal.jsx'

const ASSETS = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','AVAXUSDT','DOTUSDT','LINKUSDT','ADAUSDT','XRPUSDT','DOGEUSDT','MATICUSDT','ARBUSDT']
const SENTIMENT_LABEL = { bull:'Bullish', bear:'Bearish', neut:'Neutro' }

const FALLBACK_SETUPS = [
  { ticker:'BTCUSDT',  direction:'LONG',  entry:'61800', sl:'59200', tp1:'66500', tp2:'70000', leverage:'7', budget:'50', rr:'2.6', notes:'Double bottom su daily, supporto $61K regge' },
  { ticker:'ETHUSDT',  direction:'LONG',  entry:'3050',  sl:'2880',  tp1:'3350',  tp2:'3600',  leverage:'7', budget:'50', rr:'2.1', notes:'Triangolo ascendente weekly' },
  { ticker:'SOLUSDT',  direction:'SHORT', entry:'100',   sl:'115',   tp1:'79',    tp2:'68',    leverage:'7', budget:'50', rr:'1.9', notes:'Double top weekly confermato' },
  { ticker:'AVAXUSDT', direction:'LONG',  entry:'32.5',  sl:'30.0',  tp1:'38.0',  tp2:'42.0',  leverage:'5', budget:'50', rr:'2.4', notes:'Rimbalzo dal supporto' },
  { ticker:'BNBUSDT',  direction:'LONG',  entry:'415',   sl:'395',   tp1:'450',   tp2:'480',   leverage:'5', budget:'50', rr:'1.7', notes:'Supporto weekly, consolidazione' },
  { ticker:'DOTUSDT',  direction:'LONG',  entry:'7.80',  sl:'7.20',  tp1:'9.00',  tp2:'10.00', leverage:'5', budget:'50', rr:'2.0', notes:'Breakout resistenza mensile' },
  { ticker:'LINKUSDT', direction:'LONG',  entry:'14.20', sl:'13.00', tp1:'16.50', tp2:'18.00', leverage:'5', budget:'50', rr:'1.9', notes:'RSI divergenza rialzista' },
  { ticker:'ADAUSDT',  direction:'SHORT', entry:'0.720', sl:'0.780', tp1:'0.620', tp2:'0.560', leverage:'5', budget:'50', rr:'1.6', notes:'Resistenza storica, volume calante' },
  { ticker:'XRPUSDT',  direction:'LONG',  entry:'0.520', sl:'0.480', tp1:'0.600', tp2:'0.660', leverage:'5', budget:'50', rr:'2.0', notes:'Supporto .50, pattern cup&handle' },
  { ticker:'DOGEUSDT', direction:'LONG',  entry:'0.092', sl:'0.082', tp1:'0.112', tp2:'0.130', leverage:'3', budget:'50', rr:'2.0', notes:'Consolidazione su supporto' },
  { ticker:'MATICUSDT',direction:'SHORT', entry:'0.540', sl:'0.580', tp1:'0.460', tp2:'0.420', leverage:'5', budget:'50', rr:'2.0', notes:'Trend ribassista confermato' },
  { ticker:'ARBUSDT',  direction:'LONG',  entry:'0.820', sl:'0.750', tp1:'0.950', tp2:'1.050', leverage:'5', budget:'50', rr:'1.8', notes:'Breakout triangolo su 4h' },
]

async function generateSetups(apiKey, prices) {
  const priceStr = Object.entries(prices)
    .filter(([k]) => ASSETS.includes(k))
    .map(([k,v]) => `${k}: $${v.price} (${v.change >= 0 ? '+' : ''}${v.change.toFixed(2)}%)`)
    .join(', ')
  const text = await callClaude({
    apiKey,
    system: `Sei un analista tecnico crypto. Genera setup per TUTTI i seguenti asset: ${ASSETS.join(', ')}. Rispondi SOLO con JSON array, nessun testo extra. Ogni elemento: {"ticker":"BTCUSDT","direction":"LONG","entry":"61800","sl":"59200","tp1":"66500","tp2":"70000","leverage":"7","budget":"50","notes":"nota breve","rr":"2.6"}`,
    messages: [{ role:'user', content:`Prezzi attuali: ${priceStr}. Genera esattamente 12 setup (uno per asset), con R:R > 1.4. Rispondi solo JSON array.` }],
  })
  const clean = text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(clean)
  return Array.isArray(parsed) && parsed.length >= 6 ? parsed : FALLBACK_SETUPS
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px' }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:'var(--t4)', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:20, fontWeight:700, color: color || 'var(--t1)' }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:'var(--t4)', marginTop:3 }}>{sub}</div>}
    </div>
  )
}

// ── Setup row (desktop) ───────────────────────────────────────────────────────
function SetupRow({ s, isSelected, onSelect, onChart, onAI }) {
  const isLong = s.direction === 'LONG'
  const rr = parseFloat(s.rr)
  const rrColor = rr >= 2 ? 'var(--green)' : rr >= 1.5 ? 'var(--amber)' : 'var(--t3)'

  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:'130px 60px 90px 90px 90px 60px 1fr',
      gap:8, padding:'11px 12px',
      borderBottom:'1px solid var(--border)',
      alignItems:'center',
      background: isSelected ? 'rgba(0,212,255,.05)' : 'transparent',
      transition:'background .15s',
      borderLeft: isSelected ? '2px solid var(--cyan)' : '2px solid transparent',
    }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,.02)' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:28, height:28, borderRadius:7, background:'var(--bg4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:800, color:'var(--t2)' }}>
            {s.ticker.replace('USDT','').slice(0,3)}
          </span>
        </div>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:12, color:'var(--t1)' }}>{s.ticker.replace('USDT','')}</div>
          <div style={{ fontSize:9, color:'var(--t4)' }}>USDT · Perp</div>
        </div>
      </div>
      <span className={`badge badge-${s.direction.toLowerCase()}`}>{s.direction}</span>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600, color:'var(--cyan)' }}>${s.entry}</span>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600, color:'var(--red)' }}>${s.sl}</span>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600, color:'var(--green)' }}>${s.tp1}</span>
      <div>
        <div style={{ height:2, background:'var(--bg4)', borderRadius:1, overflow:'hidden', marginBottom:3 }}>
          <div style={{ height:'100%', background: rrColor, borderRadius:1, width:`${Math.min(rr/3*100,100)}%`, transition:'width .3s' }} />
        </div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:10, fontWeight:700, color: rrColor }}>1:{s.rr}</div>
      </div>
      <div style={{ display:'flex', gap:5 }}>
        <button className="btn" style={{
          fontSize:10, padding:'5px 9px', borderRadius:6,
          background: isLong ? 'rgba(0,217,126,.12)' : 'rgba(255,68,102,.12)',
          color: isLong ? 'var(--green)' : 'var(--red)',
          border: `1px solid ${isLong ? 'rgba(0,217,126,.25)' : 'rgba(255,68,102,.25)'}`,
        }} onClick={onSelect}>⚡</button>
        <button className="btn btn-ghost" style={{ fontSize:10, padding:'5px 9px', borderRadius:6 }} onClick={onAI}>🤖</button>
        <button className="btn btn-ghost" style={{ fontSize:10, padding:'5px 9px', borderRadius:6 }} onClick={onChart}>📈</button>
      </div>
    </div>
  )
}

// ── Setup card (mobile) ───────────────────────────────────────────────────────
function SetupCard({ s, isSelected, onSelect, onChart, onAI }) {
  const isLong = s.direction === 'LONG'
  const rr = parseFloat(s.rr)
  const rrColor = rr >= 2 ? 'var(--green)' : rr >= 1.5 ? 'var(--amber)' : 'var(--t3)'

  return (
    <div style={{
      background:'var(--bg2)', border:`1px solid ${isSelected ? 'rgba(0,212,255,.3)' : 'var(--border)'}`,
      borderRadius:12, padding:14, flexShrink:0, width:220,
      boxShadow: isSelected ? '0 0 16px rgba(0,212,255,.1)' : 'none',
      transition:'all .2s',
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:7, background:'var(--bg4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:800, color:'var(--t2)' }}>
              {s.ticker.replace('USDT','').slice(0,3)}
            </span>
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:13 }}>{s.ticker.replace('USDT','')}</div>
            <div className={`badge badge-${s.direction.toLowerCase()}`}>{s.direction}</div>
          </div>
        </div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color: rrColor }}>1:{s.rr}</div>
      </div>

      {/* Prices */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:10 }}>
        {[
          { l:'Entry', v:`$${s.entry}`, c:'var(--cyan)' },
          { l:'SL',    v:`$${s.sl}`,   c:'var(--red)' },
          { l:'TP1',   v:`$${s.tp1}`,  c:'var(--green)' },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ background:'var(--bg3)', borderRadius:7, padding:'7px 8px', textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'var(--t4)', textTransform:'uppercase', letterSpacing:.8, marginBottom:2 }}>{l}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {s.notes && <div style={{ fontSize:10, color:'var(--t4)', marginBottom:10, lineHeight:1.4 }}>{s.notes}</div>}

      {/* Actions */}
      <button onClick={onSelect} style={{
        width:'100%', padding:'9px',
        background: isSelected
          ? (isLong ? 'rgba(0,217,126,.15)' : 'rgba(255,68,102,.15)')
          : 'var(--bg3)',
        border: `1px solid ${isSelected ? (isLong ? 'rgba(0,217,126,.3)' : 'rgba(255,68,102,.3)') : 'var(--border)'}`,
        borderRadius:8, color: isSelected ? (isLong ? 'var(--green)' : 'var(--red)') : 'var(--t2)',
        fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, cursor:'pointer',
        marginBottom:6,
      }}>
        {isSelected ? '✓ Selezionato' : '⚡ Apri Trade'}
      </button>
      <div style={{ display:'flex', gap:6 }}>
        <button onClick={onAI} style={{ flex:1, padding:'7px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:7, color:'var(--t3)', fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, cursor:'pointer' }}>🤖 AI</button>
        <button onClick={onChart} style={{ flex:1, padding:'7px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:7, color:'var(--t3)', fontFamily:'var(--font-display)', fontSize:10, fontWeight:700, cursor:'pointer' }}>📈 Chart</button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Dashboard({ settings, onSelectSetup, journal, pendingSetup: externalSetup }) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { news, loading: newsLoading, refresh: refreshNews } = useNews()
  const { prices } = usePrices(ASSETS)
  const [setups, setSetups] = useState(FALLBACK_SETUPS)
  const [setupsLoading, setSetupsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [selectedSetup, setSelectedSetup] = useState(null)
  const [aiInput, setAiInput] = useState('')
  const [aiMsg, setAiMsg] = useState('Ciao! Analizza i setup, leggi le news o chiedimi qualsiasi cosa sul mercato crypto.')
  const [aiLoading, setAiLoading] = useState(false)
  const [mobileTab, setMobileTab] = useState('setup')
  const [chartTicker, setChartTicker] = useState(null)

  const activeSetup = externalSetup || selectedSetup

  const fetchSetups = async () => {
    if (!settings.hasAnthropicKey) return
    setSetupsLoading(true)
    try {
      const s = await generateSetups(settings.settings.anthropicKey, prices)
      setSetups(s); setLastUpdate(new Date())
    } catch(e) { console.error(e) }
    setSetupsLoading(false)
  }

  useEffect(() => {
    fetchSetups()
    const t = setInterval(fetchSetups, 60 * 60 * 1000)
    return () => clearInterval(t)
  }, [settings.hasAnthropicKey])

  const handleAskAI = async () => {
    if (!aiInput.trim() || !settings.hasAnthropicKey) return
    const q = aiInput; setAiInput(''); setAiLoading(true)
    try {
      const res = await callClaude({ apiKey: settings.settings.anthropicKey, system: SYSTEM_DASHBOARD, messages: [{ role:'user', content:q }] })
      setAiMsg(res)
    } catch { setAiMsg('⚠️ Errore. Verifica la API key.') }
    setAiLoading(false)
  }

  const handleSelectSetup = (s) => {
    setSelectedSetup(s); onSelectSetup?.(s)
    if (isMobile) setMobileTab('bybit')
  }

  const timeStr = lastUpdate ? `${Math.round((Date.now() - lastUpdate) / 60000)} min fa` : 'Dati di default'

  // ── MOBILE ──────────────────────────────────────────────────────────────────
  if (isMobile) return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100%' }}>
      {chartTicker && <ChartModal ticker={chartTicker} onClose={() => setChartTicker(null)} />}

      {/* Tab bar */}
      <div style={{ display:'flex', background:'var(--bg2)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        {[
          { id:'setup', label:'Setup AI' },
          { id:'news',  label:'News' },
          { id:'bybit', label:'⚡ Trade' },
        ].map(t => (
          <button key={t.id} onClick={() => setMobileTab(t.id)} style={{
            flex:1, padding:'11px 0', border:'none', cursor:'pointer',
            background:'transparent',
            fontFamily:'var(--font-display)', fontSize:11, fontWeight:700,
            color: mobileTab === t.id ? 'var(--cyan)' : 'var(--t4)',
            borderBottom: mobileTab === t.id ? '2px solid var(--cyan)' : '2px solid transparent',
            transition:'all .15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Setup tab */}
      {mobileTab === 'setup' && (
        <div style={{ padding:16, display:'flex', flexDirection:'column', gap:14 }}>
          {/* Header */}
          <div>
            <div className="eyebrow">
              <div className="live-dot" />
              Setup AI · {setupsLoading ? 'Aggiornamento...' : timeStr}
              {settings.hasAnthropicKey && (
                <button onClick={fetchSetups} disabled={setupsLoading} style={{ background:'none', border:'none', color:'var(--cyan)', fontSize:11, cursor:'pointer', padding:0 }}>⟳</button>
              )}
            </div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, color:'var(--t1)', marginTop:4 }}>
              {setups.length} opportunità identificate
            </div>
            {!settings.hasAnthropicKey && (
              <div style={{ fontSize:11, color:'var(--amber)', marginTop:6, padding:'8px 12px', background:'rgba(240,192,64,.06)', border:'1px solid rgba(240,192,64,.15)', borderRadius:8 }}>
                ⚠️ Configura la API key Anthropic per setup AI in tempo reale
              </div>
            )}
          </div>

          {/* Horizontal scroll cards */}
          <div style={{ overflowX:'auto', display:'flex', gap:10, margin:'0 -16px', padding:'0 16px', WebkitOverflowScrolling:'touch' }} className="no-scrollbar">
            {setups.map((s, i) => (
              <SetupCard key={i} s={s} isSelected={activeSetup?.ticker === s.ticker}
                onSelect={() => handleSelectSetup(s)}
                onChart={() => setChartTicker(s.ticker)}
                onAI={() => navigate(`/ai?ticker=${s.ticker}`)}
              />
            ))}
            <div style={{ width:1, flexShrink:0 }} />
          </div>

          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <StatCard label="Trade aperti" value={journal.stats.open} color="var(--cyan)" />
            <StatCard label="Win Rate" value={journal.stats.winRate !== null ? `${journal.stats.winRate}%` : '—'} color="var(--green)" />
          </div>

          {/* AI box */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,var(--cyan2),var(--cyan))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0, color:'#000', fontWeight:800 }}>◈</div>
              <span style={{ fontSize:12, fontWeight:700, color:'var(--t2)', fontFamily:'var(--font-display)' }}>NexusAI</span>
              <div style={{ marginLeft:'auto', fontSize:8, color:'var(--green)', display:'flex', alignItems:'center', gap:3, fontFamily:'var(--font-display)', fontWeight:600 }}>
                <div className="live-dot" style={{ width:4, height:4 }} />Online
              </div>
            </div>
            <div style={{ fontSize:12, color:'var(--t3)', lineHeight:1.55, marginBottom:10, background:'var(--bg3)', borderRadius:8, padding:'9px 11px', borderLeft:'2px solid rgba(0,212,255,.3)' }}>
              {aiLoading ? '...' : aiMsg}
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <input className="input-dark" value={aiInput} onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAskAI()}
                placeholder={settings.hasAnthropicKey ? 'Chiedi al mercato...' : 'Configura API key →'}
                style={{ fontSize:12 }} />
              <button onClick={handleAskAI} disabled={aiLoading || !settings.hasAnthropicKey}
                style={{ background:'linear-gradient(135deg,var(--cyan2),var(--cyan))', border:'none', borderRadius:8, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', color:'#000', cursor:'pointer', fontSize:14, fontWeight:800, flexShrink:0 }}>↑</button>
            </div>
            <button className="btn btn-ghost btn-full" style={{ marginTop:10, fontSize:12, padding:'10px' }} onClick={() => navigate('/ai')}>
              ◈ Avvia Analisi Guidata →
            </button>
          </div>
        </div>
      )}

      {/* News tab */}
      {mobileTab === 'news' && (
        <div style={{ padding:16 }}>
          <div className="eyebrow" style={{ marginBottom:12 }}>
            <div className="live-dot" />
            Notizie crypto · ogni 10 min
            <button onClick={refreshNews} style={{ background:'none', border:'none', color:'var(--cyan)', fontSize:11, cursor:'pointer', padding:0 }}>{newsLoading ? '⟳' : 'Aggiorna'}</button>
          </div>
          {news.slice(0,8).map((item, i) => (
            <div key={i} style={{ display:'flex', gap:10, padding:'12px 0', borderBottom:'1px solid var(--border)', cursor:'pointer' }}
              onClick={() => item.link && window.open(item.link, '_blank')}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:800, color:'var(--bg4)', lineHeight:1, flexShrink:0, width:22 }}>
                {String(i+1).padStart(2,'0')}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--t2)', lineHeight:1.45, marginBottom:5 }}>{item.title}</div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'var(--t4)', textTransform:'uppercase', letterSpacing:.8 }}>{item.source}</span>
                  <span style={{ fontSize:8, color:'var(--t4)' }}>{item.time}</span>
                  <span className={`badge badge-${item.sentiment}`}>{SENTIMENT_LABEL[item.sentiment]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bybit tab */}
      {mobileTab === 'bybit' && (
        <div style={{ padding:16, display:'flex', flexDirection:'column', gap:12 }}>
          {!activeSetup && (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:'28px 16px', textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:10, opacity:.3 }}>⚡</div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--t2)', marginBottom:6 }}>Nessun setup selezionato</div>
              <div style={{ fontSize:12, color:'var(--t4)', marginBottom:14, lineHeight:1.5 }}>Vai a "Setup AI" e clicca "Apri Trade" su uno dei setup.</div>
              <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={() => setMobileTab('setup')}>← Vai ai Setup</button>
            </div>
          )}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
            <BybitPanel setup={activeSetup} settings={settings} onOrderSent={(s) => journal.addTrade(s)} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <StatCard label="Aperti" value={journal.stats.open} color="var(--cyan)" />
            <StatCard label="Win Rate" value={journal.stats.winRate !== null ? `${journal.stats.winRate}%` : '—'} color="var(--green)" />
          </div>
          <button className="btn btn-ghost btn-full" style={{ fontSize:12, padding:'10px' }} onClick={() => navigate('/journal')}>
            📒 Vedi Journal completo →
          </button>
        </div>
      )}
    </div>
  )

  // ── DESKTOP ─────────────────────────────────────────────────────────────────
  return (
    <>
      {chartTicker && <ChartModal ticker={chartTicker} onClose={() => setChartTicker(null)} />}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', height:'100%', overflow:'hidden' }}>

        {/* Main */}
        <div style={{ overflowY:'auto', display:'flex', flexDirection:'column' }}>

          {/* Stats bar */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:1, borderBottom:'1px solid var(--border)' }}>
            {[
              { label:'Setup Identificati', value: setups.length, color:'var(--cyan)' },
              { label:'Trade Aperti',        value: journal.stats.open, color:'var(--t1)' },
              { label:'Win Rate',            value: journal.stats.winRate !== null ? `${journal.stats.winRate}%` : '—', color:'var(--green)' },
              { label:'Asset Monitorati',    value: ASSETS.length, color:'var(--t1)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ padding:'14px 20px', borderRight:'1px solid var(--border)' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:'var(--t4)', textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>{label}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:22, fontWeight:700, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Setup table */}
          <div style={{ padding:'20px 24px', flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div>
                <div className="eyebrow">
                  <div className="live-dot" />
                  Setup AI · {setupsLoading ? 'Aggiornamento in corso...' : timeStr}
                </div>
                <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'var(--t1)' }}>
                  {setups.length} opportunità su <span style={{ color:'var(--cyan)' }}>12 mercati</span>
                </div>
              </div>
              <button onClick={fetchSetups} disabled={setupsLoading || !settings.hasAnthropicKey}
                className="btn btn-ghost" style={{ fontSize:11, gap:5 }}>
                {setupsLoading ? '⟳ Aggiornamento...' : '⟳ Aggiorna AI'}
              </button>
            </div>

            {/* Table header */}
            <div style={{ display:'grid', gridTemplateColumns:'130px 60px 90px 90px 90px 60px 1fr', gap:8, padding:'8px 12px', borderBottom:'1px solid var(--border)', background:'var(--bg3)', borderRadius:'8px 8px 0 0' }}>
              {['Asset','Dir.','Entry','Stop Loss','TP1','R:R','Azioni'].map(h => (
                <div key={h} style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:'var(--t4)', textTransform:'uppercase', letterSpacing:1 }}>{h}</div>
              ))}
            </div>
            <div style={{ border:'1px solid var(--border)', borderTop:'none', borderRadius:'0 0 8px 8px', overflow:'hidden' }}>
              {setups.map((s, i) => (
                <SetupRow key={i} s={s}
                  isSelected={activeSetup?.ticker === s.ticker}
                  onSelect={() => handleSelectSetup(s)}
                  onChart={() => setChartTicker(s.ticker)}
                  onAI={() => navigate(`/ai?ticker=${s.ticker}`)}
                />
              ))}
            </div>

            {/* News */}
            <div style={{ marginTop:28 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div className="eyebrow">
                  <div className="live-dot" />
                  Notizie di mercato · ogni 10 min
                </div>
                <button onClick={refreshNews} className="btn btn-ghost" style={{ fontSize:10, padding:'5px 10px' }}>
                  {newsLoading ? '⟳' : '⟳ Aggiorna'}
                </button>
              </div>
              {news.slice(0,5).map((item, i) => (
                <div key={i} style={{ display:'flex', gap:12, padding:'11px 0', borderBottom:'1px solid var(--border)', cursor:'pointer', transition:'background .15s' }}
                  onClick={() => item.link && window.open(item.link, '_blank')}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:800, color:'var(--bg4)', lineHeight:1, flexShrink:0, width:24 }}>
                    {String(i+1).padStart(2,'0')}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:500, color:'var(--t2)', lineHeight:1.45, marginBottom:5 }}>{item.title}</div>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <span style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'var(--t4)', textTransform:'uppercase', letterSpacing:.8 }}>{item.source}</span>
                      <span style={{ fontSize:8, color:'var(--t4)' }}>{item.time}</span>
                      <span className={`badge badge-${item.sentiment}`}>{SENTIMENT_LABEL[item.sentiment]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display:'flex', flexDirection:'column', overflowY:'auto', borderLeft:'1px solid var(--border)', background:'var(--bg2)' }}>
          {/* Bybit */}
          <div style={{ borderBottom:'1px solid var(--border)', flexShrink:0 }}>
            <div style={{ padding:'14px 14px 0' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:'var(--t4)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:12 }}>Apri Trade</div>
            </div>
            <BybitPanel setup={activeSetup} settings={settings} onOrderSent={(s) => journal.addTrade(s)} />
          </div>

          {/* AI quick */}
          <div style={{ padding:14, borderBottom:'1px solid var(--border)', flexShrink:0 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:'var(--t4)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>NexusAI</div>
            <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:10, padding:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:9 }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:'linear-gradient(135deg,var(--cyan2),var(--cyan))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#000', fontWeight:800 }}>◈</div>
                <span style={{ fontSize:11, fontWeight:700, color:'var(--t3)', fontFamily:'var(--font-display)' }}>NexusAI</span>
                <div style={{ marginLeft:'auto', fontSize:8, color:'var(--green)', display:'flex', alignItems:'center', gap:3 }}>
                  <div className="live-dot" style={{ width:4, height:4 }} />Online
                </div>
              </div>
              <div style={{ fontSize:11, color:'var(--t3)', lineHeight:1.55, marginBottom:9, background:'var(--bg4)', borderRadius:7, padding:'8px 10px', borderLeft:'2px solid rgba(0,212,255,.3)' }}>
                {aiLoading ? '...' : aiMsg}
              </div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:9 }}>
                {['📊 Chart','🌐 Sentiment','🎓 Spiega R:R'].map(chip => (
                  <button key={chip} onClick={() => setAiInput(chip.replace(/^[^\s]+\s/,''))} style={{ background:'var(--bg4)', border:'1px solid var(--border)', borderRadius:14, padding:'3px 9px', fontSize:9, color:'var(--t3)', cursor:'pointer' }}>{chip}</button>
                ))}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <input className="input-dark" value={aiInput} onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAskAI()}
                  placeholder={settings.hasAnthropicKey ? 'Chiedi...' : 'API key →'}
                  style={{ fontSize:11, padding:'8px 10px' }} />
                <button onClick={handleAskAI} disabled={aiLoading || !settings.hasAnthropicKey}
                  style={{ background:'linear-gradient(135deg,var(--cyan2),var(--cyan))', border:'none', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', color:'#000', cursor:'pointer', fontSize:12, fontWeight:800, flexShrink:0 }}>↑</button>
              </div>
            </div>
            <button className="btn btn-ghost btn-full" style={{ marginTop:9, fontSize:11, padding:'8px' }} onClick={() => navigate('/ai')}>
              ◈ Analisi Guidata →
            </button>
          </div>

          {/* Journal stats */}
          <div style={{ padding:14 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:'var(--t4)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:12 }}>Journal</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {[
                { l:'Trade totali', v: journal.stats.total, c:'var(--t1)' },
                { l:'Aperti',       v: journal.stats.open,  c:'var(--cyan)' },
                { l:'Win Rate',     v: journal.stats.winRate !== null ? `${journal.stats.winRate}%` : '—', c:'var(--green)' },
                { l:'Stop Loss',    v: journal.stats.losses, c:'var(--red)' },
              ].map(({ l, v, c }) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:11, color:'var(--t3)' }}>{l}</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:16, fontWeight:700, color: c }}>{v}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-full" style={{ marginTop:12, fontSize:11, padding:'8px' }} onClick={() => navigate('/journal')}>
              Vedi Journal →
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
