import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import { useProjects } from '../hooks/useProjects';
import { formatNum } from '../utils/formatters';

/* ─── Shared palette (matches Charts.jsx) ─── */
const PALETTE = {
    bar1: '#8a8a82',
    bar2: '#c4501a',
    donut: ['#1a1a18', '#8a8a82', '#c4501a', '#d4c5a9', '#5c5c56', '#b0a898'],
    grid: 'rgba(26,26,24,0.08)',
    label: '#5c5c56',
    bg: '#f7f4ee',
    accent: '#c4501a',
    muted: '#d4c5a9',
    dark: '#1a1a18',
};

const EXTENDED_PALETTE = [
    '#1a1a18', '#c4501a', '#8a8a82', '#d4c5a9', '#5c5c56',
    '#b0a898', '#6b4c3b', '#a0522d', '#3c3c38', '#7a7a72',
    '#c49a6c', '#4a4a44', '#9c6644', '#2e2e2a', '#b8b0a0',
];

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

/* ─── Chart wrapper ─── */
function ChartCard({ title, subtitle, children, span }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={span === 2 ? 'data-card-wide' : 'data-card'}
            style={{
                background: PALETTE.bg,
                border: '1px solid var(--border-light)',
                padding: '20px',
                overflow: 'visible',
                minWidth: 0,
            }}
        >
            <div style={{ marginBottom: 14 }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 2 }}>{title}</h3>
                {subtitle && <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', margin: 0 }}>{subtitle}</p>}
            </div>
            {children}
        </motion.div>
    );
}

/* ─── Format helpers ─── */
const fmtBig = (n) => {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toLocaleString();
};

/* ═══════════════════════════════════════════
   1. Market Growth — Stacked Area
   ═══════════════════════════════════════════ */
function MarketGrowthChart({ projects }) {
    const containerRef = useRef();
    const svgRef = useRef();
    const tooltipRef = useRef();
    const cw = useContainerWidth(containerRef);
    const height = 280;

    const data = useMemo(() => {
        const years = [];
        let cumulative = 0;
        for (let y = 2005; y <= 2024; y++) {
            const issued = projects.reduce((s, p) => s + (p['iv_' + y] || 0), 0);
            cumulative += issued;
            years.push({ year: y, annual: issued, cumulative });
        }
        return years;
    }, [projects]);

    useEffect(() => {
        if (!data.length || !svgRef.current || cw < 100) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const margin = { top: 10, right: 12, bottom: 28, left: 52 };
        const w = cw - margin.left - margin.right;
        const h = height - margin.top - margin.bottom;
        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLinear().domain([2005, 2024]).range([0, w]);
        const y = d3.scaleLinear().domain([0, d3.max(data, d => d.cumulative) * 1.08]).range([h, 0]);

        // Grid lines
        g.append('g').selectAll('line').data(y.ticks(5)).join('line')
            .attr('x1', 0).attr('x2', w).attr('y1', d => y(d)).attr('y2', d => y(d))
            .attr('stroke', PALETTE.grid);

        // Area
        const area = d3.area()
            .x(d => x(d.year))
            .y0(h)
            .y1(d => y(d.cumulative))
            .curve(d3.curveMonotoneX);

        g.append('path').datum(data)
            .attr('fill', 'rgba(26,26,24,0.08)')
            .attr('d', area);

        // Line
        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.cumulative))
            .curve(d3.curveMonotoneX);

        const path = g.append('path').datum(data)
            .attr('fill', 'none')
            .attr('stroke', PALETTE.dark)
            .attr('stroke-width', 2)
            .attr('d', line);

        // Animate line
        const totalLength = path.node().getTotalLength();
        path.attr('stroke-dasharray', totalLength)
            .attr('stroke-dashoffset', totalLength)
            .transition().duration(1200).ease(d3.easeCubicInOut)
            .attr('stroke-dashoffset', 0);

        // Dots
        g.selectAll('.dot').data(data).join('circle').attr('class', 'dot')
            .attr('cx', d => x(d.year)).attr('cy', d => y(d.cumulative))
            .attr('r', 0).attr('fill', PALETTE.dark)
            .transition().duration(300).delay((_, i) => 1200 + i * 30)
            .attr('r', 3);

        // X axis
        g.append('g').attr('transform', `translate(0,${h})`)
            .call(d3.axisBottom(x).ticks(10).tickFormat(d => "'" + String(d).slice(2)).tickSize(0))
            .call(g => g.select('.domain').attr('stroke', PALETTE.grid))
            .selectAll('text').attr('fill', PALETTE.label).attr('font-size', '0.55rem')
            .attr('font-family', "'IBM Plex Mono', monospace");

        // Y axis
        g.append('g')
            .call(d3.axisLeft(y).ticks(5).tickFormat(d => fmtBig(d)).tickSize(0))
            .call(g => g.select('.domain').remove())
            .selectAll('text').attr('fill', PALETTE.label).attr('font-size', '0.55rem')
            .attr('font-family', "'IBM Plex Mono', monospace");

    }, [data, cw]);

    return (
        <ChartCard title="Cumulative Market Growth" subtitle="Total credits issued over time, 2005–2024" span={2}>
            <div ref={containerRef} style={{ overflow: 'hidden' }}>
                {cw > 0 && <svg ref={svgRef} width={cw} height={height} style={{ display: 'block' }} />}
            </div>
        </ChartCard>
    );
}

/* ═══════════════════════════════════════════
   2. Issuance vs Retirement Gap
   ═══════════════════════════════════════════ */
function IssuanceRetirementGap({ projects }) {
    const containerRef = useRef();
    const svgRef = useRef();
    const cw = useContainerWidth(containerRef);
    const height = 260;

    const data = useMemo(() => {
        const years = [];
        for (let y = 2005; y <= 2024; y++) {
            const issued = projects.reduce((s, p) => s + (p['iv_' + y] || 0), 0);
            const retired = projects.reduce((s, p) => s + (p['rv_' + y] || 0), 0);
            years.push({ year: y, issued, retired, gap: issued - retired });
        }
        return years;
    }, [projects]);

    useEffect(() => {
        if (!data.length || !svgRef.current || cw < 100) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const margin = { top: 10, right: 12, bottom: 28, left: 52 };
        const w = cw - margin.left - margin.right;
        const h = height - margin.top - margin.bottom;
        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand().domain(data.map(d => d.year)).range([0, w]).padding(0.25);
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

        // Gap line
        const line = d3.line()
            .x(d => x(d.year) + x.bandwidth() / 2)
            .y(d => y(d.gap > 0 ? d.gap : 0))
            .curve(d3.curveMonotoneX);

        g.append('path').datum(data)
            .attr('fill', 'none')
            .attr('stroke', PALETTE.muted)
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '4,3')
            .attr('d', line);

        // X axis
        g.append('g').attr('transform', `translate(0,${h})`)
            .call(d3.axisBottom(x).tickFormat(d => "'" + String(d).slice(2)).tickSize(0))
            .call(g => g.select('.domain').attr('stroke', PALETTE.grid))
            .selectAll('text').attr('fill', PALETTE.label).attr('font-size', '0.55rem')
            .attr('font-family', "'IBM Plex Mono', monospace");

        // Y axis
        g.append('g')
            .call(d3.axisLeft(y).ticks(4).tickFormat(d => fmtBig(d)).tickSize(0))
            .call(g => g.select('.domain').remove())
            .selectAll('text').attr('fill', PALETTE.label).attr('font-size', '0.55rem')
            .attr('font-family', "'IBM Plex Mono', monospace");
    }, [data, cw]);

    return (
        <ChartCard title="Issuance vs Retirement" subtitle="Annual volumes and the supply surplus (dashed line), 2005–2024" span={2}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: '0.6rem', color: PALETTE.label }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, background: PALETTE.bar1, display: 'inline-block' }} /> Issued
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, background: PALETTE.bar2, display: 'inline-block' }} /> Retired
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 16, height: 0, borderTop: '1.5px dashed ' + PALETTE.muted, display: 'inline-block' }} /> Surplus
                </span>
            </div>
            <div ref={containerRef} style={{ overflow: 'hidden' }}>
                {cw > 0 && <svg ref={svgRef} width={cw} height={height} style={{ display: 'block' }} />}
            </div>
        </ChartCard>
    );
}

/* ═══════════════════════════════════════════
   3. Registry Market Share — Horizontal Bars
   ═══════════════════════════════════════════ */
function RegistryMarketShare({ projects }) {
    const containerRef = useRef();
    const svgRef = useRef();
    const cw = useContainerWidth(containerRef);

    const data = useMemo(() => {
        const map = {};
        projects.forEach(p => {
            if (p.ci > 0) map[p.registry] = (map[p.registry] || 0) + (p.ci || 0);
        });
        return Object.entries(map)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value);
    }, [projects]);

    const height = data.length * 32 + 40;

    useEffect(() => {
        if (!data.length || !svgRef.current || cw < 100) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const margin = { top: 8, right: 60, bottom: 8, left: 56 };
        const w = cw - margin.left - margin.right;
        const h = height - margin.top - margin.bottom;
        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const y = d3.scaleBand().domain(data.map(d => d.label)).range([0, h]).padding(0.3);
        const x = d3.scaleLinear().domain([0, d3.max(data, d => d.value)]).range([0, w]);

        // Bars
        g.selectAll('.bar').data(data).join('rect').attr('class', 'bar')
            .attr('y', d => y(d.label))
            .attr('height', y.bandwidth())
            .attr('x', 0).attr('width', 0)
            .attr('fill', (_, i) => i === 0 ? PALETTE.dark : PALETTE.bar1)
            .transition().duration(600).delay((_, i) => i * 50)
            .attr('width', d => x(d.value));

        // Labels left
        g.selectAll('.lbl').data(data).join('text').attr('class', 'lbl')
            .attr('x', -8).attr('y', d => y(d.label) + y.bandwidth() / 2)
            .attr('text-anchor', 'end').attr('dominant-baseline', 'central')
            .attr('fill', PALETTE.label).attr('font-size', '0.65rem')
            .attr('font-family', "'IBM Plex Mono', monospace")
            .attr('font-weight', 600)
            .text(d => d.label);

        // Value labels
        g.selectAll('.val').data(data).join('text').attr('class', 'val')
            .attr('x', d => x(d.value) + 6).attr('y', d => y(d.label) + y.bandwidth() / 2)
            .attr('dominant-baseline', 'central')
            .attr('fill', PALETTE.label).attr('font-size', '0.6rem')
            .attr('font-family', "'IBM Plex Mono', monospace")
            .attr('font-weight', 600)
            .text(d => fmtBig(d.value));
    }, [data, cw]);

    return (
        <ChartCard title="Registry Market Share" subtitle="Total credits issued by registry">
            <div ref={containerRef} style={{ overflow: 'hidden' }}>
                {cw > 0 && <svg ref={svgRef} width={cw} height={height} style={{ display: 'block' }} />}
            </div>
        </ChartCard>
    );
}

/* ═══════════════════════════════════════════
   4. Sector Treemap
   ═══════════════════════════════════════════ */
function SectorTreemap({ projects }) {
    const containerRef = useRef();
    const svgRef = useRef();
    const tooltipRef = useRef();
    const cw = useContainerWidth(containerRef);
    const height = 280;

    const data = useMemo(() => {
        const map = {};
        projects.forEach(p => {
            if (p.scope && p.ci > 0) map[p.scope] = (map[p.scope] || 0) + (p.ci || 0);
        });
        return {
            name: 'root',
            children: Object.entries(map).map(([name, value]) => ({ name, value }))
        };
    }, [projects]);

    useEffect(() => {
        if (!data.children.length || !svgRef.current || cw < 100) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
        const tip = d3.select(tooltipRef.current);

        const root = d3.hierarchy(data).sum(d => d.value).sort((a, b) => b.value - a.value);
        d3.treemap().size([cw, height]).padding(2).round(true)(root);
        const total = root.value;

        const color = d3.scaleOrdinal().range(EXTENDED_PALETTE);

        const nodes = svg.selectAll('.node').data(root.leaves()).join('g').attr('class', 'node')
            .style('cursor', 'pointer');

        nodes.append('rect')
            .attr('x', d => d.x0).attr('y', d => d.y0)
            .attr('width', d => d.x1 - d.x0).attr('height', d => d.y1 - d.y0)
            .attr('fill', (_, i) => color(i))
            .attr('opacity', 0)
            .transition().duration(500).delay((_, i) => i * 40)
            .attr('opacity', 0.85);

        // Tooltip interactions
        nodes
            .on('mouseenter', function (event, d) {
                d3.select(this).select('rect').transition().duration(120).attr('opacity', 1);
                const pct = ((d.value / total) * 100).toFixed(1);
                tip.html(`<strong>${d.data.name}</strong><br/>${fmtBig(d.value)} credits · ${pct}%`)
                    .style('opacity', 1);
            })
            .on('mousemove', function (event) {
                const bounds = containerRef.current.getBoundingClientRect();
                const tx = event.clientX - bounds.left; const tf = tx > bounds.width * 0.7; tip.style('left', (tf ? tx - 180 : tx + 12) + 'px')
                    .style('top', (event.clientY - bounds.top - 10) + 'px');
            })
            .on('mouseleave', function () {
                d3.select(this).select('rect').transition().duration(120).attr('opacity', 0.85);
                tip.style('opacity', 0);
            });

        // Labels (only if box is large enough)
        nodes.each(function (d) {
            const boxW = d.x1 - d.x0;
            const boxH = d.y1 - d.y0;
            if (boxW < 60 || boxH < 36) return;
            const g = d3.select(this);
            g.append('text')
                .attr('x', d.x0 + 6).attr('y', d.y0 + 16)
                .attr('fill', '#fff').attr('font-size', boxW < 100 ? '0.55rem' : '0.65rem')
                .attr('font-weight', 700)
                .attr('pointer-events', 'none')
                .text(d.data.name.length > 20 ? d.data.name.slice(0, 18) + '…' : d.data.name);
            g.append('text')
                .attr('x', d.x0 + 6).attr('y', d.y0 + 30)
                .attr('fill', 'rgba(255,255,255,0.7)').attr('font-size', '0.55rem')
                .attr('font-family', "'IBM Plex Mono', monospace")
                .attr('pointer-events', 'none')
                .text(fmtBig(d.value));
        });
    }, [data, cw]);

    return (
        <ChartCard title="Sector Breakdown" subtitle="Credits issued by sector — area represents volume">
            <div ref={containerRef} style={{ overflow: 'hidden', position: 'relative' }}>
                {cw > 0 && <svg ref={svgRef} width={cw} height={height} style={{ display: 'block' }} />}
                <div ref={tooltipRef} style={{
                    position: 'absolute', pointerEvents: 'none', opacity: 0,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-light)',
                    padding: '6px 10px', fontSize: '0.65rem', lineHeight: 1.4,
                    fontFamily: "'IBM Plex Mono', monospace", color: 'var(--text-primary)',
                    boxShadow: '2px 2px 0px rgba(26,26,24,0.12)', zIndex: 10,
                    transition: 'opacity 0.15s ease', whiteSpace: 'nowrap',
                }} />
            </div>
        </ChartCard>
    );
}

/* ═══════════════════════════════════════════
   5. Geographic Distribution — Top 20 Countries
   ═══════════════════════════════════════════ */
function GeographicDistribution({ projects }) {
    const containerRef = useRef();
    const svgRef = useRef();
    const cw = useContainerWidth(containerRef);

    const data = useMemo(() => {
        const map = {};
        projects.forEach(p => {
            if (p.country && p.ci > 0) map[p.country] = (map[p.country] || 0) + (p.ci || 0);
        });
        return Object.entries(map)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 20);
    }, [projects]);

    const height = data.length * 28 + 30;

    useEffect(() => {
        if (!data.length || !svgRef.current || cw < 100) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const margin = { top: 6, right: 60, bottom: 6, left: 90 };
        const w = cw - margin.left - margin.right;
        const h = height - margin.top - margin.bottom;
        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const y = d3.scaleBand().domain(data.map(d => d.label)).range([0, h]).padding(0.25);
        const x = d3.scaleLinear().domain([0, d3.max(data, d => d.value)]).range([0, w]);

        // Bars
        g.selectAll('.bar').data(data).join('rect').attr('class', 'bar')
            .attr('y', d => y(d.label)).attr('height', y.bandwidth())
            .attr('x', 0).attr('width', 0)
            .attr('fill', (_, i) => i < 3 ? PALETTE.dark : PALETTE.bar1)
            .transition().duration(400).delay((_, i) => i * 25)
            .attr('width', d => x(d.value));

        // Country labels
        g.selectAll('.lbl').data(data).join('text').attr('class', 'lbl')
            .attr('x', -8).attr('y', d => y(d.label) + y.bandwidth() / 2)
            .attr('text-anchor', 'end').attr('dominant-baseline', 'central')
            .attr('fill', PALETTE.label).attr('font-size', '0.6rem')
            .text(d => d.label.length > 14 ? d.label.slice(0, 12) + '…' : d.label);

        // Values
        g.selectAll('.val').data(data).join('text').attr('class', 'val')
            .attr('x', d => x(d.value) + 6).attr('y', d => y(d.label) + y.bandwidth() / 2)
            .attr('dominant-baseline', 'central')
            .attr('fill', PALETTE.label).attr('font-size', '0.55rem')
            .attr('font-family', "'IBM Plex Mono', monospace").attr('font-weight', 600)
            .text(d => fmtBig(d.value));
    }, [data, cw]);

    return (
        <ChartCard title="Top Countries" subtitle="Top 20 countries ranked by total credits issued">
            <div ref={containerRef} style={{ overflow: 'hidden' }}>
                {cw > 0 && <svg ref={svgRef} width={cw} height={height} style={{ display: 'block' }} />}
            </div>
        </ChartCard>
    );
}

/* ═══════════════════════════════════════════
   6. Project Pipeline — stacked bar by status
   ═══════════════════════════════════════════ */
function ProjectPipeline({ projects }) {
    const containerRef = useRef();
    const svgRef = useRef();
    const cw = useContainerWidth(containerRef);
    const height = 260;

    const { chartData, statuses, registries } = useMemo(() => {
        const statusSet = new Set();
        const regMap = {};
        projects.forEach(p => {
            const reg = p.registry || 'Other';
            const st = p.status || 'Unknown';
            statusSet.add(st);
            if (!regMap[reg]) regMap[reg] = {};
            regMap[reg][st] = (regMap[reg][st] || 0) + 1;
        });
        const statuses = [...statusSet].sort();
        const registries = Object.keys(regMap).sort((a, b) => {
            const totalA = Object.values(regMap[a]).reduce((s, v) => s + v, 0);
            const totalB = Object.values(regMap[b]).reduce((s, v) => s + v, 0);
            return totalB - totalA;
        });
        const chartData = registries.map(reg => {
            const obj = { registry: reg };
            statuses.forEach(st => { obj[st] = regMap[reg][st] || 0; });
            return obj;
        });
        return { chartData, statuses, registries };
    }, [projects]);

    useEffect(() => {
        if (!chartData.length || !svgRef.current || cw < 100) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const margin = { top: 8, right: 12, bottom: 28, left: 56 };
        const w = cw - margin.left - margin.right;
        const h = height - margin.top - margin.bottom;
        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleBand().domain(registries).range([0, w]).padding(0.3);
        const color = d3.scaleOrdinal().domain(statuses).range(EXTENDED_PALETTE);

        const stack = d3.stack().keys(statuses)(chartData);
        const maxVal = d3.max(stack[stack.length - 1], d => d[1]);
        const y = d3.scaleLinear().domain([0, maxVal * 1.08]).range([h, 0]);

        // Grid
        g.append('g').selectAll('line').data(y.ticks(4)).join('line')
            .attr('x1', 0).attr('x2', w).attr('y1', d => y(d)).attr('y2', d => y(d))
            .attr('stroke', PALETTE.grid);

        // Stacked bars
        g.selectAll('.layer').data(stack).join('g').attr('class', 'layer')
            .attr('fill', d => color(d.key))
            .selectAll('rect').data(d => d).join('rect')
            .attr('x', d => x(d.data.registry)).attr('width', x.bandwidth())
            .attr('y', h).attr('height', 0)
            .transition().duration(500).delay((_, i) => i * 30)
            .attr('y', d => y(d[1])).attr('height', d => y(d[0]) - y(d[1]));

        // X axis
        g.append('g').attr('transform', `translate(0,${h})`)
            .call(d3.axisBottom(x).tickSize(0))
            .call(g => g.select('.domain').attr('stroke', PALETTE.grid))
            .selectAll('text').attr('fill', PALETTE.label).attr('font-size', '0.6rem')
            .attr('font-family', "'IBM Plex Mono', monospace").attr('font-weight', 600);

        // Y axis
        g.append('g')
            .call(d3.axisLeft(y).ticks(4).tickFormat(d => fmtBig(d)).tickSize(0))
            .call(g => g.select('.domain').remove())
            .selectAll('text').attr('fill', PALETTE.label).attr('font-size', '0.55rem')
            .attr('font-family', "'IBM Plex Mono', monospace");
    }, [chartData, cw]);

    const topStatuses = useMemo(() => {
        const counts = {};
        projects.forEach(p => { counts[p.status || 'Unknown'] = (counts[p.status || 'Unknown'] || 0) + 1; });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, [projects]);

    return (
        <ChartCard title="Project Pipeline" subtitle="Projects by status across registries" span={2}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8, fontSize: '0.6rem', color: PALETTE.label }}>
                {topStatuses.map(([st], i) => (
                    <span key={st} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ width: 8, height: 8, background: EXTENDED_PALETTE[statuses.indexOf(st) % EXTENDED_PALETTE.length], display: 'inline-block' }} />
                        {st}
                    </span>
                ))}
            </div>
            <div ref={containerRef} style={{ overflow: 'hidden' }}>
                {cw > 0 && <svg ref={svgRef} width={cw} height={height} style={{ display: 'block' }} />}
            </div>
        </ChartCard>
    );
}

/* ═══════════════════════════════════════════
   7. Reduction vs Removal — Donut + Bars
   ═══════════════════════════════════════════ */
function ReductionVsRemoval({ projects }) {
    const svgRef = useRef();
    const size = 120;

    const data = useMemo(() => {
        const map = {};
        projects.forEach(p => {
            const cat = p.rr || 'Unknown';
            map[cat] = (map[cat] || 0) + 1;
        });
        return Object.entries(map)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value);
    }, [projects]);

    const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

    useEffect(() => {
        if (!data.length || !svgRef.current) return;
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

        g.append('text').attr('text-anchor', 'middle').attr('dy', '-0.1em')
            .attr('fill', 'var(--text-primary)').attr('font-size', '0.85rem').attr('font-weight', 800)
            .attr('font-family', "'IBM Plex Mono', monospace")
            .text(fmtBig(total));
        g.append('text').attr('text-anchor', 'middle').attr('dy', '1.1em')
            .attr('fill', 'var(--text-tertiary)').attr('font-size', '0.45rem').attr('font-weight', 600)
            .text('PROJECTS');
    }, [data, size, total]);

    return (
        <ChartCard title="Reduction vs Removal" subtitle="Project count by credit type">
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <svg ref={svgRef} width={size} height={size} style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    {data.map((d, i) => {
                        const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : 0;
                        return (
                            <div key={d.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <span style={{ width: 7, height: 7, background: PALETTE.donut[i % PALETTE.donut.length], display: 'inline-block', flexShrink: 0 }} />
                                        {d.label}
                                    </span>
                                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>
                                        {d.value.toLocaleString()} ({pct}%)
                                    </span>
                                </div>
                                <div style={{ height: 6, background: 'var(--border-light)', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: pct + '%' }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                                        style={{ height: '100%', background: PALETTE.donut[i % PALETTE.donut.length] }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </ChartCard>
    );
}

/* ═══════════════════════════════════════════
   8. Methodology Landscape — Top 15
   ═══════════════════════════════════════════ */
function MethodologyLandscape({ projects }) {
    const containerRef = useRef();
    const svgRef = useRef();
    const cw = useContainerWidth(containerRef);

    const data = useMemo(() => {
        const map = {};
        projects.forEach(p => {
            if (p.meth) {
                // In some cases meth contains multiple semicolon-separated methodologies
                const primary = p.meth.split(';')[0].trim();
                // Shorten long methodology names
                const short = primary.length > 50 ? primary.slice(0, 47) + '…' : primary;
                map[short] = (map[short] || 0) + 1;
            }
        });
        return Object.entries(map)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 15);
    }, [projects]);

    const height = data.length * 28 + 30;

    useEffect(() => {
        if (!data.length || !svgRef.current || cw < 100) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const margin = { top: 6, right: 40, bottom: 6, left: 200 };
        const w = cw - margin.left - margin.right;
        const h = height - margin.top - margin.bottom;
        if (w < 30) return;
        const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        const y = d3.scaleBand().domain(data.map(d => d.label)).range([0, h]).padding(0.25);
        const x = d3.scaleLinear().domain([0, d3.max(data, d => d.value)]).range([0, w]);

        // Bars
        g.selectAll('.bar').data(data).join('rect').attr('class', 'bar')
            .attr('y', d => y(d.label)).attr('height', y.bandwidth())
            .attr('x', 0).attr('width', 0)
            .attr('fill', (_, i) => i < 3 ? PALETTE.accent : PALETTE.bar1)
            .transition().duration(400).delay((_, i) => i * 25)
            .attr('width', d => x(d.value));

        // Labels
        g.selectAll('.lbl').data(data).join('text').attr('class', 'lbl')
            .attr('x', -6).attr('y', d => y(d.label) + y.bandwidth() / 2)
            .attr('text-anchor', 'end').attr('dominant-baseline', 'central')
            .attr('fill', PALETTE.label).attr('font-size', '0.55rem')
            .text(d => d.label.length > 30 ? d.label.slice(0, 28) + '…' : d.label);

        // Values
        g.selectAll('.val').data(data).join('text').attr('class', 'val')
            .attr('x', d => x(d.value) + 5).attr('y', d => y(d.label) + y.bandwidth() / 2)
            .attr('dominant-baseline', 'central')
            .attr('fill', PALETTE.label).attr('font-size', '0.55rem')
            .attr('font-family', "'IBM Plex Mono', monospace").attr('font-weight', 600)
            .text(d => d.value);
    }, [data, cw]);

    return (
        <ChartCard title="Top Methodologies" subtitle="Most commonly used methodologies by project count">
            <div ref={containerRef} style={{ overflow: 'hidden' }}>
                {cw > 0 && <svg ref={svgRef} width={cw} height={height} style={{ display: 'block' }} />}
            </div>
        </ChartCard>
    );
}

/* ═══════════════════════════════════════════
   9. Top Developers — Circle Pack
   ═══════════════════════════════════════════ */
function TopDevelopers({ projects }) {
    const containerRef = useRef();
    const svgRef = useRef();
    const tooltipRef = useRef();
    const cw = useContainerWidth(containerRef);

    const data = useMemo(() => {
        const map = {};
        projects.forEach(p => {
            if (p.dev && typeof p.dev === 'string' && p.dev.length > 1 && p.ci > 0) {
                const dev = p.dev.trim();
                if (!map[dev]) map[dev] = { issued: 0, projects: 0 };
                map[dev].issued += (p.ci || 0);
                map[dev].projects += 1;
            }
        });
        return Object.entries(map)
            .map(([label, { issued, projects }]) => ({ label, issued, projects }))
            .sort((a, b) => b.issued - a.issued)
            .slice(0, 20);
    }, [projects]);

    const chartH = Math.min(cw || 300, 360);

    useEffect(() => {
        if (!data.length || !svgRef.current || cw < 100) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
        const tip = d3.select(tooltipRef.current);

        const hierarchy = d3.hierarchy({ children: data }).sum(d => d.issued);
        const pack = d3.pack().size([cw, chartH]).padding(3);
        const root = pack(hierarchy);

        const g = svg.append('g');
        const nodes = g.selectAll('.node').data(root.leaves()).join('g').attr('class', 'node')
            .style('cursor', 'pointer');

        // Circles
        nodes.append('circle')
            .attr('cx', d => d.x).attr('cy', d => d.y)
            .attr('r', 0)
            .attr('fill', (_, i) => i < 3 ? PALETTE.accent : PALETTE.bar1)
            .attr('stroke', 'var(--bg-base)').attr('stroke-width', 1.5)
            .on('mouseenter', function (event, d) {
                d3.select(this).transition().duration(120).attr('fill', PALETTE.dark);
                tip.html(`<strong>${d.data.label}</strong><br/>${fmtBig(d.data.issued)} credits · ${d.data.projects} projects`)
                    .style('opacity', 1);
            })
            .on('mousemove', function (event) {
                const bounds = containerRef.current.getBoundingClientRect();
                const tx = event.clientX - bounds.left; const tf = tx > bounds.width * 0.7; tip.style('left', (tf ? tx - 180 : tx + 12) + 'px')
                    .style('top', (event.clientY - bounds.top - 10) + 'px');
            })
            .on('mouseleave', function (event, d) {
                const i = root.leaves().indexOf(d);
                d3.select(this).transition().duration(120).attr('fill', i < 3 ? PALETTE.accent : PALETTE.bar1);
                tip.style('opacity', 0);
            })
            .transition().duration(500).delay((_, i) => i * 25)
            .attr('r', d => d.r);

        // Labels inside circles — only if radius is large enough
        nodes.filter(d => d.r > 22).append('text')
            .attr('x', d => d.x).attr('y', d => d.y - 4)
            .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
            .attr('fill', (_, i) => i < 3 ? '#fff' : 'var(--text-primary)')
            .attr('font-size', d => Math.min(d.r / 4.5, 10) + 'px')
            .attr('font-weight', 600)
            .text(d => d.data.label.length > 14 ? d.data.label.slice(0, 12) + '…' : d.data.label)
            .style('pointer-events', 'none');

        nodes.filter(d => d.r > 28).append('text')
            .attr('x', d => d.x).attr('y', d => d.y + 9)
            .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
            .attr('fill', (_, i) => i < 3 ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)')
            .attr('font-size', d => Math.min(d.r / 5.5, 8) + 'px')
            .attr('font-family', "'IBM Plex Mono', monospace").attr('font-weight', 600)
            .text(d => fmtBig(d.data.issued))
            .style('pointer-events', 'none');
    }, [data, cw, chartH]);

    return (
        <ChartCard title="Top Developers" subtitle="Bubble size = total credits issued">
            <div ref={containerRef} style={{ overflow: 'visible', position: 'relative' }}>
                {cw > 0 && <svg ref={svgRef} width={cw} height={chartH} style={{ display: 'block' }} />}
                <div ref={tooltipRef} style={{
                    position: 'absolute', pointerEvents: 'none', opacity: 0,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-light)',
                    padding: '6px 10px', fontSize: '0.65rem', lineHeight: 1.4,
                    fontFamily: "'IBM Plex Mono', monospace", color: 'var(--text-primary)',
                    boxShadow: '2px 2px 0px rgba(26,26,24,0.12)', zIndex: 10,
                    transition: 'opacity 0.15s ease', whiteSpace: 'nowrap',
                }} />
            </div>
        </ChartCard>
    );
}

/* ═══════════════════════════════════════════
   KPI Strip
   ═══════════════════════════════════════════ */
function KpiStrip({ projects }) {
    const stats = useMemo(() => {
        const totalIssued = projects.reduce((s, p) => s + (p.ci || 0), 0);
        const totalRetired = projects.reduce((s, p) => s + (p.cr || 0), 0);
        const registries = new Set(projects.map(p => p.registry)).size;
        const countries = new Set(projects.filter(p => p.country).map(p => p.country)).size;
        const registered = projects.filter(p => p.status === 'Registered').length;
        const retirementRate = totalIssued > 0 ? ((totalRetired / totalIssued) * 100).toFixed(1) : 0;
        return [
            { label: 'Total Projects', value: projects.length.toLocaleString() },
            { label: 'Credits Issued', value: fmtBig(totalIssued) },
            { label: 'Credits Retired', value: fmtBig(totalRetired) },
            { label: 'Retirement Rate', value: retirementRate + '%' },
            { label: 'Registries', value: registries },
            { label: 'Countries', value: countries },
        ];
    }, [projects]);

    return (
        <div className="data-kpi-strip">
            {stats.map((s, i) => (
                <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    style={{
                        padding: '16px 20px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-light)',
                        flex: 1,
                        minWidth: 120,
                    }}
                >
                    <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '-0.03em' }}>{s.value}</div>
                </motion.div>
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function DataPage() {
    const projects = useProjects();

    return (
        <div style={{ paddingBottom: 60 }}>
            {/* Sticky header */}
            <header className="top-header">
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Data</h1>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: "'IBM Plex Mono', monospace" }}>
                    Market analytics & insights
                </span>
            </header>

            {/* KPI Strip */}
            <KpiStrip projects={projects} />

            {/* Charts grid */}
            <div className="data-grid">
                <MarketGrowthChart projects={projects} />
                <IssuanceRetirementGap projects={projects} />
                <RegistryMarketShare projects={projects} />
                <SectorTreemap projects={projects} />
                <GeographicDistribution projects={projects} />
                <MethodologyLandscape projects={projects} />
                <ProjectPipeline projects={projects} />
                <ReductionVsRemoval projects={projects} />
                <TopDevelopers projects={projects} />
            </div>
        </div>
    );
}
