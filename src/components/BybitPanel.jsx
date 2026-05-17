import { useState, useEffect } from 'react'
import { fmt, bybitPlaceOrder } from '../utils/index.js'

export default function BybitPanel({ setup, settings, onOrderSent }) {
  const [fields, setFields] = useState({ entry:'', sl:'', tp1:'', tp2:'', leverage:'', budget:'' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Populate fields when a new setup is selected
  useEffect(() => {
    if (setup) {
      setFields({
        entry:    setup.entry    || '',
        sl:       setup.sl       || '',
        tp1:      setup.tp1      || '',
        tp2:      setup.tp2      || '',
        leverage: setup.leverage || settings.settings.defaultLeverage || '7',
        budget:   setup.budget   || settings.settings.defaultBudget   || '50',
      })
      setResult(null)
      setError(null)
    }
  }, [setup?.ticker, setup?.direction, setup?.entry])

  const set = (k, v) => setFields(f => ({ ...f, [k]: v }))

  // Live calculations
  const e   = parseFloat(fields.entry)
  const s   = parseFloat(fields.sl)
  const t1  = parseFloat(fields.tp1)
  const b   = parseFloat(fields.budget)
  const lev = parseFloat(fields.leverage)
  const isLong = setup?.direction === 'LONG'

  const valid = e > 0 && s > 0 && t1 > 0 && b > 0 && lev > 0
  const exposure  = valid ? b * lev : null
  const liqPrice  = valid ? (isLong ? e * (1 - 1/lev + 0.004) : e * (1 + 1/lev - 0.004)) : null
  const loss      = valid ? Math.abs(e - s) / e * exposure : null
  const profit    = valid ? Math.abs(t1 - e) / e * exposure : null
  const rr        = valid && loss > 0 ? profit / loss : null

  const rrColor = !rr ? 'rgba(255,255,255,.5)'
    : rr >= 2    ? 'var(--green-d)'
    : rr >= 1.5  ? 'var(--amber-d)'
    : 'var(--red-d)'

  const handleConfirm = async () => {
    if (!settings.hasBybitKeys) {
      setError('Configura le API Key Bybit nelle Impostazioni.')
      return
    }
    if (!valid) { setError('Verifica i valori inseriti.'); return }
    if (lev > 25) { setError('Leva massima supportata: 25x.'); return }

    setLoading(true); setError(null)
    try {
      const merged = { ...setup, ...fields }
      const res = await bybitPlaceOrder({
        apiKey:    settings.settings.bybitKey,
        apiSecret: settings.settings.bybitSecret,
        testnet:   settings.settings.bybitTestnet,
        setup:     merged,
      })
      setResult(res)
      onOrderSent?.(merged)
    } catch (err) {
      setError(err.message || 'Errore invio ordine')
    }
    setLoading(false)
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!setup) return (
    <div style={{ padding:'20px 16px', textAlign:'center' }}>
      <div style={{ fontSize:28, marginBottom:10, opacity:.25 }}>⚡</div>
      <div style={{ fontSize:12, color:'rgba(255,255,255,.2)', lineHeight:1.6 }}>
        Seleziona un setup dalla tabella<br/>o completa la guida AI
      </div>
    </div>
  )

  // ── Success state ────────────────────────────────────────────────────────
  if (result) return (
    <div style={{ padding:'16px' }}>
      <div style={{ background:'rgba(0,217,126,.08)', border:'1px solid rgba(0,217,126,.2)', borderRadius:10, padding:'18px', textAlign:'center' }}>
        <div style={{ fontSize:26, marginBottom:8 }}>✅</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:800, color:'var(--green-d)', marginBottom:6 }}>Ordine Inviato!</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', lineHeight:1.6 }}>
          {setup.direction} {setup.ticker}<br/>
          Entry ${fields.entry} · SL ${fields.sl} · TP1 ${fields.tp1}
        </div>
        <button onClick={() => setResult(null)} style={{
          marginTop:12, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)',
          borderRadius:7, color:'rgba(255,255,255,.4)', padding:'7px 16px',
          fontSize:11, cursor:'pointer', fontFamily:'var(--font-display)',
        }}>Nuovo ordine</button>
      </div>
    </div>
  )

  // ── Main panel ───────────────────────────────────────────────────────────
  const inputStyle = {
    width:'100%', background:'rgba(255,255,255,.06)',
    border:'1px solid rgba(255,255,255,.1)', borderRadius:7,
    color:'#f5f1ea', padding:'8px 10px',
    fontFamily:'var(--font-mono)', fontSize:13, fontWeight:600,
    outline:'none', transition:'border-color .15s',
  }

  return (
    <div style={{ padding:'14px', display:'flex', flexDirection:'column', gap:10 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:800, color:'var(--amber-d)', letterSpacing:2 }}>BYBIT</div>
        <div style={{ fontSize:8, color: settings.hasBybitKeys ? 'var(--green-d)' : 'var(--red-d)', display:'flex', alignItems:'center', gap:3, fontWeight:600, fontFamily:'var(--font-display)' }}>
          <div className="live-dot" style={{ width:4, height:4, background: settings.hasBybitKeys ? 'var(--green-d)' : 'var(--red-d)', boxShadow:'none' }} />
          {settings.hasBybitKeys ? (settings.settings.bybitTestnet ? 'Testnet' : 'Live') : 'API non configurata'}
        </div>
      </div>

      <div style={{ fontSize:10, color:'rgba(255,255,255,.3)' }}>
        Setup: <strong style={{ color: isLong ? 'var(--green-d)' : 'var(--red-d)' }}>{setup.ticker} {setup.direction}</strong>
        <span style={{ color:'rgba(255,255,255,.2)', marginLeft:6, fontSize:9 }}>· modifica i valori prima di confermare</span>
      </div>

      {/* Editable fields */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {[
          { key:'entry',    label:'Entry $',    color:'var(--cyan-d)' },
          { key:'sl',       label:'Stop Loss $', color:'var(--red-d)' },
          { key:'tp1',      label:'TP1 $',       color:'var(--green-d)' },
          { key:'tp2',      label:'TP2 $',       color:'var(--green-d)' },
          { key:'leverage', label:'Leva x',      color:'#f5f1ea' },
          { key:'budget',   label:'Budget $',    color:'#f5f1ea' },
        ].map(({ key, label, color }) => (
          <div key={key}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:.8, marginBottom:4 }}>{label}</div>
            <input
              type="number"
              value={fields[key]}
              onChange={e => set(key, e.target.value)}
              style={{ ...inputStyle, color }}
              onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,.3)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'}
            />
          </div>
        ))}
      </div>

      {/* Live calculations */}
      {valid && (
        <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', borderRadius:9, padding:'10px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:.8, marginBottom:3 }}>Esposizione</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'var(--cyan-d)' }}>{fmt(exposure)}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:.8, marginBottom:3 }}>Liq. Price</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'#ff8844' }}>{fmt(liqPrice)}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:.8, marginBottom:3 }}>R:R</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color: rrColor }}>
              {rr ? `1:${rr.toFixed(2)}` : '—'}
            </div>
          </div>
        </div>
      )}

      {/* P&L preview */}
      {valid && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
          <div style={{ background:'rgba(255,68,102,.07)', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:.8, marginBottom:3 }}>Perdita SL</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'var(--red-d)' }}>-{fmt(loss)}</div>
          </div>
          <div style={{ background:'rgba(0,217,126,.07)', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:.8, marginBottom:3 }}>Profitto TP1</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'var(--green-d)' }}>+{fmt(profit)}</div>
          </div>
        </div>
      )}

      {/* Leva warning */}
      {lev > 10 && (
        <div style={{ background:'rgba(240,192,64,.08)', border:'1px solid rgba(240,192,64,.2)', borderRadius:7, padding:'8px 11px', fontSize:11, color:'var(--amber-d)', lineHeight:1.4 }}>
          ⚠️ Leva {lev}x — rischio liquidazione elevato. Considera di ridurre.
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background:'rgba(255,68,102,.08)', border:'1px solid rgba(255,68,102,.2)', borderRadius:7, padding:'9px 12px', fontSize:11, color:'var(--red-d)', lineHeight:1.5 }}>
          ⚠️ {error}
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleConfirm}
        disabled={loading || !valid}
        style={{
          width:'100%', padding:'12px',
          background: !valid ? 'rgba(255,255,255,.06)'
            : isLong ? 'linear-gradient(135deg,#005a38,var(--green-d))'
            : 'linear-gradient(135deg,#7a001a,var(--red-d))',
          border:'none', borderRadius:9,
          color: !valid ? 'rgba(255,255,255,.2)' : isLong ? '#000' : '#fff',
          fontFamily:'var(--font-display)', fontWeight:800, fontSize:12,
          cursor: valid ? 'pointer' : 'not-allowed',
          letterSpacing:.5, transition:'opacity .15s',
          opacity: loading ? .6 : 1,
        }}
      >
        {loading ? '⏳ Invio in corso...' : !valid ? 'Compila tutti i campi' : `⚡ CONFERMA ${setup.direction} — BYBIT`}
      </button>

      <div style={{ fontSize:8, color:'rgba(255,255,255,.18)', textAlign:'center', lineHeight:1.5 }}>
        Ordine limit · SL/TP automatici · Review manuale richiesta
      </div>
    </div>
  )
}
