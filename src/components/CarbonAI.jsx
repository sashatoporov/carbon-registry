import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '../hooks/useProjects';

const formatNum = (num) => num ? num.toLocaleString() : "0";

export function CarbonAI() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hello. I am Carbon AI. I can analyze the registry data locally. Ask me about nature-based projects, registries, or total issuances.' }
    ]);
    const [inputStr, setInputStr] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const allProjects = useProjects();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleQuery = (query) => {
        const q = query.toLowerCase();

        // Simple Heuristic Engine
        let response = "I couldn't find specific data matching that query. Try asking about 'total verra projects', 'nature based issuing', or 'gold standard'.";

        if (q.includes('how many') || q.includes('count')) {
            if (q.includes('verra') || q.includes('vcs')) {
                const count = allProjects.filter(p => p.registry === 'VCS').length;
                response = `There are exactly **${formatNum(count)} Verra (VCS)** projects in the registry.`;
            } else if (q.includes('gold') || q.includes('gs')) {
                const count = allProjects.filter(p => p.registry === 'GOLD').length;
                response = `I found **${formatNum(count)} Gold Standard** projects.`;
            } else if (q.includes('nature') || q.includes('forestry')) {
                const count = allProjects.filter(p => p.scope === 'Forestry & Land Use').length;
                response = `There are **${formatNum(count)} Nature-Based** (Forestry & Land Use) projects.`;
            } else {
                response = `There are a total of **${formatNum(allProjects.length)}** projects across all registries.`;
            }
        }
        else if (q.includes('total') && (q.includes('issued') || q.includes('issuance') || q.includes('credits'))) {
            const active = allProjects.filter(p => p.status !== 'Canceled');
            if (q.includes('nature')) {
                const total = active.filter(p => p.scope === 'Forestry & Land Use').reduce((sum, p) => sum + (p.ci || 0), 0);
                response = `Nature-based projects have issued a total of **${formatNum(total)}** credits.`;
            } else {
                const total = active.reduce((sum, p) => sum + (p.ci || 0), 0);
                response = `Globally, **${formatNum(total)}** credits have been issued across active projects.`;
            }
        }
        else if (q.includes('what') && q.includes('registries')) {
            const regs = [...new Set(allProjects.map(p => p.registry))].filter(Boolean);
            response = `The database contains projects from: **${regs.join(', ')}**.`;
        }

        setMessages(prev => [...prev, { role: 'assistant', text: response }]);
        setIsTyping(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputStr.trim()) return;

        const userMsg = inputStr.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInputStr('');
        setIsTyping(true);

        // Simulate network delay for effect
        setTimeout(() => {
            handleQuery(userMsg);
        }, 600 + Math.random() * 400);
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
                    bottom: '32px',
                    right: '32px',
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
                            bottom: '100px',
                            right: '32px',
                            width: '380px',
                            height: '500px',
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
                                    {/* Basic raw markdown bold parser just for effect */}
                                    <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
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
