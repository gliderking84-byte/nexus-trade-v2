import { useState, useEffect, useCallback } from 'react'

async function hmacSHA256(secret, message) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,'0')).join('')
}

export function useBalance(settings) {
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetch_ = useCallback(async () => {
    if (!settings?.hasBybitKeys) return
    setLoading(true)
    try {
      const base = settings.settings.bybitTestnet
        ? 'https://api-testnet.bybit.com'
        : 'https://api.bybit.com'

      // Sync timestamp
      let ts
      try {
        const tr = await fetch(`${base}/v5/market/time`)
        const td = await tr.json()
        ts = td.result?.timeSecond
          ? (parseInt(td.result.timeSecond) * 1000).toString()
          : Date.now().toString()
      } catch { ts = Date.now().toString() }

      const apiKey = settings.settings.bybitKey
      const apiSecret = settings.settings.bybitSecret
      const recvWindow = '20000'
      const params = 'accountType=UNIFIED'
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
      const data = await res.json()
      if (data.retCode === 0) {
        const list = data.result?.list?.[0]
        const usdt = list?.totalAvailableBalance || list?.coin?.find(c => c.coin === 'USDT')?.availableToWithdraw
        if (usdt !== undefined) setBalance(parseFloat(usdt).toFixed(2))
      }
    } catch (e) { console.error('Balance fetch error:', e) }
    setLoading(false)
  }, [settings?.hasBybitKeys, settings?.settings?.bybitKey])

  useEffect(() => {
    fetch_()
    const interval = setInterval(fetch_, 30000) // refresh ogni 30s
    return () => clearInterval(interval)
  }, [fetch_])

  return { balance, loading, refresh: fetch_ }
}
