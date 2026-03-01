import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectDrawer } from '../components/ProjectDrawer';
import { YearlyBarChart, DonutChart } from '../components/Charts';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

/* ─── Section wrapper ─── */
function Section({ id, title, subtitle, children, style, onViewAll }) {
    return (
        <section id={id} style={{ marginBottom: 36, ...style }}>
            <div className="section-header" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{title}</h2>
                    {subtitle && <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{subtitle}</p>}
                </div>
                <span
                    onClick={onViewAll}
                    style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
                >
                    View all <ChevronRight size={14} />
                </span>
            </div>
            {children}
        </section>
    );
}

/* ─── Carousel ─── */
function Carousel({ projects, onClick, variant }) {
    if (!projects || projects.length === 0) return null;
    return (
        <div className="carousel-scroll">
            {projects.map((p, i) => (
                <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                >
                    <ProjectCard project={p} onClick={onClick} variant={variant} />
                </motion.div>
            ))}
        </div>
    );
}

/* ─── Category pills ─── */
const CATEGORIES = ['All', 'Forestry', 'Renewables', 'Agriculture', 'Waste', 'Transport', 'Industrial', 'CCS'];

function CategoryFilter({ active, onChange }) {
    return (
        <div className="section-header" style={{
            display: 'flex', gap: 6, marginBottom: 20,
            overflowX: 'auto', scrollbarWidth: 'none',
        }}>
            {CATEGORIES.map(cat => {
                const isActive = cat === active;
                return (
                    <button
                        key={cat}
                        onClick={() => onChange(cat)}
                        style={{
                            padding: '6px 16px',
                            fontSize: '0.8rem',
                            fontWeight: isActive ? 700 : 500,
                            background: isActive ? 'var(--bg-inverted)' : 'var(--bg-elevated)',
                            color: isActive ? 'var(--text-inverted)' : 'var(--text-secondary)',
                            border: `1px solid ${isActive ? 'var(--bg-inverted)' : 'var(--border-light)'}`,
                            borderRadius: 20,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all var(--transition-snap)',
                        }}
                    >
                        {cat}
                    </button>
                );
            })}
        </div>
    );
}

/* ─── Stat card ─── */
function StatCard({ label, value }) {
    return (
        <div style={{
            padding: '18px 20px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-light)',
            flex: 1,
            minWidth: 140,
        }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '-0.03em' }}>{value}</div>
        </div>
    );
}

/* ─── MAIN PAGE ─── */
export default function Discover() {
    const allProjects = useProjects();
    const [selectedProject, setSelectedProject] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');

    // Data slices
    const registered = useMemo(() => allProjects.filter(p => p.status === 'Registered'), [allProjects]);

    const topByCredits = useMemo(() =>
        [...registered].sort((a, b) => (b.ci || 0) - (a.ci || 0)).slice(0, 20),
        [registered]
    );

    const recentlyAdded = useMemo(() =>
        [...allProjects].sort((a, b) => {
            const da = a.dt_add || ''; const db = b.dt_add || '';
            return db.localeCompare(da);
        }).slice(0, 20),
        [allProjects]
    );

    const natureBased = useMemo(() =>
        registered.filter(p => p.scope === 'Forestry & Land Use').sort((a, b) => (b.ci || 0) - (a.ci || 0)).slice(0, 20),
        [registered]
    );

    const goldStandard = useMemo(() =>
        registered.filter(p => p.registry === 'GOLD').sort((a, b) => (b.ci || 0) - (a.ci || 0)).slice(0, 20),
        [registered]
    );

    const techRemovals = useMemo(() =>
        allProjects.filter(p => p.scope === 'Carbon Capture & Storage' || p.type === 'Biochar').sort((a, b) => (b.ci || 0) - (a.ci || 0)).slice(0, 20),
        [allProjects]
    );

    const renewables = useMemo(() =>
        registered.filter(p => p.scope === 'Renewable Energy').sort((a, b) => (b.ci || 0) - (a.ci || 0)).slice(0, 20),
        [registered]
    );

    // Category filtered trending
    const categoryFiltered = useMemo(() => {
        let pool = registered;
        if (activeCategory !== 'All') {
            const scopeMap = {
                'Forestry': 'Forestry & Land Use',
                'Renewables': 'Renewable Energy',
                'Agriculture': 'Agriculture',
                'Waste': 'Waste Management',
                'Transport': 'Transportation',
                'Industrial': 'Industrial & Commercial',
                'CCS': 'Carbon Capture & Storage',
            };
            const scope = scopeMap[activeCategory];
            if (scope) pool = pool.filter(p => p.scope === scope);
        }
        return pool.sort((a, b) => (b.ci || 0) - (a.ci || 0)).slice(0, 8);
    }, [registered, activeCategory]);

    // Stats
    const totalIssued = useMemo(() =>
        allProjects.reduce((s, p) => s + (p.ci || 0), 0),
        [allProjects]
    );
    const totalRetired = useMemo(() =>
        allProjects.reduce((s, p) => s + (p.cr || 0), 0),
        [allProjects]
    );

    // Donut data
    const registryDonut = useMemo(() => {
        const counts = {};
        allProjects.forEach(p => { counts[p.registry] = (counts[p.registry] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
    }, [allProjects]);

    const scopeDonut = useMemo(() => {
        const counts = {};
        allProjects.forEach(p => { if (p.scope) counts[p.scope] = (counts[p.scope] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value }));
    }, [allProjects]);

    const fmtBig = (n) => {
        if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
        if (n >= 1e6) return (n / 1e6).toFixed(0) + 'M';
        if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
        return n.toLocaleString();
    };

    const navigate = useNavigate();
    const handleViewAll = () => navigate('/explore');

    return (
        <div style={{ paddingBottom: 60 }}>
            {/* Sticky header */}
            <header className="top-header">
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Discover</h1>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {allProjects.length.toLocaleString()} projects
                </span>
            </header>

            {/* ─── Hero stats strip ─── */}
            <div className="stats-grid">
                <StatCard label="Total Projects" value={allProjects.length.toLocaleString()} />
                <StatCard label="Credits Issued" value={fmtBig(totalIssued)} />
                <StatCard label="Credits Retired" value={fmtBig(totalRetired)} />
                <StatCard label="Registries" value={[...new Set(allProjects.map(p => p.registry))].length} />
            </div>

            {/* ─── Charts section ─── */}
            <section id="section-charts" style={{ marginBottom: 36 }}>
                <div className="section-header">
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Market Overview</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 2 }}>Voluntary carbon market at a glance</p>
                </div>
                <div className="market-grid">
                    <YearlyBarChart projects={allProjects} height={200} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <DonutChart data={registryDonut} title="By Registry" subtitle="Project count per registry" size={110} />
                        <DonutChart data={scopeDonut} title="By Sector" subtitle="Top 6 project sectors" size={110} />
                    </div>
                </div>
            </section>

            {/* ─── 1. Top projects carousel ─── */}
            <Section id="section-top" title="Top Projects by Volume" subtitle="Highest total credits issued" onViewAll={handleViewAll}>
                <Carousel projects={topByCredits} onClick={setSelectedProject} variant="wide" />
            </Section>

            {/* ─── 2. Category-filtered trending ─── */}
            <section style={{ marginBottom: 36 }}>
                <div style={{ padding: '0 32px', marginBottom: 12, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <div>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Trending by Sector</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                            Browse projects by category
                        </p>
                    </div>
                    <span
                        onClick={handleViewAll}
                        style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
                    >
                        View all <ChevronRight size={14} />
                    </span>
                </div>

                <CategoryFilter active={activeCategory} onChange={setActiveCategory} />

                <div style={{ padding: '0 32px' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeCategory}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: 16,
                            }}
                        >
                            {categoryFiltered.map(p => (
                                <ProjectCard key={p.id} project={p} onClick={setSelectedProject} variant="compact" />
                            ))}
                        </motion.div>
                    </AnimatePresence>
                    {categoryFiltered.length === 0 && (
                        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                            No registered projects in this category.
                        </div>
                    )}
                </div>
            </section>

            {/* ─── 3. Nature-Based carousel ─── */}
            <Section id="section-nature" title="Nature-Based Solutions" subtitle="Forestry, land use, and conservation" onViewAll={handleViewAll}>
                <Carousel projects={natureBased} onClick={setSelectedProject} />
            </Section>

            {/* ─── 4. Recently added carousel ─── */}
            <Section title="Recently Added" subtitle="Latest additions to the registries" onViewAll={handleViewAll}>
                <Carousel projects={recentlyAdded} onClick={setSelectedProject} />
            </Section>

            {/* ─── 5. Gold Standard carousel ─── */}
            <Section title="Gold Standard Highlights" subtitle="Top Gold Standard certified projects" onViewAll={handleViewAll}>
                <Carousel projects={goldStandard} onClick={setSelectedProject} />
            </Section>

            {/* ─── 6. Tech Removals carousel ─── */}
            <Section id="section-tech" title="Tech & Carbon Removals" subtitle="CCS, biochar, and emerging removal technologies" onViewAll={handleViewAll}>
                <Carousel projects={techRemovals} onClick={setSelectedProject} />
            </Section>

            {/* ─── 7. Renewables carousel ─── */}
            <Section id="section-renewables" title="Renewable Energy" subtitle="Wind, solar, hydro, and biomass" onViewAll={handleViewAll}>
                <Carousel projects={renewables} onClick={setSelectedProject} />
            </Section>

            {/* Drawer */}
            {selectedProject && (
                <ProjectDrawer project={selectedProject} onClose={() => setSelectedProject(null)} />
            )}
        </div>
    );
}
