-- ============================================================
-- Supabase 접근 권한 수정 SQL
-- Supabase 대시보드 > SQL Editor 에서 전체 실행하세요.
-- ============================================================

-- 1) password_hash 컬럼 추가 (없으면)
ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2) 기존 RLS 정책 전부 삭제
DROP POLICY IF EXISTS "companies_select" ON public.companies;
DROP POLICY IF EXISTS "companies_insert" ON public.companies;
DROP POLICY IF EXISTS "companies_update" ON public.companies;
DROP POLICY IF EXISTS "companies_delete" ON public.companies;

DROP POLICY IF EXISTS "app_users_select" ON public.app_users;
DROP POLICY IF EXISTS "app_users_insert" ON public.app_users;
DROP POLICY IF EXISTS "app_users_update" ON public.app_users;
DROP POLICY IF EXISTS "app_users_delete" ON public.app_users;

DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete" ON public.transactions;

-- 3) 새 RLS 정책 (anon + authenticated 모두 허용)
-- app_users: 로그인 전에도 조회/저장 가능해야 함
CREATE POLICY "app_users_select" ON public.app_users
    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "app_users_insert" ON public.app_users
    FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "app_users_update" ON public.app_users
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "app_users_delete" ON public.app_users
    FOR DELETE TO anon, authenticated USING (true);

-- companies: 관리자 화면에서 저장 가능
CREATE POLICY "companies_select" ON public.companies
    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "companies_insert" ON public.companies
    FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "companies_update" ON public.companies
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "companies_delete" ON public.companies
    FOR DELETE TO anon, authenticated USING (true);

-- transactions: 매출 데이터 조회/저장
CREATE POLICY "transactions_select" ON public.transactions
    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "transactions_insert" ON public.transactions
    FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "transactions_update" ON public.transactions
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "transactions_delete" ON public.transactions
    FOR DELETE TO anon, authenticated USING (true);

-- 4) 확인
SELECT 'app_users 컬럼 목록:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'app_users'
ORDER BY ordinal_position;

SELECT 'app_users 데이터:' as info;
SELECT email, name, password_hash, companies, status FROM app_users;
