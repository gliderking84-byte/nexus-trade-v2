import { useState } from 'react'
import { fmt, bybitPlaceOrder } from '../utils/index.js'

export default function BybitPanel({ setup, settings, onOrderSent }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  if (!setup) return (
    <div style={{ padding:'16px', textAlign:'center' }}>
      <div style={{ fontSize:24, marginBottom:8, opacity:.3 }}>⚡</div>
      <div style={{ fontSize:12, color:'rgba(255,255,255,.2)', lineHeight:1.5 }}>
        Seleziona un setup dalla tabella<br />o completa la guida AI per inviare un ordine
      </div>
    </div>
  )

  const e = parseFloat(setup.entry)
  const s = parseFloat(setup.sl)
  const t1 = parseFloat(setup.tp1)
  const b = parseFloat(setup.budget)
  const lev = parseFloat(setup.leverage)
  const exposure = b * lev
  const liqPrice = setup.direction === 'LONG'
    ? e * (1 - 1 / lev + 0.004)
    : e * (1 + 1 / lev - 0.004)
  const loss = Math.abs(e - s) / e * exposure
  const profit = Math.abs(t1 - e) / e * exposure
  const rr = profit / loss

  const isLong = setup.direction === 'LONG'

  const handleConfirm = async () => {
    if (!settings.hasBybitKeys) {
      setError('Configura le API Key Bybit nelle Impostazioni prima di inviare ordini.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      // Dynamic import to avoid issues if crypto-js not available
      const { bybitPlaceOrder } = await import('../utils/bybit.js')
      const res = await bybitPlaceOrder({
        apiKey: settings.settings.bybitKey,
        apiSecret: settings.settings.bybitSecret,
        testnet: settings.settings.bybitTestnet,
        setup,
      })
      setResult(res)
      onOrderSent?.(setup, res)
    } catch (err) {
      setError(err.message || 'Errore invio ordine')
    }
    setLoading(false)
  }

  if (result) return (
    <div style={{ padding:'14px' }}>
      <div style={{ background:'rgba(0,217,126,.1)', border:'1px solid rgba(0,217,126,.2)', borderRadius:10, padding:'14px', textAlign:'center' }}>
        <div style={{ fontSize:22, marginBottom:6 }}>✅</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:800, color:'var(--green-d)', marginBottom:4 }}>Ordine Inviato</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', lineHeight:1.5 }}>
          {setup.direction} {setup.ticker} · ${setup.entry}<br/>
          SL: ${setup.sl} · TP1: ${setup.tp1}
        </div>
        <button className="btn btn-ghost" style={{ marginTop:10, fontSize:11, padding:'6px 14px', background:'rgba(255,255,255,.06)', color:'rgba(255,255,255,.4)', borderColor:'rgba(255,255,255,.1)' }}
          onClick={() => { setResult(null) }}>
          Nuovo ordine
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ padding:'14px', display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:800, color:'var(--amber-d)', letterSpacing:2 }}>BYBIT</div>
        <div style={{ fontSize:8, color:'var(--green-d)', display:'flex', alignItems:'center', gap:3, fontWeight:600, fontFamily:'var(--font-display)' }}>
          <div className="live-dot" style={{ width:4, height:4 }} />
          {settings.hasBybitKeys ? (settings.settings.bybitTestnet ? 'Testnet' : 'Live') : 'API non configurata'}
        </div>
      </div>

      <div style={{ fontSize:10, color:'rgba(255,255,255,.3)' }}>
        Setup selezionato:&nbsp;
        <strong style={{ color: isLong ? 'var(--green-d)' : 'var(--red-d)' }}>
          {setup.ticker} {setup.direction}
        </strong>
      </div>

      {/* Params grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
        {[
          { l:'Entry',      v:`$${setup.entry}`, c:'var(--cyan-d)' },
          { l:'Stop Loss',  v:`$${setup.sl}`,    c:'var(--red-d)' },
          { l:'TP1',        v:`$${setup.tp1}`,   c:'var(--green-d)' },
          { l:'TP2',        v: setup.tp2 ? `$${setup.tp2}` : '—', c:'var(--green-d)' },
          { l:'Leva',       v:`${setup.leverage}x` },
          { l:'Budget',     v:`$${setup.budget}` },
          { l:'Esposizione',v: fmt(exposure),    c:'var(--cyan-d)' },
          { l:'Liq. Price', v: fmt(liqPrice),    c:'#ff8844' },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ background:'rgba(255,255,255,.04)', borderRadius:7, padding:'7px 9px' }}>
            <div style={{ fontSize:8, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:.8, marginBottom:2, fontFamily:'var(--font-display)', fontWeight:700 }}>{l}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:600, color: c || 'rgba(255,255,255,.75)' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div style={{ display:'flex', gap:6 }}>
        <div style={{ flex:1, background:'rgba(255,68,102,.08)', borderRadius:7, padding:'7px', textAlign:'center' }}>
          <div style={{ fontSize:8, color:'rgba(255,255,255,.25)', marginBottom:2, fontFamily:'var(--font-display)', fontWeight:700, textTransform:'uppercase', letterSpacing:.8 }}>Perdita SL</div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700, color:'var(--red-d)' }}>-{fmt(loss)}</div>
        </div>
        <div style={{ flex:1, background:'rgba(0,217,126,.08)', borderRadius:7, padding:'7px', textAlign:'center' }}>
          <div style={{ fontSize:8, color:'rgba(255,255,255,.25)', marginBottom:2, fontFamily:'var(--font-display)', fontWeight:700, textTransform:'uppercase', letterSpacing:.8 }}>Profitto TP1</div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700, color:'var(--green-d)' }}>+{fmt(profit)}</div>
        </div>
        <div style={{ flex:1, background:'rgba(255,255,255,.04)', borderRadius:7, padding:'7px', textAlign:'center' }}>
          <div style={{ fontSize:8, color:'rgba(255,255,255,.25)', marginBottom:2, fontFamily:'var(--font-display)', fontWeight:700, textTransform:'uppercase', letterSpacing:.8 }}>R:R</div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700, color: rr >= 1.5 ? 'var(--green-d)' : 'var(--amber-d)' }}>1:{rr.toFixed(2)}</div>
        </div>
      </div>

      {error && (
        <div style={{ background:'rgba(255,68,102,.1)', border:'1px solid rgba(255,68,102,.2)', borderRadius:7, padding:'9px 12px', fontSize:11, color:'var(--red-d)', lineHeight:1.4 }}>
          ⚠️ {error}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleConfirm}
        disabled={loading}
        className={`btn btn-full ${isLong ? 'btn-long' : 'btn-short'}`}
        style={{ fontSize:12, padding:'11px', opacity: loading ? .6 : 1 }}
      >
        {loading ? '⏳ Invio in corso...' : `⚡ CONFERMA ${setup.direction} — BYBIT`}
      </button>
      <div style={{ fontSize:8, color:'rgba(255,255,255,.2)', textAlign:'center', lineHeight:1.4 }}>
        Ordine limit · SL/TP automatici · Review manuale richiesta
      </div>
    </div>
  )
}
