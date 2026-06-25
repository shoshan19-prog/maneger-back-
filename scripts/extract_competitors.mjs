#!/usr/bin/env node
// Extract competitor benchmarks from a burn-test xlsx -> config/competitor_benchmarks_v1.json
// Usage: node extract_competitors.mjs <file.xlsx>  (run from matriya-back for xlsx)
import path from 'path'; import { createRequire } from 'module'; import { writeFileSync } from 'fs';
const require = createRequire(import.meta.url);
let xlsx; for (const p of ['xlsx', path.resolve(process.cwd(),'../matriya-back/node_modules/xlsx')]) { try { xlsx=require(p); break; } catch(_){} }
if (!xlsx) { console.error('xlsx not found'); process.exit(2); }
const F = process.argv[2]; if (!F) { console.error('Usage: node extract_competitors.mjs <file.xlsx>'); process.exit(2); }
const num=v=>{if(v==null)return null;if(typeof v==='number')return Number.isFinite(v)?v:null;const s=String(v).trim();if(/לא נבדק|לא ניתן|^אין$|^-$/.test(s))return null;const m=(s.match(/\d+(?:\.\d+)?/g)||[]).map(Number);return m.length?(m.length>1?m.reduce((a,b)=>a+b,0)/m.length:m[0]):null;};
const COMP=/PROMAT|INTERCHAR|FIRETEX|CHARCOAT|FlameOFF|Cafco|Steelguard|Lapinus/i;
const rows=xlsx.utils.sheet_to_json(xlsx.readFile(F,{cellDates:true}).Sheets['בדיקת שריפה -פורמולציות מבוקרות'],{header:1,defval:null,blankrows:false});
const agg={};
for(let r=1;r<rows.length;r++){const row=rows[r];if(!row)continue;const prod=String(row[20]||'').trim();if(!COMP.test(prod))continue;
  const key=prod.replace(/\s+\d.*$/,'').toUpperCase().replace(/[^A-Z]/g,'');(agg[key]||=(agg[key]={product:prod,n:0,exp:[],ht:[],ttf:[],thk:[]}));
  const g=agg[key];g.n++;const e=num(row[8]),h=num(row[9]),tt=num(row[10]),tk=num(row[14]);if(e)g.exp.push(e);if(h)g.ht.push(h);if(tt)g.ttf.push(tt);if(tk)g.thk.push(tk);}
const rng=a=>a.length?[Math.min(...a),Math.max(...a)]:null;
const benchmarks=Object.values(agg).map(g=>({competitor:g.product,samples:g.n,expansion_ratio:rng(g.exp),char_height_mm:rng(g.ht),time_to_failure_min:rng(g.ttf),film_thickness_micron:rng(g.thk)}));
writeFileSync(path.resolve(path.dirname(new URL(import.meta.url).pathname),'../config/competitor_benchmarks_v1.json'),
  JSON.stringify({registry:'COMPETITOR_BENCHMARKS',version:'v1',source:'burn-test xlsx (real measurements)',note:'External boundary evidence: competitors achieve high TTF at LOW expansion (dense char) — the density>expansion boundary.',benchmarks},null,2));
console.log('competitors:',benchmarks.length);
