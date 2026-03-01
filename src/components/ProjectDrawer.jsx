import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import { Sparkline } from './Charts';

const fmt = (num) => {
    if (num == null) return null;
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toLocaleString();
};

const fmtDate = (d) => {
    if (!d) return null;
    // Handle ISO or other date strings
    try {
        const dt = new Date(d);
        if (isNaN(dt)) return d;
        return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return d; }
};

function Row({ label, value, isLink }) {
    if (!value) return null;
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--border-light)', gap: 16 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', flexShrink: 0, minWidth: 100 }}>{label}</span>
            {isLink ? (
                <a href={value} target="_blank" rel="noreferrer"
                    style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--accent-warm)', textAlign: 'right', maxWidth: '65%', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Visit <ExternalLink size={12} />
                </a>
            ) : (
                <span style={{ fontSize: '0.8rem', fontWeight: 600, textAlign: 'right', maxWidth: '65%', wordBreak: 'break-word' }}>{value}</span>
            )}
        </div>
    );
}

function CreditsBar({ project }) {
    const items = [
        { label: 'Issued', val: fmt(project.ci) },
        { label: 'Retired', val: fmt(project.cr) },
        { label: 'Remaining', val: fmt(project.crem) },
    ].filter(s => s.val);

    if (!items.length) return null;

    return (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)' }}>
            {items.map((s, i) => (
                <div key={s.label} style={{ flex: 1, padding: '14px 16px', borderRight: i < items.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>{s.val}</div>
                </div>
            ))}
        </div>
    );
}

export function ProjectDrawer({ project, onClose }) {
    const [expanded, setExpanded] = useState(false);

    if (!project) return null;

    const drawerWidth = expanded ? '100%' : '480px';

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                pointerEvents: 'none', display: 'flex', justifyContent: 'flex-end',
            }}>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'absolute', inset: 0,
                        background: expanded ? 'rgba(26,26,24,0.6)' : 'rgba(26,26,24,0.35)',
                        pointerEvents: 'auto',
                    }}
                    onClick={onClose}
                />

                {/* Drawer panel */}
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0, width: drawerWidth }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    style={{
                        width: drawerWidth,
                        maxWidth: expanded ? '100%' : 480,
                        background: 'var(--bg-elevated)',
                        borderLeft: expanded ? 'none' : '1px solid var(--border-medium)',
                        height: '100%',
                        pointerEvents: 'auto',
                        position: 'relative',
                        display: 'flex', flexDirection: 'column',
                        overflowY: 'auto',
                    }}
                >
                    {/* Header */}
                    <div style={{
                        background: 'var(--bg-inverted)',
                        color: 'var(--text-inverted)',
                        padding: expanded ? '32px 48px' : '20px 24px',
                        position: 'relative',
                    }}>
                        <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 8 }}>
                            <button
                                onClick={() => setExpanded(!expanded)}
                                style={{
                                    width: 40, height: 40,
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    padding: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--text-inverted)', cursor: 'pointer', background: 'transparent',
                                    borderRadius: 4
                                }}
                                title={expanded ? 'Collapse' : 'Expand to full page'}
                            >
                                {expanded ? <Minimize2 size={20} style={{ pointerEvents: 'none' }} /> : <Maximize2 size={20} style={{ pointerEvents: 'none' }} />}
                            </button>
                            <button
                                onClick={onClose}
                                style={{
                                    width: 40, height: 40,
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    padding: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--text-inverted)', cursor: 'pointer', background: 'transparent',
                                    borderRadius: 4
                                }}
                            >
                                <X size={20} style={{ pointerEvents: 'none' }} />
                            </button>
                        </div>

                        <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', fontFamily: "'IBM Plex Mono', monospace", opacity: 0.6, marginBottom: 6 }}>
                            {project.registry} · {project.id}
                        </div>
                        <h2 style={{ fontSize: expanded ? '1.5rem' : '1.2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 0, maxWidth: expanded ? 700 : '100%' }}>
                            {project.name || 'Unnamed Project'}
                        </h2>
                        {project.status && (
                            <div style={{ marginTop: 8, display: 'inline-block', padding: '3px 10px', fontSize: '0.65rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>
                                {project.status}
                            </div>
                        )}
                    </div>

                    {/* Credits */}
                    <CreditsBar project={project} />

                    {/* Top Section: Sparkline + Action Links */}
                    <div style={{
                        padding: expanded ? '24px 48px' : '16px 24px',
                        borderBottom: '1px solid var(--border-light)',
                        background: 'var(--bg-inset)',
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: expanded ? 'row' : 'column',
                            gap: 24,
                            alignItems: expanded ? 'center' : 'stretch'
                        }}>
                            {/* Sparkline */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 8 }}>
                                    Issuance History
                                </div>
                                <Sparkline project={project} width={expanded ? 600 : 380} height={expanded ? 80 : 50} />
                            </div>

                            {/* Links */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                minWidth: expanded ? 200 : 'auto'
                            }}>
                                {project.docs_url && (
                                    <a href={project.docs_url} target="_blank" rel="noreferrer"
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            padding: '10px 20px', background: 'var(--bg-inverted)', color: 'var(--text-inverted)',
                                            border: 'none', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                                            letterSpacing: '0.06em', textDecoration: 'none', transition: 'opacity 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                                    >
                                        Registry Page <ExternalLink size={13} />
                                    </a>
                                )}
                                {project.web && (
                                    <a href={project.web.startsWith('http') ? project.web : 'https://' + project.web} target="_blank" rel="noreferrer"
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            padding: '10px 20px', background: 'transparent', color: 'var(--text-primary)',
                                            border: '1px solid var(--border-medium)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                                            letterSpacing: '0.06em', textDecoration: 'none', transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-inset)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        Project Website <ExternalLink size={13} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Body — two columns when expanded */}
                    <div style={{
                        padding: expanded ? '24px 48px' : '16px 24px',
                        flex: 1,
                    }}>
                        <div style={{
                            display: expanded ? 'grid' : 'block',
                            gridTemplateColumns: expanded ? '1fr 1fr' : undefined,
                            gap: expanded ? 48 : undefined,
                        }}>
                            {/* Column 1: Core Details */}
                            <div>
                                {/* Description */}
                                {project.desc && (
                                    <div style={{ marginBottom: 16, padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                                        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 6 }}>Description</div>
                                        <p style={{ fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>{project.desc}</p>
                                    </div>
                                )}

                                <Row label="Type" value={project.type} />
                                <Row label="Scope" value={project.scope} />
                                <Row label="Reduction / Removal" value={project.rr} />
                                <Row label="Country" value={project.country} />
                                <Row label="Region" value={project.region} />
                                {project.state && <Row label="State" value={project.state} />}
                                {project.loc && <Row label="Location" value={project.loc} />}

                                {/* People */}
                                <Row label="Developer" value={project.dev} />
                                {project.owner && <Row label="Owner" value={project.owner} />}
                                {project.oper && <Row label="Operator" value={project.oper} />}
                                {project.verif && <Row label="Verifier" value={project.verif} />}
                            </div>

                            {/* Column 2: Technical/Admin Details */}
                            <div>
                                <Row label="Methodology" value={project.meth} />
                                {project.meth_v && <Row label="Methodology Version" value={project.meth_v} />}

                                <Row label="Listed" value={fmtDate(project.dt_list)} />
                                <Row label="Registered" value={fmtDate(project.dt_reg)} />
                                {project.dt_add && <Row label="Added to Database" value={fmtDate(project.dt_add)} />}
                                {project.fy && <Row label="First Vintage Year" value={project.fy} />}
                                {project.ear && <Row label="Earliest Crediting" value={fmtDate(project.ear)} />}

                                {project.poa && <Row label="Programme of Activities" value={project.poa} />}
                                {project.bp && <Row label="Buffer Pool" value={fmt(project.bp)} />}
                                {project.certs && <Row label="Certifications" value={project.certs} />}
                                {project.desig && <Row label="Designation" value={project.desig} />}

                                {/* Vintage table when expanded */}
                                {expanded && (
                                    <div style={{ marginTop: 24 }}>
                                        <VintageTable project={project} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

/* ─── Vintage table for expanded view ─── */
function VintageTable({ project }) {
    const rows = [];
    for (let y = 2005; y <= 2025; y++) {
        const issued = project['iv_' + y] || 0;
        const retired = project['rv_' + y] || 0;
        if (issued > 0 || retired > 0) rows.push({ year: y, issued, retired });
    }
    if (!rows.length) return null;

    return (
        <div>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 8 }}>
                Vintage Breakdown
            </div>
            <div style={{ border: '1px solid var(--border-light)' }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', background: 'var(--bg-inset)', borderBottom: '1px solid var(--border-light)' }}>
                    {['Year', 'Issued', 'Retired'].map(h => (
                        <div key={h} style={{ padding: '6px 10px', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)' }}>{h}</div>
                    ))}
                </div>
                {/* Rows */}
                {rows.map(r => (
                    <div key={r.year} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', borderBottom: '1px solid var(--border-light)' }}>
                        <div style={{ padding: '5px 10px', fontSize: '0.75rem', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>{r.year}</div>
                        <div style={{ padding: '5px 10px', fontSize: '0.75rem', fontFamily: "'IBM Plex Mono', monospace" }}>{r.issued > 0 ? r.issued.toLocaleString() : '—'}</div>
                        <div style={{ padding: '5px 10px', fontSize: '0.75rem', fontFamily: "'IBM Plex Mono', monospace" }}>{r.retired > 0 ? r.retired.toLocaleString() : '—'}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
