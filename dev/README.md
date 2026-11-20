# Chalk Log 개발 안내 (이어서 작업하기)

새 Claude Code 세션이나 다른 사람이 이 저장소만 보고 이어서 작업할 수 있도록 정리한 문서예요.

## 한눈에 보기

| 무엇 | 어디에 |
|---|---|
| 실제 앱 | `main` 브랜치 루트 → https://bingsuya.github.io/chalk-log/ |
| 테스트 페이지 | `main` 브랜치 `preview/` → https://bingsuya.github.io/chalk-log/preview/ |
| 작업 중 버전 (공유 카드 포함) | `feature/share-run` 브랜치의 `index.html` |
| 데이터 (가입자·기록·의견) | Supabase 프로젝트 `cezzabgotzqymhjfzixc` |
| 로그인 | Google OAuth (Supabase Auth의 Google provider) |

앱은 빌드 도구 없이 `index.html` 한 파일(HTML·CSS·JS)로 되어 있어요.
GitHub Pages가 `main` 브랜치 루트를 그대로 배포해요.

## 작업 흐름

1. **작업은 `feature/share-run`의 `index.html`에서** 해요. (공유 카드 코드가 여기에만 있어요)
2. **테스트 페이지에 올리기**
   ```bash
   # main 브랜치 체크아웃 폴더에서
   python3 dev/build_preview.py <feature/share-run의 index.html 경로> .
   git add preview && git commit -m "테스트 페이지: ..." && git push origin main
   ```
   - 테스트 페이지는 저장 키가 `chalklog-preview.*`로 분리되고, 로그인·서버 저장이 꺼지고, 예시 기록이 들어가요.
   - 화면 맨 위 노란 줄의 "예시로 되돌리기"로 예시 기록을 다시 넣을 수 있어요.
3. **실제 앱에 반영하기** (사용자가 "실서버에 올려줘"라고 했을 때)
   ```bash
   python3 dev/release_build.py <feature/share-run의 index.html 경로> .
   # sw.js의 VERSION 숫자를 하나 올리기 (예: chalklog-v8 → chalklog-v9)
   git add index.html sw.js && git commit -m "..." && git push origin main
   ```
   - `release_build.py`는 공유 카드(버튼·화면·코드·Orbitron 글꼴)를 빼고 `index.html`을 만들어요.
   - `sw.js`의 `VERSION`을 올려야 홈 화면 앱이 새 버전을 받아요.

## 데이터 구조

- **Supabase 표 `entries`** (`supabase/schema.sql`): `user_id, kind, key, data(jsonb)`
  - `kind = 'workout'`, `key = 'YYYY-MM-DD'`: `{date, types[], minutes, feel, note, run:{km, sec}, updatedAt}`
  - `kind = 'lift'`, `key = 동작 id`: `{name, custom, history:[{id, kg, date}]}` (무게는 항상 kg로 저장)
  - `kind = 'settings'`, `key = 'settings'`: `{customTypes:[{id,name}], goals:[{from:'월요일 날짜', perWeek, month:'YYYY-MM'}]}`
  - 각자 자기 줄만 읽고 쓸 수 있게 RLS로 막혀 있어요.
- **Supabase 표 `feedback`** (`supabase/feedback.sql`): 누구나 보내기만, 읽기는 관리자(대시보드)만.
- **로그인 없이 쓰면** 브라우저 `localStorage`의 `chalklog.data.v1`에 같은 모양으로 저장돼요. 로그인하면 계정으로 자동 이동해요.
- 로그인 상태에서는 기기에 사본(`chalklog.cloud.<id>`)과 보내지 못한 변경 목록(`chalklog.queue.<id>`)을 두고, 연결되면 보내요.

## 주간 목표 규칙

- 한 주는 월~일, **운동한 날 수**로 세요.
- 목표는 달마다 정해요(`month`). 그 달의 첫 주는 **목요일이 그 달에 있는 주**예요.
- "이번 주부터"를 고르면 그 달 앞쪽 주에 `perWeek: 0`을 넣어서 새로 시작해요.
- 못 채운 주는 **다음 주에 모자란 만큼 더** 하면 만회(달성으로 침). 다음 주에도 못 하면 쉬어감.
- 상태: `done` 달성 · `recovered` 만회 · `recoverable` 만회 중 · `missed` 쉬어감 · `open` 진행 중 · `none` 목표 없음
- 주별 기록은 지금 적용 중인 목표가 시작된 주부터만 보여줘요.

## 동작 확인 (테스트)

`dev/tests/`에 Playwright 스크립트가 있어요. Chromium이 있는 환경에서:

```bash
# main 체크아웃 폴더에서 두 개의 로컬 서버를 띄워요
python3 -m http.server 8766 &   # 실제 앱 (루트)
python3 -m http.server 8767 &   # 테스트 페이지는 /preview/ 로 접근 (같은 폴더라 하나만 띄워도 포트만 맞추면 돼요)
mkdir -p /tmp/out
node dev/tests/cloud2.js /tmp/out        # 로그인·동기화·오프라인·삭제·로그아웃 (가짜 Supabase)
node dev/tests/fb.js /tmp/out            # 고객센터
node dev/tests/release_goal.js           # 실제 앱: 주간 목표 축하, 러닝 페이스
node dev/tests/release_check.js          # 실제 앱: 예전 방식 목표 → 월 목표 전환
node dev/tests/goal_test.js /tmp/out     # 테스트 페이지: 달성·만회 축하
node dev/tests/start_test.js /tmp/out    # 테스트 페이지: 언제부터 셀지 선택
node dev/tests/hist_test.js              # 테스트 페이지: 주별 기록 표시 범위
```

- 8766은 루트(실제 앱), 8767은 `/preview/`를 여는 테스트예요. 둘 다 이 폴더를 띄우면 돼요.
- `pv.js`(공유 카드)는 사진 경로 `PHOTO` 자리에 아무 사진 파일 경로를 넣어서 써요.

## 남아 있는 아이디어

- 공유 카드 (인스타 스토리 9:16, 네온·스티커·미니멀) — `feature/share-run`에 완성돼 있고 실제 앱에서는 빠져 있음
- 1RM 추정 (예: "60kg × 5회" → 1RM 계산)
- 관리자 페이지 (가입자 수, 최근 활동, 받은 의견) — 관리자만 보게 하는 DB 권한 설계 필요
- 카카오 로그인

## 화면·문구 원칙

- 한국어, 해요체, 귀엽고 말랑한 말투. 실패를 탓하지 않는 문구 ("괜찮아요", "쉬어갔어요").
- 흰 배경 + 코랄 포인트, 제목·큰 숫자는 Jua, 본문은 Noto Sans KR, 종목은 이모지.
- 휴대폰 화면(390px)과 다크 모드에서 꼭 확인해요.
