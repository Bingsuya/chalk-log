// Chalk Log 설정
// 두 값이 비어 있으면 로그인 없이 "이 기기에만 저장" 모드로 동작해요.
// 값은 Supabase 대시보드 → Project Settings → API (또는 Data API) 에서 복사해요.
// anon / publishable 키는 웹페이지에 공개돼도 되는 키예요. (service_role / secret 키는 절대 넣지 마세요)
window.CHALK_CONFIG = {
  supabaseUrl: 'https://cezzabgotzqymhjfzixc.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlenphYmdvdHpxeW1oamZ6aXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMjk1MDAsImV4cCI6MjEwOTgwNTUwMH0.58S9rYXB3u_7zdcZMWQgGOiCCfCqrRK4BPfAo6MKTp8'
};
