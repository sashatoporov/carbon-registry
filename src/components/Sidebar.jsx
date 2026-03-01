import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Compass, Search, BarChart2, BookOpen } from 'lucide-react'

export function Sidebar() {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Discover', icon: Compass },
    { path: '/explore', label: 'Explore', icon: Search }
  ]

  const collections = [
    'Nature-Based Solutions',
    'Tech Removals',
    'High Retirement Rate',
    'Recent Issuances'
  ]

  return (
    <aside className="sidebar">
      <div className="brand" style={{ padding: '0 12px 24px', fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: 28, height: 28, background: 'var(--text-primary)', borderRadius: '50%', color: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={16} />
        </div>
        Registry
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '32px' }}>
        {navItems.map(item => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                transition: 'all 0.2s ease',
                textDecoration: 'none'
              }}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '0 16px', flex: 1, overflowY: 'auto' }}>
        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
          Curated Pools
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {collections.map(col => (
            <div key={col} style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.875rem', transition: 'color 0.2s ease' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
              {col}
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
