-- 매출 대시보드 데이터베이스 스키마

-- 회사 정보 테이블
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name VARCHAR(255) NOT NULL,
    business_number VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 월간 목표 테이블
CREATE TABLE IF NOT EXISTS monthly_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    target_revenue DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE(company_id, year, month)
);

-- 매출 데이터 테이블
CREATE TABLE IF NOT EXISTS revenue_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    record_date DATE NOT NULL,
    category VARCHAR(100),
    client_name VARCHAR(255),
    amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 카테고리 테이블
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE(company_id, category_name)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_revenue_company_date ON revenue_records(company_id, record_date);
CREATE INDEX IF NOT EXISTS idx_revenue_category ON revenue_records(category);
CREATE INDEX IF NOT EXISTS idx_monthly_goals_company ON monthly_goals(company_id, year, month);

-- 샘플 데이터 삽입 (테스트용)

-- 회사 1
INSERT INTO companies (id, company_name, business_number) 
VALUES (1, '테크노바 주식회사', '123-45-67890');

-- 회사 2
INSERT INTO companies (id, company_name, business_number) 
VALUES (2, '미래산업 코퍼레이션', '987-65-43210');

-- 사용자 1 (비밀번호: demo123)
INSERT INTO users (company_id, email, password_hash, full_name, phone) 
VALUES (1, 'demo1@company.com', '$2a$10$demo1hashedpassword', '김철수', '010-1234-5678');

-- 사용자 2 (비밀번호: demo123)
INSERT INTO users (company_id, email, password_hash, full_name, phone) 
VALUES (2, 'demo2@company.com', '$2a$10$demo2hashedpassword', '이영희', '010-9876-5432');

-- 월간 목표
INSERT INTO monthly_goals (company_id, year, month, target_revenue) 
VALUES (1, 2026, 2, 500000000.00);

INSERT INTO monthly_goals (company_id, year, month, target_revenue) 
VALUES (2, 2026, 2, 800000000.00);

-- 카테고리 (회사 1)
INSERT INTO categories (company_id, category_name, color) 
VALUES 
    (1, '제품 판매', '#4F46E5'),
    (1, '서비스', '#10B981'),
    (1, '구독', '#F59E0B'),
    (1, '라이선스', '#EF4444');

-- 카테고리 (회사 2)
INSERT INTO categories (company_id, category_name, color) 
VALUES 
    (2, '제조', '#4F46E5'),
    (2, '유통', '#10B981'),
    (2, '수출', '#F59E0B'),
    (2, '기타', '#EF4444');

-- 매출 데이터 샘플 (회사 1)
INSERT INTO revenue_records (company_id, record_date, category, client_name, amount, status) 
VALUES 
    (1, '2026-02-09', '제품 판매', '(주)글로벌테크', 45000000.00, 'completed'),
    (1, '2026-02-08', '서비스', '스마트솔루션', 12500000.00, 'completed'),
    (1, '2026-02-08', '구독', '디지털코리아', 3800000.00, 'pending'),
    (1, '2026-02-07', '라이선스', '넥스트제너레이션', 8900000.00, 'completed'),
    (1, '2026-02-07', '제품 판매', '이노베이션랩', 28000000.00, 'completed'),
    (1, '2026-02-06', '서비스', '퓨처비전', 15600000.00, 'completed'),
    (1, '2026-02-06', '구독', '클라우드웍스', 4200000.00, 'pending'),
    (1, '2026-02-05', '제품 판매', '스마트시스템즈', 32000000.00, 'completed');

-- 매출 데이터 샘플 (회사 2)
INSERT INTO revenue_records (company_id, record_date, category, client_name, amount, status) 
VALUES 
    (2, '2026-02-09', '수출', '대한무역', 125000000.00, 'completed'),
    (2, '2026-02-08', '유통', '글로벌유통', 48500000.00, 'completed'),
    (2, '2026-02-08', '제조', '제조파트너스', 87300000.00, 'pending'),
    (2, '2026-02-07', '기타', '수입협회', 12800000.00, 'completed'),
    (2, '2026-02-07', '제조', '산업자재', 95600000.00, 'completed'),
    (2, '2026-02-06', '수출', '해외바이어스', 145000000.00, 'completed'),
    (2, '2026-02-06', '유통', '도매센터', 52000000.00, 'pending'),
    (2, '2026-02-05', '제조', '제조협력사', 78900000.00, 'completed');

-- 뷰 생성: 월별 매출 집계
CREATE VIEW IF NOT EXISTS monthly_revenue_summary AS
SELECT 
    company_id,
    strftime('%Y', record_date) AS year,
    strftime('%m', record_date) AS month,
    SUM(amount) AS total_revenue,
    COUNT(*) AS transaction_count,
    AVG(amount) AS avg_transaction
FROM revenue_records
WHERE status = 'completed'
GROUP BY company_id, year, month;

-- 뷰 생성: 카테고리별 매출 집계
CREATE VIEW IF NOT EXISTS category_revenue_summary AS
SELECT 
    r.company_id,
    r.category,
    SUM(r.amount) AS total_revenue,
    COUNT(*) AS transaction_count,
    ROUND(SUM(r.amount) * 100.0 / (
        SELECT SUM(amount) 
        FROM revenue_records 
        WHERE company_id = r.company_id 
        AND status = 'completed'
    ), 2) AS percentage
FROM revenue_records r
WHERE r.status = 'completed'
GROUP BY r.company_id, r.category;
