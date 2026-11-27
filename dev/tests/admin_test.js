// 관리자 페이지(admin.html) 확인: 로그인 화면 · 관리자 아님 · 대시보드(휴대폰/데스크톱 다크)
// 사용법: node dev/tests/admin_test.js <스크린샷 폴더> <통계 JSON 파일>
//   통계 JSON 모양: {"stats": admin_stats() 결과, "fb": admin_feedback() 결과 배열}
const {chromium, devices} = require('playwright');
const fs = require('fs');
const OUT = process.argv[2], DATA = fs.readFileSync(process.argv[3], 'utf8');
const BASE = 'http://localhost:8766/';

const mock = (DATA) => {
  const D = JSON.parse(DATA);
  window.supabase = { createClient: () => {
    const sess = () => JSON.parse(localStorage.getItem('__s') || 'null');
    return {
      auth: {
        getSession: async () => ({data:{session:sess()}}),
        onAuthStateChange: () => ({data:{subscription:{unsubscribe(){}}}}),
        signInWithOAuth: async () => ({error:null}),
        signOut: async () => { localStorage.setItem('__s', 'null'); return {error:null}; },
      },
      rpc: async (fn) => {
        const admin = localStorage.getItem('__admin') === '1';
        if (fn === 'is_admin') return {data:admin, error:null};
        if (!admin) return {data:null, error:{code:'42501', message:'관리자만 볼 수 있어요.'}};
        if (fn === 'admin_stats') return {data:D.stats, error:null};
        if (fn === 'admin_feedback') return {data:D.fb, error:null};
      },
    };
  }};
};

(async () => {
  const b = await chromium.launch(); const errs = [];
  const run = async (name, ctxOpts, setup) => {
    const ctx = await b.newContext(ctxOpts);
    await ctx.route('**/config.js', r => r.fulfill({contentType:'application/javascript', body:"window.CHALK_CONFIG={supabaseUrl:'https://x.supabase.co',supabaseAnonKey:'k'}"}));
    await ctx.route('**/supabase.js', r => r.fulfill({contentType:'application/javascript', body:''}));
    await ctx.addInitScript(mock, DATA);
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(name + ' console: ' + m.text()); });
    await p.goto(BASE + 'admin.html'); await p.evaluate(setup); await p.reload(); await p.waitForTimeout(900);
    const vis = await p.evaluate(() => ['vLoading','vNoCloud','vLogin','vNotAdmin','vError','vDash'].filter(v => !document.getElementById(v).hidden));
    const hs = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(name, 'visible:', vis, 'hscroll:', hs);
    return {p, ctx};
  };
  const phone = {...devices['iPhone 13']};
  const admin = () => { localStorage.setItem('__s', JSON.stringify({user:{id:'u1', email:'admin@example.com'}})); localStorage.setItem('__admin', '1'); };

  let r = await run('login', phone, () => {});
  await r.p.screenshot({path:OUT + '/a_login.png'}); await r.ctx.close();

  r = await run('notadmin', phone, () => { localStorage.setItem('__s', JSON.stringify({user:{id:'u2', email:"o'neil@example.com"}})); });
  console.log('sql:', await r.p.textContent('#naSql'));
  await r.p.screenshot({path:OUT + '/a_notadmin.png'}); await r.ctx.close();

  r = await run('dash-phone', phone, admin);
  await r.p.screenshot({path:OUT + '/a_phone.png', fullPage:true});
  const bars = await r.p.$$('#chDaily .hit');
  await bars[25].dispatchEvent('pointerdown'); await r.p.waitForTimeout(100);
  console.log('tip:', await r.p.textContent('#chDaily .tip'));
  await r.p.locator('#chDaily').screenshot({path:OUT + '/a_tip.png'});
  await r.p.click('[data-cat=bug]');
  console.log('bug feedback rows:', await r.p.$$eval('#fbList li', l => l.length));
  await r.p.click('#logoutBtn'); await r.p.waitForTimeout(200);
  console.log('after logout, login visible:', await r.p.isVisible('#vLogin'));
  await r.ctx.close();

  r = await run('dash-desktop-dark', {viewport:{width:1280, height:900}, colorScheme:'dark'}, admin);
  await r.p.screenshot({path:OUT + '/a_desk_dark.png', fullPage:true}); await r.ctx.close();

  console.log('errors', errs); await b.close();
})();
