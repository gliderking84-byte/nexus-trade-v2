import { useState, useEffect, useCallback } from 'react'

async function hmacSHA256(secret, message) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('')
}

async function fetchBalance(base, apiKey, apiSecret, accountType) {
  let ts
  try {
    const tr = await fetch(`${base}/v5/market/time`)
    const td = await tr.json()
    ts = td.result?.timeSecond
      ? (parseInt(td.result.timeSecond) * 1000).toString()
      : Date.now().toString()
  } catch { ts = Date.now().toString() }

  const recvWindow = '20000'
  const params = `accountType=${accountType}`
  const signStr = `${ts}${apiKey}${recvWindow}${params}`
  const sign = await hmacSHA256(apiSecret, signStr)

  const res = await fetch(`${base}/v5/account/wallet-balance?${params}`, {
    headers: {
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-SIGN': sign,
      'X-BAPI-TIMESTAMP': ts,
      'X-BAPI-RECV-WINDOW': recvWindow,
    }
  })
  return res.json()
}

function extractUsdt(data) {
  const list = data.result?.list?.[0]
  if (!list) return null
  const candidates = [
    list.totalAvailableBalance,
    list.totalWalletBalance,
    list.coin?.find(c => c.coin === 'USDT')?.availableToWithdraw,
    list.coin?.find(c => c.coin === 'USDT')?.walletBalance,
    list.coin?.find(c => c.coin === 'USDT')?.equity,
  ]
  for (const v of candidates) {
    const n = parseFloat(v)
    if (!isNaN(n) && n >= 0) return n.toFixed(2)
  }
  return null
}

export function useBalance(settings) {
  const [balance, setBalance] = useState(null)

  const fetch_ = useCallback(async () => {
    if (!settings?.hasBybitKeys) return
    const base = settings.settings.bybitTestnet
      ? 'https://api-testnet.bybit.com'
      : 'https://api.bybit.com'
    const apiKey    = settings.settings.bybitKey
    const apiSecret = settings.settings.bybitSecret

    // Try UNIFIED first, then CONTRACT
    for (const accountType of ['UNIFIED', 'CONTRACT']) {
      try {
        const data = await fetchBalance(base, apiKey, apiSecret, accountType)
        if (data.retCode === 0) {
          const usdt = extractUsdt(data)
          if (usdt !== null) { setBalance(usdt); return }
        }
      } catch {}
    }
  }, [settings?.hasBybitKeys, settings?.settings?.bybitKey, settings?.settings?.bybitTestnet])

  useEffect(() => {
    fetch_()
    const interval = setInterval(fetch_, 30000)
    return () => clearInterval(interval)
  }, [fetch_])

  return { balance, refresh: fetch_ }
}
