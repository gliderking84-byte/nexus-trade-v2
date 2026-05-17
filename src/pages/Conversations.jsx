import { useState, useEffect } from 'react'

export default function Conversations() {
  const [convs, setConvs] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setConvs(JSON.parse(localStorage.getItem('nexus_conversations') || '[]'))
  }, [])

  const deleteConv = (id) => {
    const updated = convs.filter(c => c.id !== id)
    localStorage.setItem('nexus_conversations', JSON.stringify(updated))
    setConvs(updated)
    if (selected?.id === id) setSelected(null)
  }

  if (selected) return (
    <div style={{ padding:'24px', maxWidth:720, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button className="btn btn-ghost" style={{ padding:'7px 12px', fontSize:12 }} onClick={() => setSelected(null)}>← Indietro</button>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15 }}>{selected.ticker} — {selected.date} alle {selected.time}</div>
          {selected.setupSaved && <span className="badge badge-bull" style={{ marginTop:4, display:'inline-block' }}>Setup salvato ✓</span>}
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {selected.messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap:8 }}>
            {m.role === 'assistant' && (
              <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0, marginTop:2, color:'#f5f1ea' }}>◈</div>
            )}
            <div style={{
              maxWidth:'80%', padding:'10px 13px', fontSize:13, lineHeight:1.65, whiteSpace:'pre-wrap',
              color: m.role === 'user' ? '#f5f1ea' : 'var(--ink2)',
              background: m.role === 'user' ? 'var(--ink)' : 'var(--paper2)',
              border: m.role === 'user' ? 'none' : '1px solid var(--rule)',
              borderLeft: m.role === 'assistant' ? '3px solid var(--ink)' : undefined,
              borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            }}>{m.content}</div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ padding:'24px', maxWidth:900, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, marginBottom:4 }}>Conversazioni</div>
        <div style={{ fontSize:13, color:'var(--ink3)' }}>Storico delle tue sessioni di analisi con NexusAI.</div>
      </div>

      {!convs.length ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--ink5)' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>💬</div>
          <div style={{ fontSize:14, marginBottom:6 }}>Nessuna conversazione salvata.</div>
          <div style={{ fontSize:12 }}>Usa "Salva chat" durante una sessione con NexusAI.</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {convs.slice().reverse().map(c => (
            <div key={c.id} style={{ background:'var(--paper)', border:'1px solid var(--rule)', borderRadius:10, display:'flex', alignItems:'center', gap:14, padding:'14px 18px', cursor:'pointer', transition:'background .15s' }}
              onClick={() => setSelected(c)}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--paper2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--paper)'}
            >
              <div style={{ width:38, height:38, borderRadius:9, background:'var(--paper2)', border:'1px solid var(--rule)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>💬</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14 }}>{c.ticker}</span>
                  {c.setupSaved && <span className="badge badge-bull">Setup ✓</span>}
                </div>
                <div style={{ fontSize:12, color:'var(--ink5)', marginTop:2 }}>
                  {c.date} alle {c.time} · {c.messages.length} messaggi
                </div>
              </div>
              <button className="btn" style={{ padding:'5px 10px', fontSize:11, background:'transparent', color:'var(--red)', border:'1px solid rgba(192,48,74,.25)', borderRadius:7 }}
                onClick={e => { e.stopPropagation(); if (confirm('Eliminare?')) deleteConv(c.id) }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
