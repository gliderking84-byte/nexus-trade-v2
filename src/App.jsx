import { Routes, Route, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AIGuide from './pages/AIGuide.jsx'
import Journal from './pages/Journal.jsx'
import Conversations from './pages/Conversations.jsx'
import Settings from './pages/Settings.jsx'
import { useSettings } from './hooks/useSettings.js'
import { useJournal } from './hooks/useJournal.js'

export default function App() {
  const settings = useSettings()
  const journal = useJournal()
  const navigate = useNavigate()
  const [pendingBybitSetup, setPendingBybitSetup] = useState(null)

  const handleSendBybit = (setup) => {
    setPendingBybitSetup(setup)
    navigate('/')
  }

  return (
    <Layout stats={journal.stats} settings={settings}>
      <Routes>
        <Route path="/" element={
          <Dashboard
            settings={settings}
            journal={journal}
            pendingSetup={pendingBybitSetup}
            onSelectSetup={setPendingBybitSetup}
          />
        } />
        <Route path="/ai" element={
          <AIGuide
            settings={settings}
            journal={journal}
            onSendBybit={handleSendBybit}
          />
        } />
        <Route path="/journal" element={<Journal journal={journal} settings={settings} />} />
        <Route path="/conversations" element={<Conversations />} />
        <Route path="/settings" element={<Settings settings={settings} />} />
      </Routes>
    </Layout>
  )
}
