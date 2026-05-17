import { useState } from 'react'

function Field({ label, value, onChange, type = 'text', placeholder, hint }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ marginBottom:16 }}>
      <label className="field-label">{label}</label>
      <div style={{ position:'relative' }}>
        <input
          className="input"
          type={type === 'password' && !show ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ paddingRight: type === 'password' ? 44 : 14 }}
        />
        {type === 'password' && (
          <button onClick={() => setShow(!show)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--ink4)', cursor:'pointer', fontSize:14 }}>
            {show ? '🙈' : '👁'}
          </button>
        )}
      </div>
      {hint && <div style={{ fontSize:11, color:'var(--ink5)', marginTop:4, lineHeight:1.4 }}>{hint}</div>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background:'var(--paper)', border:'1px solid var(--rule)', borderRadius:12, padding:'20px', marginBottom:16 }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:800, marginBottom:16, paddingBottom:12, borderBottom:'1px solid var(--rule)' }}>{title}</div>
      {children}
    </div>
  )
}

export default function Settings({ settings }) {
  const { settings: s, update } = settings
  const [saved, setSaved] = useState(false)

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div style={{ padding:'16px', maxWidth:680, margin:'0 auto', overflowX:'hidden' }}>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, marginBottom:4 }}>Impostazioni</div>
        <div style={{ fontSize:13, color:'var(--ink3)' }}>Configura le API key e le preferenze dell'app.</div>
      </div>

      {/* Anthropic */}
      <Section title="🤖 Anthropic — NexusAI">
        <div style={{ background:'#f0f7ff', border:'1px solid rgba(10,114,176,.15)', borderRadius:8, padding:'10px 13px', marginBottom:16, fontSize:12, color:'var(--accent)', lineHeight:1.5 }}>
          La API key Anthropic abilita l'analisi AI dei chart, la chat guidata e la generazione automatica dei setup.<br/>
          Ottienila su <a href="https://console.anthropic.com" target="_blank" style={{ color:'var(--accent)', fontWeight:600 }}>console.anthropic.com</a>
        </div>
        <Field
          label="API Key Anthropic"
          value={s.anthropicKey}
          onChange={v => update({ anthropicKey: v })}
          type="password"
          placeholder="sk-ant-api03-..."
          hint="La chiave viene salvata solo nel tuo browser (localStorage). Non viene mai trasmessa ad altri server."
        />
        {settings.hasAnthropicKey
          ? <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--green)', fontWeight:600 }}><span>✅</span> API key valida — NexusAI attivo</div>
          : <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--ink5)' }}><span>⚠️</span> Inserisci la API key per abilitare le funzioni AI</div>
        }
      </Section>

      {/* Bybit */}
      <Section title="⚡ Bybit — Trading API">
        <div style={{ background:'#fdf5e0', border:'1px solid rgba(160,112,32,.2)', borderRadius:8, padding:'10px 13px', marginBottom:16, fontSize:12, color:'var(--amber)', lineHeight:1.5 }}>
          Le API key Bybit abilitano l'apertura degli ordini semi-automatici. Crea chiavi con permesso "Trade" su <a href="https://www.bybit.com/app/user/api-management" target="_blank" style={{ color:'var(--amber)', fontWeight:600 }}>Bybit API Management</a>.<br/>
          <strong>Consiglio:</strong> usa prima il Testnet per verificare che tutto funzioni.
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, padding:'10px 13px', background:'var(--paper2)', borderRadius:8 }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:700 }}>Modalità Testnet</span>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, color:'var(--ink4)' }}>{s.bybitTestnet ? 'Testnet (sicuro)' : 'Live (reale!)'}</span>
            <button
              onClick={() => update({ bybitTestnet: !s.bybitTestnet })}
              style={{
                width:40, height:22, borderRadius:11, border:'none', cursor:'pointer',
                background: s.bybitTestnet ? 'var(--green)' : 'var(--red)',
                position:'relative', transition:'background .2s',
              }}
            >
              <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:3, transition:'left .2s', left: s.bybitTestnet ? 3 : 21 }} />
            </button>
          </div>
        </div>

        {!s.bybitTestnet && (
          <div style={{ background:'rgba(192,48,74,.08)', border:'1px solid rgba(192,48,74,.2)', borderRadius:8, padding:'10px 13px', marginBottom:16, fontSize:12, color:'var(--red)', lineHeight:1.5 }}>
            ⚠️ <strong>Modalità Live attiva.</strong> Gli ordini verranno inviati su Bybit reale e potranno comportare perdita di fondi. Procedi con cautela.
          </div>
        )}

        <Field label="API Key" value={s.bybitKey} onChange={v => update({ bybitKey: v })} type="password" placeholder="La tua Bybit API key" />
        <Field label="API Secret" value={s.bybitSecret} onChange={v => update({ bybitSecret: v })} type="password" placeholder="Il tuo Bybit API secret" />

        {settings.hasBybitKeys
          ? <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--green)', fontWeight:600 }}><span>✅</span> Bybit configurato — {s.bybitTestnet ? 'Testnet' : 'Live'}</div>
          : <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--ink5)' }}><span>⚠️</span> Inserisci le chiavi per abilitare l'apertura ordini</div>
        }
      </Section>

      {/* Trading defaults */}
      <Section title="📐 Preferenze di Trading">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label className="field-label">Budget default ($)</label>
            <input className="input" type="number" value={s.defaultBudget} onChange={e => update({ defaultBudget: e.target.value })} placeholder="50" />
          </div>
          <div>
            <label className="field-label">Leva default (x)</label>
            <input className="input" type="number" value={s.defaultLeverage} onChange={e => update({ defaultLeverage: e.target.value })} placeholder="7" min="1" max="25" />
          </div>
        </div>
        <div style={{ marginTop:8, fontSize:11, color:'var(--ink5)' }}>Questi valori vengono usati come default nella guida AI e nel pannello Bybit.</div>
      </Section>

      {/* Data management */}
      <Section title="🗃 Gestione Dati">
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', justify:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--rule)' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600 }}>Esporta dati</div>
              <div style={{ fontSize:11, color:'var(--ink5)', marginTop:2 }}>Scarica journal e conversazioni in formato JSON</div>
            </div>
            <button className="btn btn-ghost" style={{ fontSize:11, padding:'7px 14px' }} onClick={() => {
              const data = {
                trades: JSON.parse(localStorage.getItem('nexus_trades') || '[]'),
                conversations: JSON.parse(localStorage.getItem('nexus_conversations') || '[]'),
                exported: new Date().toISOString(),
              }
              const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = url; a.download = 'nexus-export.json'; a.click()
            }}>
              ↓ Esporta JSON
            </button>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--red)' }}>Cancella tutti i dati</div>
              <div style={{ fontSize:11, color:'var(--ink5)', marginTop:2 }}>Rimuove journal, conversazioni e impostazioni</div>
            </div>
            <button className="btn" style={{ fontSize:11, padding:'7px 14px', background:'rgba(192,48,74,.08)', color:'var(--red)', border:'1px solid rgba(192,48,74,.25)', borderRadius:7 }}
              onClick={() => {
                if (confirm('Sei sicuro? Tutti i dati verranno eliminati permanentemente.')) {
                  localStorage.clear()
                  window.location.reload()
                }
              }}>
              🗑 Cancella tutto
            </button>
          </div>
        </div>
      </Section>

      <button className="btn btn-ink btn-full" style={{ fontSize:13, padding:'12px' }} onClick={handleSave}>
        {saved ? '✅ Salvato!' : '💾 Salva impostazioni'}
      </button>

      <div style={{ marginTop:20, textAlign:'center', fontSize:11, color:'var(--ink5)', lineHeight:1.5 }}>
        Nexus Trade v3.0 · Tutte le API key sono salvate esclusivamente nel tuo browser.<br/>
        Nessun dato viene trasmesso a server esterni ad eccezione delle chiamate alle API di Anthropic e Bybit.
      </div>
    </div>
  )
}
