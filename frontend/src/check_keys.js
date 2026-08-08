const fs = require('fs');
const cp = require('child_process');
const src = fs.readFileSync('utils/uzbek.js', 'utf8');
const uz = new Set();
const m = src.match(/uz: \{([\s\S]*?)\n  \},\n  ru:/);
for (const l of m[1].split('\n')) { const k = l.match(/^\s+([a-zA-Z0-9_]+):/); if (k) uz.add(k[1]); }
const out = cp.execSync('grep -rhoE "\bt\(\x27[^\x27]+\x27\)" --include=*.jsx --include=*.js .').toString();
const used = [...new Set((out.match(/t\('([^']+)'\)/g) || []).map(x => x.slice(3, -2)))];
const missing = used.filter(k => !uz.has(k));
console.log('USED unique keys:', used.length);
console.log('MISSING from uz:', JSON.stringify(missing));
