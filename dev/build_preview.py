"""Build the test page (preview/) from the working version: separate storage keys, no login, sample records."""
import os, sys
# usage: python3 dev/build_preview.py <working-version index.html> <main checkout dir>
src = open(sys.argv[1], encoding='utf8').read()
out_dir = os.path.join(sys.argv[2], 'preview')
os.makedirs(out_dir, exist_ok=True)
s = src
def rep(a, b, must=True):
    global s
    if must: assert a in s, a[:60]
    s = s.replace(a, b)
rep("'chalklog.", "'chalklog-preview.")
rep('<link rel="manifest" href="manifest.webmanifest">\n', '')
rep('href="icons/', 'href="../icons/')
rep('href="privacy.html"', 'href="../privacy.html"')
rep("if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));\n", '')
rep('<title>Chalk Log</title>', '<title>Chalk Log 테스트</title>')
bar = '''<div class="pv-bar" role="note">🧪 테스트 버전이에요 · 실제 앱·계정과 분리돼 있어요 <button type="button" id="pvReset">예시로 되돌리기</button></div>
<style>.pv-bar{position:relative;z-index:6;display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;justify-content:center;padding:8px max(16px,env(safe-area-inset-right,0px)) 8px max(16px,env(safe-area-inset-left,0px));background:#FFF6D6;color:#5A4500;font:600 13px/1.4 "Pretendard Variable",Pretendard,system-ui,sans-serif;text-align:center}.pv-bar button{border:1px solid #C9A227;background:#fff;color:#5A4500;border-radius:999px;padding:3px 10px;font:inherit;cursor:pointer}</style>
'''
rep('<header class="top">', bar + '<header class="top">')
seed = r'''<script>
/* test page: sample records in its own storage, separate from the real app */
(function(){
  var P = 'chalklog-preview.';
  try {
    document.addEventListener('click', function(e){
      if (e.target && e.target.id === 'pvReset'){
        Object.keys(localStorage).filter(function(k){ return k.indexOf(P) === 0; }).forEach(function(k){ localStorage.removeItem(k); });
        location.reload();
      }
    });
    if (localStorage.getItem(P + 'data.v1')) return;
    var pad = function(n){ return String(n).padStart(2, '0'); };
    var day = function(off){ var d = new Date(); d.setDate(d.getDate() - off); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
    var w = {};
    var mon = (function(){ var d = new Date(); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d; })();
    var at = function(week, dow){ var d = new Date(mon); d.setDate(d.getDate() + week * 7 + dow); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
    var add = function(week, dow, types, extra){ var k = at(week, dow); w[k] = Object.assign({date:k, types:types, minutes:null, feel:null, note:'', run:null, updatedAt:1}, extra || {}); };
    // 4 weeks ago: goal met (4/4)
    add(-4, 0, ['crossfit'], {minutes:60}); add(-4, 2, ['running'], {run:{km:5, sec:1830}}); add(-4, 4, ['crossfit'], {minutes:60}); add(-4, 5, ['hiking'], {minutes:180, note:'북한산 백운대'});
    // 3 weeks ago: 3/4 (short by one) ...
    add(-3, 0, ['crossfit'], {minutes:60}); add(-3, 2, ['weight'], {minutes:50}); add(-3, 5, ['running'], {run:{km:7, sec:2580}});
    // ... made up 2 weeks ago with 5 days
    add(-2, 0, ['crossfit'], {minutes:60, note:'Fran 6:12'}); add(-2, 1, ['running'], {run:{km:10.2, sec:3780}}); add(-2, 3, ['crossfit', 'weight'], {minutes:70}); add(-2, 5, ['yoga'], {minutes:40}); add(-2, 6, ['running'], {note:'첫 하프 끝!!', run:{km:21.1, sec:7643}});
    // last week: 3/4, still recoverable this week
    add(-1, 0, ['crossfit'], {minutes:60}); add(-1, 2, ['running'], {run:{km:5, sec:1755}}); add(-1, 4, ['crossfit'], {minutes:65});
    // this week: Monday so far
    add(0, 0, ['crossfit', 'running'], {minutes:75, note:'첫 5km 30분 컷!', run:{km:5, sec:1710}});
    var lifts = {
      'back-squat': {name:'백 스쿼트', custom:false, history:[{id:'s1', kg:80, date:day(70)}, {id:'s2', kg:90, date:day(40)}, {id:'s3', kg:87.5, date:day(20)}, {id:'s4', kg:97.5, date:day(1)}]},
      'deadlift': {name:'데드리프트', custom:false, history:[{id:'d1', kg:110, date:day(50)}, {id:'d2', kg:120, date:day(8)}]},
      'power-clean': {name:'파워 클린', custom:false, history:[{id:'c1', kg:60, date:day(30)}]}
    };
    localStorage.setItem(P + 'data.v1', JSON.stringify({workouts:w, lifts:lifts, settings:{customTypes:[], goals:[{from:at(-4, 0), perWeek:4, month:(function(){ var t=new Date(mon); t.setDate(t.getDate()-28+3); return t.getFullYear()+'-'+pad(t.getMonth()+1); })()}]}}));
    localStorage.setItem(P + 'guest', '1');
  } catch(e){}
})();
</script>
'''
rep('<script src="config.js"></script>', seed + '<script src="config.js"></script>')
open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf8').write(s)
open(os.path.join(out_dir, 'config.js'), 'w', encoding='utf8').write("// 테스트 페이지: 로그인·서버 저장 없이 이 기기에만 저장해요.\nwindow.CHALK_CONFIG = {};\n")
print('preview built', len(s))
