const {chromium,devices}=require('playwright');
(async()=>{const b=await chromium.launch();const errs=[];
const ctx=await b.newContext({...devices['iPhone 13']});
await ctx.route('**/config.js', r => r.fulfill({contentType:'application/javascript', body:"window.CHALK_CONFIG={}"}));
// a real-app user like you: goal set the old way on 11/16, records since early November
await ctx.addInitScript(() => { if (localStorage.getItem('chalklog.data.v1')) return; const W={}; ['2026-11-03','2026-11-05','2026-11-07','2026-11-10','2026-11-12','2026-11-16'].forEach(k=>W[k]={date:k,types:['crossfit'],updatedAt:1}); W['2026-11-12'].run={km:5,sec:1710}; W['2026-11-12'].types=['running']; localStorage.setItem('chalklog.data.v1', JSON.stringify({workouts:W,lifts:{},settings:{customTypes:[],goals:[{from:'2026-11-16',perWeek:4}]}})); localStorage.setItem('chalklog.guest','1'); });
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8766/'); await p.waitForTimeout(900);
const rows=()=>p.$$eval('.wrow',els=>els.map(e=>e.innerText.replace(/\n/g,' ')).join(' | '));
console.log('banner :', await p.textContent('.goal-ask p'));
console.log('before :', await rows());
await p.click('[data-goal-keep]'); await p.waitForTimeout(300);
console.log('after  :', await rows(), '|', await p.textContent('.goal-month'));
console.log('share UI:', await p.evaluate(()=>!!document.querySelector('#dayShare,#dlgShare,#celShare,#shDlg')), '| months:', await p.evaluate(()=>!!document.querySelector('.months,.mon')));
console.log('recent :', await p.$eval('#recent li .note', e=>e.textContent).catch(()=>'-'));
console.log('errors', errs); await b.close();})();
