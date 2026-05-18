// ─── Formatting ───────────────────────────────────────────────────────────────
export const fmt = (n, d = 2) => `$${parseFloat(n || 0).toFixed(d)}`
export const fmtPct = (n) => `${parseFloat(n || 0).toFixed(2)}%`

// ─── Claude AI call ───────────────────────────────────────────────────────────
export async function callClaude({ apiKey, messages, system, imageB64 }) {
  const apiMessages = messages.map((m, i) => {
    if (m.role === 'user' && m.hasImage && imageB64 && i === messages.length - 1) {
      return {
        role: 'user',
        content: [
          { type:'image', source:{ type:'base64', media_type:'image/jpeg', data:imageB64 } },
          { type:'text', text: m.content || 'Analizza questo chart.' },
        ],
      }
    }
    return { role: m.role, content: m.content || '' }
  })

  const filtered = []
  for (const m of apiMessages) {
    if (filtered.length === 0 && m.role === 'assistant') continue
    if (filtered.length > 0 && filtered[filtered.length-1].role === m.role) continue
    if (!m.content || (typeof m.content === 'string' && !m.content.trim())) continue
    filtered.push(m)
  }
  if (filtered.length === 0) throw new Error('Nessun messaggio valido')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system,
      messages: filtered,
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.content?.map(c => c.text || '').join('') || ''
}

// ─── Setup parser ─────────────────────────────────────────────────────────────
export function parseSetupData(text) {
  const match = text.match(/\[SETUP_DATA:(\{.*?\})\]/s)
  if (!match) return null
  try { return JSON.parse(match[1]) } catch { return null }
}

export function cleanAIText(text) {
  return text
    .replace(/\[SETUP_READY\]/g, '')
    .replace(/\[SETUP_DATA:.*?\]/gs, '')
    .trim()
}

// ─── Bybit HMAC ───────────────────────────────────────────────────────────────
async function hmacSHA256(secret, message) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('')
}

// ─── Bybit synced timestamp ───────────────────────────────────────────────────
export async function getBybitTimestamp(base) {
  try {
    const r = await fetch(`${base}/v5/market/time`)
    const d = await r.json()
    return d.result?.timeSecond
      ? (parseInt(d.result.timeSecond) * 1000).toString()
      : Date.now().toString()
  } catch { return Date.now().toString() }
}

// ─── Bybit Place Order (Limit / Market / Conditional) ─────────────────────────
export async function bybitPlaceOrder({ apiKey, apiSecret, testnet, setup, orderType, triggerPrice, triggerBy, currentPrice, positionMode = 'one-way' }) {
  const base = testnet
    ? 'https://api-testnet.bybit.com'
    : 'https://api.bybit.com'

  const ts = await getBybitTimestamp(base)
  const recvWindow = '20000'
  const side = setup.direction === 'LONG' ? 'Buy' : 'Sell'

  // Use correct reference price for qty calculation per order type
  let refPrice
  if (orderType === 'Market') {
    // For market orders use current market price (passed in) or fetch it
    refPrice = parseFloat(currentPrice) || parseFloat(setup.entry)
    if (!refPrice || isNaN(refPrice)) {
      // Fetch mark price as last resort
      try {
        const r = await fetch(`${base}/v5/market/tickers?category=linear&symbol=${setup.ticker}`)
        const d = await r.json()
        refPrice = parseFloat(d.result?.list?.[0]?.lastPrice) || parseFloat(setup.entry)
      } catch { refPrice = parseFloat(setup.entry) }
    }
  } else if (orderType === 'Conditional') {
    refPrice = parseFloat(triggerPrice) || parseFloat(setup.entry)
  } else {
    refPrice = parseFloat(setup.entry)
  }

  if (!refPrice || isNaN(refPrice) || refPrice <= 0) throw new Error('Prezzo di riferimento non valido')

  const budget = parseFloat(setup.budget)
  const leverage = parseFloat(setup.leverage)
  if (!budget || !leverage || isNaN(budget) || isNaN(leverage)) throw new Error('Budget o leva non validi')

  const rawQty = (budget * leverage) / refPrice
  // Bybit requires minimum qty — round to reasonable decimals based on price
  const decimals = refPrice > 1000 ? 3 : refPrice > 100 ? 2 : refPrice > 10 ? 1 : 0
  const qty = rawQty.toFixed(decimals)

  if (parseFloat(qty) <= 0) throw new Error(`Quantità non valida: ${qty}. Aumenta budget o riduci la leva.`)

  // Build body based on order type
  const body = {
    category: 'linear',
    symbol: setup.ticker,
    side,
    qty,
    takeProfit: setup.tp1 ? String(setup.tp1) : undefined,
    stopLoss:   setup.sl  ? String(setup.sl)  : undefined,
    tpTriggerBy: 'LastPrice',
    slTriggerBy: 'LastPrice',
  }
  // positionIdx: 0=One-Way, 1=Hedge Buy, 2=Hedge Sell
  if (positionMode === 'hedge') {
    body.positionIdx = side === 'Buy' ? 1 : 2
  } else {
    body.positionIdx = 0
  }

  // positionIdx: 0 = One-Way Mode, 1 = Hedge Mode Buy/Long, 2 = Hedge Mode Sell/Short
  if (hedgeMode) {
    body.positionIdx = side === 'Buy' ? 1 : 2
  } else {
    body.positionIdx = 0
  }

  // Remove undefined keys
  Object.keys(body).forEach(k => body[k] === undefined && delete body[k])

  if (orderType === 'Market') {
    body.orderType = 'Market'
    body.timeInForce = 'IOC'
  } else if (orderType === 'Limit') {
    body.orderType = 'Limit'
    body.timeInForce = 'GTC'
    body.price = String(setup.entry)
  } else if (orderType === 'Conditional') {
    body.orderType = 'Market'
    body.timeInForce = 'IOC'
    body.orderFilter = 'StopOrder'
    const tpNum = parseFloat(triggerPrice || setup.entry)
    body.triggerPrice = String(tpNum)
    body.triggerBy = triggerBy || 'LastPrice'
    // triggerDirection: 1=Rising (trigger when price goes UP to level)
    //                   2=Falling (trigger when price goes DOWN to level)
    // Determined by comparing trigger vs current price — NOT by long/short
    body.triggerDirection = tpNum > refPrice ? 1 : 2
  }

  const bodyStr = JSON.stringify(body)
  const signStr = `${ts}${apiKey}${recvWindow}${bodyStr}`
  const sign = await hmacSHA256(apiSecret, signStr)

  const res = await fetch(`${base}/v5/order/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-SIGN': sign,
      'X-BAPI-TIMESTAMP': ts,
      'X-BAPI-RECV-WINDOW': recvWindow,
    },
    body: bodyStr,
  })
  const data = await res.json()
  if (data.retCode !== 0) throw new Error(data.retMsg || 'Bybit API error')
  return data
}


// ─── Bybit Cancel Order ───────────────────────────────────────────────────────
export async function bybitCancelOrder({ apiKey, apiSecret, testnet, ticker, orderId }) {
  const base = testnet
    ? 'https://api-testnet.bybit.com'
    : 'https://api.bybit.com'

  const ts = await getBybitTimestamp(base)
  const recvWindow = '20000'

  const body = {
    category: 'linear',
    symbol: ticker,
    orderId,
  }
  const bodyStr = JSON.stringify(body)
  const signStr = `${ts}${apiKey}${recvWindow}${bodyStr}`
  const sign = await hmacSHA256(apiSecret, signStr)

  const res = await fetch(`${base}/v5/order/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-SIGN': sign,
      'X-BAPI-TIMESTAMP': ts,
      'X-BAPI-RECV-WINDOW': recvWindow,
    },
    body: bodyStr,
  })
  const data = await res.json()
  if (data.retCode !== 0) throw new Error(data.retMsg || 'Bybit cancel error')
  return data
}

// ─── AI System prompts ────────────────────────────────────────────────────────
export const SYSTEM_DASHBOARD = `Sei NexusAI, analista tecnico esperto di crypto perpetual contracts su Bybit.
Rispondi SEMPRE in italiano. Sii conciso (max 4-5 righe), diretto e professionale.
Puoi analizzare chart, rispondere a domande sul mercato, spiegare concetti di trading.
Per analisi su immagini: identifica pattern, livelli Fibonacci, supporti/resistenze, MA, volume.
Se suggerisci un setup, indica: direzione, entry, SL, TP1, TP2, leva consigliata, R:R.`

export const SYSTEM_GUIDE = `Sei NexusAI, assistente esperto di trading crypto su Bybit.
Guida l'utente passo per passo verso l'apertura di un trade consapevole in 5 step.

STEP 1 - VALUTAZIONE LIVELLO:
Capisci il livello con 1-2 domande naturali. Deduci dalle risposte, non chiedere esplicitamente.

STEP 2 - ANALISI CHART:
Chiedi chart o screenshot. Analizza pattern, Fibonacci, supporti/resistenze, MA.
Per inesperti: spiega brevemente ogni concetto inline (max 2 righe).

STEP 3 - DEFINIZIONE SETUP:
Definisci: direzione (long/short), entry, stop loss, TP1, TP2.

STEP 4 - GESTIONE RISCHIO:
Chiedi budget e leva. Calcola esposizione, liquidation price, R:R. Avvisa se leva > 10x.

STEP 5 - RIEPILOGO:
Mostra riepilogo. Aggiungi ESATTAMENTE su righe separate:
[SETUP_READY]
[SETUP_DATA:{"ticker":"SOLUSDT","direction":"SHORT","entry":"100","sl":"115","tp1":"79","tp2":"68","budget":"50","leverage":"7","notes":"Double top weekly confermato"}]

STILE: tono caldo mai condiscendente, messaggi brevi (max 5 righe), emoji con parsimonia.
Rispondi SEMPRE in italiano.`
