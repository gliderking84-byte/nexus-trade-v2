import { useState, useEffect } from 'react'

const DEFAULTS = {
  anthropicKey:  '',
  bybitKey:      '',
  bybitSecret:   '',
  bybitTestnet:  true,
  positionMode:  'one-way',   // 'one-way' | 'hedge'
  defaultBudget:   '50',
  defaultLeverage: '7',
  currency:      'USD',       // 'USD' | 'EUR'
  eurUsdRate:    0.92,        // fallback rate
  defaultAssets: ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','AVAXUSDT','DOTUSDT','LINKUSDT','ADAUSDT','XRPUSDT','DOGEUSDT','MATICUSDT','ARBUSDT'],
}

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const s = localStorage.getItem('nexus_settings')
      return s ? { ...DEFAULTS, ...JSON.parse(s) } : DEFAULTS
    } catch { return DEFAULTS }
  })

  // Fetch live EUR/USD rate on mount
  useEffect(() => {
    fetch('https://api.frankfurter.app/latest?from=USD&to=EUR')
      .then(r => r.json())
      .then(d => { if (d.rates?.EUR) update({ eurUsdRate: d.rates.EUR }) })
      .catch(() => {})
  }, [])

  const update = (updates) => {
    const next = { ...settings, ...updates }
    setSettings(next)
    localStorage.setItem('nexus_settings', JSON.stringify(next))
  }

  const hasAnthropicKey = Boolean(settings.anthropicKey?.startsWith('sk-ant'))
  const hasBybitKeys    = Boolean(settings.bybitKey && settings.bybitSecret)

  // Currency formatter
  const fmtCurrency = (usdAmount) => {
    const n = parseFloat(usdAmount || 0)
    if (settings.currency === 'EUR') {
      return `€${(n * settings.eurUsdRate).toFixed(2)}`
    }
    return `$${n.toFixed(2)}`
  }

  return { settings, update, hasAnthropicKey, hasBybitKeys, fmtCurrency }
}
