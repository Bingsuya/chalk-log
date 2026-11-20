const {chromium,devices}=require('playwright');
const BASE='http://localhost:8766/';
const mock = () => {
  window.__fb = JSON.parse(localStorage.getItem('__fb')||'[]');
  window.supabase = { createClient: () => {
    const sess = () => JSON.parse(localStorage.getItem('__mocksession')||'null');
    return {
      auth: { getSession: async () => ({data:{session:sess()}}), onAuthStateChange: () => ({data:{subscription:{unsubscribe(){}}}}), signInWithOAuth: async()=>({error:null}), signOut: async()=>({error:null}) },
      from: t => ({
        select: async () => ({data:[],error:null}),
        upsert: async () => ({data:null,error:null}),
        delete: () => ({match: async () => ({data:null,error:null})}),
        insert: async row => { const a = JSON.parse(localStorage.getItem('__fb')||'[]'); a.push({table:t, ...row}); localStorage.setItem('__fb', JSON.stringify(a)); return {data:null,error:null}; },
      }),
    };
  }};
};
(async()=>{
const b=await chromium.launch(); const errs=[];
const ctx=await b.newContext({...devices['iPhone 13']});
await ctx.route('**/config.js', r => r.fulfill({contentType:'application/javascript', body:"window.CHALK_CONFIG={supabaseUrl:'https://x.supabase.co',supabaseAnonKey:'k'}"}));
await ctx.addInitScript(mock);
const p=await ctx.newPage(); p.on('pageerror',e=>errs.push(e.message));
await p.goto(BASE); await p.evaluate(()=>localStorage.setItem('chalklog.guest','1')); await p.reload(); await p.waitForTimeout(600);
await p.click('#fbOpen'); await p.waitForTimeout(200);
await p.click('#fbForm button[type=submit]'); console.log('empty msg:', await p.textContent('#fbErr'));
await p.click('[data-cat=bug]'); await p.fill('#fbMsg','달력에서 날짜 누르면 위로 튀어요'); await p.waitForTimeout(400); await p.screenshot({path:process.argv[2]+'/fb.png'});
await p.click('#fbForm button[type=submit]'); await p.waitForTimeout(300);
console.log('guest sent:', await p.isVisible('#fbDone'), await p.evaluate(()=>localStorage.getItem('__fb')));
await p.click('#fbAgain'); await p.fill('#fbMsg','두번째'); await p.click('#fbForm button[type=submit]'); console.log('cooldown:', await p.textContent('#fbErr'));
await p.click('#fbClose');
// signed in
await p.evaluate(()=>{ localStorage.setItem('__mocksession', JSON.stringify({user:{id:'u9',email:'pal@example.com'}})); localStorage.removeItem('chalklog.fbAt'); localStorage.removeItem('__fb'); });
await p.reload(); await p.waitForTimeout(700);
await p.click('#fbOpen'); console.log('prefilled contact:', await p.inputValue('#fbContact'));
await p.fill('#fbMsg','러닝 거리도 기록하고 싶어요'); await p.click('#fbForm button[type=submit]'); await p.waitForTimeout(300);
console.log('signed-in row:', await p.evaluate(()=>localStorage.getItem('__fb')));
console.log('errors', errs); await b.close();})();
