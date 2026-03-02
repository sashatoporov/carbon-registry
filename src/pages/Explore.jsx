import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { Search, ChevronRight, Check, ChevronDown, X, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { ProjectDrawer } from '../components/ProjectDrawer';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, formatNum } from '../utils/formatters';

const REGISTRY_NAMES = {
    'ACR': 'American Carbon Registry',
    'CAR': 'Climate Action Reserve',
    'CDM': 'Clean Development Mechanism',
    'GOLD': 'Gold Standard',
    'VCS': 'Verra (VCS)'
};

const MultiSelect = ({ label, options, selected, onChange, getOptionLabel = opt => opt }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggle = (opt) => {
        const next = selected.includes(opt)
            ? selected.filter(x => x !== opt)
            : [...selected, opt];
        onChange(next);
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', minWidth: 180 }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: selected.length > 0 ? 'var(--bg-inset)' : 'var(--bg-elevated)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 4,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: selected.length > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    transition: 'all 0.15s ease'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    <span style={{ opacity: 0.6, fontSize: '0.7rem', textTransform: 'uppercase' }}>{label}:</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selected.length === 0 ? 'All' : selected.length === 1 ? getOptionLabel(selected[0]) : `${selected.length} selected`}
                    </span>
                </div>
                <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            minWidth: '100%',
                            width: 'max-content',
                            maxWidth: 320,
                            marginTop: 4,
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-light)',
                            borderRadius: 4,
                            boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                            zIndex: 100,
                            maxHeight: 400,
                            overflowY: 'auto',
                            padding: '4px'
                        }}
                    >
                        {options.map(opt => (
                            <div
                                key={opt}
                                onClick={() => toggle(opt)}
                                style={{
                                    padding: '8px 10px',
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    cursor: 'pointer',
                                    borderRadius: 3,
                                    background: selected.includes(opt) ? 'rgba(var(--accent-rgb), 0.1)' : 'transparent',
                                    color: selected.includes(opt) ? 'var(--accent-warm)' : 'var(--text-primary)',
                                    transition: 'background 0.1s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-inset)'}
                                onMouseLeave={e => e.currentTarget.style.background = selected.includes(opt) ? 'rgba(var(--accent-rgb), 0.1)' : 'transparent'}
                            >
                                <div style={{
                                    width: 14,
                                    height: 14,
                                    border: '1.5px solid',
                                    borderColor: selected.includes(opt) ? 'var(--accent-warm)' : 'var(--border-medium)',
                                    borderRadius: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: selected.includes(opt) ? 'var(--accent-warm)' : 'transparent'
                                }}>
                                    {selected.includes(opt) && <Check size={10} color="white" />}
                                </div>
                                <span style={{ flex: 1 }}>{getOptionLabel(opt)}</span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const tdStyle = {
    padding: '8px 20px',
    fontSize: '0.8rem',
    color: 'var(--text-secondary)'
};

const truncateStyle = {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    wordBreak: 'break-word',
    whiteSpace: 'normal',
};

const formatShortDate = (dstr) => {
    if (!dstr) return '—';
    const d = new Date(dstr);
    if (isNaN(d)) return '—';
    if (d.getFullYear() < 2000) return '—';
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

export default function Explore() {
    const allProjects = useProjects();
    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize state from URL params
    const getParamArray = (key) => {
        const val = searchParams.get(key);
        return val ? val.split(',') : [];
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRegistries, setSelectedRegistries] = useState(() => getParamArray('registry'));
    const [selectedTypes, setSelectedTypes] = useState(() => getParamArray('type'));
    const [selectedLocations, setSelectedLocations] = useState(() => getParamArray('location'));
    const [selectedScopes, setSelectedScopes] = useState(() => getParamArray('scope'));

    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState(() => searchParams.get('sort') || 'dt_add');
    const [sortDirection, setSortDirection] = useState(() => searchParams.get('dir') || 'desc');
    const itemsPerPage = 100;

    const projectId = searchParams.get('project');
    const selectedProject = useMemo(() =>
        projectId ? allProjects.find(p => p.id === projectId) : null
        , [projectId, allProjects]);

    const setSelectedProject = (p) => {
        if (p) searchParams.set('project', p.id);
        else searchParams.delete('project');
        setSearchParams(searchParams);
    };

    // Sync filters and sort to URL
    useEffect(() => {
        const updateParams = () => {
            const params = new URLSearchParams(searchParams);

            const sync = (key, arr) => {
                if (arr.length > 0) params.set(key, arr.join(','));
                else params.delete(key);
            };

            sync('registry', selectedRegistries);
            sync('type', selectedTypes);
            sync('location', selectedLocations);
            sync('scope', selectedScopes);

            if (sortField) params.set('sort', sortField);
            else params.delete('sort');

            if (sortDirection) params.set('dir', sortDirection);
            else params.delete('dir');

            if (params.toString() !== searchParams.toString()) {
                setSearchParams(params);
            }
        };
        updateParams();
    }, [selectedRegistries, selectedTypes, selectedLocations, selectedScopes, sortField, sortDirection]);

    const uniqueValues = useMemo(() => {
        return {
            registries: [...new Set(allProjects.map(p => p.registry).filter(Boolean))].sort(),
            types: [...new Set(allProjects.map(p => p.type).filter(Boolean))].sort(),
            locations: [...new Set(allProjects.map(p => p.country || p.region).filter(Boolean))].sort(),
            scopes: [...new Set(allProjects.map(p => p.scope).filter(Boolean))].sort()
        };
    }, [allProjects]);

    const filtered = useMemo(() => {
        return allProjects.filter(p => {
            if (selectedRegistries.length > 0 && !selectedRegistries.includes(p.registry)) return false;
            if (selectedLocations.length > 0 && !selectedLocations.includes(p.country || p.region)) return false;

            // Special handling for "Tech & Carbon Removals" preset coming from Discover page
            const isTechPreset = selectedScopes.length === 1 && selectedScopes.includes('Carbon Capture & Storage') &&
                selectedTypes.length === 1 && selectedTypes.includes('Biochar');

            if (isTechPreset) {
                if (p.scope !== 'Carbon Capture & Storage' && p.type !== 'Biochar') return false;
            } else {
                if (selectedTypes.length > 0 && !selectedTypes.includes(p.type)) return false;
                if (selectedScopes.length > 0 && !selectedScopes.includes(p.scope)) return false;
            }

            if (searchTerm) {
                const q = searchTerm.toLowerCase();
                const hay = [p.name, p.id, p.dev, p.country, p.registry, p.type].filter(Boolean).join(' ').toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });
    }, [allProjects, searchTerm, selectedRegistries, selectedTypes, selectedLocations, selectedScopes]);

    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];

            // Special case for Location
            if (sortField === 'location') {
                valA = a.country || a.region || '';
                valB = b.country || b.region || '';
            }

            if (valA === valB) return 0;
            if (valA === null || valA === undefined || valA === '') return 1;
            if (valB === null || valB === undefined || valB === '') return -1;

            let comparison = 0;
            if (typeof valA === 'string') {
                comparison = valA.localeCompare(valB);
            } else {
                comparison = valA - valB;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [filtered, sortField, sortDirection]);

    const totalPages = Math.ceil(sorted.length / itemsPerPage);
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return sorted.slice(start, start + itemsPerPage);
    }, [sorted, currentPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedRegistries, selectedTypes, selectedLocations, selectedScopes]);

    const getHeaderTitle = () => {
        if (searchTerm) return `Search: "${searchTerm}"`;

        const r = selectedRegistries;
        const s = selectedScopes;
        const t = selectedTypes;
        const l = selectedLocations;

        if (s.length === 0 && t.length === 0 && r.length === 0 && l.length === 0 && sortField === 'ci' && sortDirection === 'desc') {
            return 'Top Projects by Volume';
        }
        if (s.length === 0 && t.length === 0 && r.length === 0 && l.length === 0 && sortField === 'dt_add' && sortDirection === 'desc') {
            return 'Recently Added';
        }
        if (r.length === 1 && r[0] === 'GOLD' && s.length === 0 && t.length === 0 && l.length === 0) {
            return 'Gold Standard Highlights';
        }
        if (s.length === 1 && s[0] === 'Forestry & Land Use' && t.length === 0 && r.length === 0 && l.length === 0) {
            return 'Nature-Based Solutions';
        }
        if (s.length === 1 && s[0] === 'Carbon Capture & Storage' && t.length === 1 && t[0] === 'Biochar' && r.length === 0 && l.length === 0) {
            return 'Tech & Carbon Removals';
        }
        if (s.length === 1 && s[0] === 'Renewable Energy' && t.length === 0 && r.length === 0 && l.length === 0) {
            return 'Renewable Energy';
        }

        if (s.length === 1 && t.length === 0 && r.length === 0 && l.length === 0) return s[0];
        if (t.length === 1 && s.length === 0 && r.length === 0 && l.length === 0) return t[0];
        if (r.length === 1 && s.length === 0 && t.length === 0 && l.length === 0) return `${r[0]} Projects`;

        if (s.length > 0 || t.length > 0 || r.length > 0 || l.length > 0) {
            return 'Filtered Projects';
        }

        return 'All Projects';
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
            <header className="top-header" style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', color: 'var(--text-tertiary)', minWidth: 0, flex: 1 }}>
                    <Link to="/explore" onClick={() => {
                        setSelectedRegistries([]);
                        setSelectedTypes([]);
                        setSelectedLocations([]);
                        setSelectedScopes([]);
                        setSearchTerm('');
                    }} style={{ color: 'inherit', textDecoration: 'none', opacity: 0.6 }}>Explore</Link>
                    <ChevronRight size={16} style={{ opacity: 0.4, flexShrink: 0 }} />
                    <span style={{
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {getHeaderTitle()}
                    </span>
                </div>
                <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    fontFamily: "'IBM Plex Mono', monospace",
                    flexShrink: 0,
                    opacity: 0.8
                }}>
                    {filtered.length.toLocaleString()} projects found
                </div>
            </header>

            {/* Search and Filters */}
            <div className="explore-filters-container" style={{
                padding: '16px 32px',
                borderBottom: '1px solid var(--border-light)',
                background: 'var(--bg-base)',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 16
            }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
                                borderRadius: 4,
                                padding: '10px 14px 10px 42px',
                                color: 'var(--text-primary)',
                                fontSize: '0.875rem',
                                outline: 'none',
                                fontFamily: 'inherit',
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <MultiSelect
                        label="Registry"
                        options={uniqueValues.registries}
                        selected={selectedRegistries}
                        onChange={setSelectedRegistries}
                        getOptionLabel={opt => REGISTRY_NAMES[opt] || opt}
                    />
                    <MultiSelect
                        label="Type"
                        options={uniqueValues.types}
                        selected={selectedTypes}
                        onChange={setSelectedTypes}
                    />
                    <MultiSelect
                        label="Location"
                        options={uniqueValues.locations}
                        selected={selectedLocations}
                        onChange={setSelectedLocations}
                    />
                    <MultiSelect
                        label="Scope"
                        options={uniqueValues.scopes}
                        selected={selectedScopes}
                        onChange={setSelectedScopes}
                    />

                    {(selectedRegistries.length > 0 || selectedTypes.length > 0 || selectedLocations.length > 0 || selectedScopes.length > 0) && (
                        <button
                            onClick={() => {
                                setSelectedRegistries([]);
                                setSelectedTypes([]);
                                setSelectedLocations([]);
                                setSelectedScopes([]);
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--accent-warm)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '0 8px'
                            }}
                        >
                            <X size={14} /> Clear All
                        </button>
                    )}
                </div>
            </div>

            {/* Results Table */}
            <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                {paginated.length === 0 ? (
                    <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        No projects match your search.
                    </div>
                ) : (
                    <table style={{ width: '100%', minWidth: 1000, tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 5, boxShadow: '0 1px 0 var(--border-light)' }}>
                            <tr>
                                {[
                                    { label: 'Registry', field: 'registry', width: '9%' },
                                    { label: 'ID', field: 'id', width: '10%' },
                                    { label: 'Project Name', field: 'name', width: '27%' },
                                    { label: 'Location', field: 'location', width: '15%' },
                                    { label: 'Type', field: 'type', width: '13%' },
                                    { label: 'Added', field: 'dt_add', width: '8%' },
                                    { label: 'Issued', field: 'ci', width: '9%' },
                                    { label: 'Retired', field: 'cr', width: '9%' }
                                ].map(h => {
                                    const isSorted = sortField === h.field;
                                    return (
                                        <th
                                            key={h.field}
                                            onClick={() => {
                                                if (isSorted) {
                                                    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                                                } else {
                                                    setSortField(h.field);
                                                    setSortDirection('desc');
                                                }
                                            }}
                                            style={{
                                                padding: '12px 20px',
                                                fontSize: '0.65rem',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                color: isSorted ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                                letterSpacing: '0.05em',
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                transition: 'color 0.15s ease',
                                                width: h.width
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                            onMouseLeave={e => e.currentTarget.style.color = isSorted ? 'var(--text-primary)' : 'var(--text-tertiary)'}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {h.label}
                                                {isSorted && (
                                                    sortDirection === 'asc' ? <ArrowUp size={12} strokeWidth={3} /> : <ArrowDown size={12} strokeWidth={3} />
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((p) => (
                                <tr
                                    key={p.id}
                                    onClick={() => setSelectedProject(p)}
                                    style={{
                                        borderBottom: '1px solid var(--border-light)',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        height: '64px'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={tdStyle}>
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            fontSize: '0.65rem',
                                            fontWeight: 600,
                                            background: 'var(--bg-elevated)',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            {p.registry}
                                        </span>
                                    </td>
                                    <td style={{ ...tdStyle, fontFamily: "'IBM Plex Mono', monospace" }}>{p.id}</td>
                                    <td style={{ ...tdStyle, fontWeight: 500, color: 'var(--text-primary)' }}>
                                        <div style={truncateStyle} title={p.name}>{p.name}</div>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={truncateStyle} title={p.country || p.region || '—'}>{p.country || p.region || '—'}</div>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={truncateStyle} title={p.type || '—'}>{p.type || '—'}</div>
                                    </td>
                                    <td style={tdStyle}>{formatShortDate(p.dt_add)}</td>
                                    <td style={{ ...tdStyle, fontFamily: "'IBM Plex Mono', monospace", textAlign: 'right' }}>{formatNum(p.ci)}</td>
                                    <td style={{ ...tdStyle, fontFamily: "'IBM Plex Mono', monospace", textAlign: 'right', paddingRight: 20 }}>{formatNum(p.cr)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ─── Bottom Pagination ─── */}
            {totalPages > 1 && (
                <div style={{
                    padding: '16px 32px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 16,
                    borderTop: '1px solid var(--border-light)',
                    background: 'var(--bg-elevated)',
                    zIndex: 20
                }}>
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                        {currentPage.toLocaleString()} / {totalPages.toLocaleString()}
                    </span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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

            <AnimatePresence>
                {selectedProject && (
                    <ProjectDrawer
                        project={selectedProject}
                        onClose={() => setSelectedProject(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
