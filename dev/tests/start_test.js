const {chromium,devices}=require('playwright');
const OUT=process.argv[2];
const weeks = p => p.evaluate(()=>[...document.querySelectorAll('#goalCard .wk')].map(e=>e.getAttribute('title').replace(' 주 · ',' ')).join(' | ')+'  ##  '+[...document.querySelectorAll('.mon')].map(e=>e.innerText.replace(/\n/g,' ')).join(' || '));
(async()=>{const b=await chromium.launch();const errs=[];
const page = async init => { const ctx=await b.newContext({...devices['iPhone 13']}); await ctx.addInitScript(init); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message)); await p.goto('http://localhost:8767/preview/'); await p.waitForTimeout(900); return p; };
const seed = (W, goals) => `if(!localStorage.getItem('chalklog-preview.data.v1')){const W={};${JSON.stringify(W)}.forEach(k=>W[k]={date:k,types:['crossfit'],updatedAt:1});localStorage.setItem('chalklog-preview.data.v1',JSON.stringify({workouts:W,lifts:{},settings:{customTypes:[],goals:${JSON.stringify(goals)}}}));localStorage.setItem('chalklog-preview.guest','1');}`;
// D: brand-new, only this week
let p = await page(seed(['2026-11-16','2026-11-17'], []));
await p.click('#goalCard [data-goal-edit]'); await p.waitForTimeout(200);
console.log('D dialog: start shown', await p.isVisible('#goalStartWrap'), '| picked', await p.$eval('#goalStart [aria-pressed="true"]', e=>e.textContent), '|', await p.textContent('#goalSub'));
await p.screenshot({path:OUT+'/goal-start.png'});
await p.click('[data-n="4"]'); await p.click('#goalSave'); await p.waitForTimeout(300);
console.log('D after :', await weeks(p));
// E: early-November records, no goal -> default month; choose this week instead
p = await page(seed(['2026-11-03','2026-11-05','2026-11-10','2026-11-16'], []));
await p.click('#goalCard [data-goal-edit]'); await p.waitForTimeout(200);
console.log('E dialog: picked', await p.$eval('#goalStart [aria-pressed="true"]', e=>e.textContent));
await p.click('#goalStart [data-from="week"]'); console.log('E sub   :', await p.textContent('#goalSub'));
await p.click('#goalSave'); await p.waitForTimeout(300); console.log('E after :', await weeks(p));
await p.click('#goalCard [data-goal-edit]'); console.log('E reopen picked:', await p.$eval('#goalStart [aria-pressed="true"]', e=>e.textContent));
// F: legacy week goal, no early records -> banner says this week
p = await page(seed(['2026-11-16'], [{from:'2026-11-16',perWeek:4}]));
console.log('F banner:', await p.textContent('.goal-ask p'));
await p.click('[data-goal-keep]'); await p.waitForTimeout(300); console.log('F after :', await weeks(p), '|', await p.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('chalklog-preview.data.v1')).settings.goals)));
console.log('errors', errs); await b.close();})();
