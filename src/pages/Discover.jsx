import React, { useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectDrawer } from '../components/ProjectDrawer';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "tween", ease: "easeOut", duration: 0.4 } }
};

function CarouselRow({ title, projects, onProjectClick }) {
    if (!projects || projects.length === 0) return null;
    return (
        <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', padding: '0 32px' }}>{title}</h2>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className="carousel"
                style={{
                    display: 'flex',
                    gap: '20px',
                    overflowX: 'auto',
                    padding: '8px 32px 24px',
                    scrollSnapType: 'x mandatory'
                }}>
                {projects.map(p => (
                    <motion.div variants={itemVariants} key={p.id} style={{ scrollSnapAlign: 'start' }}>
                        <ProjectCard project={p} onClick={onProjectClick} />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}

export default function Discover() {
    const allProjects = useProjects();
    const [selectedProject, setSelectedProject] = useState(null);

    const natureBased = allProjects.filter(p => p.scope === 'Forestry & Land Use' && p.status !== 'Canceled').sort((a, b) => (b.ci || 0) - (a.ci || 0)).slice(0, 15);
    const topGold = allProjects.filter(p => p.registry === 'GOLD' && p.status !== 'Canceled').sort((a, b) => (b.ci || 0) - (a.ci || 0)).slice(0, 15);
    const techRemovals = allProjects.filter(p => p.scope === 'Carbon Capture & Storage').sort((a, b) => (b.ci || 0) - (a.ci || 0)).slice(0, 15);

    return (
        <div style={{ paddingBottom: '60px' }}>
            <header className="top-header">
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Discover</h1>
            </header>

            <div style={{ padding: '0 32px', marginBottom: '48px', marginTop: '32px' }}>
                <div style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-light)',
                    boxShadow: 'var(--shadow-md)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '48px',
                    color: 'var(--text-primary)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Subtle accent line */}
                    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '6px', background: 'var(--accent-default)' }} />
                    <h2 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '16px', maxWidth: '600px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                        Explore the World{`'`}s Carbon Markets
                    </h2>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '500px' }}>
                        Dive into {allProjects.length.toLocaleString()} voluntary carbon projects across multiple registries.
                    </p>
                </div>
            </div>

            <CarouselRow title="Top Nature-Based Solutions" projects={natureBased} onProjectClick={setSelectedProject} />
            <CarouselRow title="Leading Gold Standard Projects" projects={topGold} onProjectClick={setSelectedProject} />
            <CarouselRow title="Carbon Capture & Tech Removals" projects={techRemovals} onProjectClick={setSelectedProject} />

            {selectedProject && (
                <ProjectDrawer project={selectedProject} onClose={() => setSelectedProject(null)} />
            )}
        </div>
    );
}
