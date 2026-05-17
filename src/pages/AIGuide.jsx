import { useState, useEffect, useRef, useCallback } from 'react'
import { callClaude, parseSetupData, cleanAIText, SYSTEM_GUIDE, fmt } from '../utils/index.js'
import SetupBanner from '../components/SetupBanner.jsx'

const STEPS = [
  { n:1, label:'Valutazione',    icon:'👤' },
  { n:2, label:'Analisi Chart',  icon:'📊' },
  { n:3, label:'Definizione',    icon:'🎯' },
  { n:4, label:'Rischio',        icon:'⚖️' },
  { n:5, label:'Riepilogo',      icon:'✅' },
]

function detectStep(text) {
  const t = text.toLowerCase()
  if (t.includes('setup_ready') || t.includes('setup_data')) return 5
  if (t.includes('budget') || t.includes('leva') || t.includes('esposizione') || t.includes('liquidazione')) return 4
  if (t.includes('entry') || t.includes('stop loss') || t.includes('take profit') || t.includes('long') || t.includes('short')) return 3
  if (t.includes('chart') || t.includes('grafico') || t.includes('fibonacci') || t.includes('pattern') || t.includes('resistenza')) return 2
  return 1
}

export default function AIGuide({ settings, journal, onSendBybit }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [image, setImage] = useState(null)
  const [imageB64, setImageB64] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [pendingSetup, setPendingSetup] = useState(null)
  const [convSaved, setConvSaved] = useState(false)
  const fileRef = useRef()
  const bottomRef = useRef()
  const textareaRef = useRef()

  useEffect(() => {
    setTimeout(() => {
      setMessages([{
        role:'assistant',
        content:'Ciao! Sono NexusAI, il tuo assistente per il trading crypto. 👋\n\nSono qui per guidarti passo per passo — dall\'analisi del grafico fino all\'apertura della posizione su Bybit.\n\nPer iniziare: su quale crypto o mercato stai pensando di operare oggi?',
      }])
    }, 300)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages, loading])

  const handleImageFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    setImage(URL.createObjectURL(file))
    const reader = new FileReader()
    reader.onload = () => setImageB64(reader.result.split(',')[1])
    reader.readAsDataURL(file)
  }, [])

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) { e.preventDefault(); handleImageFile(item.getAsFile()); return }
    }
  }, [handleImageFile])

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false)
    handleImageFile(e.dataTransfer.files?.[0])
  }, [handleImageFile])

  const send = useCallback(async () => {
    if (!input.trim() && !imageB64) return
    if (!settings.hasAnthropicKey) return

    const userMsg = { role:'user', content: input, hasImage: !!imageB64, image }
    const currentInput = input, currentB64 = imageB64
    setMessages(m => [...m, userMsg])
    setInput(''); setImage(null); setImageB64(null)
    setLoading(true)

    // Build history for API (skip first assistant greeting)
    const history = [...messages.slice(1), userMsg].map(m => ({
      role: m.role,
      content: m.role === 'assistant' ? cleanAIText(m.rawText || m.content) : m.content,
      hasImage: m.hasImage && m === userMsg,
    }))

    try {
      const text = await callClaude({
        apiKey: settings.settings.anthropicKey,
        system: SYSTEM_GUIDE,
        messages: history,
        imageB64: currentB64,
      })

      const setup = parseSetupData(text)
      if (setup) setPendingSetup(setup)

      const displayText = cleanAIText(text)
      setMessages(m => [...m, { role:'assistant', content:displayText, rawText:text }])
      setStep(detectStep(text))
    } catch (err) {
      setMessages(m => [...m, { role:'assistant', content:`⚠️ ${err.message || 'Errore di connessione'}` }])
    }
    setLoading(false)
  }, [input, imageB64, image, messages, settings])

  const saveConversation = () => {
    const convs = JSON.parse(localStorage.getItem('nexus_conversations') || '[]')
    const ticker = pendingSetup?.ticker || 'CRYPTO'
    convs.push({
      id: Date.now(),
      date: new Date().toLocaleDateString('it-IT'),
      time: new Date().toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' }),
      ticker,
      messages: messages.map(m => ({ role:m.role, content:m.content })),
      setupSaved: !!pendingSetup,
    })
    localStorage.setItem('nexus_conversations', JSON.stringify(convs))
    setConvSaved(true)
  }

  const startNew = () => {
    setMessages([{
      role:'assistant',
      content:'Pronto per una nuova analisi! Su quale crypto vuoi operare?',
    }])
    setStep(1); setPendingSetup(null); setConvSaved(false)
    setImage(null); setImageB64(null)
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflowX:'hidden', maxWidth:'100%' }} onPaste={handlePaste}>

      {/* Progress header */}
      <div style={{ padding:'14px 20px 10px', borderBottom:'1px solid var(--rule)', background:'var(--paper2)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:6,
            background:'var(--ink)', color:'#f5f1ea',
            fontFamily:'var(--font-display)', fontSize:9, fontWeight:700,
            padding:'4px 12px', borderRadius:3, letterSpacing:.8, textTransform:'uppercase',
          }}>
            <span>{STEPS[step-1]?.icon}</span>
            Step {step} — {STEPS[step-1]?.label}
          </div>
          <div style={{ display:'flex', gap:7, alignItems:'center' }}>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--ink5)' }}>{step}/{STEPS.length}</span>
            {messages.length > 2 && (
              <button className="btn btn-ghost" style={{ fontSize:10, padding:'5px 11px' }} onClick={saveConversation} disabled={convSaved}>
                {convSaved ? '✓ Salvata' : '💬 Salva chat'}
              </button>
            )}
            <button className="btn btn-ghost" style={{ fontSize:10, padding:'5px 11px' }} onClick={startNew}>
              ↺ Nuova analisi
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ height:2, background:'var(--rule)', borderRadius:0, overflow:'hidden', marginBottom:6 }}>
          <div style={{ height:'100%', background:'var(--ink)', transition:'width .5s ease', width:`${progress}%` }} />
        </div>
        {/* Step dots */}
        <div style={{ display:'flex', gap:5 }}>
          {STEPS.map(s => (
            <div key={s.n} style={{ flex:1, height:2, borderRadius:1, background: s.n <= step ? 'var(--ink)' : 'var(--rule)', transition:'background .4s' }} />
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'18px 20px', display:'flex', flexDirection:'column', gap:12 }}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(26,22,16,.08)', border:'2px dashed var(--ink)', pointerEvents:'none' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, color:'var(--ink)', letterSpacing:1 }}>📸 Rilascia lo screenshot</div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap:8, animation:'fade-up .3s ease forwards' }}>
            {m.role === 'assistant' && (
              <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0, marginTop:2, color:'#f5f1ea' }}>◈</div>
            )}
            <div style={{
              maxWidth:'80%', padding:'11px 14px', fontSize:13, lineHeight:1.65,
              color: m.role === 'user' ? '#f5f1ea' : 'var(--ink2)',
              background: m.role === 'user' ? 'var(--ink)' : 'var(--paper2)',
              border: m.role === 'user' ? 'none' : '1px solid var(--rule)',
              borderLeft: m.role === 'assistant' ? '3px solid var(--ink)' : undefined,
              borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              whiteSpace:'pre-wrap',
            }}>
              {m.image && <img src={m.image} alt="" style={{ maxWidth:'100%', borderRadius:8, marginBottom:8, display:'block' }} />}
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--ink)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'#f5f1ea' }}>◈</div>
            <div style={{ background:'var(--paper2)', border:'1px solid var(--rule)', borderLeft:'3px solid var(--ink)', borderRadius:'14px 14px 14px 4px', padding:'12px 16px', display:'flex', gap:5 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--ink3)', animation:'pulse-live 1.2s ease-in-out infinite', animationDelay:`${i*.2}s` }} />
              ))}
            </div>
          </div>
        )}

        {pendingSetup && (
          <SetupBanner
            setup={pendingSetup}
            onSave={() => { journal.addTrade(pendingSetup); saveConversation() }}
            onSendBybit={() => onSendBybit?.(pendingSetup)}
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding:'12px 20px 16px', borderTop:'2px solid var(--ink)', background:'var(--paper2)', flexShrink:0 }}>
        {image && (
          <div style={{ position:'relative', display:'inline-block', marginBottom:8 }}>
            <img src={image} alt="" style={{ height:52, borderRadius:7, border:'1px solid var(--rule)' }} />
            <button onClick={() => { setImage(null); setImageB64(null) }} style={{ position:'absolute', top:-6, right:-6, width:18, height:18, background:'var(--red)', border:'none', borderRadius:'50%', color:'#fff', fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>
        )}

        {!settings.hasAnthropicKey && (
          <div style={{ background:'#fdf5e0', border:'1px solid rgba(160,112,32,.2)', borderRadius:7, padding:'8px 12px', fontSize:11, color:'var(--amber)', marginBottom:8 }}>
            ⚠️ Configura la API key Anthropic nelle <strong>Impostazioni</strong> per usare la chat AI.
          </div>
        )}

        <input type="file" accept="image/*" ref={fileRef} style={{ display:'none' }} onChange={e => handleImageFile(e.target.files?.[0])} />
        <div style={{ display:'flex', gap:7, alignItems:'flex-end' }}>
          <button onClick={() => fileRef.current?.click()} className="btn btn-ghost" style={{ padding:'9px 11px', flexShrink:0, fontSize:16 }} title="Carica screenshot">📸</button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Scrivi un messaggio… o incolla uno screenshot con Ctrl+V"
            rows={1}
            style={{ flex:1, background:'var(--paper)', border:'1.5px solid var(--rule)', borderRadius:9, color:'var(--ink)', padding:'10px 13px', fontSize:13, outline:'none', resize:'none', lineHeight:1.5, fontFamily:'var(--font-body)', transition:'border-color .2s' }}
            onFocus={e => e.target.style.borderColor = 'var(--ink)'}
            onBlur={e => e.target.style.borderColor = 'var(--rule)'}
          />
          <button onClick={send} disabled={loading || !settings.hasAnthropicKey || (!input.trim() && !imageB64)} className="btn btn-ink" style={{ flexShrink:0, padding:'10px 16px', opacity: loading ? .5 : 1 }}>
            Invia ↑
          </button>
        </div>
        <div style={{ marginTop:6, fontSize:10, color:'var(--ink5)', textAlign:'center' }}>
          📸 pulsante · Ctrl+V incolla screenshot · Invio per inviare
        </div>
      </div>
    </div>
  )
}
