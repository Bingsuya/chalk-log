const {chromium,devices}=require('playwright');
const OUT=process.argv[2];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPhone 13']});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8767/preview/');await p.waitForTimeout(1200);
const weeks = async () => p.$$eval('#goalCard .wrow', els => els.map(e => e.getAttribute('title')).join(' | '));
console.log('initial header:', await p.$eval('#goalCard h2', e=>e.textContent), '| streak:', await p.$eval('.goal-streak', e=>e.textContent));
console.log('weeks:', await weeks());
console.log('msg:', await p.$eval('.goal-msg', e=>e.textContent));
await p.$eval('#goalCard', e=>e.scrollIntoView()); await p.screenshot({path:OUT+'/goal-card.png'});
// log the remaining days of this week (Tue, Wed, Thu, Fri)
const dates = await p.evaluate(()=>{ const d=new Date(); d.setDate(d.getDate()-(d.getDay()+6)%7); const out=[]; for(let i=1;i<=4;i++){ const x=new Date(d); x.setDate(d.getDate()+i); out.push(x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')); } return out; });
for (const [i,ds] of dates.entries()){
  await p.evaluate(ds => { const el=document.querySelector('#dayDate'); el.value=ds; el.dispatchEvent(new Event('change')); }, ds);
  await p.click('[data-type=crossfit]'); await p.click('#daySave'); await p.waitForTimeout(400);
  const cel = await p.isVisible('#celebrate');
  console.log(`saved ${ds}: header=${await p.$eval('#goalCard h2', e=>e.textContent)} celebrate=${cel}${cel ? ' -> '+await p.textContent('#celTitle')+' / '+await p.textContent('#celSub') : ''}`);
  if (cel){ await p.screenshot({path:OUT+`/celebrate-${i}.png`}); await p.click('#celOk'); }
}
console.log('weeks after:', await weeks());
console.log('streak after:', await p.$eval('.goal-streak', e=>e.textContent), '| msg:', await p.$eval('.goal-msg', e=>e.textContent));
// share from celebration path & goal dialog
await p.click('[data-goal-edit]'); await p.waitForTimeout(200); await p.screenshot({path:OUT+'/goal-dlg.png'});
await p.click('[data-n="3"]'); await p.click('#goalSave'); await p.waitForTimeout(300);
console.log('after change to 3:', await p.$eval('#goalCard h2', e=>e.textContent), '|', await weeks());
await p.click('[data-goal-edit]'); await p.click('#goalOff'); await p.click('#goalOff'); await p.waitForTimeout(300);
console.log('goal off -> empty state:', await p.$eval('#goalCard', e=>e.innerText.slice(0,20)));
console.log('errors', errs); await b.close();})();
