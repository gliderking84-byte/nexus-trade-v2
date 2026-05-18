import { useState } from 'react'

const store = {
  get: (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null } catch { return null } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
}

export function useJournal() {
  const [trades, setTrades] = useState(() => store.get('nexus_trades') || [])

  const save = (t) => { setTrades(t); store.set('nexus_trades', t) }

  const addTrade = (setup, convId) => {
    // setup may include orderId from Bybit response
    const e = parseFloat(setup.entry), s = parseFloat(setup.sl),
      t1 = parseFloat(setup.tp1), t2 = parseFloat(setup.tp2),
      b = parseFloat(setup.budget), lev = parseFloat(setup.leverage)
    const exposure = b * lev
    const qty = exposure / e
    const liqPrice = setup.direction === 'LONG'
      ? e * (1 - 1 / lev + 0.004)
      : e * (1 + 1 / lev - 0.004)
    const loss = Math.abs(e - s) / e * exposure
    const profitTP1 = Math.abs(t1 - e) / e * exposure
    const profitTP2 = t2 ? Math.abs(t2 - e) / e * exposure : null
    const rr1 = profitTP1 / loss
    save([...trades, {
      ...setup, id: Date.now(), convId, orderId: setup.orderId || null,
      date: new Date().toLocaleDateString('it-IT'),
      status: 'Aperta',
      exposure, qty, liqPrice, loss, profitTP1, profitTP2, rr1,
    }])
  }

  const updateTrade = (id, updates) => save(trades.map(t => t.id === id ? { ...t, ...updates } : t))
  const deleteTrade = (id) => save(trades.filter(t => t.id !== id))

  const stats = {
    total: trades.length,
    open: trades.filter(t => t.status === 'Aperta').length,
    wins: trades.filter(t => t.status === 'TP2 ✅' || t.status === 'TP1 ✅').length,
    losses: trades.filter(t => t.status === 'SL ❌').length,
  }
  stats.winRate = (stats.wins + stats.losses) > 0
    ? Math.round(stats.wins / (stats.wins + stats.losses) * 100)
    : null

  return { trades, addTrade, updateTrade, deleteTrade, stats }
}
