import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNews } from '../hooks/useNews'
import { usePrices } from '../hooks/usePrices'
import { callClaude, SYSTEM_DASHBOARD, fmt } from '../utils/index.js'
import BybitPanel from '../components/BybitPanel.jsx'

const STEPS = ['Valutazione','Analisi Chart','Definizione Setup','Gestione Rischio','Riepilogo']

const ASSETS = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','AVAXUSDT']

const SENTIMENT_LABEL = { bull:'Bullish', bear:'Bearish', neut:'Neutro' }

// AI generates setup suggestions using Claude
async function generateSetups(apiKey, prices) {
  const priceStr = Object.entries(prices)
    .filter(([k]) => ASSETS.includes(k))
    .map(([k,v]) => `${k}: $${v.price} (${v.change >= 0 ? '+' : ''}${v.change.toFixed(2)}%)`)
    .join(', ')

  const text = await callClaude({
    apiKey,
    system: `Sei un analista tecnico crypto. Analizza i prezzi forniti e genera 3-4 setup trading (long o short) sui principali mercati. Rispondi SOLO con un JSON array, nessun altro testo, nessun markdown. Formato: [{"ticker":"BTCUSDT","direction":"LONG","entry":"61800","sl":"59200","tp1":"66500","tp2":"70000","leverage":"7","budget":"50","notes":"Pattern double bottom su daily","rr":"2.6"}]`,
    messages: [{ role:'user', content:`Prezzi attuali: ${priceStr}. Genera 3-4 setup con buon R:R (>1.5). Solo JSON array.` }],
  })
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export default function Dashboard({ settings, onSelectSetup, journal, pendingSetup: externalSetup }) {
  const navigate = useNavigate()
  const { news, loading: newsLoading, lastUpdate, refresh: refreshNews } = useNews()
  const { prices } = usePrices(ASSETS)
  const [setups, setSetups] = useState([])
  const [setupsLoading, setSetupsLoading] = useState(false)
  const [lastSetupUpdate, setLastSetupUpdate] = useState(null)
  const [selectedSetup, setSelectedSetup] = useState(null)
  const activeSetup = externalSetup || selectedSetup
  const [aiInput, setAiInput] = useState('')
  const [aiMsg, setAiMsg] = useState('Ciao! Sono NexusAI. Analizza i setup, leggi le news o chiedimi qualsiasi cosa sul mercato crypto.')
  const [aiLoading, setAiLoading] = useState(false)

  const fetchSetups = async () => {
    if (!settings.hasAnthropicKey) return
    setSetupsLoading(true)
    try {
      const s = await generateSetups(settings.settings.anthropicKey, prices)
      if (Array.isArray(s) && s.length > 0) {
        setSetups(s)
        setLastSetupUpdate(new Date())
      }
    } catch (e) {
      console.error('Setup generation error:', e)
    }
    setSetupsLoading(false)
  }

  useEffect(() => {
    fetchSetups()
    const interval = setInterval(fetchSetups, 60 * 60 * 1000) // every hour
    return () => clearInterval(interval)
  }, [settings.hasAnthropicKey])

  const handleAskAI = async () => {
    if (!aiInput.trim() || !settings.hasAnthropicKey) return
    const q = aiInput
    setAiInput('')
    setAiLoading(true)
    try {
      const res = await callClaude({
        apiKey: settings.settings.anthropicKey,
        system: SYSTEM_DASHBOARD,
        messages: [{ role:'user', content:q }],
      })
      setAiMsg(res)
    } catch { setAiMsg('⚠️ Errore. Verifica la API key nelle impostazioni.') }
    setAiLoading(false)
  }

  const handleSelectSetup = (s) => {
    setSelectedSetup(s)
    onSelectSetup?.(s)
  }

  // Merge AI setups with static fallback
  const displaySetups = setups.length > 0 ? setups : [
    { ticker:'BTCUSDT', direction:'LONG',  entry:'61800', sl:'59200', tp1:'66500', tp2:'70000', leverage:'7', budget:'50', rr:'2.6', notes:'Double bottom su daily, supporto $61K regge' },
    { ticker:'ETHUSDT', direction:'LONG',  entry:'3050',  sl:'2880',  tp1:'3350',  tp2:'3600',  leverage:'7', budget:'50', rr:'2.1', notes:'Triangolo ascendente weekly, volume crescente' },
    { ticker:'SOLUSDT', direction:'SHORT', entry:'100',   sl:'115',   tp1:'79',    tp2:'68',    leverage:'7', budget:'50', rr:'1.9', notes:'Double top weekly confermato, neckline rotta' },
    { ticker:'AVAXUSDT',direction:'LONG',  entry:'32.5',  sl:'30.0',  tp1:'38.0',  tp2:'42.0',  leverage:'5', budget:'50', rr:'2.4', notes:'Doppio minimo daily, rimbalzo dal supporto' },
  ]

  const timeStr = lastSetupUpdate
    ? `${Math.round((Date.now() - lastSetupUpdate) / 60000)} min fa`
    : 'Non ancora aggiornato'

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', height:'100%', overflow:'hidden' }}>

      {/* ── Main ── */}
      <div style={{ overflowY:'auto', padding:'24px', display:'flex', flexDirection:'column', gap:22, borderRight:'1px solid var(--rule)' }}>

        {/* Hero */}
        <div>
          <div className="eyebrow">
            <div className="live-dot" />
            Setup AI · {setupsLoading ? 'Aggiornamento...' : timeStr}
            {settings.hasAnthropicKey && (
              <button onClick={fetchSetups} disabled={setupsLoading} style={{ marginLeft:4, background:'none', border:'none', color:'var(--accent)', fontSize:11, cursor:'pointer', padding:0, fontFamily:'var(--font-body)' }}>
                {setupsLoading ? '⟳' : 'Aggiorna ⟳'}
              </button>
            )}
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, lineHeight:1.15, color:'var(--ink)' }}>
            {displaySetups.length} opportunità su{' '}
            <span style={{ color:'var(--accent)' }}>mercati principali</span> oggi.
          </div>
          <div style={{ fontSize:12, color:'var(--ink3)', marginTop:4, lineHeight:1.6 }}>
            {settings.hasAnthropicKey
              ? 'Analisi AI in tempo reale. Clicca ⚡ Apri per inviare l\'ordine su Bybit con SL e TP automatici.'
              : 'Configura la API key Anthropic nelle Impostazioni per abilitare l\'analisi AI in tempo reale.'}
          </div>
        </div>

        {/* Setup table */}
        <div>
          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:'110px 58px 90px 90px 90px 70px 1fr', gap:8, padding:'6px 0', borderBottom:'2px solid var(--ink)', marginBottom:0 }}>
            {['Asset','Dir.','Entry','Stop Loss','TP1','R:R','Azione'].map(h => (
              <div key={h} style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'var(--ink4)', textTransform:'uppercase', letterSpacing:1.2 }}>{h}</div>
            ))}
          </div>
          {displaySetups.map((s, i) => {
            const isSelected = selectedSetup?.ticker === s.ticker
            const isLong = s.direction === 'LONG'
            return (
              <div key={i} style={{
                display:'grid', gridTemplateColumns:'110px 58px 90px 90px 90px 70px 1fr',
                gap:8, padding:'10px 0', borderBottom:'1px solid var(--rule)',
                alignItems:'center', cursor:'pointer',
                background: isSelected ? 'rgba(0,0,0,.03)' : 'transparent',
                transition:'background .15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,.025)'}
                onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'rgba(0,0,0,.03)' : 'transparent'}
              >
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
                    <div style={{ height:'100%', background:'var(--ink)', borderRadius:2, width:`${Math.min(parseFloat(s.rr) / 3 * 100, 100)}%` }} />
                  </div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:10, fontWeight:700 }}>1:{s.rr}</div>
                </div>
                <button
                  className={`btn btn-outline`}
                  style={{ fontSize:10, padding:'5px 12px', borderColor: isLong ? 'var(--green)' : 'var(--red)', color: isLong ? 'var(--green)' : 'var(--red)' }}
                  onClick={() => handleSelectSetup(s)}
                  onMouseEnter={e => { e.target.style.background = isLong ? 'var(--green)' : 'var(--red)'; e.target.style.color = '#fff' }}
                  onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = isLong ? 'var(--green)' : 'var(--red)' }}
                >
                  ⚡ Apri Trade
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
            <span style={{ color:'var(--ink5)', fontWeight:400 }}>· aggiornamento ogni 10 min</span>
            <button onClick={refreshNews} style={{ background:'none', border:'none', color:'var(--accent)', fontSize:11, cursor:'pointer', padding:0, marginLeft:4 }}>
              {newsLoading ? '⟳' : 'Aggiorna'}
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column' }}>
            {news.slice(0,6).map((item, i) => (
              <div key={i} style={{ display:'flex', gap:10, padding:'10px 0', borderBottom:'1px solid var(--rule)', cursor:'pointer' }}
                onClick={() => item.link && window.open(item.link, '_blank')}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color:'var(--rule2)', lineHeight:1, flexShrink:0, width:22 }}>
                  {String(i+1).padStart(2,'0')}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--ink2)', lineHeight:1.45, marginBottom:4 }}>{item.title}</div>
                  <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'var(--ink5)', letterSpacing:.8, textTransform:'uppercase' }}>{item.source}</span>
                    <span style={{ fontSize:8, color:'var(--ink5)' }}>{item.time}</span>
                    <span className={`badge badge-${item.sentiment}`}>{SENTIMENT_LABEL[item.sentiment]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <div style={{ display:'flex', flexDirection:'column', overflowY:'auto', background:'var(--paper2)' }}>

        {/* Bybit panel */}
        <div style={{ borderBottom:'1px solid var(--rule)', flexShrink:0 }}>
          <div style={{ padding:'14px 14px 0', marginBottom:0 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:'var(--ink5)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>
              Apri Trade — Bybit
            </div>
          </div>
          <div style={{ background:'var(--dark2)', margin:'0', padding:0, borderRadius:0 }}>
            <BybitPanel setup={activeSetup || selectedSetup} settings={settings} onOrderSent={(s) => { journal.addTrade(s) }} />
          </div>
        </div>

        {/* AI quick ask */}
        <div style={{ padding:'14px', borderBottom:'1px solid var(--rule)', flexShrink:0 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:'var(--ink5)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10 }}>NexusAI</div>
          <div style={{ background:'var(--dark2)', borderRadius:10, padding:13 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, flexShrink:0, color:'#f5f1ea' }}>◈</div>
              <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', fontFamily:'var(--font-display)' }}>NexusAI</span>
              <div style={{ marginLeft:'auto', fontSize:8, color:'var(--green-d)', display:'flex', alignItems:'center', gap:3, fontFamily:'var(--font-display)', fontWeight:600 }}>
                <div className="live-dot" style={{ width:4, height:4 }} />
                Online
              </div>
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', lineHeight:1.55, marginBottom:10, background:'rgba(255,255,255,.04)', borderRadius:8, padding:'8px 10px', borderLeft:'2px solid rgba(255,255,255,.1)' }}>
              {aiLoading ? '...' : aiMsg}
            </div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
              {['📊 Analizza chart','🌐 Sentiment oggi','🎓 Spiega R:R','⚖️ Gestione rischio'].map(chip => (
                <button key={chip} onClick={() => setAiInput(chip.replace(/^[^\s]+\s/,''))} style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', borderRadius:16, padding:'4px 10px', fontSize:9, color:'rgba(255,255,255,.4)', cursor:'pointer', fontFamily:'var(--font-body)' }}>
                  {chip}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <input
                className="input-dark"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAskAI()}
                placeholder={settings.hasAnthropicKey ? 'Chiedi...' : 'Configura API key →'}
                style={{ fontSize:11, padding:'8px 10px' }}
              />
              <button onClick={handleAskAI} disabled={aiLoading || !settings.hasAnthropicKey} style={{ background:'var(--ink)', border:'none', borderRadius:8, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', color:'#f5f1ea', cursor:'pointer', fontSize:13, fontWeight:700, flexShrink:0 }}>↑</button>
            </div>
          </div>
          <button className="btn btn-ink btn-full" style={{ marginTop:10, fontSize:11, padding:'9px' }} onClick={() => navigate('/ai')}>
            🤖 Avvia Analisi Guidata →
          </button>
        </div>

        {/* Journal mini stats */}
        <div style={{ padding:'14px' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:'var(--ink5)', textTransform:'uppercase', letterSpacing:1.5, marginBottom:12 }}>Journal</div>
          {[
            { l:'Trade totali', v: journal.stats.total },
            { l:'Aperti',       v: journal.stats.open, c:'var(--accent)' },
            { l:'Win Rate',     v: journal.stats.winRate !== null ? `${journal.stats.winRate}%` : '—', c:'var(--green)' },
            { l:'Stop Loss',    v: journal.stats.losses, c:'var(--red)' },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'9px 0', borderBottom:'1px solid var(--rule)' }}>
              <span style={{ fontSize:11, color:'var(--ink3)' }}>{l}</span>
              <span style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:800, color: c || 'var(--ink)' }}>{v}</span>
            </div>
          ))}
          <button className="btn btn-outline btn-full" style={{ marginTop:12, fontSize:11, padding:'8px' }} onClick={() => navigate('/journal')}>
            Vedi Journal completo →
          </button>
        </div>
      </div>
    </div>
  )
}
