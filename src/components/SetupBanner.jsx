import { fmt } from '../utils/index.js'

export default function SetupBanner({ setup, onSave, onSendBybit }) {
  const e = parseFloat(setup.entry), s = parseFloat(setup.sl),
    t1 = parseFloat(setup.tp1), t2 = parseFloat(setup.tp2),
    b = parseFloat(setup.budget), lev = parseFloat(setup.leverage)
  const exposure = b * lev
  const liqPrice = setup.direction === 'LONG'
    ? e * (1 - 1 / lev + 0.004)
    : e * (1 + 1 / lev - 0.004)
  const loss = Math.abs(e - s) / e * exposure
  const profit = Math.abs(t1 - e) / e * exposure
  const rr = profit / loss
  const isLong = setup.direction === 'LONG'

  return (
    <div style={{
      background:'var(--dark2)', borderRadius:12, padding:16,
      border:`1px solid ${isLong ? 'rgba(0,217,126,.2)' : 'rgba(255,68,102,.2)'}`,
      animation:'fade-up .35s ease forwards',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:15 }}>🎯</span>
          <span style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:800, color:'#f5f1ea' }}>Setup Pronto</span>
          <span className={`badge badge-${setup.direction.toLowerCase()}`}>{setup.direction}</span>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'rgba(255,255,255,.4)' }}>{setup.ticker}</span>
        </div>
        <div style={{ display:'flex', gap:7 }}>
          <button className="btn btn-amber" style={{ fontSize:11, padding:'7px 14px' }} onClick={onSendBybit}>
            ⚡ Invia a Bybit
          </button>
          <button className="btn" style={{ fontSize:11, padding:'7px 14px', background:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.6)', borderRadius:7 }} onClick={onSave}>
            💾 Salva Journal
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:7, marginBottom:10 }}>
        {[
          { l:'Entry',       v:`$${setup.entry}`,                    c:'var(--cyan-d)' },
          { l:'Stop Loss',   v:`$${setup.sl}`,                       c:'var(--red-d)' },
          { l:'TP1',         v:`$${setup.tp1}`,                      c:'var(--green-d)' },
          { l:'TP2',         v: setup.tp2 ? `$${setup.tp2}` : '—',  c:'var(--green-d)' },
          { l:'Budget',      v:`$${setup.budget}` },
          { l:'Leva',        v:`${setup.leverage}x` },
          { l:'Esposizione', v: fmt(exposure),                       c:'var(--cyan-d)' },
          { l:'Liq. Price',  v: fmt(liqPrice),                       c:'#ff8844' },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ background:'rgba(255,255,255,.04)', borderRadius:7, padding:'8px 10px' }}>
            <div style={{ fontSize:8, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:.8, marginBottom:3, fontFamily:'var(--font-display)', fontWeight:700 }}>{l}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600, color: c || 'rgba(255,255,255,.8)' }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:7 }}>
        {[
          { l:'Perdita SL',   v:`-${fmt(loss)}`,   c:'var(--red-d)' },
          { l:'Profitto TP1', v:`+${fmt(profit)}`,  c:'var(--green-d)' },
          { l:'R:R Ratio',    v:`1 : ${rr.toFixed(2)}`, c: rr >= 1.5 ? 'var(--green-d)' : 'var(--amber-d)' },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ flex:1, background:'rgba(255,255,255,.04)', borderRadius:7, padding:'8px 10px', textAlign:'center' }}>
            <div style={{ fontSize:8, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:.8, marginBottom:3, fontFamily:'var(--font-display)', fontWeight:700 }}>{l}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {setup.notes && (
        <div style={{ marginTop:10, fontSize:11, color:'rgba(255,255,255,.35)', borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:9, lineHeight:1.5 }}>
          📝 {setup.notes}
        </div>
      )}
    </div>
  )
}
