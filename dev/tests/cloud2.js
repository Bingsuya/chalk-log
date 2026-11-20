const {chromium,devices}=require('playwright');
const BASE='http://localhost:8766/';
const mock = () => {
  const DBK='__mockdb', SK='__mocksession';
  const db = () => JSON.parse(localStorage.getItem(DBK)||'[]'); const save = r => localStorage.setItem(DBK, JSON.stringify(r));
  window.__fail = false;
  window.supabase = { createClient: () => {
    let cb = null;
    const sess = () => JSON.parse(localStorage.getItem(SK)||'null');
    const res = d => window.__fail ? {data:null,error:{message:'network'}} : {data:d,error:null};
    return {
      auth: {
        getSession: async () => ({data:{session:sess()}}),
        onAuthStateChange: f => { cb = f; return {data:{subscription:{unsubscribe(){}}}}; },
        signInWithOAuth: async ({options}) => { localStorage.setItem(SK, JSON.stringify({user:{id:'u1',email:'me@example.com'}})); location.href = options.redirectTo + '?code=abc'; return {error:null}; },
        signOut: async () => { localStorage.removeItem(SK); return {error:null}; },
      },
      from: () => ({
        select: async () => { if (window.__fail) return res(); const u = sess().user.id; return res(db().filter(r => r.user_id===u).map(({kind,key,data})=>({kind,key,data}))); },
        upsert: async rows => { if (window.__fail) return res(); const all = db(); rows.forEach(r => { const i = all.findIndex(x => x.user_id===r.user_id && x.kind===r.kind && x.key===r.key); if (i>=0) all[i]=r; else all.push(r); }); save(all); return res(null); },
        delete: () => ({ match: async m => { if (window.__fail) return res(); save(db().filter(r => !Object.entries(m).every(([k,v]) => r[k]===v))); return res(null); } }),
      }),
    };
  }};
};
(async()=>{
const b=await chromium.launch(); const errs=[];
const mk = async () => { const ctx=await b.newContext({...devices['iPhone 13']}); await ctx.route('**/config.js', r => r.fulfill({contentType:'application/javascript', body:"window.CHALK_CONFIG={supabaseUrl:'https://x.supabase.co',supabaseAnonKey:'k'}"})); await ctx.addInitScript(mock); const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message)); return [ctx,p]; };
const [ctx,p]=await mk();
await p.goto(BASE); await p.evaluate(()=>{ localStorage.setItem('chalklog.data.v1', JSON.stringify({workouts:{'2026-11-01':{date:'2026-11-01',types:['running'],updatedAt:1},'2026-11-02':{date:'2026-11-02',types:['crossfit'],updatedAt:1}},lifts:{},settings:{customTypes:[]}})); });
await p.reload(); await p.waitForTimeout(600);
console.log('1 login overlay shown:', await p.isVisible('#login'));
await p.screenshot({path:process.argv[2]+'/login.png'});
await p.click('#googleBtn'); await p.waitForTimeout(1200);
const st = await p.evaluate(()=>({url:location.href, anonLeft:localStorage.getItem('chalklog.data.v1'), rows:JSON.parse(localStorage.getItem('__mockdb')||'[]').length, acct:document.querySelector('#acct').innerText, login:!document.querySelector('#login').hidden}));
console.log('2 after login:', JSON.stringify(st));
await p.click('[data-type=hiking]'); await p.click('#daySave'); await p.waitForTimeout(500);
console.log('3 rows after save:', await p.evaluate(()=>JSON.parse(localStorage.getItem('__mockdb')).length));
await p.evaluate(()=>{ window.__fail = true; }); await p.evaluate(()=>location.hash='#pr'); await p.click('[data-lift=deadlift]'); await p.fill('#dlgW','140'); await p.click('#dlgForm button[type=submit]'); await p.waitForTimeout(500); await p.click('#dlgClose');
console.log('4 while failing:', await p.evaluate(()=>({chip:document.querySelector('#syncChip').textContent, queue:JSON.parse(localStorage.getItem('chalklog.queue.u1')).length})));
await p.evaluate(()=>{ window.__fail = false; window.dispatchEvent(new Event('online')); }); await p.waitForTimeout(600);
console.log('5 after reconnect:', await p.evaluate(()=>({chip:document.querySelector('#syncChip').textContent, queue:JSON.parse(localStorage.getItem('chalklog.queue.u1')).length, lift:JSON.parse(localStorage.getItem('__mockdb')).some(r=>r.kind==='lift')})));
await p.evaluate(()=>location.hash='#log'); await p.screenshot({path:process.argv[2]+'/cloud.png', fullPage:true});
// second device: same account, empty cache
const dbDump = await p.evaluate(()=>localStorage.getItem('__mockdb'));
const [ctx2,p2]=await mk(); await p2.goto(BASE); await p2.evaluate(d=>{ localStorage.setItem('__mockdb', d); localStorage.setItem('__mocksession', JSON.stringify({user:{id:'u1',email:'me@example.com'}})); }, dbDump);
await p2.reload(); await p2.waitForTimeout(800);
console.log('6 second device:', await p2.evaluate(()=>({days:document.querySelectorAll('.cal .cell.has').length, login:!document.querySelector('#login').hidden})));
// delete a day on device 1 then logout
await p.click('[data-date="2026-11-01"]'); await p.click('#dayDel'); await p.click('#dayDel'); await p.waitForTimeout(500);
console.log('7 rows after delete:', await p.evaluate(()=>JSON.parse(localStorage.getItem('__mockdb')).filter(r=>r.kind==='workout').map(r=>r.key).join(',')));
await p.click('#backupOpen'); console.log('7b wipe visible:', await p.isVisible('#wipeSec')); await p.click('#wipeBtn'); await p.click('#wipeBtn'); await p.waitForTimeout(400); console.log('7c rows after wipe:', await p.evaluate(()=>JSON.parse(localStorage.getItem('__mockdb')).length)); await p.click('#logoutBtn'); await p.click('#logoutBtn'); await p.waitForTimeout(500);
console.log('8 after logout:', await p.evaluate(()=>({login:!document.querySelector('#login').hidden, cache:localStorage.getItem('chalklog.cloud.u1'), days:document.querySelectorAll('.cal .cell.has').length})));
// guest path
await p.click('#guestBtn'); await p.click('#backupOpen'); console.log('9a wipe hidden for guest:', !(await p.isVisible('#wipeSec'))); await p.click('#bkClose'); await p.reload(); await p.waitForTimeout(500);
console.log('9 guest remembered:', await p.evaluate(()=>({login:!document.querySelector('#login').hidden, banner:document.querySelector('#banner').textContent.slice(0,20)})));
console.log('errors', errs);
await b.close();})();
