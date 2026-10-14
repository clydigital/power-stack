/* Power Stack stock-state presentation adapter.
   Advisory labels are projections of existing stored classifications, not fresh evidence.
   Do not mutate issuer scores, holdings, action gates or Live Desk canonical state. */
(function (root) {
  'use strict';
  const tones = Object.freeze(['bullish','bearish','caution','conditional','unconfirmed','unrated','neutral']);
  const safeTone = v => tones.includes(v) ? v : 'neutral';
  const escape = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const badge = (text, tone, label) => '<span class="stock-tag stock-tag--' + safeTone(tone) + '" title="' + escape(label || text) + '">' + escape(text) + '</span>';
  const strip = (items) => '<div class="stock-tag-strip">' + items.map(x => badge(x.text,x.tone,x.label)).join('') + '</div>';

  function holding(h) {
    const state = String(h?.contradiction || '').toUpperCase().trim();
    if (state === 'CONFIRMED') return {tone:'bullish',text:'Bullish thesis',basis:'Confirmed thesis in stored holding research; not an instruction to buy'};
    if (state === 'BREAKING') return {tone:'bearish',text:'Bearish / breaking',basis:'Stored holding thesis marked BREAKING'};
    if (state === 'DIVERGING') return {tone:'caution',text:'Diverging',basis:'Stored holding thesis diverging; follow-up required'};
    if (state === 'PRICE-LED') return {tone:'caution',text:'Price-led risk',basis:'Stored assessment relies on price; issuer proof required'};
    return {tone:'unconfirmed',text:'Unconfirmed',basis:'Stored holding thesis or instrument evidence unconfirmed'};
  }

  function holdingAction(h) {
    const verdict=String(h?.verdict||'').toUpperCase(), status=String(h?.status||'').toUpperCase();
    if (h?.ticker==='6742UW') return {tone:'bearish',text:'VERIFY TERMS',basis:'Warrant instrument terms not independently verified; no new exposure'};
    if (status.includes('BREAKING') || verdict.includes('DO NOT AVERAGE DOWN')) return {tone:'bearish',text:'NO AVERAGE DOWN',basis:'Existing written holding action: no averaging down'};
    if (verdict.includes('NO ADD')||verdict.includes('NO NEW MONEY')||verdict.includes('NO INCREASE')||verdict.includes('NO CHASE')) return {tone:'caution',text:'HOLD · NO ADD',basis:'Existing holding verdict restricts fresh capital'};
    if (String(h?.action).toUpperCase()==='WAIT') return {tone:'unconfirmed',text:'WAIT',basis:'Existing holding action is WAIT'};
    return {tone:'conditional',text:String(h?.action||'REVIEW'),basis:'Existing stored holding action; not a new trade instruction'};
  }

  function watchlist(w) {
    switch (String(w?.bucket || '').toLowerCase()) {
      case 'buy': return {tone:'bullish',text:'Bullish thesis',basis:'Power Stack research-priority bucket; not a live BUY recommendation'};
      case 'selective': return {tone:'conditional',text:'Conditional',basis:'Watch / entry study bucket; entry requires further proof'};
      case 'wait': return {tone:'unconfirmed',text:'Needs proof',basis:'Wait / prove it bucket; key facts unresolved'};
      case 'avoid': return {tone:'bearish',text:'Bearish risk',basis:'Avoid / high-risk bucket; downside risk dominates'};
      default: return {tone:'neutral',text:'Unclassified',basis:'No valid research classification'};
    }
  }
  function watchlistAction(w) {
    switch (String(w?.bucket||'').toLowerCase()) {
      case 'buy': return {tone:'caution',text:'RESEARCH FIRST',basis:'Best researched setups are not automatic purchases'};
      case 'selective': return {tone:'caution',text:'WAIT / RETEST',basis:'Do not enter before the company and price gates are met'};
      case 'wait': return {tone:'unconfirmed',text:'WAIT FOR PROOF',basis:'Unresolved company or valuation evidence'};
      case 'avoid': return {tone:'bearish',text:'AVOID FOR NOW',basis:'Existing Power Stack high-risk category'};
      default: return {tone:'neutral',text:'REVIEW',basis:'No approved action mapping'};
    }
  }
  function candidate(c, w) {
    if (c?.unscored || c?.lane==='ADJACENT_RESEARCH') return {tone:'unrated',text:'Unrated research',basis:'Research-only name; no existing scored security thesis'};
    return w ? watchlist(w) : {tone:'neutral',text:'Under review',basis:'No matching canonical watchlist rating'};
  }
  function candidateAction(c) {
    const label=String(c?.action||'RESEARCH ONLY');
    if (c?.unscored) return {tone:'unrated',text:'RESEARCH ONLY',basis:'Unscored research idea; not investment-ready'};
    if (/NO CHASE/i.test(label)) return {tone:'caution',text:'NO CHASE',basis:'Recorded shortlist entry discipline'};
    if (/WAIT/i.test(label)) return {tone:'caution',text:label,basis:'Recorded shortlist entry discipline'};
    return {tone:'unconfirmed',text:label,basis:'Recorded shortlist action; verify company and entry conditions'};
  }
  function library(status) {
    if(status==='Speculative') return {tone:'bearish',text:'Speculative risk',basis:'Research status bucket; not a trading signal'};
    if(status==='Priority') return {tone:'conditional',text:'Priority research',basis:'Research priority only, no live trade gate'};
    if(status==='Core') return {tone:'bullish',text:'Core research',basis:'Existing core research classification; not a live buy call'};
    if(status==='Research Queue') return {tone:'unrated',text:'Research queue',basis:'More research required'};
    return {tone:'neutral',text:'Watchlist',basis:'No company-level action adjudication'};
  }
  function cpiImpact(observation) {
    if(!observation || !observation.macroTransmission) return null;
    const modes={
      ADVERSE:{tone:'caution',text:'CPI · Rates headwind'},
      MIXED:{tone:'neutral',text:'CPI · Two-sided'},
      FAVOURABLE_BUT_CONDITIONAL:{tone:'conditional',text:'CPI · Possible tailwind'},
      ADVERSE_WITH_HEDGE_OPTION:{tone:'caution',text:'CPI · Rates / hedge'}
    };
    const out=modes[observation.macroTransmission];
    return out?{...out,basis:String(observation.interpretation||'Macro-only interpretation. Not a company or trade rating.')}:null;
  }
  // Presentation-only playbook: instructions are curated from existing dated stock
  // evidence and must never be mistaken for executable orders or live quotes.
  const planTone = code => ({
    HOLD_NO_CHASE:'caution',HOLD_NO_ADD:'caution',VERIFY_INSTRUMENT:'bearish',
    NO_AVERAGE_DOWN:'bearish',PRIORITY_RESEARCH:'conditional',
    WAIT_FOR_ENTRY:'caution',WAIT_FOR_PROOF:'unconfirmed',AVOID:'bearish',
    RESEARCH_ONLY:'unrated'
  })[code]||'neutral';
  function planHeader(plan) {
    return '<div class="stock-plan-top">'+badge('WHAT TO DO · '+plan.label,planTone(plan.code))+
      '<span class="stock-plan-date">Decision as of 14 Oct 2026'+(plan.priority==='URGENT'?' · Urgent review':plan.priority==='HIGH'?' · Priority review':'')+'</span></div>';
  }
  const planRow = (label,body,tone) => '<div class="stock-plan-row '+(tone?'stock-plan-row--'+tone:'')+'"><b>'+escape(label)+'</b><p>'+escape(body||'Awaiting issuer evidence')+'</p></div>';
  const planFoot = (price,extra) => '<div class="stock-plan-foot">Trade gate: BLOCKED pending current quote, valuation and issuer confirmation.'+
    (price?' Prior reference: '+escape(price)+'.':'')+(extra?' '+escape(extra):'')+'</div>';
  function holdingPlan(plan,compact) {
    if(!plan)return '';
    const base='<div class="stock-plan">'+planHeader(plan)+planRow('DO NOW',plan.now,'now')+
      (compact?'<details class="stock-plan-details"><summary>See add and risk conditions</summary>':'<div class="stock-plan-conditions">')+
      planRow('CONSIDER ADDING ONLY IF',plan.addOnlyIf,'entry')+
      planRow('REVIEW REDUCING / EXIT IF',plan.reviewOrReduceIf,'risk')+
      '</'+(compact?'details':'div')+'>'+planFoot(plan.quoteAsOf?'quote '+plan.quoteAsOf:'warrant quote unavailable')+'</div>';
    return base;
  }
  function watchPlan(plan,source,review,compact) {
    if(!plan)return '';
    const unscored=plan.code==='RESEARCH_ONLY';
    const entry=unscored ? source?.mustProve : source?.entry;
    const confirm=unscored ? 'Issuer evidence and cash economics must first be verified; no rating or entry established.' : source?.confirmation;
    const fail=unscored ? source?.risk : source?.invalidation;
    const gates=planRow('ENTRY / PRICE GATE',entry,'entry')+
      planRow('COMPANY PROOF REQUIRED',confirm,'entry')+
      planRow('STAND ASIDE / REVIEW IF',fail,'risk')+
      (review?.nextProof?planRow('CPI FOLLOW-UP',review.nextProof):'');
    const details=compact?'<details class="stock-plan-details"><summary>See entry, proof and risk gates</summary>'+gates+'</details>':
      '<div class="stock-plan-conditions">'+gates+'</div>';
    const price=unscored?'unscored research only':source?.price;
    return '<div class="stock-plan">'+planHeader(plan)+planRow('DO NOW',plan.now,'now')+
      details+planFoot(price,unscored?'No instrument score or action exists.':'Any historic price/level must be rechecked.')+'</div>';
  }
  root.PowerStackState=Object.freeze({holding,holdingAction,watchlist,watchlistAction,candidate,candidateAction,library,cpiImpact,holdingPlan,watchPlan,badge,strip,escape});
})(typeof window!=='undefined'?window:globalThis);
