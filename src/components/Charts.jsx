import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';

/* ─── Color palette (e-ink muted) ─── */
const PALETTE = {
    bar1: '#8a8a82',
    bar2: '#c4501a',
    donut: ['#1a1a18', '#8a8a82', '#c4501a', '#d4c5a9', '#5c5c56', '#b0a898'],
    grid: 'rgba(26,26,24,0.08)',
    label: '#5c5c56',
    bg: '#f7f4ee',
};

/* ─── Hook: measure container width ─── */
function useContainerWidth(ref) {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        if (!ref.current) return;
        const ro = new ResizeObserver(entries => {
            for (const e of entries) setWidth(e.contentRect.width);
        });
        ro.observe(ref.current);
        setWidth(ref.current.clientWidth);
        return () => ro.disconnect();
    }, [ref]);
    return width;
}

/* ═══════════════════════════════════════════
   Yearly Issuance + Retirement Bar Chart
   ═══════════════════════════════════════════ */
export function YearlyBarChart({ projects, height = 200 }) {
    const containerRef = useRef();
    const svgRef = useRef();
    const cw = useContainerWidth(containerRef);

    const data = useMemo(() => {
        const years = [];
        for (let y = 2005; y <= 2024; y++) {
            const issued = projects.reduce((s, p) => s + (p['iv_' + y] || 0), 0);
            const retired = projects.reduce((s, p) => s + (p['rv_' + y] || 0), 0);
            years.push({ year: y, issued, retired });
        }
        return years;
    }, [projects]);

    useEffect(() => {
        if (!data.length || !svgRef.current || cw < 100) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const margin = { top: 8, right: 8, bottom: 26, left: 48 };
        const w = cw - margin.left - margin.right;
        const h = height - margin.top - margin.bottom;
        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand().domain(data.map(d => d.year)).range([0, w]).padding(0.3);
        const maxVal = d3.max(data, d => Math.max(d.issued, d.retired));
        const y = d3.scaleLinear().domain([0, maxVal * 1.08]).range([h, 0]);

        // Grid
        g.append('g').selectAll('line').data(y.ticks(4)).join('line')
            .attr('x1', 0).attr('x2', w).attr('y1', d => y(d)).attr('y2', d => y(d))
            .attr('stroke', PALETTE.grid);

        const barW = x.bandwidth() / 2 - 1;

        // Issued bars
        g.selectAll('.bi').data(data).join('rect').attr('class', 'bi')
            .attr('x', d => x(d.year)).attr('width', barW)
            .attr('y', h).attr('height', 0).attr('fill', PALETTE.bar1)
            .transition().duration(500).delay((_, i) => i * 20)
            .attr('y', d => y(d.issued)).attr('height', d => h - y(d.issued));

        // Retired bars
        g.selectAll('.br').data(data).join('rect').attr('class', 'br')
            .attr('x', d => x(d.year) + barW + 2).attr('width', barW)
            .attr('y', h).attr('height', 0).attr('fill', PALETTE.bar2)
            .transition().duration(500).delay((_, i) => i * 20)
            .attr('y', d => y(d.retired)).attr('height', d => h - y(d.retired));

        // X axis
        g.append('g').attr('transform', `translate(0,${h})`)
            .call(d3.axisBottom(x).tickFormat(d => "'" + String(d).slice(2)).tickSize(0))
            .call(g => g.select('.domain').attr('stroke', PALETTE.grid))
            .selectAll('text').attr('fill', PALETTE.label).attr('font-size', '0.55rem')
            .attr('font-family', "'IBM Plex Mono', monospace");

        // Y axis
        g.append('g')
            .call(d3.axisLeft(y).ticks(4).tickFormat(d => d >= 1e6 ? (d / 1e6).toFixed(0) + 'M' : d).tickSize(0))
            .call(g => g.select('.domain').remove())
            .selectAll('text').attr('fill', PALETTE.label).attr('font-size', '0.55rem')
            .attr('font-family', "'IBM Plex Mono', monospace");

    }, [data, cw, height]);

    return (
        <div ref={containerRef} style={{ background: PALETTE.bg, border: '1px solid var(--border-light)', padding: '14px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                    <h3 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 1 }}>Market Activity</h3>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', margin: 0 }}>Annual credits issued & retired, 2005–2024</p>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: '0.6rem', color: PALETTE.label }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ width: 8, height: 8, background: PALETTE.bar1, display: 'inline-block' }} /> Issued
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ width: 8, height: 8, background: PALETTE.bar2, display: 'inline-block' }} /> Retired
                    </span>
                </div>
            </div>
            {cw > 0 && <svg ref={svgRef} width={cw} height={height} style={{ display: 'block' }} />}
        </div>
    );
}

/* ═══════════════════════════════════════════
   Donut Chart
   ═══════════════════════════════════════════ */
export function DonutChart({ data, title, subtitle, size = 120 }) {
    const svgRef = useRef();

    useEffect(() => {
        if (!data || !data.length || !svgRef.current) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const r = size / 2;
        const ir = r * 0.55;
        const g = svg.append('g').attr('transform', `translate(${r},${r})`);
        const color = d3.scaleOrdinal().range(PALETTE.donut);
        const pie = d3.pie().value(d => d.value).sort(null).padAngle(0.02);
        const arc = d3.arc().innerRadius(ir).outerRadius(r - 2);

        g.selectAll('.arc').data(pie(data)).join('g').attr('class', 'arc')
            .append('path').attr('fill', (_, i) => color(i))
            .attr('d', d3.arc().innerRadius(ir).outerRadius(r - 2).startAngle(d => d.startAngle).endAngle(d => d.startAngle))
            .transition().duration(600).delay((_, i) => i * 60)
            .attrTween('d', function (d) {
                const interp = d3.interpolate(d.startAngle, d.endAngle);
                return t => arc({ ...d, endAngle: interp(t) });
            });

        const total = data.reduce((s, d) => s + d.value, 0);
        g.append('text').attr('text-anchor', 'middle').attr('dy', '-0.1em')
            .attr('fill', 'var(--text-primary)').attr('font-size', '0.95rem').attr('font-weight', 800)
            .attr('font-family', "'IBM Plex Mono', monospace")
            .text(total >= 1000 ? (total / 1000).toFixed(1) + 'K' : total.toLocaleString());
        g.append('text').attr('text-anchor', 'middle').attr('dy', '1.1em')
            .attr('fill', 'var(--text-tertiary)').attr('font-size', '0.5rem').attr('font-weight', 600)
            .text('TOTAL');
    }, [data, size]);

    return (
        <div style={{ background: PALETTE.bg, border: '1px solid var(--border-light)', padding: '12px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <svg ref={svgRef} width={size} height={size} style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 2 }}>{title}</h3>
                {subtitle && <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', margin: '0 0 8px 0' }}>{subtitle}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {data.slice(0, 6).map((d, i) => (
                        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.65rem' }}>
                            <span style={{ width: 6, height: 6, background: PALETTE.donut[i % PALETTE.donut.length], flexShrink: 0 }} />
                            <span style={{ color: 'var(--text-secondary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</span>
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: '0.6rem' }}>{d.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════
   Sparkline (for ProjectDrawer)
   ═══════════════════════════════════════════ */
export function Sparkline({ project, width = 200, height = 40 }) {
    const svgRef = useRef();

    const data = useMemo(() => {
        const points = [];
        for (let y = 2005; y <= 2025; y++) {
            const val = project['iv_' + y] || 0;
            if (val > 0 || points.length > 0) points.push({ year: y, value: val });
        }
        return points;
    }, [project]);

    useEffect(() => {
        if (!data.length || !svgRef.current) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([2, width - 2]);
        const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value)]).range([height - 2, 2]);

        svg.append('path').datum(data)
            .attr('fill', 'rgba(26,26,24,0.06)')
            .attr('d', d3.area().x(d => x(d.year)).y0(height).y1(d => y(d.value)).curve(d3.curveMonotoneX));

        svg.append('path').datum(data)
            .attr('fill', 'none').attr('stroke', PALETTE.bar2).attr('stroke-width', 1.5)
            .attr('d', d3.line().x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveMonotoneX));
    }, [data, width, height]);

    if (!data.length) return null;

    return (
        <div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
                Issuance History
            </div>
            <svg ref={svgRef} width={width} height={height} style={{ display: 'block' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: 'var(--text-tertiary)', fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>
                <span>{data[0]?.year}</span>
                <span>{data[data.length - 1]?.year}</span>
            </div>
        </div>
    );
}
