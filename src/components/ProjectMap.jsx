import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';

const WORLD_JSON_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// SVG Path for a map pin (similar to Lucide's MapPin)
const PIN_PATH = "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z";
const PIN_INNER_CIRCLE = "M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z";

export default function ProjectMap({ lat, lng, width = '100%', height = 200 }) {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: height });

    // Use ResizeObserver to update dimensions when container size changes
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                // Ignore height from observer, use the prop height to avoid vertical jumping 
                // but let width be responsive
                setDimensions({
                    width: entry.contentRect.width,
                    height: height
                });
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [height]);

    useEffect(() => {
        if (!lat || !lng || dimensions.width === 0) return;

        let isMounted = true;

        const drawMap = async () => {
            const response = await fetch(WORLD_JSON_URL);
            const data = await response.json();
            if (!isMounted) return;

            const countries = feature(data, data.objects.countries);

            const svg = d3.select(svgRef.current);
            svg.selectAll('*').remove();

            const w = dimensions.width;
            const h = dimensions.height;

            // Use a focus-centric projection
            const projection = d3.geoOrthographic()
                .scale(Math.min(w / 1.5, h / 1.5))
                .center([lng, lat])
                .rotate([-lng, -lat])
                .translate([w / 2, h / 2]);

            const path = d3.geoPath().projection(projection);

            // Background sphere (Sea)
            svg.append('circle')
                .attr('cx', w / 2)
                .attr('cy', h / 2)
                .attr('r', projection.scale())
                .attr('fill', 'var(--bg-base)')
                .attr('stroke', 'var(--border-light)')
                .attr('stroke-width', 0.5);

            // Graticule (grid lines)
            const graticule = d3.geoGraticule();
            svg.append('path')
                .datum(graticule())
                .attr('d', path)
                .attr('fill', 'none')
                .attr('stroke', 'var(--text-tertiary)')
                .attr('stroke-width', 0.2)
                .attr('opacity', 0.15);

            // Countries (Land)
            svg.append('g')
                .selectAll('path')
                .data(countries.features)
                .enter()
                .append('path')
                .attr('d', path)
                .attr('fill', 'var(--bg-elevated)')
                .attr('stroke', 'var(--border-medium)')
                .attr('stroke-width', 0.4);

            // Project Pin
            const [x, y] = projection([lng, lat]);

            // Pulse effect (circle under the pin)
            const pulse = svg.append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', 5)
                .attr('fill', 'var(--accent-warm)')
                .attr('opacity', 0.8);

            const repeat = () => {
                pulse.transition()
                    .duration(2000)
                    .attr('r', 25)
                    .attr('opacity', 0)
                    .transition()
                    .duration(0)
                    .attr('r', 5)
                    .attr('opacity', 0.8)
                    .on('end', repeat);
            };
            repeat();

            // Custom SVG Pin Icon
            // We scale and translate the pin path so its bottom point is at (x,y)
            const pinScale = 0.8;
            // The original pin path is drawn inside a 24x24 viewBox. Bottom point is at (12, 23).
            // Translating to center the bottom point:
            const tx = x - (12 * pinScale);
            const ty = y - (23 * pinScale);

            const pinGroup = svg.append('g')
                .attr('transform', `translate(${tx}, ${ty}) scale(${pinScale})`);

            pinGroup.append('path')
                .attr('d', PIN_PATH)
                .attr('fill', 'var(--accent-warm)')
                .attr('stroke', 'var(--bg-base)')
                .attr('stroke-width', 2);

            pinGroup.append('path')
                .attr('d', PIN_INNER_CIRCLE)
                .attr('fill', 'var(--bg-base)');

        };

        drawMap();

        return () => { isMounted = false; };
    }, [lat, lng, dimensions]);

    if (!lat || !lng) return null;

    return (
        <div ref={containerRef} style={{
            width,
            height,
            background: 'var(--bg-base)',
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
            position: 'relative',
            marginTop: 12,
            marginBottom: 20,
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
        }}>
            <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            <div style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                fontSize: '0.6rem',
                color: 'var(--text-tertiary)',
                background: 'var(--bg-elevated)',
                padding: '3px 8px',
                borderRadius: 4,
                border: '1px solid var(--border-light)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
                {lat.toFixed(4)}, {lng.toFixed(4)}
            </div>
        </div>
    );
}
