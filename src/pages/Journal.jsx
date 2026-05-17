import { fmt } from '../utils/index.js'

const STATUS_CFG = {
  'Aperta':  { color:'var(--accent)', bg:'rgba(10,114,176,.08)' },
  'TP1 ✅':  { color:'var(--amber)', bg:'rgba(160,112,32,.08)' },
  'TP2 ✅':  { color:'var(--green)', bg:'rgba(0,122,80,.08)' },
  'SL ❌':   { color:'var(--red)',   bg:'rgba(192,48,74,.08)' },
}

export default function Journal({ journal }) {
  const { trades, updateTrade, deleteTrade, stats } = journal

  return (
    <div style={{ padding:'24px', maxWidth:900, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, marginBottom:4 }}>Trade Journal</div>
        <div style={{ fontSize:13, color:'var(--ink3)' }}>Storico delle tue operazioni e setup salvati.</div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:28 }}>
        {[
          { l:'Trade totali', v: stats.total, c:'var(--ink)' },
          { l:'Aperti',       v: stats.open,  c:'var(--accent)' },
          { l:'Win Rate',     v: stats.winRate !== null ? `${stats.winRate}%` : '—', c:'var(--green)' },
          { l:'Stop Loss',    v: stats.losses, c:'var(--red)' },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ background:'var(--paper2)', border:'1px solid var(--rule)', borderRadius:10, padding:'14px 16px', textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:9, fontWeight:700, color:'var(--ink5)', textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>{l}</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:800, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {!trades.length ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--ink5)' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📒</div>
          <div style={{ fontSize:14, marginBottom:6 }}>Nessun trade registrato ancora.</div>
          <div style={{ fontSize:12 }}>Completa un'analisi con NexusAI e salva il setup.</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {trades.slice().reverse().map(t => {
            const cfg = STATUS_CFG[t.status] || STATUS_CFG['Aperta']
            const isLong = t.direction === 'LONG'
            return (
              <div key={t.id} style={{ background:'var(--paper)', border:'1px solid var(--rule)', borderLeft:`3px solid ${cfg.color}`, borderRadius:10, padding:'16px 18px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:15 }}>{t.ticker}</span>
                    <span className={`badge badge-${(t.direction||'LONG').toLowerCase()}`}>{t.direction || 'LONG'}</span>
                    <span style={{ fontSize:11, color:'var(--ink5)' }}>{t.date}</span>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <select
                      value={t.status}
                      onChange={e => updateTrade(t.id, { status:e.target.value })}
                      style={{ background: cfg.bg, border:`1px solid ${cfg.color}40`, borderRadius:7, color:cfg.color, padding:'5px 10px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-display)' }}
                    >
                      {Object.keys(STATUS_CFG).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => { if (confirm('Eliminare questo trade?')) deleteTrade(t.id) }}
                      style={{ background:'transparent', border:'1px solid rgba(192,48,74,.3)', borderRadius:7, color:'var(--red)', padding:'5px 10px', fontSize:11, cursor:'pointer' }}>✕</button>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:10 }}>
                  {[
                    { l:'Entry',       v:`$${t.entry}`,                         c:'var(--accent)' },
                    { l:'Stop Loss',   v:`$${t.sl}`,                            c:'var(--red)' },
                    { l:'TP1',         v:`$${t.tp1}`,                           c:'var(--amber)' },
                    { l:'TP2',         v: t.tp2 ? `$${t.tp2}` : '—',           c:'var(--green)' },
                    { l:'Budget',      v:`$${t.budget}` },
                    { l:'Leva',        v:`${t.leverage}x` },
                    { l:'Esposizione', v: fmt(t.exposure),                      c:'var(--accent)' },
                    { l:'Liq. Price',  v: fmt(t.liqPrice),                      c:'#c05820' },
                  ].map(({ l, v, c }) => (
                    <div key={l} style={{ background:'var(--paper2)', borderRadius:7, padding:'8px 10px' }}>
                      <div style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'var(--ink5)', textTransform:'uppercase', letterSpacing:.8, marginBottom:3 }}>{l}</div>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600, color: c || 'var(--ink)' }}>{v}</div>
                    </div>
                  ))}
                </div>

                {t.rr1 && (
                  <div style={{ display:'flex', gap:8 }}>
                    {[
                      { l:'Perdita SL',   v:`-${fmt(t.loss)}`,           c:'var(--red)' },
                      { l:'Profitto TP1', v:`+${fmt(t.profitTP1)}`,      c:'var(--green)' },
                      { l:'R:R TP1',      v:`1:${t.rr1.toFixed(2)}`,     c: t.rr1 >= 1.5 ? 'var(--green)' : 'var(--amber)' },
                    ].map(({ l, v, c }) => (
                      <div key={l} style={{ background:'var(--paper2)', borderRadius:7, padding:'7px 12px' }}>
                        <div style={{ fontFamily:'var(--font-display)', fontSize:8, fontWeight:700, color:'var(--ink5)', textTransform:'uppercase', letterSpacing:.8, marginBottom:2 }}>{l}</div>
                        <div style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600, color: c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}

                {t.notes && (
                  <div style={{ marginTop:10, padding:'8px 12px', background:'var(--paper2)', borderRadius:7, fontSize:12, color:'var(--ink3)', borderLeft:'2px solid var(--rule2)' }}>
                    📝 {t.notes}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
