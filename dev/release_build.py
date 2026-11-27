"""Make the real app (index.html on main) from the working version.
The share card is included; pass --no-share to leave it out (the old way)."""
import sys, os
# usage: python3 dev/release_build.py <working-version index.html> <main checkout dir> [--no-share]
args=[a for a in sys.argv[1:] if not a.startswith('--')]
src=open(args[0],encoding='utf8').read()
s=src
if '--no-share' not in sys.argv:
    open(os.path.join(args[1],'index.html'),'w',encoding='utf8').write(s)
    print('release index built (with share card)', len(s)); sys.exit(0)
def cut(start, end):
    global s
    i=s.index(start); j=s.index(end, i); s=s[:i]+s[j:]
def rep(a,b=''):
    global s
    assert s.count(a)==1,(s.count(a),a[:70]); s=s.replace(a,b)
cut('/* share card */', '/* weekly goal */')
rep('<button type="button" class="btn sm" id="dayShare" hidden>📸 공유 카드 만들기</button>')
rep('\n        <button type="button" class="btn sm" id="dlgShare" hidden style="margin-top:10px">📸 PR 공유</button>')
rep('<button type="button" class="btn sm" id="celShare">📸 자랑하기</button>')
cut('<dialog id="shDlg"', '<div class="login" id="login" hidden>')
cut('/* ---------- share card: a 1080×1920', '/* ---------- weekly goal')
i=s.index("$('#celShare').addEventListener('click'"); j=s.index('\n});\n', i)+len('\n});\n'); s=s[:i]+s[j:]
rep("  $('#dayShare').hidden = !w;\n")
rep("\n  $('#dlgShare').hidden = !b;")
for k in ['shDlg','shCanvas','openShare','dayShare','dlgShare','celShare','Orbitron','drawNeon','monthsHtml']:
    assert k not in s, k
open(os.path.join(args[1],'index.html'),'w',encoding='utf8').write(s)
print('release index built', len(s))
