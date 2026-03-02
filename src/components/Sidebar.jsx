import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Compass, Search, Leaf, Zap, TrendingUp, Globe, Layers, Map as MapIcon, BarChart3 } from 'lucide-react'

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  const mainNav = [
    { path: '/', label: 'Discover', icon: Compass },
    { path: '/explore', label: 'Explore', icon: Search },
    { path: '/map', label: 'Map', icon: MapIcon },
    { path: '/data', label: 'Data', icon: BarChart3 },
  ]

  const collections = [
    { label: 'Nature-Based', icon: Leaf, sectionId: 'section-nature' },
    { label: 'Tech Removals', icon: Zap, sectionId: 'section-tech' },
    { label: 'High Volume', icon: TrendingUp, sectionId: 'section-top' },
    { label: 'Renewables', icon: Globe, sectionId: 'section-renewables' },
  ]

  const scrollToSection = (sectionId) => {
    // Navigate to discover page first if not already there
    if (location.pathname !== '/') {
      navigate('/')
      // Wait for navigation then scroll
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const linkStyle = (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '9px 20px',
    fontSize: '0.875rem',
    fontWeight: active ? 700 : 500,
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    background: active ? 'var(--bg-inset)' : 'transparent',
    textDecoration: 'none',
    borderLeft: active ? '3px solid var(--accent-warm)' : '3px solid transparent',
    transition: 'all 0.15s ease',
  })

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand" style={{ padding: '0 20px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28,
          background: 'var(--bg-inverted)',
          color: 'var(--text-inverted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 6,
        }}>
          <Layers size={14} strokeWidth={2.5} />
        </div>
        <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>
          Carbon Explorer
        </span>
      </div>

      {/* Main nav */}
      <nav style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        marginBottom: 28,
        width: '100%'
      }}>
        {mainNav.map(item => (
          <Link key={item.path} to={item.path} style={linkStyle(location.pathname === item.path)}>
            <item.icon size={18} />
            <span className="nav-label" style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Collections header */}
      <div className="sidebar-collections" style={{ padding: '0 20px', marginBottom: 8 }}>
        <span style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--text-tertiary)',
        }}>
          Collections
        </span>
      </div>

      {/* Collection items — scroll to Discover sections */}
      <nav className="sidebar-collections" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {collections.map(col => (
          <div
            key={col.label}
            onClick={() => scrollToSection(col.sectionId)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 20px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              borderLeft: '3px solid transparent',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.background = 'var(--bg-inset)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-secondary)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <col.icon size={16} />
            {col.label}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontFamily: "'IBM Plex Mono', monospace", marginBottom: 8 }}>
          v1.0 · Carbon Explorer
        </div>
        <a
          href="https://gspp.berkeley.edu/berkeley-carbon-trading-project/offsets-database"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.65rem',
            color: 'var(--accent-warm)',
            textDecoration: 'underline',
            display: 'block',
            lineHeight: 1.4
          }}
        >
          Source: Voluntary Registry Offsets Database
        </a>
      </div>
    </aside>
  )
}
