import { useState, useEffect } from 'react'
import { fmt, bybitPlaceOrder } from '../utils/index.js'

const ORDER_TYPES = [
  { id:'Limit',       label:'Limit',       desc:'Ordine al prezzo specificato' },
  { id:'Market',      label:'Market',      desc:'Esecuzione immediata al prezzo corrente' },
  { id:'Conditional', label:'Conditional', desc:'Parte quando il prezzo tocca il trigger' },
]

const TRIGGER_BY_OPTIONS = [
  { id:'LastPrice',  label:'Last Price'  },
  { id:'MarkPrice',  label:'Mark Price'  },
  { id:'IndexPrice', label:'Index Price' },
]

export default function BybitPanel({ setup, settings, onOrderSent }) {
  const [fields, setFields]       = useState({ entry:'', sl:'', tp1:'', tp2:'', leverage:'', budget:'' })
  const [orderType, setOrderType] = useState('Limit')
  const [triggerPrice, setTriggerPrice] = useState('')
  const [triggerBy, setTriggerBy] = useState('LastPrice')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState(null)

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
      setTriggerPrice(setup.entry || '')
      setResult(null)
      setError(null)
    }
  }, [setup?.ticker, setup?.direction, setup?.entry])

  const set = (k, v) => setFields(f => ({ ...f, [k]: v }))

  const e   = parseFloat(fields.entry)
  const s   = parseFloat(fields.sl)
  const t1  = parseFloat(fields.tp1)
  const b   = parseFloat(fields.budget)
  const lev = parseFloat(fields.leverage)
  const tp  = parseFloat(triggerPrice)
  const isLong = setup?.direction === 'LONG'

  const priceForCalc = orderType === 'Market' ? e : orderType === 'Conditional' ? (tp || e) : e
  const valid = priceForCalc > 0 && s > 0 && t1 > 0 && b > 0 && lev > 0
    && (orderType !== 'Conditional' || tp > 0)

  const exposure = valid ? b * lev : null
  const liqPrice = valid ? (isLong
    ? priceForCalc * (1 - 1/lev + 0.004)
    : priceForCalc * (1 + 1/lev - 0.004)) : null
  const loss   = valid ? Math.abs(priceForCalc - s) / priceForCalc * exposure : null
  const profit = valid ? Math.abs(t1 - priceForCalc) / priceForCalc * exposure : null
  const rr     = valid && loss > 0 ? profit / loss : null
  const rrColor = !rr ? 'rgba(255,255,255,.5)' : rr >= 2 ? 'var(--green-d)' : rr >= 1.5 ? 'var(--amber-d)' : 'var(--red-d)'

  const handleConfirm = async () => {
    if (!settings.hasBybitKeys) { setError('Configura le API Key Bybit nelle Impostazioni.'); return }
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
        orderType,
        triggerPrice: orderType === 'Conditional' ? triggerPrice : undefined,
        triggerBy:    orderType === 'Conditional' ? triggerBy    : undefined,
      })
      setResult(res)
      onOrderSent?.(merged)
    } catch (err) { setError(err.message || 'Errore invio ordine') }
    setLoading(false)
  }

  // ── styles ────────────────────────────────────────────────────────────────
  const inputStyle = {
    width:'100%', background:'rgba(255,255,255,.06)',
    border:'1px solid rgba(255,255,255,.1)', borderRadius:7,
    color:'#f5f1ea', padding:'8px 10px',
    fontFamily:'var(--font-mono)', fontSize:13, fontWeight:600,
    outline:'none', transition:'border-color .15s',
  }
  const labelStyle = {
    fontFamily:'var(--font-display)', fontSize:8, fontWeight:700,
    color:'rgba(255,255,255,.25)', textTransform:'uppercase',
    letterSpacing:.8, marginBottom:4, display:'block',
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (!setup) return (
    <div style={{ padding:'20px 16px', textAlign:'center' }}>
      <div style={{ fontSize:28, marginBottom:10, opacity:.2 }}>⚡</div>
      <div style={{ fontSize:12, color:'rgba(255,255,255,.2)', lineHeight:1.6 }}>
        Seleziona un setup dalla tabella<br/>o completa la guida AI
      </div>
    </div>
  )

  // ── Success ───────────────────────────────────────────────────────────────
  if (result) return (
    <div style={{ padding:'16px' }}>
      <div style={{ background:'rgba(0,217,126,.08)', border:'1px solid rgba(0,217,126,.2)', borderRadius:10, padding:'18px', textAlign:'center' }}>
        <div style={{ fontSize:26, marginBottom:8 }}>✅</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:800, color:'var(--green-d)', marginBottom:6 }}>Ordine Inviato!</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', lineHeight:1.6 }}>
          {orderType} · {setup.direction} {setup.ticker}<br/>
          {orderType === 'Conditional' ? `Trigger $${triggerPrice}` : `Entry $${fields.entry}`}
          {' · '}SL ${fields.sl} · TP1 ${fields.tp1}
        </div>
        <button onClick={() => setResult(null)} style={{ marginTop:12, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:7, color:'rgba(255,255,255,.4)', padding:'7px 16px', fontSize:11, cursor:'pointer', fontFamily:'var(--font-display)' }}>
          Nuovo ordine
        </button>
      </div>
    </div>
  )

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding:'14px', display:'flex', flexDirection:'column', gap:10 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:800, color:'var(--amber-d)', letterSpacing:2 }}>BYBIT</div>
        <div style={{ fontSize:8, display:'flex', alignItems:'center', gap:3, fontWeight:600, fontFamily:'var(--font-display)', color: settings.hasBybitKeys ? 'var(--green-d)' : 'var(--red-d)' }}>
          <div className="live-dot" style={{ width:4, height:4, background: settings.hasBybitKeys ? 'var(--green-d)' : 'var(--red-d)', boxShadow:'none' }} />
          {settings.hasBybitKeys ? (settings.settings.bybitTestnet ? 'Testnet' : 'Live') : 'API non configurata'}
        </div>
      </div>

      <div style={{ fontSize:10, color:'rgba(255,255,255,.3)' }}>
        Setup: <strong style={{ color: isLong ? 'var(--green-d)' : 'var(--red-d)' }}>{setup.ticker} {setup.direction}</strong>
      </div>

      {/* ── Order type selector ─────────────────────────────────────────── */}
      <div>
        <div style={labelStyle}>Tipo Ordine</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5 }}>
          {ORDER_TYPES.map(ot => (
            <button key={ot.id} onClick={() => setOrderType(ot.id)} style={{
              padding:'8px 4px', border:`1.5px solid ${orderType === ot.id ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.1)'}`,
              borderRadius:8, cursor:'pointer', textAlign:'center',
              background: orderType === ot.id ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.03)',
              transition:'all .15s',
            }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:10, fontWeight:800, color: orderType === ot.id ? '#f5f1ea' : 'rgba(255,255,255,.35)', letterSpacing:.3 }}>
                {ot.label}
              </div>
            </button>
          ))}
        </div>
        <div style={{ fontSize:9, color:'rgba(255,255,255,.2)', marginTop:5, lineHeight:1.4 }}>
          {ORDER_TYPES.find(o => o.id === orderType)?.desc}
        </div>
      </div>

      {/* ── Conditional trigger fields ──────────────────────────────────── */}
      {orderType === 'Conditional' && (
        <div style={{ background:'rgba(240,192,64,.06)', border:'1px solid rgba(240,192,64,.15)', borderRadius:9, padding:'12px', display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:'var(--amber-d)', textTransform:'uppercase', letterSpacing:1 }}>
            ⚡ Parametri Condizionali
          </div>
          <div>
            <label style={labelStyle}>Trigger Price $</label>
            <input type="number" value={triggerPrice} onChange={e => setTriggerPrice(e.target.value)}
              placeholder={isLong ? 'Es. prezzo che deve salire a...' : 'Es. prezzo che deve scendere a...'}
              style={{ ...inputStyle, color:'var(--amber-d)', borderColor:'rgba(240,192,64,.3)' }}
              onFocus={e => e.target.style.borderColor = 'rgba(240,192,64,.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(240,192,64,.3)'}
            />
          </div>
          <div>
            <label style={labelStyle}>Trigger Direction</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
              {[
                { id: isLong ? 1 : 2, label: isLong ? '↗ Sale a (Rise)' : '↘ Scende a (Fall)' },
                { id: isLong ? 2 : 1, label: isLong ? '↘ Scende a (Fall)' : '↗ Sale a (Rise)' },
              ].map(opt => (
                <div key={opt.id} style={{ padding:'7px 8px', border:'1px solid rgba(255,255,255,.1)', borderRadius:7, fontSize:10, color:'rgba(255,255,255,.4)', background:'rgba(255,255,255,.03)', textAlign:'center' }}>
                  {opt.label}
                </div>
              ))}
            </div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,.2)', marginTop:4 }}>
              {isLong
                ? 'Long: il trigger si attiva quando il prezzo sale al livello indicato'
                : 'Short: il trigger si attiva quando il prezzo scende al livello indicato'}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Trigger By</label>
            <select value={triggerBy} onChange={e => setTriggerBy(e.target.value)} style={{ ...inputStyle, color:'var(--amber-d)', fontSize:12 }}>
              {TRIGGER_BY_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* ── Price fields ────────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {[
          { key:'entry',    label: orderType === 'Conditional' ? 'Order Price $' : orderType === 'Market' ? 'Prezzo stimato $' : 'Entry $', color:'var(--cyan-d)', disabled: orderType === 'Market' },
          { key:'sl',       label:'Stop Loss $',  color:'var(--red-d)' },
          { key:'tp1',      label:'TP1 $',         color:'var(--green-d)' },
          { key:'tp2',      label:'TP2 $',         color:'var(--green-d)' },
          { key:'leverage', label:'Leva x',        color:'#f5f1ea' },
          { key:'budget',   label:'Budget $',      color:'#f5f1ea' },
        ].map(({ key, label, color, disabled }) => (
          <div key={key}>
            <label style={labelStyle}>{label}</label>
            <input
              type="number"
              value={fields[key]}
              onChange={e => set(key, e.target.value)}
              disabled={disabled}
              style={{ ...inputStyle, color, opacity: disabled ? .4 : 1, cursor: disabled ? 'not-allowed' : 'text' }}
              onFocus={e => !disabled && (e.target.style.borderColor = 'rgba(255,255,255,.3)')}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.1)'}
            />
          </div>
        ))}
      </div>

      {/* ── Live calculations ───────────────────────────────────────────── */}
      {valid && (
        <>
          <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', borderRadius:9, padding:'10px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
            {[
              { l:'Esposizione', v: fmt(exposure),    c:'var(--cyan-d)' },
              { l:'Liq. Price',  v: fmt(liqPrice),    c:'#ff8844' },
              { l:'R:R',         v: rr ? `1:${rr.toFixed(2)}` : '—', c: rrColor },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:.8, marginBottom:3 }}>{l}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:c }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            <div style={{ background:'rgba(255,68,102,.07)', borderRadius:8, padding:'8px', textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:.8, marginBottom:3 }}>Perdita SL</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'var(--red-d)' }}>-{fmt(loss)}</div>
            </div>
            <div style={{ background:'rgba(0,217,126,.07)', borderRadius:8, padding:'8px', textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:.8, marginBottom:3 }}>Profitto TP1</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'var(--green-d)' }}>+{fmt(profit)}</div>
            </div>
          </div>
        </>
      )}

      {/* Warnings */}
      {lev > 10 && (
        <div style={{ background:'rgba(240,192,64,.08)', border:'1px solid rgba(240,192,64,.2)', borderRadius:7, padding:'8px 11px', fontSize:11, color:'var(--amber-d)', lineHeight:1.4 }}>
          ⚠️ Leva {lev}x — rischio liquidazione elevato.
        </div>
      )}
      {error && (
        <div style={{ background:'rgba(255,68,102,.08)', border:'1px solid rgba(255,68,102,.2)', borderRadius:7, padding:'9px 12px', fontSize:11, color:'var(--red-d)', lineHeight:1.5 }}>
          ⚠️ {error}
        </div>
      )}

      {/* CTA */}
      <button onClick={handleConfirm} disabled={loading || !valid} style={{
        width:'100%', padding:'12px', border:'none', borderRadius:9,
        background: !valid ? 'rgba(255,255,255,.06)'
          : isLong  ? 'linear-gradient(135deg,#005a38,var(--green-d))'
          : 'linear-gradient(135deg,#7a001a,var(--red-d))',
        color: !valid ? 'rgba(255,255,255,.2)' : isLong ? '#000' : '#fff',
        fontFamily:'var(--font-display)', fontWeight:800, fontSize:12,
        cursor: valid ? 'pointer' : 'not-allowed',
        letterSpacing:.5, opacity: loading ? .6 : 1, transition:'opacity .15s',
      }}>
        {loading ? '⏳ Invio in corso...'
          : !valid ? 'Compila tutti i campi'
          : `⚡ CONFERMA ${orderType.toUpperCase()} ${setup.direction} — BYBIT`}
      </button>

      <div style={{ fontSize:8, color:'rgba(255,255,255,.18)', textAlign:'center', lineHeight:1.5 }}>
        {orderType === 'Market' && 'Esecuzione immediata · SL/TP automatici'}
        {orderType === 'Limit' && 'Ordine limit · SL/TP automatici · Review manuale richiesta'}
        {orderType === 'Conditional' && `Si attiva quando il prezzo tocca $${triggerPrice || '—'}`}
      </div>
    </div>
  )
}
