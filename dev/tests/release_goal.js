const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPhone 13']});
await ctx.route('**/config.js', r => r.fulfill({contentType:'application/javascript', body:"window.CHALK_CONFIG={}"}));
await ctx.addInitScript(() => {
  if (localStorage.getItem('chalklog.data.v1')) return;
  const pad=n=>String(n).padStart(2,'0'); const mon=new Date(); mon.setDate(mon.getDate()-(mon.getDay()+6)%7);
  const at=(w,d)=>{const x=new Date(mon); x.setDate(x.getDate()+w*7+d); return x.getFullYear()+'-'+pad(x.getMonth()+1)+'-'+pad(x.getDate());};
  const W={}; const add=(w,d,t)=>{const k=at(w,d); W[k]={date:k,types:t,updatedAt:1};};
  add(-1,0,['crossfit']); add(-1,2,['crossfit']); add(-1,4,['crossfit']); add(0,0,['crossfit']);
  localStorage.setItem('chalklog.data.v1', JSON.stringify({workouts:W,lifts:{},settings:{customTypes:[],goals:[{from:at(-1,0),perWeek:4}]}}));
  localStorage.setItem('chalklog.guest','1');
});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/');await p.waitForTimeout(800);
console.log('months:', await p.$$eval('.mon',els=>els.map(e=>e.innerText.replace(/\n/g,' / ')).join(' || '))); console.log('goal:', await p.$eval('#goalCard h2', e=>e.textContent), '|', await p.$eval('.goal-msg', e=>e.textContent.slice(0,40)));
console.log('share UI present:', await p.evaluate(()=>!!document.querySelector('#dayShare,#dlgShare,#celShare,#shDlg')));
await p.click('[data-type=running]'); console.log('run box:', await p.isVisible('#runBox'));
await p.fill('#runKm','5'); await p.fill('#runM','27'); await p.fill('#runS','30'); console.log('pace:', await p.textContent('#paceLine'));
await p.click('#daySave'); await p.waitForTimeout(300);
const days = await p.evaluate(()=>{const d=new Date(); d.setDate(d.getDate()-(d.getDay()+6)%7); return [2,3,4].map(i=>{const x=new Date(d); x.setDate(d.getDate()+i); return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');});});
for (const ds of days){ await p.evaluate(ds=>{const el=document.querySelector('#dayDate'); el.value=ds; el.dispatchEvent(new Event('change'));}, ds); await p.click('[data-type=weight]'); await p.click('#daySave'); await p.waitForTimeout(300);
  if (await p.isVisible('#celebrate')){ console.log('celebrate at', ds, ':', await p.textContent('#celTitle'), '| buttons:', await p.$$eval('#celebrate button', bs=>bs.map(b=>b.textContent).join(','))); await p.click('#celOk'); } }
console.log('errors', errs); await b.close();})();
