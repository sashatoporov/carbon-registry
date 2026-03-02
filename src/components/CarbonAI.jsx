import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '../hooks/useProjects';

const formatNum = (num) => num ? num.toLocaleString() : "0";

export function CarbonAI() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hello! I\'m **Carbon AI** — your local data analyst for this registry.', chips: ['overview', 'top 5 projects', 'compare registries', 'retirement rate', 'top countries'] }
    ]);
    const [inputStr, setInputStr] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const allProjects = useProjects();
    const messagesEndRef = useRef(null);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleQuery = (query) => {
        const q = query.toLowerCase().trim();
        const projects = allProjects;

        if (!projects.length) {
            setMessages(prev => [...prev, { role: 'assistant', text: "Data is still loading. Please try again in a moment." }]);
            setIsTyping(false);
            return;
        }

        let response = null;
        let fallbackChips = null;

        // ── Helper functions ──
        const fmt = (n) => n ? n.toLocaleString() : '0';
        const fmtBig = (n) => {
            if (!n) return '0';
            if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
            if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
            if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
            return n.toLocaleString();
        };

        const countryMatch = (name) => projects.filter(p => p.country && p.country.toLowerCase().includes(name));
        const scopeMatch = (name) => projects.filter(p => p.scope && p.scope.toLowerCase().includes(name));
        const registryMatch = (name) => projects.filter(p => p.registry && p.registry.toLowerCase() === name);

        // ── 1. Overview / Summary ──
        if (q.match(/^(hi|hello|hey|overview|summary|tell me about|what is this|what do you know)/)) {
            const totalProjects = projects.length;
            const totalIssued = projects.reduce((s, p) => s + (p.ci || 0), 0);
            const totalRetired = projects.reduce((s, p) => s + (p.cr || 0), 0);
            const regs = [...new Set(projects.map(p => p.registry).filter(Boolean))];
            const countries = [...new Set(projects.map(p => p.country).filter(Boolean))];
            response = `The registry contains **${fmt(totalProjects)}** projects across **${regs.length}** registries (${regs.join(', ')}) spanning **${countries.length}** countries. Total credits issued: **${fmtBig(totalIssued)}**. Total retired: **${fmtBig(totalRetired)}** (${Math.round(totalRetired / totalIssued * 100)}% retirement rate).`;
        }

        // ── 2. Registry queries ──
        else if (q.match(/what\s+(are\s+the\s+)?registries|which registries|list.*registries/)) {
            const regs = [...new Set(projects.map(p => p.registry).filter(Boolean))];
            const regCounts = regs.map(r => ({ name: r, count: projects.filter(p => p.registry === r).length }))
                .sort((a, b) => b.count - a.count);
            response = `There are **${regs.length}** registries: ${regCounts.map(r => `**${r.name}** (${fmt(r.count)})`).join(', ')}.`;
        }

        // ── 3. How many / Count queries ──
        else if (q.match(/how many|count|number of/) || q.match(/^total projects/)) {
            // Country-specific count
            const countryWords = ['india', 'brazil', 'china', 'indonesia', 'kenya', 'united states', 'colombia', 'peru', 'mexico', 'turkey', 'vietnam', 'thailand', 'cambodia', 'ethiopia', 'uganda', 'guatemala', 'honduras', 'nepal', 'bangladesh', 'myanmar', 'ghana', 'argentina', 'chile', 'south africa', 'philippines', 'pakistan', 'nigeria', 'tanzania', 'mozambique', 'malawi', 'rwanda', 'dr congo', 'drc', 'laos', 'madagascar', 'zambia', 'zimbabwe', 'dominican republic', 'nicaragua', 'panama', 'costa rica', 'uruguay', 'ecuador', 'bolivia', 'paraguay'];
            const matchedCountry = countryWords.find(c => q.includes(c));

            if (matchedCountry) {
                const matched = countryMatch(matchedCountry === 'drc' ? 'congo' : matchedCountry);
                const issued = matched.reduce((s, p) => s + (p.ci || 0), 0);
                response = `There are **${fmt(matched.length)}** projects in **${matched[0]?.country || matchedCountry}**, with a total of **${fmtBig(issued)}** credits issued.`;
            }
            else if (q.match(/verra|vcs/)) {
                const count = projects.filter(p => p.registry === 'VCS').length;
                response = `There are **${fmt(count)} Verra (VCS)** projects in the registry.`;
            }
            else if (q.match(/gold\s?standard|^gs$/)) {
                const count = projects.filter(p => p.registry === 'GOLD').length;
                response = `There are **${fmt(count)} Gold Standard** projects.`;
            }
            else if (q.match(/acr/)) {
                const count = projects.filter(p => p.registry === 'ACR').length;
                response = `There are **${fmt(count)} ACR** projects.`;
            }
            else if (q.match(/cdm|clean development/)) {
                const count = projects.filter(p => p.registry === 'CDM').length;
                response = `There are **${fmt(count)} CDM** projects.`;
            }
            else if (q.match(/nature|forest|land use/)) {
                const count = scopeMatch('forestry').length;
                response = `There are **${fmt(count)} Forestry & Land Use** (nature-based) projects.`;
            }
            else if (q.match(/renewable|energy|wind|solar/)) {
                const count = scopeMatch('renewable').length;
                response = `There are **${fmt(count)} Renewable Energy** projects.`;
            }
            else if (q.match(/waste/)) {
                const count = scopeMatch('waste').length;
                response = `There are **${fmt(count)} Waste Management** projects.`;
            }
            else if (q.match(/agri/)) {
                const count = scopeMatch('agriculture').length;
                response = `There are **${fmt(count)} Agriculture** projects.`;
            }
            else if (q.match(/active|registered/)) {
                const count = projects.filter(p => p.status === 'Registered').length;
                response = `There are **${fmt(count)}** projects with "Registered" (active) status.`;
            }
            else if (q.match(/cancel/)) {
                const count = projects.filter(p => p.status === 'Canceled' || p.status === 'Cancelled').length;
                response = `There are **${fmt(count)}** canceled projects.`;
            }
            else if (q.match(/complet/)) {
                const count = projects.filter(p => p.status === 'Completed').length;
                response = `There are **${fmt(count)}** completed projects.`;
            }
            else {
                response = `There are **${fmt(projects.length)}** projects total across all registries.`;
            }
        }

        // ── 4. Total issued / retired / credits ──
        else if (q.match(/(total|all).*(issued|issuance|credits|retired|retirement)/)) {
            if (q.includes('retired') || q.includes('retirement')) {
                const total = projects.reduce((s, p) => s + (p.cr || 0), 0);
                response = `A total of **${fmtBig(total)}** credits have been retired across all projects.`;
            } else {
                const total = projects.reduce((s, p) => s + (p.ci || 0), 0);
                response = `A total of **${fmtBig(total)}** credits have been issued across all projects.`;
            }
        }

        // ── 5. Top / Largest projects ──
        else if (q.match(/top|largest|biggest|most credits|highest/)) {
            const n = parseInt((q.match(/\d+/) || [5])[0]) || 5;
            const limit = Math.min(n, 10);
            const sorted = [...projects].filter(p => p.ci > 0).sort((a, b) => (b.ci || 0) - (a.ci || 0)).slice(0, limit);
            const list = sorted.map((p, i) => `${i + 1}. **${p.name}** (${p.registry}) — ${fmtBig(p.ci)} credits`).join('\n');
            response = `**Top ${limit} projects by credits issued:**\n${list}`;
        }

        // ── 6. Country-specific (without "how many") ──
        else if (q.match(/projects?\s+(in|from)\s+\w+/) || q.match(/\w+\s+projects?$/)) {
            const countryWords2 = ['india', 'brazil', 'china', 'indonesia', 'kenya', 'united states', 'usa', 'colombia', 'peru', 'mexico', 'turkey', 'vietnam', 'thailand', 'cambodia', 'ethiopia', 'uganda'];
            const matchedCountry2 = countryWords2.find(c => q.includes(c));
            if (matchedCountry2) {
                const matched = countryMatch(matchedCountry2 === 'usa' ? 'united states' : matchedCountry2);
                const issued = matched.reduce((s, p) => s + (p.ci || 0), 0);
                const topP = [...matched].sort((a, b) => (b.ci || 0) - (a.ci || 0)).slice(0, 3);
                const topList = topP.map(p => `**${p.name}** (${fmtBig(p.ci)})`).join(', ');
                response = `**${matched[0]?.country || matchedCountry2}** has **${fmt(matched.length)}** projects with **${fmtBig(issued)}** total credits issued. Top projects: ${topList}.`;
            }
        }

        // ── 7. Retirement rate ──
        else if (q.match(/retirement\s*rate|retire.*percent|%.*retire/)) {
            const totalIssued = projects.reduce((s, p) => s + (p.ci || 0), 0);
            const totalRetired = projects.reduce((s, p) => s + (p.cr || 0), 0);
            const pct = Math.round(totalRetired / totalIssued * 100);
            response = `The overall retirement rate is **${pct}%** — **${fmtBig(totalRetired)}** credits retired out of **${fmtBig(totalIssued)}** issued.`;
        }

        // ── 8. Compare registries ──
        else if (q.match(/compare|vs|versus|difference between/)) {
            const regs = [...new Set(projects.map(p => p.registry).filter(Boolean))];
            const stats = regs.map(r => {
                const rp = projects.filter(p => p.registry === r);
                return { name: r, count: rp.length, issued: rp.reduce((s, p) => s + (p.ci || 0), 0) };
            }).sort((a, b) => b.issued - a.issued);
            const table = stats.map(r => `**${r.name}**: ${fmt(r.count)} projects, ${fmtBig(r.issued)} issued`).join('\n');
            response = `**Registry comparison:**\n${table}`;
        }

        // ── 9. Scope / Sector breakdown ──
        else if (q.match(/scope|sector|breakdown|categories|types of projects/)) {
            const scopes = {};
            projects.forEach(p => { if (p.scope) scopes[p.scope] = (scopes[p.scope] || 0) + 1; });
            const sorted = Object.entries(scopes).sort((a, b) => b[1] - a[1]).slice(0, 8);
            const list = sorted.map(([s, c]) => `**${s}**: ${fmt(c)}`).join('\n');
            response = `**Top sectors by project count:**\n${list}`;
        }

        // ── 10. REDD / specific type ──
        else if (q.match(/redd|afforestation|cookstove|wind|solar|hydro|biogas|methane/)) {
            const typeWord = q.match(/(redd|afforestation|cookstove|wind|solar|hydro|biogas|methane)/)[1];
            const matched = projects.filter(p => (p.type && p.type.toLowerCase().includes(typeWord)) || (p.scope && p.scope.toLowerCase().includes(typeWord)));
            const issued = matched.reduce((s, p) => s + (p.ci || 0), 0);
            response = `Found **${fmt(matched.length)}** projects matching "${typeWord}" with **${fmtBig(issued)}** total credits issued.`;
        }

        // ── 11. Developer queries ──
        else if (q.match(/develop(er|ed)\s+by|who develop/)) {
            const devWord = q.replace(/.*develop(er|ed)\s+(by\s+)?/i, '').trim();
            if (devWord.length > 2) {
                const matched = projects.filter(p => p.dev && typeof p.dev === 'string' && p.dev.toLowerCase().includes(devWord));
                if (matched.length > 0) {
                    response = `Found **${fmt(matched.length)}** projects developed by "${matched[0].dev}". Total credits: **${fmtBig(matched.reduce((s, p) => s + (p.ci || 0), 0))}**.`;
                } else {
                    response = `No projects found with developer matching "${devWord}".`;
                }
            }
        }

        // ── 12. Reduction vs Removal ──
        else if (q.match(/reduction\s*(vs|versus|or|and)\s*removal|removal\s*(vs|versus|or)\s*reduction/)) {
            const reductions = projects.filter(p => p.rr === 'Reduction');
            const removals = projects.filter(p => p.rr && p.rr.toLowerCase().includes('removal'));
            const mixed = projects.filter(p => p.rr === 'Mixed');
            response = `**Reduction vs Removal:**\n**Reduction**: ${fmt(reductions.length)} projects (${fmtBig(reductions.reduce((s, p) => s + (p.ci || 0), 0))} credits)\n**Removal**: ${fmt(removals.length)} projects (${fmtBig(removals.reduce((s, p) => s + (p.ci || 0), 0))} credits)\n**Mixed**: ${fmt(mixed.length)} projects`;
        }

        // ── 13. Top countries ──
        else if (q.match(/top countries|which countries|country breakdown|countries with most/)) {
            const countries = {};
            projects.forEach(p => { if (p.country) countries[p.country] = (countries[p.country] || 0) + 1; });
            const sorted = Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 10);
            const list = sorted.map(([c, n], i) => `${i + 1}. **${c}**: ${fmt(n)} projects`).join('\n');
            response = `**Top 10 countries by project count:**\n${list}`;
        }

        // ── Fallback ──
        if (!response) {
            response = "I couldn't match that query. Try one of these:";
            fallbackChips = ['overview', 'how many projects in India', 'top 5 projects', 'retirement rate', 'compare registries', 'sector breakdown', 'reduction vs removal'];
        }

        setMessages(prev => [...prev, { role: 'assistant', text: response, chips: fallbackChips }]);
        setIsTyping(false);
    };

    const sendQuery = (query) => {
        setMessages(prev => [...prev, { role: 'user', text: query }]);
        setInputStr('');
        setIsTyping(true);
        setTimeout(() => handleQuery(query), 500 + Math.random() * 300);
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputStr.trim() || isTyping) return;
        sendQuery(inputStr.trim());
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    position: 'fixed',
                    bottom: isMobile ? '90px' : '32px',
                    right: isMobile ? '16px' : '32px',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'var(--text-primary)',
                    color: 'var(--bg-base)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 50,
                }}
            >
                <Sparkles size={24} />
            </motion.button>

            {/* Chat Interface Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            position: 'fixed',
                            bottom: isMobile ? '90px' : '100px',
                            right: isMobile ? '16px' : '32px',
                            width: isMobile ? 'calc(100% - 32px)' : '380px',
                            height: isMobile ? 'min(500px, calc(100% - 110px))' : '500px',
                            background: 'var(--bg-elevated)',
                            borderRadius: 'var(--radius-xl)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                            border: '1px solid var(--border-light)',
                            display: 'flex',
                            flexDirection: 'column',
                            zIndex: 100,
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid var(--border-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--bg-highlight)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Bot size={20} color="var(--accent-verra)" />
                                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Carbon AI</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} style={{ color: 'var(--text-tertiary)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {messages.map((msg, idx) => (
                                <div key={idx} style={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    background: msg.role === 'user' ? 'var(--text-primary)' : 'var(--bg-highlight)',
                                    color: msg.role === 'user' ? 'var(--bg-base)' : 'var(--text-primary)',
                                    padding: '12px 16px',
                                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                    fontSize: '0.9rem',
                                    lineHeight: 1.5
                                }}>
                                    <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                                    {msg.chips && msg.chips.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                                            {msg.chips.map(chip => (
                                                <button
                                                    key={chip}
                                                    onClick={() => !isTyping && sendQuery(chip)}
                                                    style={{
                                                        padding: '4px 10px',
                                                        fontSize: '0.72rem',
                                                        fontFamily: "'IBM Plex Mono', monospace",
                                                        background: 'var(--bg-base)',
                                                        border: '1px solid var(--border-light)',
                                                        borderRadius: 'var(--radius-pill)',
                                                        color: 'var(--text-secondary)',
                                                        cursor: isTyping ? 'default' : 'pointer',
                                                        transition: 'all 0.15s',
                                                        opacity: isTyping ? 0.5 : 1,
                                                    }}
                                                    onMouseEnter={e => { if (!isTyping) { e.target.style.background = 'var(--text-primary)'; e.target.style.color = 'var(--bg-base)'; } }}
                                                    onMouseLeave={e => { e.target.style.background = 'var(--bg-base)'; e.target.style.color = 'var(--text-secondary)'; }}
                                                >{chip}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isTyping && (
                                <div style={{
                                    alignSelf: 'flex-start', background: 'var(--bg-highlight)', padding: '12px 16px', borderRadius: '18px 18px 18px 4px'
                                }}>
                                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ display: 'flex', gap: '4px' }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-tertiary)' }} />
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-tertiary)' }} />
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-tertiary)' }} />
                                    </motion.div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div style={{ padding: '16px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-base)' }}>
                            <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={inputStr}
                                    onChange={e => setInputStr(e.target.value)}
                                    placeholder="Ask about registry data..."
                                    style={{
                                        width: '100%',
                                        padding: '12px 48px 12px 16px',
                                        borderRadius: 'var(--radius-pill)',
                                        border: '1px solid var(--border-light)',
                                        background: 'var(--bg-elevated)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        fontSize: '0.95rem'
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!inputStr.trim() || isTyping}
                                    style={{
                                        position: 'absolute',
                                        right: '6px',
                                        top: '6px',
                                        bottom: '6px',
                                        width: '36px',
                                        borderRadius: '50%',
                                        background: inputStr.trim() ? 'var(--text-primary)' : 'transparent',
                                        color: inputStr.trim() ? 'var(--bg-base)' : 'var(--text-tertiary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        cursor: inputStr.trim() ? 'pointer' : 'default'
                                    }}
                                >
                                    <Send size={16} style={{ marginLeft: inputStr.trim() ? '2px' : '0' }} />
                                </button>
                            </form>
                            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <AlertCircle size={10} />
                                Local contextual data query engine
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
