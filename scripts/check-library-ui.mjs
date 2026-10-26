import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('research-library.html','utf8');
const css=fs.readFileSync('styles.css','utf8');
assert(html.includes('src="app.js"'),'Library does not load app.js');
assert(html.includes('id="grid"'),'Idea grid is missing');
assert(!/<\/section>\\n(?=\s*<section)/.test(html),'Visible escaped newline between sections');
assert(css.includes('.score-line.score-unrated')&&css.includes('.row-meter.score-unrated'),'Missing unrated visual treatment');

const from=app.indexOf('function validScore(');
const to=app.indexOf('function counts(',from);
assert(from>=0&&to>from,'Missing guarded score formatting');
const f=vm.runInNewContext('function clamp(v,a,b){return Math.min(b,Math.max(a,v))}\n'+app.slice(from,to)+'\n({validScore,scoreLabel,pct})');
for(const invalid of [undefined,null,'', ' ', 'NaN', 'Infinity', NaN, Infinity, 'not rated']){
  assert.equal(f.validScore(invalid,5),null,'Missing/unrated must remain unknown: '+String(invalid));
  assert.equal(f.scoreLabel(invalid,5),'—','Missing/unrated must show dash');
  assert.equal(f.pct(invalid,5),'0%','Unknown metrics must never make NaN CSS');
}
assert.equal(f.validScore(0,5),0,'Real zero must not disappear');
assert.equal(f.scoreLabel(2.5,5),'2.5','Fractional score must render');
assert.equal(f.pct(2.5,5),'50%','Half score must fill half bar');
assert.equal(f.validScore(6,5),null,'Out-of-scale score must be unrated, not silently clamped');
assert(app.includes("Theme not assigned"),'Blank theme tags are exposed');
assert(app.includes("n!==null&&n<=2"),'Unknown dependency must not be counted low-risk');
assert(app.includes("if(av===null&&bv!==null)return 1"),'Unrated items should sort last, not first');

/* The brand should anchor the main library header, while the sidebar is just a filter rail. */
const brandAndTitle=html.match(/<header class="topbar">([\s\S]*?)<div class="top-actions">/)?.[1]||'';
const sidebar=html.match(/<aside class="sidebar">([\s\S]*?)<nav class="side-scroll">/)?.[1]||'';
assert(brandAndTitle.includes('class="library-wordmark"') && brandAndTitle.includes('>Full Library</h1>'),
  'Library brand and page title must share the main header');
assert(sidebar.includes('Browse research') && !sidebar.includes('class="brand">POWER STACK'),
  'Filter rail must not duplicate the Power Stack title');
assert(html.includes('<body class="ps-library-page">'),'Full Library layout requires the scoped styles');
assert(fs.readFileSync('ps-ux.css','utf8').includes('.ps-library-page .library-wordmark'),
  'Responsive title placement styles missing');

console.log('Full Library UI guard checks passed: unknown ≠ zero, no NaN, honest missing theme, stable sort and clean layout');
