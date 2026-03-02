/**
 * generateProjectStory.js
 * 
 * Deterministic "AI-style" summary generator for carbon credit projects.
 * Reads structured project data and composes a natural-language paragraph.
 */

function fmtNum(n) {
    if (!n || n <= 0) return null;
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toLocaleString();
}

function retirementPct(ci, cr) {
    if (!ci || ci <= 0 || !cr) return null;
    return Math.round((cr / ci) * 100);
}

function describeRR(rr) {
    if (!rr) return '';
    const lower = rr.toLowerCase();
    if (lower === 'reduction') return 'emission reduction';
    if (lower.includes('removal')) return 'carbon removal';
    if (lower === 'mixed') return 'both emission reduction and carbon removal';
    return rr.toLowerCase();
}

function describeScope(scope) {
    if (!scope) return null;
    const map = {
        'Forestry & Land Use': 'forestry and land use',
        'Renewable Energy': 'renewable energy',
        'Waste Management': 'waste management',
        'Agriculture': 'agricultural',
        'Chemical Processes': 'chemical processes',
        'Industrial & Commercial': 'industrial',
        'Transportation': 'transportation',
        'Carbon Capture & Storage': 'carbon capture and storage',
        'Energy Distribution': 'energy distribution',
    };
    return map[scope] || scope.toLowerCase();
}

function projectAge(fy) {
    if (!fy) return null;
    const currentYear = new Date().getFullYear();
    const years = currentYear - fy;
    if (years <= 0) return null;
    if (years === 1) return '1 year';
    return `${years} years`;
}

export function generateProjectStory(project) {
    if (!project) return null;

    const parts = [];
    const p = project;

    // Opening — name, scope, registry, country
    let opener = p.name || 'This project';
    if (p.scope) {
        opener += ` is a ${describeScope(p.scope)} project`;
    } else {
        opener += ' is a carbon credit project';
    }
    if (p.registry) {
        opener += ` registered under ${p.registry}`;
    }
    if (p.country) {
        opener += ` in ${p.country}`;
        if (p.state && p.state.length < 30 && !p.state.includes(';')) {
            opener += `, ${p.state}`;
        }
    }
    opener += '.';
    parts.push(opener);

    // Credit story
    const ciStr = fmtNum(p.ci);
    const crStr = fmtNum(p.cr);
    const retPct = retirementPct(p.ci, p.cr);
    const age = projectAge(p.fy);

    if (ciStr) {
        let creditPart = '';
        if (age && p.fy) {
            creditPart = `Since ${p.fy}, it has issued ${ciStr} carbon credits`;
        } else {
            creditPart = `The project has issued ${ciStr} carbon credits`;
        }

        if (p.type) {
            creditPart += ` through ${p.type.toLowerCase()} activities`;
        }

        if (crStr && retPct !== null && retPct > 0) {
            creditPart += `, with ${crStr} credits retired`;
            if (retPct >= 5) {
                creditPart += ` — a ${retPct}% retirement rate`;
            }
        }

        creditPart += '.';
        parts.push(creditPart);
    }

    // Methodology / mechanism
    if (p.rr) {
        const rrDesc = describeRR(p.rr);
        let mechPart = `The project focuses on ${rrDesc}`;
        if (p.meth && p.meth.length < 100) {
            mechPart += ` using the ${p.meth} methodology`;
        }
        mechPart += '.';
        parts.push(mechPart);
    }

    // Developer
    if (p.dev && typeof p.dev === 'string' && p.dev.length > 1) {
        parts.push(`Developed by ${p.dev}.`);
    }

    // Status
    if (p.status) {
        const statusLower = p.status.toLowerCase();
        if (statusLower === 'registered') {
            parts.push('The project is currently active and registered.');
        } else if (statusLower === 'completed') {
            parts.push('The project has completed its crediting period.');
        } else if (statusLower === 'canceled' || statusLower === 'cancelled') {
            parts.push('Note: this project has been canceled.');
        }
    }

    // Buffer pool
    if (p.bp && p.bp > 0) {
        parts.push(`${fmtNum(p.bp)} credits are held in a buffer pool for permanence risk management.`);
    }

    const story = parts.join(' ');

    // Only return if we generated something meaningful (at least 2 sentences)
    return parts.length >= 2 ? story : null;
}
