import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { useProjects } from '../hooks/useProjects';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ZoomIn, ZoomOut, RotateCcw, Map as MapIcon, Info } from 'lucide-react';
import { ProjectDrawer } from '../components/ProjectDrawer';
import { useSearchParams, Link } from 'react-router-dom';

const WORLD_JSON_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// Normalize project country names to GeoJSON standards
const COUNTRY_NAME_MAP = {
    'United States': 'United States of America',
    'T\u00fcrkiye': 'Turkey',
    'Viet Nam': 'Vietnam',
    'Russian Federation': 'Russia',
    'Korea, Republic of': 'South Korea',
    'Lao People\'s Democratic Republic': 'Laos',
    'DRC': 'Dem. Rep. Congo',
    'Democratic Republic of the Congo': 'Dem. Rep. Congo',
    'Congo, The Democratic Republic of the': 'Dem. Rep. Congo',
    'Congo': 'Congo',
    'Côte d\'Ivoire': 'Ivory Coast',
};

// Approximate coordinates for states/provinces to enable pinning
const STATE_COORDINATES = {
    'CALIFORNIA': [-119.4179, 36.7783],
    'OHIO': [-82.9071, 40.4173],
    'ARKANSAS': [-92.2896, 34.7465],
    'TEXAS': [-99.9018, 31.9686],
    'NEW YORK': [-75.4999, 43.2994],
    'WASHINGTON': [-120.7401, 47.7511],
    'OREGON': [-120.5542, 43.8041],
    'COLORADO': [-105.7821, 39.5501],
    'FLORIDA': [-81.5158, 27.6648],
    'GEORGIA': [-83.5002, 32.1656],
    'MAINE': [-69.4455, 45.2538],
    'MICHIGAN': [-84.5068, 44.3148],
    'MINNESOTA': [-94.6859, 46.7296],
    'MISSISSIPPI': [-89.3985, 32.3547],
    'MISSOURI': [-92.2884, 37.9643],
    'PENNSYLVANIA': [-77.1945, 41.2033],
    'WISCONSIN': [-89.6165, 43.7844],
    'ILLINOIS': [-89.3985, 40.6331],
    'DURANGO': [-104.8946, 24.5505], // Mexico
    'CHIHUAHUA': [-106.4111, 28.633],
    'OAXACA': [-96.7266, 17.0732],
    'MICHOACÁN': [-101.3846, 19.5665],
    'QUINTANA ROO': [-88.4791, 19.1817],
};

export default function Map() {
    const allProjects = useProjects();
    const svgRef = useRef(null);
    const [worldData, setWorldData] = useState(null);
    const [hoveredCountry, setHoveredCountry] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const projectId = searchParams.get('project');

    const selectedProject = useMemo(() =>
        projectId ? allProjects.find(p => p.id === projectId) : null
        , [projectId, allProjects]);

    const setSelectedProject = (p) => {
        if (p) searchParams.set('project', p.id);
        else searchParams.delete('project');
        setSearchParams(searchParams);
    };

    // Aggregate project data for visualization
    const projectGeoData = useMemo(() => {
        const countryCounts = {};
        const countryProjects = {};
        const pinLocations = [];

        allProjects.forEach(p => {
            const rawCountry = p.country || 'Unknown';
            const country = COUNTRY_NAME_MAP[rawCountry] || rawCountry;

            countryCounts[country] = (countryCounts[country] || 0) + 1;
            if (!countryProjects[country]) countryProjects[country] = [];
            countryProjects[country].push(p);

            // Detailed pinning logic
            const stateKey = p.state?.toUpperCase();
            if (stateKey && STATE_COORDINATES[stateKey]) {
                const baseCoords = STATE_COORDINATES[stateKey];
                // Add minor jitter to avoid perfect overlap
                const jitterX = (Math.random() - 0.5) * 0.8;
                const jitterY = (Math.random() - 0.5) * 0.8;
                pinLocations.push({
                    id: p.id,
                    name: p.name,
                    coords: [baseCoords[0] + jitterX, baseCoords[1] + jitterY],
                    project: p
                });
            }
        });

        return { countryCounts, countryProjects, pinLocations };
    }, [allProjects]);

    useEffect(() => {
        fetch(WORLD_JSON_URL)
            .then(res => res.json())
            .then(data => {
                const countries = feature(data, data.objects.countries);
                setWorldData(countries);
            });
    }, []);

    useEffect(() => {
        if (!worldData || !svgRef.current) return;

        const width = svgRef.current.clientWidth;
        const height = svgRef.current.clientHeight;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const projection = d3.geoMercator()
            .scale(width / 6.5)
            .translate([width / 2, height / 1.5]);

        const path = d3.geoPath().projection(projection);

        const g = svg.append('g');

        const zoomRef = d3.zoom()
            .scaleExtent([1, 12])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                // Scale markers down as we zoom in
                g.selectAll('.project-marker')
                    .attr('r', d => (Math.sqrt(d.count || 1) * 2 + 1) / Math.sqrt(event.transform.k));
                g.selectAll('.precise-pin')
                    .attr('r', 3 / Math.sqrt(event.transform.k))
                    .attr('stroke-width', 0.5 / event.transform.k);
            });

        // Store zoom behavior for programmatic access
        svgRef.current.__zoomBehavior = zoomRef;

        svg.call(zoomRef);

        // Draw countries
        g.selectAll('path')
            .data(worldData.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', d => {
                const name = d.properties.name;
                const count = projectGeoData.countryCounts[name] || 0;
                return count > 0 ? 'var(--bg-inverted)' : 'var(--bg-elevated)';
            })
            .attr('stroke', 'var(--border-light)')
            .attr('stroke-width', 0.5)
            .attr('opacity', d => {
                const name = d.properties.name;
                const count = projectGeoData.countryCounts[name] || 0;
                return count > 0 ? 0.9 : 0.3;
            })
            .style('cursor', 'pointer')
            .style('transition', 'fill 0.2s ease')
            .on('mouseenter', (event, d) => {
                const name = d.properties.name;
                const count = projectGeoData.countryCounts[name] || 0;
                setHoveredCountry({ name, count, x: event.pageX, y: event.pageY });
                d3.select(event.currentTarget)
                    .attr('stroke', 'var(--accent-warm)')
                    .attr('stroke-width', 1.2);
            })
            .on('mouseleave', (event, d) => {
                setHoveredCountry(null);
                d3.select(event.currentTarget)
                    .attr('stroke', 'var(--border-light)')
                    .attr('stroke-width', 0.5);
            })
            .on('click', (event, d) => {
                // Future: Click to zoom into country or show list
            });

        // Add country-level density markers (for countries without precise pins)
        const densityMarkers = worldData.features
            .map(d => {
                const name = d.properties.name;
                const count = projectGeoData.countryCounts[name] || 0;
                if (count === 0) return null;

                // If it's USA or Mexico, we might have precise pins, but we can still show a subtle cluster
                const center = path.centroid(d);
                if (!center || isNaN(center[0])) return null;

                return { name, count, coords: center };
            })
            .filter(Boolean);

        g.selectAll('.project-marker')
            .data(densityMarkers)
            .enter()
            .append('circle')
            .attr('class', 'project-marker')
            .attr('cx', d => d.coords[0])
            .attr('cy', d => d.coords[1])
            .attr('r', d => Math.sqrt(d.count) * 2 + 1)
            .attr('fill', 'var(--accent-warm)')
            .attr('opacity', 0.4)
            .attr('stroke', 'white')
            .attr('stroke-width', 0.5)
            .style('pointer-events', 'none');

        // Add precise pins for states/cities
        g.selectAll('.precise-pin')
            .data(projectGeoData.pinLocations)
            .enter()
            .append('circle')
            .attr('class', 'precise-pin')
            .attr('cx', d => projection(d.coords)[0])
            .attr('cy', d => projection(d.coords)[1])
            .attr('r', 3)
            .attr('fill', '#fff')
            .attr('stroke', 'var(--accent-warm)')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('click', (event, d) => {
                event.stopPropagation();
                setSelectedProject(d.project);
            })
            .on('mouseenter', (event, d) => {
                setHoveredCountry({ name: d.name, count: 1, isProject: true, x: event.pageX, y: event.pageY });
            })
            .on('mouseleave', () => setHoveredCountry(null));

    }, [worldData, projectGeoData]);

    return (
        <div className="map-page-container" style={{
            height: '100vh',
            width: '100%',
            background: 'var(--bg-base)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <header className="top-header" style={{
                background: 'var(--bg-base)',
                backdropFilter: 'blur(12px)',
                zIndex: 10,
                borderBottom: '1px solid var(--border-light)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', color: 'var(--text-tertiary)', minWidth: 0 }}>
                        <Link to="/" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.6 }}>Explore</Link>
                        <ChevronRight size={14} style={{ opacity: 0.4 }} />
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Map View</span>
                    </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 12, fontFamily: "'IBM Plex Mono', monospace" }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-warm)' }}></div>
                        <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clusters</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', border: '1px solid var(--accent-warm)' }}></div>
                        <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pins</span>
                    </div>
                    <span style={{ opacity: 0.3 }}>|</span>
                    <span>{allProjects.length.toLocaleString()} Projects</span>
                </div>
            </header>

            {/* Map Canvas */}
            <div style={{ flex: 1, position: 'relative' }}>
                <svg
                    ref={svgRef}
                    style={{ width: '100%', height: '100%', display: 'block' }}
                />

                {/* Legend / Overlay */}
                <div style={{
                    position: 'absolute',
                    bottom: 32,
                    left: 32,
                    background: 'var(--bg-elevated)',
                    padding: '16px 20px',
                    border: '1px solid var(--border-light)',
                    borderRadius: 12,
                    pointerEvents: 'none',
                    zIndex: 5,
                    boxShadow: 'var(--shadow-offset)'
                }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1rem', color: 'var(--text-tertiary)', fontWeight: 700, marginBottom: 8 }}>Geographic Insight</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Project Distribution</div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4, maxWidth: 200, lineHeight: 1.4 }}>
                        Map showing project clusters by country and precise pins for sub-country locations (US, Mexico).
                    </p>
                </div>

                {/* Controls */}
                <div style={{
                    position: 'absolute',
                    top: 100,
                    right: 32,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    zIndex: 20
                }}>
                    <MapControlButton
                        icon={ZoomIn}
                        title="Zoom In"
                        onClick={() => {
                            const svg = d3.select(svgRef.current);
                            const zoom = svgRef.current.__zoomBehavior;
                            if (zoom) {
                                svg.transition()
                                    .duration(500)
                                    .call(zoom.scaleBy, 1.5);
                            }
                        }}
                    />
                    <MapControlButton
                        icon={ZoomOut}
                        title="Zoom Out"
                        onClick={() => {
                            const svg = d3.select(svgRef.current);
                            const zoom = svgRef.current.__zoomBehavior;
                            if (zoom) {
                                svg.transition()
                                    .duration(500)
                                    .call(zoom.scaleBy, 1 / 1.5);
                            }
                        }}
                    />
                    <MapControlButton
                        icon={RotateCcw}
                        title="Reset View"
                        onClick={() => {
                            const svg = d3.select(svgRef.current);
                            const zoom = svgRef.current.__zoomBehavior;
                            if (zoom) {
                                svg.transition()
                                    .duration(750)
                                    .call(zoom.transform, d3.zoomIdentity);
                            }
                        }}
                    />
                </div>
            </div>

            {/* Tooltip */}
            <AnimatePresence>
                {hoveredCountry && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        style={{
                            position: 'fixed',
                            left: hoveredCountry.x + 15,
                            top: hoveredCountry.y + 15,
                            background: 'rgba(255, 255, 255, 0.95)',
                            color: '#000',
                            padding: '10px 14px',
                            borderRadius: 8,
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            pointerEvents: 'none',
                            zIndex: 1000,
                            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2
                        }}
                    >
                        <div style={{ color: '#666', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                            {hoveredCountry.isProject ? 'Project' : hoveredCountry.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                            <span style={{ fontWeight: 800 }}>
                                {hoveredCountry.isProject ? hoveredCountry.name : hoveredCountry.count.toLocaleString()}
                            </span>
                            {!hoveredCountry.isProject && <span style={{ fontWeight: 500, opacity: 0.7 }}>Projects</span>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Project Drawer Integration */}
            <AnimatePresence>
                {selectedProject && (
                    <ProjectDrawer project={selectedProject} onClose={() => setSelectedProject(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}

function MapControlButton({ icon: Icon, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                width: 40,
                height: 40,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-light)',
                borderRadius: 10,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: 'var(--shadow-offset)'
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--bg-inset)'
                e.currentTarget.style.transform = 'translate(-1px, -1px)'
                e.currentTarget.style.boxShadow = '3px 3px 0px rgba(26, 26, 24, 0.9)'
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--bg-elevated)'
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'var(--shadow-offset)'
            }}
        >
            <Icon size={18} strokeWidth={2.5} />
        </button>
    );
}
