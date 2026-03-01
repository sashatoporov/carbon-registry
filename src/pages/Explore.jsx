import React, { useState, useMemo } from 'react';
import { useProjects } from '../hooks/useProjects';
import { Search } from 'lucide-react';
import { ProjectDrawer } from '../components/ProjectDrawer';
import { ProjectCard } from '../components/ProjectCard';
import { motion, AnimatePresence } from 'framer-motion';

export default function Explore() {
    const allProjects = useProjects();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterScope, setFilterScope] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 100;

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
        });
    }, [allProjects, searchTerm, filterScope]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filtered.slice(start, start + itemsPerPage);
    }, [filtered, currentPage]);

    // Reset to page 1 when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterScope]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header className="top-header">
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Explore</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: "'IBM Plex Mono', monospace" }}>
                        {filtered.length} projects found
                    </span>
                </div>
            </header>

            {/* Search bar */}
            <div className="explore-search-container" style={{ padding: '16px 32px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-base)', zIndex: 10 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: 14, top: 11, color: 'var(--text-tertiary)' }} size={18} />
                    <input
                        type="text"
                        placeholder="Search projects, developers, IDs..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-light)',
                            borderRadius: 0,
                            padding: '10px 14px 10px 42px',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            outline: 'none',
                            fontFamily: 'inherit',
                        }}
                    />
                </div>
                <select
                    value={filterScope}
                    onChange={e => setFilterScope(e.target.value)}
                    style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-light)',
                        color: 'var(--text-primary)',
                        padding: '10px 16px',
                        borderRadius: 0,
                        fontSize: '0.875rem',
                        outline: 'none',
                        appearance: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                    }}
                >
                    <option value="">All Scopes</option>
                    {scopes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Results list */}
            <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                {paginated.length === 0 && (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        No projects match your search.
                    </div>
                )}
                <AnimatePresence mode="popLayout">
                    {paginated.map((p, i) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(i * 0.005, 0.2), duration: 0.2 }}
                        >
                            <ProjectCard project={p} onClick={setSelectedProject} variant="compact" />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Sticky Pagination Controls */}
            {totalPages > 1 && (
                <div style={{
                    padding: '16px 32px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 16,
                    borderTop: '1px solid var(--border-light)',
                    background: 'var(--bg-elevated)',
                    zIndex: 20,
                    boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
                }}>
                    <button
                        disabled={currentPage === 1}
                        onClick={() => {
                            setCurrentPage(p => Math.max(1, p - 1));
                            document.querySelector('.main-content')?.scrollTo(0, 0);
                        }}
                        style={{
                            padding: '8px 12px',
                            background: 'transparent',
                            border: '1px solid var(--border-medium)',
                            color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            opacity: currentPage === 1 ? 0.5 : 1,
                            minWidth: 80
                        }}
                    >
                        Prev
                    </button>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", color: 'var(--text-secondary)' }}>
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => {
                            setCurrentPage(p => Math.min(totalPages, p + 1));
                            document.querySelector('.main-content')?.scrollTo(0, 0);
                        }}
                        style={{
                            padding: '8px 12px',
                            background: 'transparent',
                            border: '1px solid var(--border-medium)',
                            color: currentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            opacity: currentPage === totalPages ? 0.5 : 1,
                            minWidth: 80
                        }}
                    >
                        Next
                    </button>
                </div>
            )}

            {selectedProject && (
                <ProjectDrawer project={selectedProject} onClose={() => setSelectedProject(null)} />
            )}
        </div>
    );
}
