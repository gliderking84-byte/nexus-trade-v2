import { useState } from 'react'

function Toggle({ value, onChange, labelOn, labelOff, colorOn = 'var(--green)', colorOff = 'var(--bg4)' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <span style={{ fontSize:12, color: value ? colorOn : 'var(--t4)', fontWeight:600, minWidth:80 }}>
        {value ? labelOn : labelOff}
      </span>
      <button onClick={() => onChange(!value)} style={{
        width:44, height:24, borderRadius:12, border:'none', cursor:'pointer',
        background: value ? colorOn : 'var(--bg4)',
        position:'relative', transition:'background .2s', flexShrink:0,
        boxShadow: value ? `0 0 8px ${colorOn}40` : 'none',
      }}>
        <div style={{
          width:18, height:18, borderRadius:'50%', background:'#fff',
          position:'absolute', top:3, transition:'left .2s',
          left: value ? 23 : 3, boxShadow:'0 1px 3px rgba(0,0,0,.3)',
        }} />
      </button>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, hint, dark = true }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ marginBottom:16 }}>
      <label className={dark ? 'field-label-dark' : 'field-label'}>{label}</label>
      <div style={{ position:'relative' }}>
        <input
          className={dark ? 'input-dark' : 'input'}
          type={type === 'password' && !show ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ paddingRight: type === 'password' ? 44 : 14 }}
        />
        {type === 'password' && (
          <button onClick={() => setShow(!show)} style={{
            position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
            background:'none', border:'none', color:'var(--t4)', cursor:'pointer', fontSize:14,
          }}>{show ? '🙈' : '👁'}</button>
        )}
      </div>
      {hint && <div style={{ fontSize:11, color:'var(--t4)', marginTop:5, lineHeight:1.5 }}>{hint}</div>}
    </div>
  )
}

function Section({ title, icon, children, accentColor }) {
  return (
    <div style={{
      background:'var(--bg2)', border:'1px solid var(--border)',
      borderRadius:12, padding:'20px', marginBottom:14,
      borderLeft: accentColor ? `3px solid ${accentColor}` : '3px solid transparent',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
        <span style={{ fontSize:16 }}>{icon}</span>
        <span style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:800, color:'var(--t1)' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function StatusBadge({ ok, labelOk, labelNo }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color: ok ? 'var(--green)' : 'var(--t4)' }}>
      <span>{ok ? '✅' : '⚪'}</span>
      {ok ? labelOk : labelNo}
    </div>
  )
}

export default function Settings({ settings }) {
  const { settings: s, update } = settings
  const [saved, setSaved] = useState(false)
  const [saveTimer, setSaveTimer] = useState(null)

  const handleUpdate = (updates) => {
    update(updates)
    if (saveTimer) clearTimeout(saveTimer)
    setSaved(true)
    const t = setTimeout(() => setSaved(false), 2000)
    setSaveTimer(t)
  }

  return (
    <div style={{ padding:'20px 16px', maxWidth:680, margin:'0 auto', overflowX:'hidden' }}>
      {/* Header */}
      <div style={{ marginBottom:22 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, color:'var(--t1)', marginBottom:4 }}>Impostazioni</div>
        <div style={{ fontSize:13, color:'var(--t3)' }}>
          Configura API key, modalità di trading e preferenze display.
          {saved && <span style={{ marginLeft:10, color:'var(--green)', fontWeight:600 }}>✓ Salvato</span>}
        </div>
      </div>

      {/* ── Anthropic ─────────────────────────────────────────────────── */}
      <Section title="NexusAI — Anthropic" icon="◈" accentColor="var(--cyan)">
        <div style={{ background:'rgba(0,212,255,.06)', border:'1px solid rgba(0,212,255,.12)', borderRadius:8, padding:'10px 13px', marginBottom:16, fontSize:12, color:'var(--t3)', lineHeight:1.5 }}>
          La API key Anthropic abilita analisi AI dei chart, chat guidata e generazione setup.
          Ottienila su <a href="https://console.anthropic.com" target="_blank" style={{ color:'var(--cyan)' }}>console.anthropic.com</a>
        </div>
        <Field label="API Key Anthropic" value={s.anthropicKey} onChange={v => handleUpdate({ anthropicKey: v })}
          type="password" placeholder="sk-ant-api03-..." hint="Salvata solo nel tuo browser (localStorage)." />
        <StatusBadge ok={settings.hasAnthropicKey} labelOk="NexusAI attivo" labelNo="API key non configurata" />
      </Section>

      {/* ── Bybit ─────────────────────────────────────────────────────── */}
      <Section title="Bybit — Trading API" icon="⚡" accentColor="var(--amber)">
        <div style={{ background:'rgba(240,192,64,.06)', border:'1px solid rgba(240,192,64,.12)', borderRadius:8, padding:'10px 13px', marginBottom:16, fontSize:12, color:'var(--t3)', lineHeight:1.5 }}>
          Chiavi con permesso "Trade" su <a href="https://www.bybit.com/app/user/api-management" target="_blank" style={{ color:'var(--amber)' }}>Bybit API Management</a>.
          Usa prima il Testnet.
        </div>

        <Field label="API Key" value={s.bybitKey} onChange={v => handleUpdate({ bybitKey: v })} type="password" placeholder="Bybit API key" />
        <Field label="API Secret" value={s.bybitSecret} onChange={v => handleUpdate({ bybitSecret: v })} type="password" placeholder="Bybit API secret" />

        {/* Testnet toggle */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:'var(--bg3)', borderRadius:9, marginBottom:12 }}>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, color:'var(--t2)' }}>Modalità Testnet</div>
            <div style={{ fontSize:11, color:'var(--t4)', marginTop:2 }}>Ordini simulati, nessun rischio reale</div>
          </div>
          <Toggle value={s.bybitTestnet} onChange={v => handleUpdate({ bybitTestnet: v })}
            labelOn="Testnet" labelOff="Live ⚠️"
            colorOn="var(--green)" colorOff="var(--red)" />
        </div>

        {/* Hedge Mode toggle */}
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'flex-start',
          padding:'12px 14px', background:'var(--bg3)', borderRadius:9, marginBottom:12,
          border: s.bybitHedgeMode ? '1px solid rgba(0,212,255,.2)' : '1px solid transparent',
        }}>
          <div style={{ flex:1, marginRight:16 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, color:'var(--t2)' }}>
              Position Mode
            </div>
            <div style={{ fontSize:11, color:'var(--t4)', marginTop:3, lineHeight:1.5 }}>
              {s.bybitHedgeMode
                ? '🔀 Hedge Mode — puoi tenere Long e Short contemporaneamente (positionIdx: 1/2)'
                : '→ One-Way Mode — una posizione per asset alla volta (positionIdx: 0)'}
            </div>
            {s.bybitHedgeMode && (
              <div style={{ fontSize:10, color:'var(--cyan)', marginTop:5, padding:'5px 9px', background:'rgba(0,212,255,.06)', borderRadius:6, lineHeight:1.4 }}>
                ℹ️ Attiva Hedge Mode su Bybit in: Account → Preferenze → Position Mode → Hedge Mode
              </div>
            )}
          </div>
          <Toggle
            value={s.bybitHedgeMode}
            onChange={v => handleUpdate({ bybitHedgeMode: v })}
            labelOn="Hedge" labelOff="One-Way"
            colorOn="var(--cyan)" colorOff="var(--bg4)"
          />
        </div>

        {!s.bybitTestnet && (
          <div style={{ background:'rgba(255,68,102,.08)', border:'1px solid rgba(255,68,102,.2)', borderRadius:8, padding:'10px 13px', marginBottom:12, fontSize:12, color:'var(--red)', lineHeight:1.5 }}>
            ⚠️ <strong>Modalità Live attiva.</strong> Gli ordini verranno eseguiti su Bybit reale.
          </div>
        )}

        <StatusBadge
          ok={settings.hasBybitKeys}
          labelOk={`Bybit configurato · ${s.bybitTestnet ? 'Testnet' : 'Live'} · ${s.bybitHedgeMode ? 'Hedge Mode' : 'One-Way Mode'}`}
          labelNo="API key non configurata"
        />
      </Section>

      {/* ── Display & Currency ─────────────────────────────────────────── */}
      <Section title="Display & Valuta" icon="💱" accentColor="var(--purple)">

        {/* Currency selector */}
        <div style={{ marginBottom:16 }}>
          <label className="field-label-dark">Valuta di visualizzazione</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              { id:'USD', label:'🇺🇸 USD — Dollaro', sub:'Prezzi in $', color:'var(--cyan)' },
              { id:'EUR', label:'🇪🇺 EUR — Euro',    sub:'Conversione live', color:'var(--purple)' },
            ].map(opt => (
              <button key={opt.id} onClick={() => handleUpdate({ currency: opt.id })} style={{
                padding:'12px 14px', borderRadius:9, border:`1.5px solid ${s.currency === opt.id ? opt.color : 'var(--border)'}`,
                background: s.currency === opt.id ? `rgba(${opt.id === 'USD' ? '0,212,255' : '167,139,250'},.08)` : 'var(--bg3)',
                cursor:'pointer', textAlign:'left', transition:'all .15s',
              }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, color: s.currency === opt.id ? opt.color : 'var(--t2)', marginBottom:3 }}>
                  {opt.label}
                </div>
                <div style={{ fontSize:10, color:'var(--t4)' }}>{opt.sub}</div>
              </button>
            ))}
          </div>
          {s.currency === 'EUR' && (
            <div style={{ fontSize:10, color:'var(--t4)', marginTop:8, padding:'6px 10px', background:'var(--bg3)', borderRadius:7, lineHeight:1.5 }}>
              💱 Tasso EUR/USD aggiornato ogni ora via exchangerate-api.com · I prezzi crypto rimangono in USD su Bybit
            </div>
          )}
        </div>
      </Section>

      {/* ── Trading defaults ───────────────────────────────────────────── */}
      <Section title="Preferenze Trading" icon="📐" accentColor="var(--green)">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label className="field-label-dark">Budget default ($)</label>
            <input className="input-dark" type="number" value={s.defaultBudget}
              onChange={e => handleUpdate({ defaultBudget: e.target.value })} placeholder="50" />
          </div>
          <div>
            <label className="field-label-dark">Leva default (x)</label>
            <input className="input-dark" type="number" value={s.defaultLeverage}
              onChange={e => handleUpdate({ defaultLeverage: e.target.value })} placeholder="7" min="1" max="25" />
          </div>
        </div>
        <div style={{ marginTop:8, fontSize:11, color:'var(--t4)', lineHeight:1.4 }}>
          Usati come valori predefiniti nel pannello Bybit e nella guida AI.
        </div>
      </Section>

      {/* ── Data management ────────────────────────────────────────────── */}
      <Section title="Gestione Dati" icon="🗃">
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--t2)' }}>Esporta dati</div>
              <div style={{ fontSize:11, color:'var(--t4)', marginTop:2 }}>Journal e conversazioni in JSON</div>
            </div>
            <button className="btn btn-ghost" style={{ fontSize:11, padding:'7px 14px' }} onClick={() => {
              const data = {
                trades: JSON.parse(localStorage.getItem('nexus_trades') || '[]'),
                conversations: JSON.parse(localStorage.getItem('nexus_conversations') || '[]'),
                exported: new Date().toISOString(),
              }
              const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href=url; a.download='nexus-export.json'; a.click()
            }}>↓ Esporta</button>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--red)' }}>Cancella tutti i dati</div>
              <div style={{ fontSize:11, color:'var(--t4)', marginTop:2 }}>Rimuove journal, chat e impostazioni</div>
            </div>
            <button className="btn btn-danger" style={{ fontSize:11, padding:'7px 14px' }}
              onClick={() => { if (confirm('Eliminare tutti i dati?')) { localStorage.clear(); window.location.reload() } }}>
              🗑 Cancella
            </button>
          </div>
        </div>
      </Section>

      <div style={{ textAlign:'center', fontSize:11, color:'var(--t4)', lineHeight:1.6, paddingBottom:20 }}>
        Nexus Trade v3.0 · API key salvate solo nel browser locale<br/>
        Nessun dato trasmesso a server esterni oltre Anthropic e Bybit
      </div>
    </div>
  )
}
