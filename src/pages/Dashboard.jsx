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

async function generateSetups(apiKey, prices) {
  const priceStr = Object.entries(prices)
    .filter(([k]) => ASSETS.includes(k))
    .map(([k,v]) => `${k}: $${v.price} (${v.change >= 0 ? '+' : ''}${v.change.toFixed(2)}%)`)
    .join(', ')
  const text = await callClaude({
    apiKey,
    system: `Sei un analista tecnico crypto. Analizza i prezzi e genera 3-4 setup trading. Rispondi SOLO con JSON array, nessun altro testo. Formato esatto: [{"ticker":"BTCUSDT","direction":"LONG","entry":"61800","sl":"59200","tp1":"66500","tp2":"70000","leverage":"7","budget":"50","notes":"Pattern su daily","rr":"2.6"}]`,
    messages: [{ role:'user', content:`Prezzi: ${priceStr}. Genera 3-4 setup con R:R > 1.5. Solo JSON array.` }],
  })
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

const FALLBACK_SETUPS = [
  { ticker:'BTCUSDT', direction:'LONG',  entry:'61800', sl:'59200', tp1:'66500', tp2:'70000', leverage:'7', budget:'50', rr:'2.6', notes:'Double bottom su daily, supporto $61K regge' },
  { ticker:'ETHUSDT', direction:'LONG',  entry:'3050',  sl:'2880',  tp1:'3350',  tp2:'3600',  leverage:'7', budget:'50', rr:'2.1', notes:'Triangolo ascendente weekly' },
  { ticker:'SOLUSDT', direction:'SHORT', entry:'100',   sl:'115',   tp1:'79',    tp2:'68',    leverage:'7', budget:'50', rr:'1.9', notes:'Double top weekly confermato' },
  { ticker:'AVAXUSDT',direction:'LONG',  entry:'32.5',  sl:'30.0',  tp1:'38.0',  tp2:'42.0',  leverage:'5', budget:'50', rr:'2.4', notes:'Rimbalzo dal supporto' },
]

export default function Dashboard({ settings, onSelectSetup, journal, pendingSetup: externalSetup }) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { news, loading: newsLoading, refresh: refreshNews } = useNews()
  const { prices } = usePrices(ASSETS)
  const [setups, setSetups] = useState([])
  const [setupsLoading, setSetupsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [selectedSetup, setSelectedSetup] = useState(null)
  const [aiInput, setAiInput] = useState('')
  const [aiMsg, setAiMsg] = useState('Ciao! Analizza i setup, leggi le news o chiedimi qualsiasi cosa sul mercato crypto.')
  const [aiLoading, setAiLoading] = useState(false)
  const [mobileTab, setMobileTab] = useState('setup') // 'setup' | 'news' | 'bybit'
  const [chartTicker, setChartTicker] = useState(null)

  const activeSetup = externalSetup || selectedSetup

  const fetchSetups = async () => {
    if (!settings.hasAnthropicKey) return
    setSetupsLoading(true)
    try {
      const s = await generateSetups(settings.settings.anthropicKey, prices)
      if (Array.isArray(s) && s.length > 0) { setSetups(s); setLastUpdate(new Date()) }
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

  const handleSelectSetup = (s) => { setSelectedSetup(s); onSelectSetup?.(s); if (isMobile) setMobileTab('bybit') }

  const displaySetups = setups.length > 0 ? setups : FALLBACK_SETUPS
  const timeStr = lastUpdate ? `${Math.round((Date.now() - lastUpdate) / 60000)} min fa` : 'In attesa...'

  const openChart = (ticker) => setChartTicker(ticker)
  const openAI = (ticker) => navigate(`/ai?ticker=${ticker}`)

  // ── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ display:'flex', flexDirection:'column', minHeight:'100%' }}>

        {/* Mobile tab bar */}
        <div style={{ display:'flex', background:'var(--paper2)', borderBottom:'1px solid var(--rule)', flexShrink:0 }}>
          {[
            { id:'setup', label:'Setup AI' },
            { id:'news',  label:'News' },
            { id:'bybit', label:'⚡ Trade' },
          ].map(t => (
            <button key={t.id} onClick={() => setMobileTab(t.id)} style={{
              flex:1, padding:'10px 0', border:'none', cursor:'pointer',
              background:'transparent',
              fontFamily:'var(--font-display)', fontSize:11, fontWeight:700,
              color: mobileTab === t.id ? 'var(--ink)' : 'var(--ink4)',
              borderBottom: mobileTab === t.id ? '2px solid var(--ink)' : '2px solid transparent',
              transition:'all .15s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Setup tab */}
        {mobileTab === 'setup' && (
          <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:16 }}>

            {/* Hero */}
            <div>
              <div className="eyebrow">
                <div className="live-dot" />
                Setup AI · {setupsLoading ? 'Aggiornamento...' : timeStr}
                {settings.hasAnthropicKey && (
                  <button onClick={fetchSetups} disabled={setupsLoading} style={{ background:'none', border:'none', color:'var(--accent)', fontSize:11, cursor:'pointer', padding:0 }}>
                    {setupsLoading ? '⟳' : 'Aggiorna ⟳'}
                  </button>
                )}
              </div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, lineHeight:1.2, color:'var(--ink)', marginTop:4 }}>
                {displaySetups.length} opportunità oggi.
              </div>
            </div>

            {/* Setup cards (vertical on mobile) */}
            {displaySetups.map((s, i) => {
              const isLong = s.direction === 'LONG'
              const isSelected = activeSetup?.ticker === s.ticker
              return (
                <div key={i} style={{
                  background:'var(--paper)', border:`1px solid ${isSelected ? 'var(--ink)' : 'var(--rule)'}`,
                  borderLeft:`3px solid ${isLong ? 'var(--green)' : 'var(--red)'}`,
                  borderRadius:10, padding:'14px',
                  boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,.1)' : 'none',
                }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:800 }}>{s.ticker.replace('USDT','')}</span>
                      <span style={{ fontSize:9, color:'var(--ink4)' }}>USDT</span>
                      <span className={`badge badge-${s.direction.toLowerCase()}`}>{s.direction}</span>
                    </div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color: parseFloat(s.rr) >= 2 ? 'var(--green)' : parseFloat(s.rr) >= 1.5 ? 'var(--amber)' : 'var(--ink3)' }}>
                      R:R 1:{s.rr}
                    </div>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:7, marginBottom:11 }}>
                    {[
                      { l:'Entry',     v:`$${s.entry}`, c:'var(--accent)' },
                      { l:'Stop Loss', v:`$${s.sl}`,    c:'var(--red)' },
                      { l:'TP1',       v:`$${s.tp1}`,   c:'var(--green)' },
                    ].map(({ l, v, c }) => (
                      <div key={l} style={{ background:'var(--paper2)', borderRadius:7, padding:'8px 10px' }}>
                        <div style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'var(--ink5)', textTransform:'uppercase', letterSpacing:.8, marginBottom:2 }}>{l}</div>
                        <div style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color: c }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {s.notes && <div style={{ fontSize:11, color:'var(--ink4)', marginBottom:10, lineHeight:1.4 }}>📝 {s.notes}</div>}

                  <button
                    onClick={() => handleSelectSetup(s)}
                    style={{
                      width:'100%', padding:'10px', border:`1.5px solid ${isLong ? 'var(--green)' : 'var(--red)'}`,
                      borderRadius:8, background: isSelected ? (isLong ? 'var(--green)' : 'var(--red)') : 'transparent',
                      color: isSelected ? '#fff' : (isLong ? 'var(--green)' : 'var(--red)'),
                      fontFamily:'var(--font-display)', fontSize:12, fontWeight:800, cursor:'pointer',
                      letterSpacing:.5,
                    }}
                  >
                    {isSelected ? '✓ Selezionato — vai a Trade ↗' : `⚡ Seleziona e Apri Trade`}
                  </button>
                </div>
              )
            })}

            {/* AI quick box */}
            <div style={{ background:'var(--dark2)', borderRadius:12, padding:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
                <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#f5f1ea', flexShrink:0 }}>◈</div>
                <span style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,.5)', fontFamily:'var(--font-display)' }}>NexusAI</span>
                <div style={{ marginLeft:'auto', fontSize:8, color:'var(--green-d)', display:'flex', alignItems:'center', gap:3 }}>
                  <div className="live-dot" style={{ width:4, height:4 }} />Online
                </div>
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', lineHeight:1.55, marginBottom:10, background:'rgba(255,255,255,.04)', borderRadius:8, padding:'8px 10px', borderLeft:'2px solid rgba(255,255,255,.1)' }}>
                {aiLoading ? '...' : aiMsg}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <input className="input-dark" value={aiInput} onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAskAI()}
                  placeholder={settings.hasAnthropicKey ? 'Chiedi al mercato...' : 'Configura API key →'}
                  style={{ fontSize:12, padding:'9px 11px' }} />
                <button onClick={handleAskAI} disabled={aiLoading || !settings.hasAnthropicKey}
                  style={{ background:'var(--ink)', border:'none', borderRadius:8, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', color:'#f5f1ea', cursor:'pointer', fontSize:14, fontWeight:700, flexShrink:0 }}>↑</button>
              </div>
              <button className="btn btn-ink btn-full" style={{ marginTop:10, fontSize:12, padding:'10px' }} onClick={() => navigate('/ai')}>
                🤖 Avvia Analisi Guidata →
              </button>
            </div>
          </div>
        )}

        {/* News tab */}
        {mobileTab === 'news' && (
          <div style={{ padding:'16px' }}>
            <div className="eyebrow" style={{ marginBottom:12 }}>
              <div className="live-dot" />
              Notizie crypto
              <button onClick={refreshNews} style={{ background:'none', border:'none', color:'var(--accent)', fontSize:11, cursor:'pointer', padding:0 }}>
                {newsLoading ? '⟳' : 'Aggiorna'}
              </button>
            </div>
            {news.slice(0,8).map((item, i) => (
              <div key={i} style={{ display:'flex', gap:10, padding:'12px 0', borderBottom:'1px solid var(--rule)', cursor:'pointer' }}
                onClick={() => item.link && window.open(item.link, '_blank')}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'var(--rule2)', lineHeight:1, flexShrink:0, width:22 }}>
                  {String(i+1).padStart(2,'0')}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--ink2)', lineHeight:1.45, marginBottom:5 }}>{item.title}</div>
                  <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'var(--ink5)', textTransform:'uppercase', letterSpacing:.8 }}>{item.source}</span>
                    <span style={{ fontSize:8, color:'var(--ink5)' }}>{item.time}</span>
                    <span className={`badge badge-${item.sentiment}`}>{SENTIMENT_LABEL[item.sentiment]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {chartModal}

        {/* Bybit tab */}
        {mobileTab === 'bybit' && (
          <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:12 }}>
            <div className="eyebrow">⚡ Apri Trade — Bybit</div>
            {!activeSetup && (
              <div style={{ background:'var(--paper2)', border:'1px solid var(--rule)', borderRadius:10, padding:'24px 16px', textAlign:'center' }}>
                <div style={{ fontSize:24, marginBottom:8 }}>⚡</div>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--ink2)', marginBottom:6 }}>Nessun setup selezionato</div>
                <div style={{ fontSize:12, color:'var(--ink4)', marginBottom:14 }}>Vai a "Setup AI" e clicca "Seleziona e Apri Trade" su uno dei setup disponibili.</div>
                <button className="btn btn-outline" style={{ fontSize:12 }} onClick={() => setMobileTab('setup')}>← Vai ai Setup</button>
              </div>
            )}
            <div style={{ background:'var(--dark2)', borderRadius:12, overflow:'hidden' }}>
              <BybitPanel setup={activeSetup} settings={settings} onOrderSent={(s) => { journal.addTrade(s) }} />
            </div>

            {/* Journal mini */}
            <div style={{ background:'var(--paper2)', border:'1px solid var(--rule)', borderRadius:10, padding:'14px' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:'var(--ink5)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:12 }}>Journal</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  { l:'Totali',   v: journal.stats.total },
                  { l:'Aperti',   v: journal.stats.open,  c:'var(--accent)' },
                  { l:'Win Rate', v: journal.stats.winRate !== null ? `${journal.stats.winRate}%` : '—', c:'var(--green)' },
                  { l:'Stop',     v: journal.stats.losses, c:'var(--red)' },
                ].map(({ l, v, c }) => (
                  <div key={l} style={{ textAlign:'center', padding:'10px', background:'var(--paper)', borderRadius:8 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'var(--ink5)', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{l}</div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color: c || 'var(--ink)' }}>{v}</div>
                  </div>
                ))}
              </div>
              <button className="btn btn-outline btn-full" style={{ marginTop:12, fontSize:11, padding:'9px' }} onClick={() => navigate('/journal')}>
                Vedi Journal completo →
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── CHART MODAL (shared between mobile and desktop)
  const chartModal = chartTicker && (
    <ChartModal ticker={chartTicker} onClose={() => setChartTicker(null)} />
  )

  // ── DESKTOP LAYOUT ─────────────────────────────────────────────────────────
  return (
    <>
    {chartModal}
    <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', height:'100%', overflow:'hidden' }}>

      {/* Main */}
      <div style={{ overflowY:'auto', padding:'24px', display:'flex', flexDirection:'column', gap:22, borderRight:'1px solid var(--rule)' }}>

        <div>
          <div className="eyebrow">
            <div className="live-dot" />
            Setup AI · {setupsLoading ? 'Aggiornamento...' : timeStr}
            {settings.hasAnthropicKey && (
              <button onClick={fetchSetups} disabled={setupsLoading} style={{ marginLeft:4, background:'none', border:'none', color:'var(--accent)', fontSize:11, cursor:'pointer', padding:0 }}>
                {setupsLoading ? '⟳' : 'Aggiorna ⟳'}
              </button>
            )}
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, lineHeight:1.15, color:'var(--ink)' }}>
            {displaySetups.length} opportunità su <span style={{ color:'var(--accent)' }}>mercati principali</span> oggi.
          </div>
          <div style={{ fontSize:12, color:'var(--ink3)', marginTop:4, lineHeight:1.6 }}>
            {settings.hasAnthropicKey ? 'Analisi AI in tempo reale. Clicca ⚡ Apri per inviare l\'ordine su Bybit.' : 'Configura la API key Anthropic nelle Impostazioni per l\'analisi AI.'}
          </div>
        </div>

        {/* Table */}
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'110px 58px 90px 90px 90px 60px 100px 80px 70px', gap:6, padding:'6px 0', borderBottom:'2px solid var(--ink)' }}>
            {['Asset','Dir.','Entry','Stop Loss','TP1','R:R','Trade','AI','Chart'].map(h => (
              <div key={h} style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'var(--ink4)', textTransform:'uppercase', letterSpacing:1.2 }}>{h}</div>
            ))}
          </div>
          {displaySetups.map((s, i) => {
            const isSelected = activeSetup?.ticker === s.ticker
            const isLong = s.direction === 'LONG'
            return (
              <div key={i} style={{
                display:'grid', gridTemplateColumns:'110px 58px 90px 90px 90px 60px 100px 80px 70px',
                gap:6, padding:'10px 0', borderBottom:'1px solid var(--rule)', alignItems:'center',
                background: isSelected ? 'rgba(0,0,0,.02)' : 'transparent',
              }}>
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:12 }}>{s.ticker.replace('USDT','')}</div>
                  <div style={{ fontSize:9, color:'var(--ink4)' }}>USDT</div>
                </div>
                <span className={`badge badge-${s.direction.toLowerCase()}`}>{s.direction}</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:600, color:'var(--accent)' }}>${s.entry}</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:600, color:'var(--red)' }}>${s.sl}</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:600 }}>${s.tp1}</span>
                <div>
                  <div style={{ height:3, background:'var(--rule)', borderRadius:2, overflow:'hidden', marginBottom:3 }}>
                    <div style={{ height:'100%', background:'var(--ink)', borderRadius:2, width:`${Math.min(parseFloat(s.rr)/3*100,100)}%` }} />
                  </div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:10, fontWeight:700 }}>1:{s.rr}</div>
                </div>
                <button className="btn btn-outline"
                  style={{ fontSize:10, padding:'5px 8px', borderColor: isLong ? 'var(--green)' : 'var(--red)', color: isLong ? 'var(--green)' : 'var(--red)' }}
                  onClick={() => handleSelectSetup(s)}
                  onMouseEnter={e => { e.target.style.background = isLong ? 'var(--green)' : 'var(--red)'; e.target.style.color='#fff' }}
                  onMouseLeave={e => { e.target.style.background='transparent'; e.target.style.color = isLong ? 'var(--green)' : 'var(--red)' }}>
                  ⚡ Trade
                </button>
                <button className="btn btn-ghost"
                  style={{ fontSize:10, padding:'5px 8px' }}
                  onClick={() => openAI(s.ticker)}>
                  🤖 AI
                </button>
                <button className="btn btn-ghost"
                  style={{ fontSize:10, padding:'5px 8px' }}
                  onClick={() => openChart(s.ticker)}>
                  📈 Chart
                </button>
              </div>
            )
          })}
        </div>

        {/* News */}
        <div>
          <div className="eyebrow" style={{ marginBottom:10 }}>
            <div className="live-dot" />
            Notizie di mercato
            <span style={{ color:'var(--ink5)', fontWeight:400 }}>· ogni 10 min</span>
            <button onClick={refreshNews} style={{ background:'none', border:'none', color:'var(--accent)', fontSize:11, cursor:'pointer', padding:0, marginLeft:4 }}>
              {newsLoading ? '⟳' : 'Aggiorna'}
            </button>
          </div>
          {news.slice(0,5).map((item, i) => (
            <div key={i} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom:'1px solid var(--rule)', cursor:'pointer' }}
              onClick={() => item.link && window.open(item.link, '_blank')}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'var(--rule2)', lineHeight:1, flexShrink:0, width:22 }}>{String(i+1).padStart(2,'0')}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--ink2)', lineHeight:1.45, marginBottom:4 }}>{item.title}</div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'var(--ink5)', textTransform:'uppercase', letterSpacing:.8 }}>{item.source}</span>
                  <span style={{ fontSize:8, color:'var(--ink5)' }}>{item.time}</span>
                  <span className={`badge badge-${item.sentiment}`}>{SENTIMENT_LABEL[item.sentiment]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ display:'flex', flexDirection:'column', overflowY:'auto', background:'var(--paper2)' }}>
        <div style={{ borderBottom:'1px solid var(--rule)', flexShrink:0 }}>
          <div style={{ padding:'14px 14px 0' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:'var(--ink5)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>Apri Trade — Bybit</div>
          </div>
          <div style={{ background:'var(--dark2)' }}>
            <BybitPanel setup={activeSetup} settings={settings} onOrderSent={(s) => { journal.addTrade(s) }} />
          </div>
        </div>

        {/* AI */}
        <div style={{ padding:'14px', borderBottom:'1px solid var(--rule)', flexShrink:0 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:'var(--ink5)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>NexusAI</div>
          <div style={{ background:'var(--dark2)', borderRadius:10, padding:13 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, flexShrink:0, color:'#f5f1ea' }}>◈</div>
              <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', fontFamily:'var(--font-display)' }}>NexusAI</span>
              <div style={{ marginLeft:'auto', fontSize:8, color:'var(--green-d)', display:'flex', alignItems:'center', gap:3 }}>
                <div className="live-dot" style={{ width:4, height:4 }} />Online
              </div>
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', lineHeight:1.55, marginBottom:10, background:'rgba(255,255,255,.04)', borderRadius:8, padding:'8px 10px', borderLeft:'2px solid rgba(255,255,255,.1)' }}>
              {aiLoading ? '...' : aiMsg}
            </div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
              {['📊 Analizza chart','🌐 Sentiment','🎓 Spiega R:R','⚖️ Rischio'].map(chip => (
                <button key={chip} onClick={() => setAiInput(chip.replace(/^[^\s]+\s/,''))} style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', borderRadius:16, padding:'4px 10px', fontSize:9, color:'rgba(255,255,255,.4)', cursor:'pointer' }}>{chip}</button>
              ))}
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <input className="input-dark" value={aiInput} onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAskAI()}
                placeholder={settings.hasAnthropicKey ? 'Chiedi...' : 'Configura API key →'}
                style={{ fontSize:11, padding:'8px 10px' }} />
              <button onClick={handleAskAI} disabled={aiLoading || !settings.hasAnthropicKey}
                style={{ background:'var(--ink)', border:'none', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', color:'#f5f1ea', cursor:'pointer', fontSize:13, fontWeight:700, flexShrink:0 }}>↑</button>
            </div>
          </div>
          <button className="btn btn-ink btn-full" style={{ marginTop:10, fontSize:11, padding:'9px' }} onClick={() => navigate('/ai')}>
            🤖 Avvia Analisi Guidata →
          </button>
        </div>

        {/* Stats */}
        <div style={{ padding:'14px' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:'var(--ink5)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:12 }}>Journal</div>
          {[
            { l:'Trade totali', v: journal.stats.total },
            { l:'Aperti',       v: journal.stats.open,  c:'var(--accent)' },
            { l:'Win Rate',     v: journal.stats.winRate !== null ? `${journal.stats.winRate}%` : '—', c:'var(--green)' },
            { l:'Stop Loss',    v: journal.stats.losses, c:'var(--red)' },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'9px 0', borderBottom:'1px solid var(--rule)' }}>
              <span style={{ fontSize:11, color:'var(--ink3)' }}>{l}</span>
              <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color: c || 'var(--ink)' }}>{v}</span>
            </div>
          ))}
          <button className="btn btn-outline btn-full" style={{ marginTop:12, fontSize:11, padding:'8px' }} onClick={() => navigate('/journal')}>Vedi Journal →</button>
        </div>
      </div>
    </div>
    </>
  )
}