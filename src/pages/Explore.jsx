import React, { useState, useMemo } from 'react';
import { useProjects } from '../hooks/useProjects';
import { Search, Filter } from 'lucide-react';
import { ProjectDrawer } from '../components/ProjectDrawer';

export default function Explore() {
    const allProjects = useProjects();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterScope, setFilterScope] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);

    const scopes = useMemo(() => {
        return [...new Set(allProjects.map(p => p.scope).filter(Boolean))].sort();
    }, [allProjects]);

    const filtered = useMemo(() => {
        return allProjects.filter(p => {
            if (filterScope && p.scope !== filterScope) return false;
            if (searchTerm) {
                const q = searchTerm.toLowerCase();
                const hay = [p.name, p.id, p.dev, p.country].filter(Boolean).join(' ').toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        }).slice(0, 50); // Just top 50 for quick rendering in explore list initially
    }, [allProjects, searchTerm, filterScope]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header className="top-header">
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Explore</h1>
            </header>

            <div style={{ padding: '24px 32px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: 16, top: 12, color: 'var(--text-tertiary)' }} size={20} />
                    <input
                        type="text"
                        placeholder="Search projects, developers, IDs..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'var(--bg-highlight)',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-pill)',
                            padding: '12px 16px 12px 48px',
                            color: 'var(--text-primary)',
                            fontSize: '1rem',
                            outline: 'none'
                        }}
                    />
                </div>
                <select
                    value={filterScope}
                    onChange={e => setFilterScope(e.target.value)}
                    style={{
                        background: 'var(--bg-highlight)',
                        border: '1px solid var(--border-light)',
                        color: 'var(--text-primary)',
                        padding: '12px 24px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '1rem',
                        outline: 'none',
                        appearance: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <option value="">All Scopes</option>
                    {scopes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 32px 32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {filtered.map(p => (
                        <div key={p.id} style={{
                            background: 'var(--bg-elevated)',
                            padding: '16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            cursor: 'pointer'
                        }}
                            onClick={() => setSelectedProject(p)}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-highlight)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.id}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.registry}</span>
                            </div>
                            <h3 style={{ fontSize: '1rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name || 'Unnamed'}</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.type}</p>
                        </div>
                    ))}
                </div>
            </div>
            {selectedProject && (
                <ProjectDrawer project={selectedProject} onClose={() => setSelectedProject(null)} />
            )}
        </div>
    );
}
