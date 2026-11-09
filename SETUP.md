# 로그인·계정 저장 설정 안내

Chalk Log에 구글 로그인을 켜고, 기록이 계정에 저장되게 하는 설정이에요. 20~30분쯤 걸려요.
화면의 메뉴 이름은 서비스가 업데이트되면서 조금 달라질 수 있어요. 비슷한 이름을 찾으면 돼요.

> ⚠️ **절대 남에게 보내거나 GitHub에 올리면 안 되는 것**
> - Supabase 데이터베이스 비밀번호
> - Supabase `service_role` / `secret` 키
> - Google 클라이언트 보안 비밀번호(Client secret) — Supabase 설정 화면에만 붙여넣어요
>
> 저(Claude)에게 보내도 되는 건 **Project URL**과 **anon(publishable) 키** 두 개뿐이에요. 이 둘은 원래 웹페이지에 공개되는 값이에요.

---

## 1. Supabase 프로젝트 만들기 (5분)

1. https://supabase.com 에 들어가서 **Start your project** → GitHub 계정으로 가입해요.
2. **New project**를 눌러요.
   - Name: `chalk-log`
   - Database Password: 아무거나 강하게 정하고 **따로 적어두세요** (Chalk Log 설정에는 안 써요)
   - Region: **Northeast Asia (Seoul)**
   - Plan: Free
3. **Create new project** → 1~2분 기다리면 준비돼요.

## 2. 데이터베이스 표 만들기 (1분)

1. 왼쪽 메뉴 **SQL Editor** → **New query**
2. 이 저장소의 [`supabase/schema.sql`](supabase/schema.sql) 내용을 **전부 복사해서 붙여넣고** → **Run**
3. 아래에 `Success. No rows returned`가 나오면 끝이에요.

> 이 SQL은 "각자 자기 기록만 읽고 쓸 수 있게" 막는 규칙까지 같이 만들어요.

## 3. Google 로그인 키 만들기 (10~15분)

1. https://console.cloud.google.com 에 구글 계정으로 들어가요.
2. 위쪽 프로젝트 선택 → **새 프로젝트** → 이름 `chalk-log` → 만들기 → 만든 프로젝트를 선택해요.
3. 왼쪽 메뉴(또는 검색창)에서 **Google 인증 플랫폼(Google Auth Platform)** 또는 **OAuth 동의 화면**으로 가요.
   - **시작하기** → 앱 이름 `Chalk Log`, 사용자 지원 이메일은 내 이메일
   - **브랜딩(Branding)** 화면은 앱 이름·지원 이메일·개발자 연락처만 채우면 돼요.
     - ⚠️ **로고는 올리지 마세요.** 올리면 구글 브랜드 심사가 걸려서 며칠~몇 주 로그인이 제한될 수 있어요.
     - 개인정보처리방침 링크(선택): `https://bingsuya.github.io/chalk-log/privacy.html`
   - 대상(Audience): **외부(External)**
   - 연락처 이메일: 내 이메일 → 동의 → 만들기
4. **대상(Audience)** 화면에서 **앱 게시(Publish app)** → 확인
   - 이걸 해야 친구들도 로그인할 수 있어요. 이메일·이름만 쓰는 기본 로그인이라 구글 심사는 필요 없어요.
5. **클라이언트(Clients)** → **클라이언트 만들기(Create client)**
   - 애플리케이션 유형: **웹 애플리케이션**
   - 이름: `Chalk Log`
   - **승인된 자바스크립트 원본**: `https://bingsuya.github.io`
   - **승인된 리디렉션 URI**: Supabase의 콜백 주소
     - Supabase → **Authentication → Sign In / Providers → Google**을 열면 **Callback URL**이 보여요. 그걸 복사해서 넣어요.
     - 모양: `https://<프로젝트ID>.supabase.co/auth/v1/callback`
   - **만들기** → 나오는 **클라이언트 ID**와 **클라이언트 보안 비밀번호**를 복사해 둬요.

## 4. Supabase에 Google 로그인 켜기 (2분)

1. Supabase → **Authentication → Sign In / Providers → Google**
2. **Enable** 켜기
3. **Client ID**와 **Client Secret**에 방금 복사한 값을 붙여넣고 **Save**

## 5. 로그인 후 돌아올 주소 등록 (1분)

1. Supabase → **Authentication → URL Configuration**
2. **Site URL**: `https://bingsuya.github.io/chalk-log/`
3. **Redirect URLs** → **Add URL** → `https://bingsuya.github.io/chalk-log/` → Save

## 6. 앱에 연결하기

1. Supabase → **Project Settings → API** (또는 **Data API / API Keys**)
2. 아래 두 값을 복사해요.
   - **Project URL** (예: `https://abcdefghijklmnop.supabase.co`)
   - **anon public** 키 또는 **publishable** 키 (`eyJ...` 또는 `sb_publishable_...`)
3. 둘 중 편한 방법으로:
   - Claude에게 두 값을 보내면 연결해서 올려줘요.
   - 또는 GitHub에서 [`config.js`](config.js)를 열고 ✏️ 편집 → 두 값을 따옴표 안에 넣고 → **Commit changes**

---

## 다 되면 확인할 것

1. https://bingsuya.github.io/chalk-log/ 열기 → 로그인 화면이 나와요.
2. **Google로 계속하기** → 구글 계정 선택 → Chalk Log로 돌아오면 맨 아래에 `내이메일 로그인됨 · ☁️ 계정에 저장됨`이 보여요.
3. 운동 하나 기록 → 다른 기기(PC 등)에서 같은 계정으로 로그인 → 같은 기록이 보이면 성공이에요.

## 문제가 생기면

- **`redirect_uri_mismatch` 오류**: 3-5단계의 리디렉션 URI가 Supabase Callback URL과 글자 하나까지 같은지 확인해요.
- **로그인 후 다시 로그인 화면이 나옴**: 5단계의 주소 끝에 `/`까지 정확히 들어갔는지 확인해요.
- **"액세스 차단됨: 앱이 테스트 중"**: 3-4단계의 **앱 게시**를 눌렀는지 확인해요.
- **아이폰 홈 화면 앱에서 로그인이 Safari로 넘어가 버림**: 홈 화면 앱 안에서 다시 한 번 로그인해 보세요. 그래도 안 되면 Claude에게 알려주세요.
