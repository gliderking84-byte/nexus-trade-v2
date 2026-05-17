import { useState, useEffect } from 'react'

const DEFAULTS = {
  anthropicKey: '',
  bybitKey: '',
  bybitSecret: '',
  bybitTestnet: true,
  defaultBudget: '50',
  defaultLeverage: '7',
  defaultAssets: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'AVAXUSDT'],
}

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const s = localStorage.getItem('nexus_settings')
      return s ? { ...DEFAULTS, ...JSON.parse(s) } : DEFAULTS
    } catch { return DEFAULTS }
  })

  const update = (updates) => {
    const next = { ...settings, ...updates }
    setSettings(next)
    localStorage.setItem('nexus_settings', JSON.stringify(next))
  }

  const hasAnthropicKey = Boolean(settings.anthropicKey?.startsWith('sk-ant'))
  const hasBybitKeys    = Boolean(settings.bybitKey && settings.bybitSecret)

  return { settings, update, hasAnthropicKey, hasBybitKeys }
}
