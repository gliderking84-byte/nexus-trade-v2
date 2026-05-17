import { useState, useEffect, useRef } from 'react'

const DEFAULT_PRICES = {
  BTCUSDT:  { price: 63420, change: 2.1 },
  ETHUSDT:  { price: 3180,  change: 1.4 },
  SOLUSDT:  { price: 88.20, change: -2.6 },
  BNBUSDT:  { price: 418.5, change: 0.8 },
  AVAXUSDT: { price: 34.20, change: -1.2 },
  DOTUSDT:  { price: 7.85,  change: 0.1 },
  LINKUSDT: { price: 14.20, change: 1.8 },
}

export function usePrices(symbols = Object.keys(DEFAULT_PRICES)) {
  const [prices, setPrices] = useState(DEFAULT_PRICES)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)
  const prevRef = useRef({})

  useEffect(() => {
    let ws
    let reconnectTimer

    const connect = () => {
      try {
        ws = new WebSocket('wss://stream.bybit.com/v5/public/linear')
        wsRef.current = ws

        ws.onopen = () => {
          setConnected(true)
          ws.send(JSON.stringify({
            op: 'subscribe',
            args: symbols.map(s => `tickers.${s}`)
          }))
        }

        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data)
            if (data.topic?.startsWith('tickers.') && data.data) {
              const sym = data.data.symbol
              const price = parseFloat(data.data.lastPrice)
              const prev24 = parseFloat(data.data.prevPrice24h)
              const change = prev24 ? ((price - prev24) / prev24) * 100 : 0
              if (sym && price) {
                setPrices(p => ({ ...p, [sym]: { price, change } }))
              }
            }
          } catch {}
        }

        ws.onerror = () => setConnected(false)
        ws.onclose = () => {
          setConnected(false)
          reconnectTimer = setTimeout(connect, 5000)
        }
      } catch {
        reconnectTimer = setTimeout(connect, 5000)
      }
    }

    connect()
    return () => {
      clearTimeout(reconnectTimer)
      if (ws) ws.close()
    }
  }, [symbols.join(',')])

  return { prices, connected }
}
