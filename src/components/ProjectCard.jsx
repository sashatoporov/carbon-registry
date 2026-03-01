import { motion } from 'framer-motion';
import { Globe, ExternalLink } from 'lucide-react';

const formatNum = (num) => {
    if (num == null) return "—";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toLocaleString();
};

export function ProjectCard({ project, onClick, variant = 'default' }) {
    if (!project) return null;
    const isCanceled = project.status === 'Canceled';

    if (variant === 'compact') {
        return (
            <motion.div
                whileHover={{ backgroundColor: 'var(--bg-inset)' }}
                transition={{ duration: 0.1 }}
                onClick={() => onClick?.(project)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-light)',
                    opacity: isCanceled ? 0.5 : 1,
                }}
            >
                <div style={{
                    width: 36, height: 36,
                    background: 'var(--bg-inverted)',
                    color: 'var(--text-inverted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace",
                    flexShrink: 0,
                }}>
                    {project.registry}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {project.name || 'Unnamed'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {project.country || project.region || '—'} · {project.type || '—'}
                    </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>
                        {formatNum(project.ci)}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>issued</div>
                </div>
            </motion.div>
        );
    }

    // Default card variant — used in carousels
    return (
        <motion.div
            onClick={() => onClick?.(project)}
            whileHover={{ y: -3, boxShadow: 'var(--shadow-offset)' }}
            transition={{ type: 'spring', stiffness: 600, damping: 28 }}
            style={{
                width: variant === 'wide' ? 320 : 240,
                flexShrink: 0,
                cursor: 'pointer',
                opacity: isCanceled ? 0.5 : 1,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-light)',
                overflow: 'hidden',
                scrollSnapAlign: 'start',
            }}
        >
            {/* Top band */}
            <div style={{
                background: 'var(--bg-inverted)',
                color: 'var(--text-inverted)',
                padding: '10px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.7rem',
                fontWeight: 600,
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: '0.04em',
            }}>
                <span>{project.registry}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {project.web && (
                        <a
                            href={project.web.startsWith('http') ? project.web : 'https://' + project.web}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: 'inherit', display: 'flex', alignItems: 'center' }}
                            title="Visit Project Website"
                        >
                            <Globe size={12} />
                        </a>
                    )}
                    <span style={{ opacity: 0.6 }}>{project.id}</span>
                </div>
            </div>

            {/* Body */}
            <div style={{ padding: '16px 18px' }}>
                <h4 style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: 38,
                    marginBottom: 8,
                }}>
                    {project.name || 'Unnamed Project'}
                </h4>

                <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginBottom: 12,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                    {project.country || project.region || '—'} · {project.type || '—'}
                </div>

                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 12 }}>
                    Registered: {project.dt_reg || '—'}
                </div>

                <div style={{
                    display: 'flex',
                    gap: 16,
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: 10,
                }}>
                    <div>
                        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 2 }}>Issued</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{formatNum(project.ci)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 2 }}>Retired</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{formatNum(project.cr)}</div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
