# ◈ Nexus Trade v3

AI-powered crypto trading dashboard con stile editorial Financial Times.

## Funzionalità

- **Dashboard** — Setup AI auto-aggiornati, news crypto live, ticker prezzi WebSocket
- **AI Guidata** — Percorso 5 step adattivo al livello utente, analisi chart con screenshot
- **Trade semi-automatico** — Apertura ordini su Bybit con SL/TP automatici
- **Journal** — Storico trade con statistiche win rate
- **Conversazioni** — Storico sessioni AI salvate
- **Impostazioni** — API key Anthropic e Bybit configurabili dall'app

## Stack

- React 18 + Vite + React Router
- Bybit V5 WebSocket (prezzi live) + REST API (ordini)
- Anthropic Claude API (analisi AI)
- SubtleCrypto Web API (firma HMAC Bybit, zero dipendenze)
- localStorage (persistenza locale)

## Setup locale

```bash
npm install
npm run dev
```

Apri http://localhost:5173 e configura le API key in **Impostazioni**.

## Deploy su Vercel

1. Pusha su GitHub
2. Importa il repo su [vercel.com](https://vercel.com)
3. Clicca **Deploy** — nessuna variabile d'ambiente richiesta
4. Apri l'app e configura le API key in **Impostazioni**

> Le API key vengono salvate esclusivamente nel localStorage del browser dell'utente.
> Nessun server intermedio, nessuna configurazione server-side.

## Configurazione API key (nell'app)

### Anthropic
- Vai su [console.anthropic.com](https://console.anthropic.com)
- Crea una API key
- Incollala in **Impostazioni → Anthropic**

### Bybit
- Vai su Bybit → API Management
- Crea chiave con permesso "Trade"
- Incolla chiave e secret in **Impostazioni → Bybit**
- Usa prima il **Testnet** per verificare

## Note di sicurezza

- Le API key sono salvate solo nel browser (localStorage)
- Per produzione considera un backend proxy per le chiavi Bybit
- Non esporre mai le chiavi in variabili d'ambiente pubbliche client-side
