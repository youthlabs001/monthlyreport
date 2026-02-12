// 설정 및 데모 데이터

// Supabase 연동 (프로젝트 ID: rmneisdjxjteysazzrhy)
// anon key는 Supabase 대시보드 > Project Settings > API 에서 확인 후 넣어주세요.
const SUPABASE_URL = 'https://rmneisdjxjteysazzrhy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtbmVpc2RqeGp0ZXlzYXp6cmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNTk3MDYsImV4cCI6MjA4NTkzNTcwNn0.mACC4MRK_0Kpdr-iQyGT3LoLt-NiSDjXmNux_nWDWUs';

// 데모 사용자 계정
const DEMO_USERS = {
    'demo1@company.com': {
        password: 'demo123',
        fullName: '김철수',
        phone: '010-1234-5678',
        companies: ['테크노바 주식회사', '글로벌테크 주식회사'],
        // 기본 회사 (첫 번째)
        companyName: '테크노바 주식회사',
        businessNumber: '123-45-67890',
        monthlyGoal: 500000000,
        data: {
            currentMonthRevenue: 385420000,
            lastMonthRevenue: 342150000,
            monthlyRevenue: [
                { month: '2025-08', revenue: 298450000 },
                { month: '2025-09', revenue: 315620000 },
                { month: '2025-10', revenue: 328900000 },
                { month: '2025-11', revenue: 335480000 },
                { month: '2025-12', revenue: 342150000 },
                { month: '2026-01', revenue: 362800000 },
                { month: '2026-02', revenue: 385420000 }
            ],
            lastYearRevenue: [
                { month: '2025-08', revenue: 245300000 },
                { month: '2025-09', revenue: 258700000 },
                { month: '2025-10', revenue: 267200000 },
                { month: '2025-11', revenue: 275800000 },
                { month: '2025-12', revenue: 282400000 },
                { month: '2026-01', revenue: 295100000 },
                { month: '2026-02', revenue: 308600000 }
            ],
            categories: [
                { name: '제품 판매', value: 45, amount: 173439000 },
                { name: '서비스', value: 30, amount: 115626000 },
                { name: '구독', value: 15, amount: 57813000 },
                { name: '라이선스', value: 10, amount: 38542000 }
            ],
            weeklyData: [
                { day: '월', revenue: 48500000 },
                { day: '화', revenue: 52300000 },
                { day: '수', revenue: 49800000 },
                { day: '목', revenue: 56200000 },
                { day: '금', revenue: 61400000 },
                { day: '토', revenue: 38900000 },
                { day: '일', revenue: 32100000 }
            ],
            quarterlyGrowth: [
                { quarter: 'Q1 2025', growth: 12.5 },
                { quarter: 'Q2 2025', growth: 15.8 },
                { quarter: 'Q3 2025', growth: 18.2 },
                { quarter: 'Q4 2025', growth: 22.3 }
            ],
            transactions: [
                { date: '2026-02-09', client: '(주)글로벌테크', category: '제품 판매', amount: 45000000, status: 'completed' },
                { date: '2026-02-08', client: '스마트솔루션', category: '서비스', amount: 12500000, status: 'completed' },
                { date: '2026-02-08', client: '디지털코리아', category: '구독', amount: 3800000, status: 'pending' },
                { date: '2026-02-07', client: '넥스트제너레이션', category: '라이선스', amount: 8900000, status: 'completed' },
                { date: '2026-02-07', client: '이노베이션랩', category: '제품 판매', amount: 28000000, status: 'completed' },
                { date: '2026-02-06', client: '퓨처비전', category: '서비스', amount: 15600000, status: 'completed' },
                { date: '2026-02-06', client: '클라우드웍스', category: '구독', amount: 4200000, status: 'pending' },
                { date: '2026-02-05', client: '스마트시스템즈', category: '제품 판매', amount: 32000000, status: 'completed' }
            ]
        }
    },
    'demo2@company.com': {
        password: 'demo123',
        fullName: '이영희',
        phone: '010-9876-5432',
        companies: ['미래산업 코퍼레이션'],
        // 기본 회사 (첫 번째)
        companyName: '미래산업 코퍼레이션',
        businessNumber: '987-65-43210',
        monthlyGoal: 800000000,
        data: {
            currentMonthRevenue: 672850000,
            lastMonthRevenue: 638920000,
            monthlyRevenue: [
                { month: '2025-08', revenue: 545200000 },
                { month: '2025-09', revenue: 568300000 },
                { month: '2025-10', revenue: 589100000 },
                { month: '2025-11', revenue: 612400000 },
                { month: '2025-12', revenue: 638920000 },
                { month: '2026-01', revenue: 655700000 },
                { month: '2026-02', revenue: 672850000 }
            ],
            lastYearRevenue: [
                { month: '2025-08', revenue: 445800000 },
                { month: '2025-09', revenue: 468200000 },
                { month: '2025-10', revenue: 485600000 },
                { month: '2025-11', revenue: 502300000 },
                { month: '2025-12', revenue: 518900000 },
                { month: '2026-01', revenue: 535400000 },
                { month: '2026-02', revenue: 548600000 }
            ],
            categories: [
                { name: '제조', value: 50, amount: 336425000 },
                { name: '유통', value: 25, amount: 168212500 },
                { name: '수출', value: 20, amount: 134570000 },
                { name: '기타', value: 5, amount: 33642500 }
            ],
            weeklyData: [
                { day: '월', revenue: 85200000 },
                { day: '화', revenue: 92300000 },
                { day: '수', revenue: 88500000 },
                { day: '목', revenue: 95800000 },
                { day: '금', revenue: 102400000 },
                { day: '토', revenue: 68900000 },
                { day: '일', revenue: 52100000 }
            ],
            quarterlyGrowth: [
                { quarter: 'Q1 2025', growth: 16.3 },
                { quarter: 'Q2 2025', growth: 19.7 },
                { quarter: 'Q3 2025', growth: 23.4 },
                { quarter: 'Q4 2025', growth: 26.8 }
            ],
            transactions: [
                { date: '2026-02-09', client: '대한무역', category: '수출', amount: 125000000, status: 'completed' },
                { date: '2026-02-08', client: '글로벌유통', category: '유통', amount: 48500000, status: 'completed' },
                { date: '2026-02-08', client: '제조파트너스', category: '제조', amount: 87300000, status: 'pending' },
                { date: '2026-02-07', client: '수입협회', category: '기타', amount: 12800000, status: 'completed' },
                { date: '2026-02-07', client: '산업자재', category: '제조', amount: 95600000, status: 'completed' },
                { date: '2026-02-06', client: '해외바이어스', category: '수출', amount: 145000000, status: 'completed' },
                { date: '2026-02-06', client: '도매센터', category: '유통', amount: 52000000, status: 'pending' },
                { date: '2026-02-05', client: '제조협력사', category: '제조', amount: 78900000, status: 'completed' }
            ]
        }
    },
    // 관리자 전용 계정
    'admin@company.com': {
        password: 'admin123',
        fullName: '관리자',
        isAdmin: true,
        companyName: '관리자',
        data: {
            currentMonthRevenue: 0,
            lastMonthRevenue: 0,
            monthlyRevenue: [],
            lastYearRevenue: [],
            categories: [],
            weeklyData: [],
            quarterlyGrowth: [],
            transactions: []
        }
    }
};

// 관리자 화면에서 추가한 계정 로드 후 DEMO_USERS에 병합 (로그인 가능하도록)
// 삭제된 관리자(demo_users_deleted)는 목록에서 제외
(function mergeAddedAccounts() {
    try {
        const stored = localStorage.getItem('demo_users_additions');
        if (stored) {
            const additions = JSON.parse(stored);
            Object.keys(additions).forEach(function(email) {
                DEMO_USERS[email] = additions[email];
            });
        }
        const deletedRaw = localStorage.getItem('demo_users_deleted');
        if (deletedRaw) {
            const deleted = JSON.parse(deletedRaw);
            if (Array.isArray(deleted)) {
                deleted.forEach(function(email) {
                    delete DEMO_USERS[email];
                });
            }
        }
    } catch (e) {
        console.warn('추가 계정 로드 실패:', e);
    }
})();

// 관리자 계정 여부 확인 (여러 관리자 지원)
const ADMIN_EMAIL = 'admin@company.com';
function isAdminUser(email) {
    return DEMO_USERS[email] && DEMO_USERS[email].isAdmin === true;
}

// 숫자 포맷팅 함수
function formatCurrency(amount) {
    return '₩' + amount.toLocaleString('ko-KR');
}

function formatNumber(num) {
    return num.toLocaleString('ko-KR');
}

function formatPercent(value) {
    return value.toFixed(1) + '%';
}

// 날짜 포맷팅 함수
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function formatMonthKo(dateString) {
    const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${months[date.getMonth()]}`;
}

// 로컬 스토리지 관리
const Storage = {
    setUser(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    },
    
    getUser() {
        try {
            const user = localStorage.getItem('currentUser');
            if (!user) return null;
            return JSON.parse(user);
        } catch (error) {
            // JSON 파싱 실패 시 localStorage 초기화
            console.error('localStorage 데이터 오류:', error);
            localStorage.removeItem('currentUser');
            return null;
        }
    },
    
    removeUser() {
        localStorage.removeItem('currentUser');
    },
    
    isLoggedIn() {
        return this.getUser() !== null;
    },
    
    // 현재 선택된 회사 저장
    setSelectedCompany(email, companyName) {
        localStorage.setItem(`selectedCompany_${email}`, companyName);
    },
    
    // 현재 선택된 회사 가져오기
    getSelectedCompany(email) {
        return localStorage.getItem(`selectedCompany_${email}`);
    }
};

// 회사별 데이터 (demo1@company.com의 두 번째 회사)
const COMPANY_DATA = {
    'demo1@company.com': {
        '글로벌테크 주식회사': {
            companyName: '글로벌테크 주식회사',
            businessNumber: '345-67-89012',
            monthlyGoal: 400000000,
            data: {
                currentMonthRevenue: 298500000,
                lastMonthRevenue: 285300000,
                monthlyRevenue: [
                    { month: '2025-08', revenue: 225400000 },
                    { month: '2025-09', revenue: 238600000 },
                    { month: '2025-10', revenue: 251200000 },
                    { month: '2025-11', revenue: 268900000 },
                    { month: '2025-12', revenue: 285300000 },
                    { month: '2026-01', revenue: 292100000 },
                    { month: '2026-02', revenue: 298500000 }
                ],
                lastYearRevenue: [
                    { month: '2025-08', revenue: 185200000 },
                    { month: '2025-09', revenue: 192800000 },
                    { month: '2025-10', revenue: 205400000 },
                    { month: '2025-11', revenue: 218600000 },
                    { month: '2025-12', revenue: 228900000 },
                    { month: '2026-01', revenue: 238200000 },
                    { month: '2026-02', revenue: 245100000 }
                ],
                categories: [
                    { name: '제품 판매', value: 40, amount: 119400000 },
                    { name: '서비스', value: 35, amount: 104475000 },
                    { name: '구독', value: 15, amount: 44775000 },
                    { name: '라이선스', value: 10, amount: 29850000 }
                ],
                weeklyData: [
                    { day: '월', revenue: 38200000 },
                    { day: '화', revenue: 42800000 },
                    { day: '수', revenue: 39500000 },
                    { day: '목', revenue: 46300000 },
                    { day: '금', revenue: 51200000 },
                    { day: '토', revenue: 32100000 },
                    { day: '일', revenue: 28400000 }
                ],
                quarterlyGrowth: [
                    { quarter: 'Q1 2025', growth: 10.2 },
                    { quarter: 'Q2 2025', growth: 13.5 },
                    { quarter: 'Q3 2025', growth: 16.8 },
                    { quarter: 'Q4 2025', growth: 19.5 }
                ],
                transactions: [
                    { date: '2026-02-09', client: '테크솔루션', category: '제품 판매', amount: 35000000, status: 'completed' },
                    { date: '2026-02-08', client: '비즈니스파트너스', category: '서비스', amount: 18500000, status: 'completed' },
                    { date: '2026-02-08', client: '엔터프라이즈', category: '구독', amount: 5200000, status: 'pending' },
                    { date: '2026-02-07', client: '디지털허브', category: '라이선스', amount: 6800000, status: 'completed' },
                    { date: '2026-02-07', client: '스마트비즈', category: '제품 판매', amount: 22000000, status: 'completed' },
                    { date: '2026-02-06', client: '이커머스플러스', category: '서비스', amount: 12300000, status: 'completed' },
                    { date: '2026-02-06', client: '클라우드프로', category: '구독', amount: 3900000, status: 'pending' },
                    { date: '2026-02-05', client: '테크이노베이션', category: '제품 판매', amount: 25800000, status: 'completed' }
                ]
            }
        }
    }
};
