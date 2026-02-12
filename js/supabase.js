// Supabase 클라이언트 (config.js의 SUPABASE_URL, SUPABASE_ANON_KEY 사용)
// 스크립트 로드 순서: config.js → Supabase CDN → supabase.js
// 사용: 전역 변수 supabase 로 DB/인증 등 호출 (supabase가 null이면 anon key 미설정)
var supabase = null;
if (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL && typeof SUPABASE_ANON_KEY !== 'undefined' && SUPABASE_ANON_KEY) {
    try {
        var lib = typeof window !== 'undefined' && window.supabase;
        if (lib && typeof lib.createClient === 'function') {
            supabase = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
    } catch (e) {
        console.warn('Supabase 클라이언트 초기화 실패:', e);
    }
}
