const {chromium,devices}=require('playwright');
const info = p => p.evaluate(()=>({head:(document.querySelector('.goal-month')||{}).textContent+' / '+(document.querySelector('#goalCard h2')||{}).textContent, streak:(document.querySelector('.goal-streak')||{}).textContent, msg:(document.querySelector('.goal-msg')||{}).textContent, weeks:[...document.querySelectorAll('#goalCard .wrow')].map(e=>e.getAttribute('title').replace(' 주 · ',' ')).join(' | '), months:[...document.querySelectorAll('.mon')].map(e=>e.innerText.replace(/\n/g,' ')).join(' || ')}));
(async()=>{const b=await chromium.launch();const p=await b.newPage({...devices['iPhone 13']});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8767/preview/');await p.evaluate(()=>Object.keys(localStorage).forEach(k=>localStorage.removeItem(k)));await p.reload();await p.waitForTimeout(1000);
// same steps as the screenshot: change goal -> this week -> 2 per week
await p.click('#goalCard [data-goal-edit]'); await p.click('#goalStart [data-from="week"]'); await p.click('[data-n="2"]'); await p.click('#goalSave'); await p.waitForTimeout(300);
console.log('this week, 2/wk:', JSON.stringify(await info(p), null, 1));
await p.$eval('#goalCard', e=>e.scrollIntoView()); await p.screenshot({path:process.argv[2]+'/fresh.png'});
await p.click('#goalCard [data-goal-edit]'); console.log('reopen:', await p.$eval('#goalStart [aria-pressed="true"]', e=>e.textContent), '| n =', await p.$eval('#goalPick [aria-pressed="true"]', e=>e.textContent));
// switch back to month start -> earlier weeks counted again with the new goal
await p.click('#goalStart [data-from="month"]'); await p.click('#goalSave'); await p.waitForTimeout(300);
console.log('month start, 2/wk:', JSON.stringify(await info(p)));
console.log('goals:', await p.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('chalklog-preview.data.v1')).settings.goals)));
console.log('errors', errs); await b.close();})();
