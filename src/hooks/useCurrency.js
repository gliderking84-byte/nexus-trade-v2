import { useState, useEffect } from 'react'

const FALLBACK_RATE = 0.92 // EUR/USD fallback

export function useCurrency(currency = 'USD') {
  const [eurRate, setEurRate] = useState(FALLBACK_RATE)

  useEffect(() => {
    if (currency !== 'EUR') return
    const fetchRate = async () => {
      try {
        // Free public API, no key needed
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
        const data = await res.json()
        if (data.rates?.EUR) setEurRate(data.rates.EUR)
      } catch {
        // Keep fallback
      }
    }
    fetchRate()
    const interval = setInterval(fetchRate, 60 * 60 * 1000) // refresh hourly
    return () => clearInterval(interval)
  }, [currency])

  const convert = (usdAmount) => {
    if (currency === 'EUR') return parseFloat(usdAmount || 0) * eurRate
    return parseFloat(usdAmount || 0)
  }

  const format = (usdAmount, decimals = 2) => {
    const amount = convert(usdAmount)
    if (currency === 'EUR') return `€${amount.toFixed(decimals)}`
    return `$${amount.toFixed(decimals)}`
  }

  const symbol = currency === 'EUR' ? '€' : '$'
  const rate = currency === 'EUR' ? eurRate : 1

  return { convert, format, symbol, rate, eurRate }
}
