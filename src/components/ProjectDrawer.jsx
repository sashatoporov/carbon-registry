import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, ExternalLink, Info, Sparkles } from 'lucide-react';
import { Sparkline } from './Charts';
import sdgMapping from '../data/sdg_mapping.json';
import { generateProjectStory } from '../utils/generateProjectStory';

import { formatDate as fmtDate, formatNum as fmt } from '../utils/formatters';

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

const SDG_NAMES = {
    1: "No Poverty",
    2: "Zero Hunger",
    3: "Good Health and Well-being",
    4: "Quality Education",
    5: "Gender Equality",
    6: "Clean Water and Sanitation",
    7: "Affordable and Clean Energy",
    8: "Decent Work and Economic Growth",
    9: "Industry, Innovation and Infrastructure",
    10: "Reduced Inequality",
    11: "Sustainable Cities and Communities",
    12: "Responsible Consumption and Production",
    13: "Climate Action",
    14: "Life Below Water",
    15: "Life on Land",
    16: "Peace and Justice Strong Institutions",
    17: "Partnerships to achieve the Goal"
};

function SDGSection({ projectId }) {
    const projectSdgs = sdgMapping[projectId];
    const [tooltip, setTooltip] = useState(null);
    if (!projectSdgs || !projectSdgs.length) return null;

    return (
        <div style={{ marginBottom: 24, position: 'relative' }}>
            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                Sustainable Development Goals
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {projectSdgs.map(num => {
                    const padNum = num.toString().padStart(2, '0');
                    return (
                        <motion.div
                            key={num}
                            onMouseEnter={() => setTooltip({ num, name: SDG_NAMES[num] })}
                            onMouseLeave={() => setTooltip(null)}
                            whileHover={{ y: -3, scale: 1.05 }}
                            style={{ position: 'relative', cursor: 'help' }}
                        >
                            <img
                                src={`${import.meta.env.BASE_URL}sdg-icons/E-WEB-Goal-${padNum}.png`}
                                alt={SDG_NAMES[num]}
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 4,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                            />
                        </motion.div>
                    );
                })}
            </div>

            <AnimatePresence>
                {tooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        style={{
                            position: 'absolute',
                            bottom: 'calc(100% + 10px)',
                            left: 0,
                            background: 'var(--bg-inverted)',
                            color: 'var(--text-inverted)',
                            padding: '6px 12px',
                            borderRadius: 4,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            zIndex: 100,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}
                    >
                        {tooltip.num}. {tooltip.name}
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 22,
                            width: 0,
                            height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: '6px solid var(--bg-inverted)'
                        }} />
                    </motion.div>
                )}
            </AnimatePresence>
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
    const story = useMemo(() => {
        try {
            return project ? generateProjectStory(project) : null;
        } catch (e) {
            console.error('Error in generateProjectStory', e);
            return null;
        }
    }, [project]);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const drawerWidth = isMobile || expanded ? '100%' : '480px';

    return (
        <div
            className="project-drawer-container"
            style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                zIndex: 1000,
                pointerEvents: 'none',
                display: 'flex',
                justifyContent: 'flex-end',
            }}
        >

            {/* Drawer panel */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0, width: drawerWidth }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                style={{
                    width: drawerWidth,
                    maxWidth: '100%',
                    background: 'var(--bg-elevated)',
                    borderLeft: expanded ? 'none' : '1px solid var(--border-medium)',
                    height: '100%',
                    pointerEvents: 'auto',
                    position: 'relative',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                    willChange: 'transform',
                }}
            >
                {/* Header */}
                <div style={{
                    background: 'var(--bg-inverted)',
                    color: 'var(--text-inverted)',
                    padding: (expanded && !isMobile) ? '32px 48px' : '20px 24px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 5,
                    flexShrink: 0,
                    // Force hardware acceleration in Safari to prevent white flash/flicker
                    WebkitTransform: 'translateZ(0)',
                    transform: 'translateZ(0)',
                }}>
                    <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 8, zIndex: 10 }}>
                        {!isMobile && (
                            <motion.button
                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setExpanded(!expanded)}
                                style={{
                                    width: 44, height: 44,
                                    border: '1px solid rgba(255,255,255,0.25)',
                                    padding: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--text-inverted)', cursor: 'pointer',
                                    background: 'rgba(255,255,255,0.08)',
                                    backdropFilter: 'blur(4px)',
                                    borderRadius: 6,
                                    transition: 'background 0.2s',
                                    outline: 'none'
                                }}
                                title={expanded ? 'Collapse' : 'Expand to full page'}
                            >
                                {expanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                            </motion.button>
                        )}
                        <motion.button
                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            style={{
                                width: 44, height: 44,
                                border: '1px solid rgba(255,255,255,0.25)',
                                padding: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-inverted)', cursor: 'pointer',
                                background: 'rgba(255,255,255,0.08)',
                                backdropFilter: 'blur(4px)',
                                borderRadius: 6,
                                transition: 'background 0.2s',
                                outline: 'none'
                            }}
                            title="Close"
                        >
                            <X size={20} />
                        </motion.button>
                    </div>

                    <div style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', fontFamily: "'IBM Plex Mono', monospace", opacity: 0.6, marginBottom: 6 }}>
                        {project.registry} · {project.id}
                    </div>
                    <h2 style={{ fontSize: (expanded && !isMobile) ? '1.5rem' : '1.2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 0, maxWidth: (expanded && !isMobile) ? 700 : '100%' }}>
                        {project.name || 'Unnamed Project'}
                    </h2>
                    {project.status && (
                        <div style={{ marginTop: 8, display: 'inline-block', padding: '3px 10px', fontSize: '0.65rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>
                            {project.status}
                        </div>
                    )}
                </div>

                {/* Scrollable body */}
                <div style={{ flex: 1, overflowY: 'auto' }}>

                    {/* Credits */}
                    <CreditsBar project={project} />

                    {/* Top Section: Sparkline + Action Links */}
                    <div style={{
                        padding: (expanded && !isMobile) ? '24px 48px' : '16px 24px',
                        borderBottom: '1px solid var(--border-light)',
                        background: 'var(--bg-inset)',
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: (expanded && !isMobile) ? 'row' : 'column',
                            gap: 24,
                            alignItems: (expanded && !isMobile) ? 'center' : 'stretch'
                        }}>
                            {/* Sparkline */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Sparkline project={project} width={(expanded && !isMobile) ? 600 : 380} height={(expanded && !isMobile) ? 80 : 50} />
                            </div>

                            {/* Links */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                minWidth: (expanded && !isMobile) ? 200 : 'auto'
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
                        padding: (expanded && !isMobile) ? '24px 48px' : '16px 24px',
                        flex: 1,
                    }}>
                        <div style={{
                            display: (expanded && !isMobile) ? 'grid' : 'block',
                            gridTemplateColumns: (expanded && !isMobile) ? '1fr 1fr' : undefined,
                            gap: (expanded && !isMobile) ? 48 : undefined,
                        }}>
                            {/* Column 1: Core Details */}
                            <div>
                                {/* AI Project Story */}
                                {story && (
                                    <div style={{
                                        marginBottom: 20,
                                        padding: '14px 16px',
                                        borderLeft: '3px solid var(--accent-warm)',
                                        background: 'rgba(var(--accent-rgb), 0.04)',
                                        borderRadius: '0 6px 6px 0',
                                    }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            marginBottom: 8,
                                        }}>
                                            <Sparkles size={13} style={{ color: 'var(--accent-warm)', opacity: 0.8 }} />
                                            <span style={{
                                                fontSize: '0.6rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em',
                                                fontWeight: 700,
                                                color: 'var(--accent-warm)',
                                                fontFamily: "'IBM Plex Mono', monospace",
                                            }}>AI Summary</span>
                                        </div>
                                        <p style={{
                                            fontSize: '0.82rem',
                                            lineHeight: 1.65,
                                            color: 'var(--text-secondary)',
                                            margin: 0,
                                            fontStyle: 'italic',
                                        }}>{story}</p>
                                    </div>
                                )}

                                {/* Description */}
                                {project.desc && (
                                    <div style={{ marginBottom: 16, padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                                        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 6 }}>Description</div>
                                        <p style={{ fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>{project.desc}</p>
                                    </div>
                                )}

                                <SDGSection projectId={project.id} />

                                <Row label="Type" value={project.type} />
                                <Row label="Scope" value={project.scope} />
                                <Row label="Reduction / Removal" value={project.rr} />
                                <Row label="Country" value={project.country} />
                                <Row label="Region" value={project.region} />
                                {project.state && <Row label="State" value={project.state} />}
                                {project.loc && <Row label="Location" value={project.loc} />}
                                {(project.lat || project.lng) && <Row label="Coordinates" value={`${project.lat || '—'}, ${project.lng || '—'}`} />}

                                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-medium)' }}>
                                    <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 12 }}>Proponent & Contacts</div>
                                    <Row label="Proponent" value={project.proponent || project.dev} />
                                    {project.email && <Row label="Contact Email" value={project.email} />}
                                    {project.web_ext && <Row label="External Website" value={project.web_ext} isLink={true} />}
                                </div>

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

                                {/* Vintage table - always visible */}
                                <div style={{ marginTop: 24 }}>
                                    <VintageTable project={project} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>  {/* end scrollable body */}
            </motion.div>
        </div>
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
