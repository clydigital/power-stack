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
const brandAndTitle=html.match(/<header class="topbar">([\s\S]*?)<div class="top-actions[^"]*">/)?.[1]||'';
const sidebar=html.match(/<aside class="sidebar">([\s\S]*?)<nav class="side-scroll"[^>]*>/)?.[1]||'';
assert(brandAndTitle.includes('class="library-wordmark"') && brandAndTitle.includes('<h1 id="libraryTitle">Full Library</h1>'),
  'Library brand and page title must share the main header');
assert(sidebar.includes('library-filter-title">Filters') && !sidebar.includes('class="brand">POWER STACK'),
  'Filter rail must be a compact filter header without duplicated branding');
assert(!sidebar.includes('LIBRARY FILTERS') && !sidebar.includes('Browse research'),
  'Legacy two-line title must not reappear in the filter rail');
assert(html.includes('class="side-section library-universe"') && html.includes('aria-label="Research filters"'),
  'First filter must be compact and the filter navigation labelled');
const libraryStyles=fs.readFileSync('ps-ux.css','utf8');
assert(libraryStyles.includes('.ps-library-page .side-scroll .mini-track{display:none}'),
  'Dashboard-like progress bars should be hidden in filter navigation');
assert(libraryStyles.includes('flex:0 0 auto;min-height:56px') && libraryStyles.includes('.ps-library-page .library-filter-heading::after{display:none}'),
  'Filter header must not shrink, clip or show the decorative overlay');
assert(html.includes('<body class="ps-library-page">'),'Full Library layout requires the scoped styles');
assert(fs.readFileSync('ps-ux.css','utf8').includes('.ps-library-page .library-wordmark'),
  'Responsive title placement styles missing');


const topbar=html.match(/<header class="topbar">([\s\S]*?)<\/header>/)?.[1]||'';
assert(topbar.includes('class="top-actions library-utilities"') && topbar.includes('id="liveBadge"'),
  'Library header must retain a compact live-status indicator');
assert(!topbar.includes('Investment desk ↗'),
  'Desk is part of the flat section navigation and should not be duplicated in the header');
assert(!topbar.includes('Market Motion →')&&!topbar.includes('Developing Themes →')&&!topbar.includes('Current Holdings →')&&!topbar.includes('Strategy baskets →'),
  'Full research navigation should live in the workspace switcher, not large stacked header buttons');
assert(!app.includes("$('h1').textContent="),
  'Filter interactions must never overwrite the permanent Full Library page heading');
assert(app.includes('const selectedFilters=')&&app.includes("selectedFilters.join(' · ')"),
  'Selected research filters should remain visible beneath the fixed heading');
assert(fs.readFileSync('ps-ux.css','utf8').includes('body.ps-library-page .ps-library-tabs a[aria-current="page"]'),
  'Library navigation needs a stable, underline-only active state');
assert(fs.readFileSync('ps-ux.css','utf8').includes('border:0; border-bottom:2px solid transparent; border-radius:0'),
  'Library navigation must not render pill-style action buttons');


// External market data remains accessible but is not the owner of research or actions.
assert(html.includes('<details class="ps-macro-evidence"') && html.includes('id="marketEvidenceStatus"'),
  'Optional market evidence must be a real, accessible disclosure with a source state');
assert(html.indexOf('id="grid"') < html.indexOf('id="marketEvidence"'),
  'Investment research should precede external market detail');
assert(html.includes('id="livePulse"') && html.includes('id="contextBody"') && html.includes('id="bondMetrics"'),
  'Collapsing macro panels must preserve their existing data containers');
assert(html.includes('class="ps-sidebar-market-source"') && html.includes('Research ownership'),
  'The sidebar should prioritise Power Stack research and make macro source details optional');
assert(html.includes('Power Stack independently evaluates issuer fundamentals'),
  'Explain market evidence ownership separately from company and portfolio authority');
assert(css.includes('.ps-library-page .single-context{display:block;grid-template-columns:none'),
  'Regime explanation must not be trapped in the unused 180px grid column');
assert(app.includes('function macroFeedPartial()') && app.includes('sourceStatus'),
  'Degraded Live Desk source health must not be presented as clean fresh evidence');
assert(app.includes('Power Stack decision:') && app.includes('Live Desk market interpretation:'),
  'External macro interpretation and Power Stack judgement must have separate labels');
assert(!app.includes('Live rates & market state → Power Stack'),
  'Library must not present a Live-branded page headline instead of research results');

console.log('Full Library UI guard checks passed: unknown ≠ zero, no NaN, honest missing theme, stable sort and clean layout');
