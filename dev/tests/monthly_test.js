const {chromium,devices}=require('playwright');
const OUT=process.argv[2];
const info = p => p.evaluate(()=>({
  ask: (document.querySelector('.goal-ask p')||{}).textContent||'',
  head: ((document.querySelector('.goal-month')||{}).textContent||'') + ' / ' + ((document.querySelector('#goalCard h2')||{}).textContent||''),
  weeks: [...document.querySelectorAll('#goalCard .wrow')].map(e=>e.getAttribute('title').replace(' 주 · ',' ')).join(' | '),
  months: [...document.querySelectorAll('.mon')].map(e=>e.innerText.replace(/\n/g,' ')).join(' || ')}));
(async()=>{const b=await chromium.launch();const errs=[];
const page = async (init, time) => { const ctx=await b.newContext({...devices['iPhone 13']}); if (time) await ctx.clock.setFixedTime(new Date(time)); if (init) await ctx.addInitScript(init); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message)); await p.goto('http://localhost:8767/preview/'); await p.waitForTimeout(1000); return p; };
// A: new month prompt (seeded)
let p = await page();
console.log('A before:', JSON.stringify(await info(p)));
await p.$eval('#goalCard', e=>e.scrollIntoView()); await p.screenshot({path:OUT+'/monthly-prompt.png'});
await p.click('[data-goal-keep]'); await p.waitForTimeout(300);
console.log('A after :', JSON.stringify(await info(p)), '| saved:', await p.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('chalklog-preview.data.v1')).settings.goals)));
// B: legacy week-based goal set on 11/16, workouts since early November
const legacy = () => { if (localStorage.getItem('chalklog-preview.data.v1')) return; const W={}; ['2026-11-02','2026-11-04','2026-11-06','2026-11-07','2026-11-09','2026-11-11','2026-11-13','2026-11-16'].forEach(k=>W[k]={date:k,types:['crossfit'],updatedAt:1}); localStorage.setItem('chalklog-preview.data.v1', JSON.stringify({workouts:W,lifts:{},settings:{customTypes:[],goals:[{from:'2026-11-16',perWeek:4}]}})); localStorage.setItem('chalklog-preview.guest','1'); };
p = await page(legacy);
console.log('B before:', JSON.stringify(await info(p)));
await p.click('[data-goal-keep]'); await p.waitForTimeout(300);
console.log('B after :', JSON.stringify(await info(p)));
await p.click('#goalCard [data-goal-edit]'); console.log('B dialog:', await p.textContent('#goalTitle'), '|', await p.textContent('#goalSub'), '|', await p.textContent('#goalSave'));
await p.click('[data-n="3"]'); await p.click('#goalSave'); await p.waitForTimeout(300);
console.log('B to 3  :', JSON.stringify(await info(p)));
// C: December with a November monthly goal
const dec = () => { if (localStorage.getItem('chalklog-preview.data.v1')) return; const W={}; ['2026-11-30','2026-12-01','2026-12-02'].forEach(k=>W[k]={date:k,types:['running'],updatedAt:1}); localStorage.setItem('chalklog-preview.data.v1', JSON.stringify({workouts:W,lifts:{},settings:{customTypes:[],goals:[{from:'2026-11-02',perWeek:4,month:'2026-11'}]}})); localStorage.setItem('chalklog-preview.guest','1'); };
p = await page(dec, '2026-12-03T10:00:00');
console.log('C dec   :', JSON.stringify(await info(p)));
await p.click('#goalCard [data-goal-edit]'); console.log('C dialog:', await p.textContent('#goalTitle'), '|', await p.textContent('#goalSub'));
await p.click('[data-n="5"]'); await p.click('#goalSave'); await p.waitForTimeout(300);
console.log('C saved :', JSON.stringify(await info(p)), '|', await p.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('chalklog-preview.data.v1')).settings.goals)));
console.log('errors', errs); await b.close();})();
