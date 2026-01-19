-- =============================================
-- Monthly Report 데이터베이스 스키마
-- Supabase SQL Editor에서 실행해주세요
-- =============================================

-- 1. 매출 리포트 테이블 생성
CREATE TABLE IF NOT EXISTS sales_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 같은 사용자의 같은 년/월 데이터는 중복 불가
    UNIQUE(user_id, year, month)
);

-- 2. Row Level Security (RLS) 활성화
-- 사용자가 본인의 데이터만 볼 수 있도록 설정
ALTER TABLE sales_reports ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책 생성
-- 사용자는 본인의 데이터만 조회 가능
CREATE POLICY "Users can view own sales reports" 
    ON sales_reports 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- 사용자는 본인의 데이터만 삽입 가능
CREATE POLICY "Users can insert own sales reports" 
    ON sales_reports 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 사용자는 본인의 데이터만 수정 가능
CREATE POLICY "Users can update own sales reports" 
    ON sales_reports 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- 4. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sales_reports_updated_at
    BEFORE UPDATE ON sales_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_sales_reports_user_id ON sales_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_reports_year_month ON sales_reports(year, month);
