// Supabase 설정 (Vercel 배포용 - 별도 파일)
window.SUPABASE_URL = 'https://rmneisdjxjteysazzrhy.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbmVpc2RqeGp0ZXlzYXp6cmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNTk3MDYsImV4cCI6MjA4NTkzNTcwNn0.mACC4MRK_0Kpdr-iQyGT3LoLt-NiSDjXmNux_nWDWUs';

// 전역 변수로도 설정 (호환성)
if (typeof SUPABASE_URL === 'undefined') {
    var SUPABASE_URL = window.SUPABASE_URL;
}
if (typeof SUPABASE_ANON_KEY === 'undefined') {
    var SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;
}

console.log('[Supabase Config] 설정 로드됨:', SUPABASE_URL ? '✓' : '✗');
