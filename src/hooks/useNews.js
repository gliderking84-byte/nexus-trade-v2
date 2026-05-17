import { useState, useEffect } from 'react'

const FEEDS = [
  { name: 'CoinDesk',     url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
  { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss' },
  { name: 'CryptoSlate',  url: 'https://cryptoslate.com/feed/' },
  { name: 'Decrypt',      url: 'https://decrypt.co/feed' },
]

const CORS = 'https://api.rss2json.com/v1/api.json?rss_url='

function getSentiment(title = '') {
  const t = title.toLowerCase()
  const bull = ['surge','rally','soar','break','bull','rise','gain','pump','high','ath','record','recover','up']
  const bear = ['drop','fall','crash','bear','dump','low','decline','sink','plunge','fear','loss','down','weak']
  if (bull.some(w => t.includes(w))) return 'bull'
  if (bear.some(w => t.includes(w))) return 'bear'
  return 'neut'
}

const MOCK_NEWS = [
  { title: 'Bitcoin supera $63K: analisti puntano al breakout del canale discendente mensile', source: 'CoinDesk', time: '8 min fa', sentiment: 'bull' },
  { title: 'ETH/BTC ratio ai minimi da 2021: rotazione verso Bitcoin in corso sui mercati', source: 'CoinTelegraph', time: '22 min fa', sentiment: 'neut' },
  { title: 'Solana: $88 supporto critico — double top confermato, bear in controllo del prezzo', source: 'CryptoSlate', time: '41 min fa', sentiment: 'bear' },
  { title: 'Fed lascia tassi invariati: sentiment risk-on torna favorevole agli asset crypto', source: 'Decrypt', time: '1h fa', sentiment: 'bull' },
  { title: 'BNB consolida sopra $415: supporto weekly regge, possibile rimbalzo verso $450', source: 'CoinDesk', time: '1h 20m fa', sentiment: 'bull' },
  { title: 'AVAX forma doppio minimo su daily: volume crescente, segnale di inversione', source: 'CryptoSlate', time: '2h fa', sentiment: 'bull' },
]

export function useNews() {
  const [news, setNews] = useState(MOCK_NEWS)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchNews = async () => {
    setLoading(true)
    const items = []
    for (const feed of FEEDS) {
      try {
        const res = await fetch(`${CORS}${encodeURIComponent(feed.url)}`)
        const data = await res.json()
        if (data.items?.length) {
          data.items.slice(0, 3).forEach(item => {
            const pub = new Date(item.pubDate)
            const diffMs = Date.now() - pub.getTime()
            const diffMin = Math.round(diffMs / 60000)
            const time = diffMin < 60
              ? `${diffMin} min fa`
              : `${Math.round(diffMin / 60)}h fa`
            items.push({
              title: item.title,
              source: feed.name,
              time,
              sentiment: getSentiment(item.title),
              link: item.link,
            })
          })
        }
      } catch {}
    }
    if (items.length > 0) {
      items.sort(() => Math.random() - 0.5)
      setNews(items)
    }
    setLastUpdate(new Date())
    setLoading(false)
  }

  useEffect(() => {
    fetchNews()
    const interval = setInterval(fetchNews, 10 * 60 * 1000) // every 10 min
    return () => clearInterval(interval)
  }, [])

  return { news, loading, lastUpdate, refresh: fetchNews }
}
