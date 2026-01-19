// Supabase 설정
const SUPABASE_URL = 'https://deunmnkkwfbzjnaahqkt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldW5tbmtrd2ZiempuYWFocWt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3OTkxNDUsImV4cCI6MjA4NDM3NTE0NX0.ODsEwnAkK-WLp-meuk5hTtySSam9kFFCyHPaCPjro_Y';

// Supabase 클라이언트 초기화
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
