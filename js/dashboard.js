// DOM Elements
const userEmailEl = document.getElementById('userEmail');
const companyNameEl = document.getElementById('companyName');
const logoutBtn = document.getElementById('logoutBtn');
const tableContainer = document.getElementById('tableContainer');
const yearFilter = document.getElementById('yearFilter');

// Stats Elements
const currentMonthSalesEl = document.getElementById('currentMonthSales');
const lastMonthSalesEl = document.getElementById('lastMonthSales');
const yearTotalSalesEl = document.getElementById('yearTotalSales');
const avgMonthlySalesEl = document.getElementById('avgMonthlySales');
const salesChangeEl = document.getElementById('salesChange');

// 현재 사용자 정보
let currentUser = null;

// 페이지 로드 시 인증 확인
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadSalesData();
});

// 인증 확인
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        // 로그인되지 않은 경우 로그인 페이지로 이동
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = session.user;
    
    // 사용자 정보 표시
    userEmailEl.textContent = currentUser.email;
    companyNameEl.textContent = currentUser.user_metadata?.company_name || '고객';
}

// 로그아웃 처리
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});

// 연도 필터 변경 시
yearFilter.addEventListener('change', async () => {
    await loadSalesData();
});

// 매출 데이터 로드
async function loadSalesData() {
    const selectedYear = yearFilter.value;
    
    // 로딩 표시
    tableContainer.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
    
    try {
        // Supabase에서 매출 데이터 조회
        const { data: salesData, error } = await supabase
            .from('sales_reports')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('year', selectedYear)
            .order('month', { ascending: true });
        
        if (error) {
            throw error;
        }
        
        // 데이터 표시
        displaySalesData(salesData, selectedYear);
        updateStats(salesData);
        
    } catch (error) {
        console.error('Error loading sales data:', error);
        
        // 테이블이 없거나 에러 발생 시 샘플 데이터 표시
        displayEmptyState();
    }
}

// 매출 데이터 테이블 표시
function displaySalesData(data, year) {
    if (!data || data.length === 0) {
        displayEmptyState();
        return;
    }
    
    const tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>월</th>
                    <th>매출액</th>
                    <th>판매 건수</th>
                    <th>비고</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(row => `
                    <tr>
                        <td>${year}년 ${row.month}월</td>
                        <td class="amount">${formatCurrency(row.amount)}</td>
                        <td>${row.sales_count || '-'}건</td>
                        <td>${row.note || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = tableHTML;
}

// 빈 상태 표시
function displayEmptyState() {
    tableContainer.innerHTML = `
        <div class="empty-state">
            <h4>📭 데이터가 없습니다</h4>
            <p>선택한 기간의 매출 데이터가 없습니다.</p>
        </div>
    `;
    
    // 통계도 초기화
    currentMonthSalesEl.textContent = '₩0';
    lastMonthSalesEl.textContent = '₩0';
    yearTotalSalesEl.textContent = '₩0';
    avgMonthlySalesEl.textContent = '₩0';
    salesChangeEl.textContent = '전월 대비 -';
}

// 통계 업데이트
function updateStats(data) {
    if (!data || data.length === 0) return;
    
    const currentMonth = new Date().getMonth() + 1;
    const currentMonthData = data.find(d => d.month === currentMonth);
    const lastMonthData = data.find(d => d.month === currentMonth - 1);
    
    // 이번 달 매출
    const currentSales = currentMonthData?.amount || 0;
    currentMonthSalesEl.textContent = formatCurrency(currentSales);
    
    // 지난 달 매출
    const lastSales = lastMonthData?.amount || 0;
    lastMonthSalesEl.textContent = formatCurrency(lastSales);
    
    // 전월 대비 변화
    if (lastSales > 0) {
        const changePercent = ((currentSales - lastSales) / lastSales * 100).toFixed(1);
        const isPositive = changePercent >= 0;
        salesChangeEl.textContent = `전월 대비 ${isPositive ? '+' : ''}${changePercent}%`;
        salesChangeEl.className = isPositive ? 'change' : 'change negative';
    }
    
    // 올해 누적 매출
    const yearTotal = data.reduce((sum, d) => sum + (d.amount || 0), 0);
    yearTotalSalesEl.textContent = formatCurrency(yearTotal);
    
    // 평균 월 매출
    const avgSales = data.length > 0 ? yearTotal / data.length : 0;
    avgMonthlySalesEl.textContent = formatCurrency(avgSales);
}

// 통화 포맷
function formatCurrency(amount) {
    return '₩' + Math.round(amount).toLocaleString('ko-KR');
}
