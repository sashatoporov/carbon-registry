import React from 'react';
import { motion } from 'framer-motion';

const formatNum = (num) => {
    if (num == null) return "—";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toLocaleString();
};

const getRegistryColor = (reg) => {
    switch (reg) {
        case 'VCS': return 'var(--accent-verra)';
        case 'GOLD': return 'var(--accent-gold)';
        case 'CAR': return 'var(--accent-car)';
        case 'ACR': return 'var(--accent-acr)';
        case 'ART': return 'var(--accent-art)';
        default: return 'var(--text-tertiary)';
    }
};

export function ProjectCard({ project, onClick }) {
    const isCanceled = project.status === 'Canceled';

    return (
        <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onClick?.(project)}
            style={{
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                cursor: 'pointer',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '260px',
                flexShrink: 0,
                opacity: isCanceled ? 0.6 : 1,
                position: 'relative',
                overflow: 'hidden',
                transition: 'box-shadow var(--transition-fast)'
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
        >
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, height: '3px',
                background: getRegistryColor(project.registry),
                opacity: 0.8
            }} />

            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: getRegistryColor(project.registry) }}>
                        {project.registry}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                        {project.id}
                    </span>
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '48px' }}>
                    {project.name || 'Unnamed Project'}
                </h4>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {project.type || 'Unknown Type'}
                </div>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {project.country || project.region || 'Unknown Location'}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Issued</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, fontFamily: 'monospace' }}>{formatNum(project.ci)}</div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Retired</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, fontFamily: 'monospace' }}>{formatNum(project.cr)}</div>
                </div>
            </div>
        </motion.div>
    );
}
