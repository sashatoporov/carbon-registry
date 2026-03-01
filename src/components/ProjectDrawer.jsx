import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const formatNum = (num) => {
    if (num == null) return "—";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toLocaleString();
};

export function ProjectDrawer({ project, onClose }) {
    if (!project) return null;

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1000,
                pointerEvents: 'none',
                display: 'flex',
                justifyContent: 'flex-end'
            }}>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        pointerEvents: 'auto'
                    }}
                    onClick={onClose}
                />

                {/* Drawer panel */}
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    style={{
                        width: '100%',
                        maxWidth: '500px',
                        background: 'var(--bg-elevated)',
                        borderLeft: '1px solid var(--border-light)',
                        height: '100%',
                        pointerEvents: 'auto',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: 'auto'
                    }}
                >
                    {/* Header Image / Gradient overlay */}
                    <div style={{
                        height: '240px',
                        background: 'linear-gradient(135deg, var(--accent-verra), var(--accent-car))',
                        position: 'relative',
                        flexShrink: 0
                    }}>
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute', top: 16, right: 16,
                                background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '8px',
                                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <X size={20} />
                        </button>

                        <div style={{
                            position: 'absolute', bottom: 24, left: 24, right: 24,
                            color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                        }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em', opacity: 0.9, marginBottom: '8px' }}>
                                {project.registry} • {project.id}
                            </div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.1 }}>
                                {project.name || 'Unnamed Project'}
                            </h2>
                        </div>
                    </div>

                    <div style={{ padding: '32px 24px', flex: 1 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                            <div style={{ background: 'var(--bg-highlight)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Type</div>
                                <div style={{ fontSize: '1rem', fontWeight: 600 }}>{project.type || '—'}</div>
                            </div>
                            <div style={{ background: 'var(--bg-highlight)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Location</div>
                                <div style={{ fontSize: '1rem', fontWeight: 600 }}>{project.country || project.region || '—'}</div>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '1.125rem', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                            Impact Credits
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Total Issued</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'monospace' }}>{formatNum(project.ci)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Total Retired</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'monospace' }}>{formatNum(project.cr)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Remaining</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent-default)' }}>{formatNum(project.crem)}</span>
                            </div>
                        </div>

                        <h3 style={{ fontSize: '1.125rem', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border-light)' }}>
                            Details
                        </h3>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            <p style={{ marginBottom: '12px' }}><strong>Developer:</strong> {project.dev || '—'}</p>
                            <p style={{ marginBottom: '12px' }}><strong>Methodology:</strong> {project.meth || '—'}</p>
                            <p style={{ marginBottom: '12px' }}><strong>Status:</strong> {project.status || '—'}</p>
                            {project.docs_url && (
                                <a href={project.docs_url} target="_blank" rel="noreferrer" style={{
                                    display: 'inline-block', marginTop: '16px', padding: '10px 20px',
                                    background: 'var(--text-primary)', color: 'var(--bg-base)',
                                    borderRadius: 'var(--radius-pill)', fontWeight: 600, fontSize: '0.875rem'
                                }}>
                                    View Source Documentation
                                </a>
                            )}
                        </div>

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
