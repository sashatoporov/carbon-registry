import React from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import Discover from './pages/Discover'
import Explore from './pages/Explore'
import Map from './pages/Map'
import DataPage from './pages/Data'
import { CarbonAI } from './components/CarbonAI'

function App() {
  return (
    <HashRouter>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Discover />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/map" element={<Map />} />
            <Route path="/data" element={<DataPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <CarbonAI />
      </div>
    </HashRouter>
  )
}

export default App
