const {chromium,devices}=require('playwright');const fs=require('fs');
const OUT=process.argv[2], PHOTO=process.argv[3];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({...devices['iPhone 13']});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8767/preview/');await p.waitForTimeout(1500);
console.log('bar:', await p.isVisible('.pv-bar'), '| login hidden:', !(await p.isVisible('#login')), '| runBox:', await p.isVisible('#runBox'), '| pace:', await p.textContent('#paceLine'));
await p.screenshot({path:OUT+'/pv-form.png'});
// edit the run and save
await p.fill('#runKm','5.5'); console.log('pace after edit:', await p.textContent('#paceLine'));
await p.fill('#runS','75'); await p.click('#daySave'); console.log('bad seconds:', await p.textContent('#dayErr'));
await p.fill('#runS','30'); await p.click('#daySave'); await p.waitForTimeout(300);
console.log('saved run:', await p.evaluate(()=>{const d=JSON.parse(localStorage.getItem('chalklog-preview.data.v1'));const k=Object.keys(d.workouts).sort().pop();return JSON.stringify(d.workouts[k].run)}));
console.log('recent row:', (await p.textContent('#recent li .note')));
console.log('bars running:', await p.$eval('#bars', e=>e.innerText.split('\n').slice(0,3).join(' | ')));
// share card
await p.click('#dayShare'); await p.waitForTimeout(1500);
const grab = async name => { await p.waitForTimeout(700); const d = await p.$eval('#shCanvas', c=>c.toDataURL('image/jpeg',0.85)); fs.writeFileSync(OUT+'/cards/'+name+'.jpg', Buffer.from(d.split(',')[1],'base64')); };
await grab('day-neon');
await p.click('[data-tpl=sticker]'); await grab('day-sticker');
await p.click('[data-tpl=minimal]'); await grab('day-minimal');
await p.setInputFiles('#shFile', PHOTO); await p.waitForTimeout(800);
await p.click('[data-tpl=neon]'); await grab('day-neon-photo');
await p.click('[data-tpl=sticker]'); await grab('day-sticker-photo');
await p.click('[data-tpl=minimal]'); await grab('day-minimal-photo');
await p.screenshot({path:OUT+'/pv-sharedlg.png'});
console.log('file ready:', await p.evaluate(()=>!!document.querySelector('#shCanvas')) );
await p.click('#shClose');
// PR card
await p.evaluate(()=>location.hash='#pr'); await p.waitForTimeout(300);
await p.click('[data-lift=back-squat]'); await p.waitForTimeout(300);
console.log('PR share btn:', await p.isVisible('#dlgShare'));
await p.click('#dlgShare'); await p.click('[data-tpl=neon]'); await grab('pr-neon');
await p.click('[data-tpl=sticker]'); await grab('pr-sticker');
console.log('keys:', await p.evaluate(()=>Object.keys(localStorage).join(',')));
console.log('errors:', errs);
await b.close();})();
