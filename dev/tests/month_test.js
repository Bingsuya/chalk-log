// 테스트 페이지: 한 달 목표 완주 축하
// A) 11월 마지막 주에 지난주 모자란 만큼까지 채우면 → 11월 완주
// B) 12월 첫 주에 11월 마지막 주를 만회하면 → 12월에 들어서도 11월 완주 축하
// 사용법: node dev/tests/month_test.js <스크린샷 폴더>   (8767 포트에 이 폴더를 띄운 상태)
const {chromium, devices} = require('playwright');
const OUT = process.argv[2];
const P = 'chalklog-preview.';
const wk = (dates) => Object.fromEntries(dates.map(d => [d, {date:d, types:['crossfit'], minutes:null, feel:null, note:'', run:null, updatedAt:1}]));

async function scenario(b, name, now, workouts, saves){
  const ctx = await b.newContext({...devices['iPhone 13']});
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.clock.setFixedTime(new Date(now + 'T12:00:00'));
  await p.addInitScript(([P, data]) => {
    if (!sessionStorage.getItem('seeded')){
      localStorage.setItem(P + 'data.v1', JSON.stringify(data)); localStorage.setItem(P + 'guest', '1'); sessionStorage.setItem('seeded', '1');
    }
  }, [P, {workouts, lifts:{}, settings:{customTypes:[], goals:[{from:'2026-11-02', perWeek:3, month:'2026-11'}]}}]);
  await p.goto('http://localhost:8767/preview/'); await p.waitForTimeout(900);
  console.log(`[${name}] today ${now}`);
  for (const ds of saves){
    await p.evaluate(ds => { const el = document.querySelector('#dayDate'); el.value = ds; el.dispatchEvent(new Event('change')); }, ds);
    await p.click('[data-type=crossfit]'); await p.click('#daySave'); await p.waitForTimeout(400);
    const cel = await p.isVisible('#celebrate');
    console.log(`  saved ${ds}: ${cel ? (await p.textContent('#celTitle')) + ' / ' + (await p.textContent('#celSub')) : '(축하 없음)'}`);
    if (cel){
      if ((await p.textContent('#celTitle')).includes('완주')){
        await p.screenshot({path:`${OUT}/month-${name}-celebrate.png`});
        await p.click('#celShare'); await p.waitForTimeout(800);
        console.log('  share caption:', await p.inputValue('#shCaption'));
        await p.screenshot({path:`${OUT}/month-${name}-share.png`});
        await p.click('#shClose'); await p.waitForTimeout(200);
      } else await p.click('#celOk');
    }
  }
  console.log('  trophy rows:', await p.$$eval('#goalCard .mrow', els => els.map(e => e.textContent)));
  await p.$eval('#goalCard', e => e.scrollIntoView()); await p.waitForTimeout(150);
  await p.locator('#goalCard').screenshot({path:`${OUT}/month-${name}-card.png`});
  console.log('  errors', errs); await ctx.close();
}

(async () => {
  const b = await chromium.launch();
  // A: 11/25(수). 11월 3주차(11/16~)는 2/3회 → 마지막 주(11/23~)에 4회 하면 만회 + 완주
  await scenario(b, 'A', '2026-11-26',
    wk(['2026-11-02','2026-11-04','2026-11-06','2026-11-09','2026-11-11','2026-11-13','2026-11-16','2026-11-18','2026-11-23','2026-11-24']),
    ['2026-11-25', '2026-11-26']);
  // B: 12/3(목). 11월 마지막 주(11/23~)는 2/3회 → 12월 첫 주에 4회 하면 11월 완주
  await scenario(b, 'B', '2026-12-03',
    wk(['2026-11-02','2026-11-04','2026-11-06','2026-11-09','2026-11-11','2026-11-13','2026-11-16','2026-11-18','2026-11-20','2026-11-23','2026-11-24','2026-11-30','2026-12-01']),
    ['2026-12-02', '2026-12-03']);
  // C: 한 주를 쉬어간(만회 못 한) 달은 완주가 아님
  await scenario(b, 'C', '2026-11-26',
    wk(['2026-11-02','2026-11-09','2026-11-11','2026-11-13','2026-11-16','2026-11-18','2026-11-20','2026-11-23','2026-11-24']),
    ['2026-11-25']);
  await b.close();
})();
