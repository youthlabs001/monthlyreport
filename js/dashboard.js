// 대시보드 기능

let currentUser = null;
let userData = null;
let charts = {};
let currentCompany = null;

// 초기화 함수
function initApp() {
    console.log('[initApp] 시작');
    
    // 로그인 확인
    currentUser = Storage.getUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    console.log('[initApp] currentUser:', currentUser);
    
    // 관리자 계정은 기본적으로 관리자 페이지로 이동 (단, '대시보드로 돌아가기'로 온 경우는 표시)
    if (isAdminUser(currentUser.email) && !sessionStorage.getItem('adminViewDashboard')) {
        window.location.href = 'admin.html';
        return;
    }
    sessionStorage.removeItem('adminViewDashboard');
    
    // 사용자 데이터 로드
    const baseUserData = DEMO_USERS[currentUser.email];
    console.log('[initApp] baseUserData:', baseUserData);
    
    if (!baseUserData) {
        Storage.removeUser();
        window.location.href = 'index.html';
        return;
    }
    
    // 회사 선택 초기화
    initCompanySelector(baseUserData);
    
    // 이벤트 리스너만 먼저 설정 (initDashboard는 loadCompanyData에서 호출)
    setupEventListeners();
    
    // 관리자 테스트 모드(사용자로 접속) 시 배너 표시
    setupImpersonationBanner();
}

// DOM 로드 완료 여부 확인 후 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // 이미 로드 완료된 경우 즉시 실행
    initApp();
}

// 관리자가 사용자 계정으로 접속한 경우 배너 표시 및 복귀 버튼
function setupImpersonationBanner() {
    if (sessionStorage.getItem('adminImpersonating') !== '1') return;
    const banner = document.getElementById('adminImpersonationBanner');
    const nameEl = document.getElementById('impersonationUserName');
    const backBtn = document.getElementById('backToAdminBtn');
    if (!banner || !nameEl || !backBtn) return;
    nameEl.textContent = currentUser.fullName || currentUser.email;
    banner.style.display = 'flex';
    backBtn.addEventListener('click', () => {
        const backup = sessionStorage.getItem('adminUserBackup');
        if (backup) {
            try {
                Storage.setUser(JSON.parse(backup));
            } catch (e) {}
        }
        sessionStorage.removeItem('adminImpersonating');
        sessionStorage.removeItem('adminUserBackup');
        location.href = 'admin.html';
    });
}

// 회사 선택 초기화
function initCompanySelector(baseUserData) {
    const companies = baseUserData.companies || [baseUserData.companyName];
    
    // 이전에 선택한 회사가 있으면 로드, 없으면 첫 번째 회사
    const savedCompany = Storage.getSelectedCompany(currentUser.email);
    currentCompany = (savedCompany && companies.includes(savedCompany)) ? savedCompany : companies[0];
    
    // 현재 회사에 맞는 데이터 로드
    loadCompanyData();
    
    // 여러 회사가 있으면 선택기 표시
    if (companies.length > 1) {
        const selector = document.getElementById('companySelector');
        const select = document.getElementById('companySelect');
        
        if (selector && select) {
            // 드롭다운 옵션 생성
            select.innerHTML = companies.map(company => 
                `<option value="${company}" ${company === currentCompany ? 'selected' : ''}>${company}</option>`
            ).join('');
            
            // 선택 이벤트
            select.addEventListener('change', (e) => {
                switchCompany(e.target.value);
            });
            
            selector.style.display = 'block';
        }
    }
}

// 회사 데이터 로드
function loadCompanyData() {
    const baseUserData = DEMO_USERS[currentUser.email];
    
    console.log('[loadCompanyData] currentUser.email:', currentUser.email);
    console.log('[loadCompanyData] currentCompany:', currentCompany);
    console.log('[loadCompanyData] baseUserData:', baseUserData);
    
    if (!baseUserData) {
        console.error('[loadCompanyData] baseUserData가 없습니다!');
        return;
    }
    
    // userData 설정
    userData = {
        companyName: currentCompany,
        fullName: baseUserData.fullName || currentUser.email,
        email: currentUser.email,
        data: {
            currentMonthRevenue: 0,
            lastMonthRevenue: 0,
            transactions: [],
            monthlyRevenue: [],
            lastYearRevenue: [],
            monthlyData: {}
        }
    };
    
    console.log('[loadCompanyData] userData 설정 완료:', userData);
    
    // 선택한 회사 저장
    Storage.setSelectedCompany(currentUser.email, currentCompany);
    
    // 대시보드 초기화 (사용자 정보 표시)
    initDashboard();
    
    // Supabase에서 거래 데이터 로드
    loadTransactionsFromSupabase();
}

// Supabase에서 거래 데이터 로드
function loadTransactionsFromSupabase() {
    var sb = window.supabaseClient || (typeof supabase !== 'undefined' ? supabase : null);
    if (!sb) {
        console.warn('[Supabase] 연결 안 됨, localStorage만 사용');
        destroyAllCharts();
        createRevenueChart({}, new Date().getFullYear(), new Date().getFullYear() - 1);
        return;
    }
    
    console.log(`[Supabase] ${currentCompany} 데이터 조회 중...`);
    console.log(`[Supabase] 필터 - user_email: ${currentUser.email}, company_name: ${currentCompany}`);
    
    sb.from('transactions')
        .select('*')
        .eq('user_email', currentUser.email)
        .eq('company_name', currentCompany)
        .then(function(result) {
            console.log(`[Supabase] 조회 결과:`, result);
            
            if (result.error) {
                console.error('[Supabase] 조회 에러:', result.error);
                destroyAllCharts();
                createRevenueChart({}, new Date().getFullYear(), new Date().getFullYear() - 1);
                return;
            }
            
            if (result.data && result.data.length > 0) {
                console.log(`[Supabase] ${currentCompany}의 거래 데이터 ${result.data.length}건 로드됨`);
                console.log(`[Supabase] 첫 번째 데이터 샘플:`, result.data[0]);
                
                // Supabase 데이터를 localStorage에 캐시
                const storageKey = `transactions_${currentUser.email}_${currentCompany}`;
                const transactions = result.data.map(function(row) {
                    return {
                        date: row.transaction_date,
                        client: row.client,
                        category: row.category,
                        amount: row.amount,
                        status: row.status,
                        note: row.note
                    };
                });
                localStorage.setItem(storageKey, JSON.stringify(transactions));
                
                console.log(`[localStorage] ${storageKey}에 ${transactions.length}건 캐시됨`);
                
                // 월별 데이터 집계 및 차트 업데이트
                aggregateAndUpdateCharts(transactions);
            } else {
                console.log(`[Supabase] ${currentCompany}의 거래 데이터 없음 (0건)`);
                // Supabase에 데이터 없으면 빈 차트 표시
                destroyAllCharts();
                createRevenueChart({}, new Date().getFullYear(), new Date().getFullYear() - 1);
            }
        })
        .catch(function(err) {
            console.error('[Supabase] 거래 데이터 로드 실패:', err);
            // 에러 시 빈 차트 표시
            destroyAllCharts();
            createRevenueChart({}, new Date().getFullYear(), new Date().getFullYear() - 1);
        });
}

// 거래 데이터를 월별로 집계하여 차트 업데이트
function aggregateAndUpdateCharts(transactions) {
    console.log('[차트 업데이트] 월별 집계 시작...', transactions.length + '건');
    console.log('[차트 업데이트] 첫 5개 거래 샘플:', transactions.slice(0, 5));
    
    // 현재 연도 및 전년도
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    console.log(`[차트 업데이트] 현재 연도: ${currentYear}, 전년도: ${lastYear}`);
    console.log(`[차트 업데이트] 현재 월: ${new Date().getMonth() + 1}, 전월: ${new Date().getMonth()}`);
    
    // 월별 데이터 집계 (연도별로 분리)
    const monthlyData = {};
    
    transactions.forEach(function(t, idx) {
        const date = new Date(t.date);
        if (isNaN(date.getTime())) {
            console.log(`[차트 업데이트] 날짜 파싱 실패 [${idx}]:`, t.date);
            return;
        }
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-12
        
        if (idx < 3) {
            console.log(`[차트 업데이트] 거래 [${idx}] - 날짜: ${t.date}, 연도: ${year}, 월: ${month}, 금액: ${t.amount}`);
        }
        
        // 올해와 전년도만 집계
        if (year !== currentYear && year !== lastYear) {
            if (idx < 3) {
                console.log(`[차트 업데이트] 거래 [${idx}] - 연도 범위 벗어남 (건너뜀)`);
            }
            return;
        }
        
        const key = `${year}-${month}`;
        
        if (!monthlyData[key]) {
            monthlyData[key] = 0;
        }
        
        monthlyData[key] += parseFloat(t.amount) || 0;
    });
    
    console.log('[차트 업데이트] 월별 집계 결과:', monthlyData);
    
    // 이번 달/전월 매출 계산
    const now = new Date();
    const currentMonth = `${currentYear}-${now.getMonth() + 1}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = `${lastMonthDate.getFullYear()}-${lastMonthDate.getMonth() + 1}`;
    
    console.log(`[차트 업데이트] 이번 달 키: ${currentMonth}`);
    console.log(`[차트 업데이트] 전월 키: ${lastMonth}`);
    
    const currentMonthRevenue = monthlyData[currentMonth] || 0;
    const lastMonthRevenue = monthlyData[lastMonth] || 0;
    
    console.log(`[차트 업데이트] 이번 달 매출: ${currentMonthRevenue}`);
    console.log(`[차트 업데이트] 전월 매출: ${lastMonthRevenue}`);
    
    // userData 업데이트
    if (!userData.data) {
        userData.data = {};
    }
    userData.data.currentMonthRevenue = currentMonthRevenue;
    userData.data.lastMonthRevenue = lastMonthRevenue;
    userData.data.monthlyData = monthlyData;
    userData.data.transactions = transactions;
    
    // 통계 업데이트
    updateStatCards();
    
    // 차트 다시 그리기
    destroyAllCharts();
    createRevenueChart(monthlyData, currentYear, lastYear);
    
    console.log('[차트 업데이트] 완료!');
}

// 모든 차트 제거
function destroyAllCharts() {
    if (charts.revenue) {
        charts.revenue.destroy();
        charts.revenue = null;
    }
}

// 회사 전환
function switchCompany(companyName) {
    currentCompany = companyName;
    
    // 차트 제거
    destroyAllCharts();
    
    // 데이터 로드 (내부에서 initDashboard 호출)
    loadCompanyData();
}

// 모든 차트 제거
function destroyAllCharts() {
    Object.keys(charts).forEach(key => {
        if (charts[key]) {
            charts[key].destroy();
            charts[key] = null;
        }
    });
    charts = {};
}

// 대시보드 초기화
function initDashboard() {
    // 사용자 정보 표시
    updateUserInfo();
    
    // 통계 카드 업데이트
    updateStatCards();
    
    // 차트는 데이터 로드 완료 후 생성 (initDashboard에서는 생성 안 함)
}

// 관리자에서 등록한 공지사항 표시
function updateDashboardNotices() {
    const container = document.getElementById('dashboardNoticeList');
    if (!container) return;
    let notices = [];
    try {
        const raw = localStorage.getItem('admin_notices');
        if (raw) notices = JSON.parse(raw);
    } catch (e) {}
    if (notices.length === 0) {
        container.innerHTML = '<div class="notice-empty">등록된 공지사항이 없습니다.</div>';
        return;
    }
    const now = new Date();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    container.innerHTML = notices.slice(0, 10).map(notice => {
        const dateStr = notice.date ? notice.date.slice(0, 10).replace(/-/g, '.') : '';
        const isNew = notice.createdAt && new Date(notice.createdAt).getTime() > sevenDaysAgo;
        return `
            <div class="notice-item${isNew ? ' new' : ''}">
                ${isNew ? '<div class="notice-badge">NEW</div>' : ''}
                <div class="notice-title">${escapeHtml(notice.title)}</div>
                <div class="notice-date">${dateStr}</div>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 사용자 정보 업데이트
function updateUserInfo() {
    console.log('[updateUserInfo] 실행 중...');
    console.log('[updateUserInfo] userData:', userData);
    console.log('[updateUserInfo] currentUser:', currentUser);
    console.log('[updateUserInfo] currentCompany:', currentCompany);
    
    // 좌측 패널 사용자 정보
    const userNameLarge = document.getElementById('userNameLarge');
    const userEmailLarge = document.getElementById('userEmailLarge');
    
    const displayName = currentCompany || userData?.companyName || '회사명';
    const displayEmail = currentUser?.email || 'user@company.com';
    
    if (userNameLarge) {
        userNameLarge.textContent = displayName;
        console.log('[updateUserInfo] 회사명 설정:', displayName);
    }
    if (userEmailLarge) {
        userEmailLarge.textContent = displayEmail;
        console.log('[updateUserInfo] 이메일 설정:', displayEmail);
    }
    
    // 날짜 정보
    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 기준`;
    const dateInfo = document.getElementById('dateInfo');
    if (dateInfo) {
        dateInfo.textContent = dateStr;
        console.log('[updateUserInfo] 날짜 설정:', dateStr);
    }
}

// 빠른 통계 업데이트
// 빠른 통계 업데이트 (사용하지 않음 - 삭제됨)
function updateQuickStats() {
    // 빠른 통계 섹션이 제거되었으므로 더 이상 필요 없음
}

// 통계 카드 업데이트
function updateStatCards() {
    console.log('[updateStatCards] 시작');
    console.log('[updateStatCards] userData.data:', userData.data);
    
    const data = userData.data || {};
    
    const currentMonthRevenue = data.currentMonthRevenue || 0;
    const lastMonthRevenue = data.lastMonthRevenue || 0;
    
    console.log('[updateStatCards] 이번 달 매출:', currentMonthRevenue);
    console.log('[updateStatCards] 전월 매출:', lastMonthRevenue);
    
    // 이번 달 매출 표시
    document.getElementById('currentRevenue').textContent = formatCurrency(currentMonthRevenue);
    
    // 전월 대비 증감률
    let revenueChange = 0;
    if (lastMonthRevenue > 0) {
        revenueChange = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    }
    
    const revenueChangeEl = document.getElementById('revenueChange');
    revenueChangeEl.textContent = formatPercent(Math.abs(revenueChange));
    
    const statChange = revenueChangeEl.closest('.stat-change');
    if (revenueChange > 0) {
        statChange.classList.remove('negative');
        statChange.classList.add('positive');
        statChange.querySelector('.arrow').textContent = '↑';
    } else {
        statChange.classList.remove('positive');
        statChange.classList.add('negative');
        statChange.querySelector('.arrow').textContent = '↓';
    }
    
    // 전월 매출
    document.getElementById('lastRevenue').textContent = formatCurrency(lastMonthRevenue);
    
    // 평균 거래액 (이번 달 기준)
    const avgTransaction = currentMonthRevenue > 0 && data.transactions ? currentMonthRevenue / data.transactions.length : 0;
    document.getElementById('avgTransaction').textContent = formatCurrency(Math.round(avgTransaction));
    
    console.log('[updateStatCards] 완료');
}

// 월별 매출 추이 차트 (관리자 화면과 동일)
function createRevenueChart(monthlyData, currentYear, lastYear) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) {
        console.error('[차트] revenueChart 캔버스를 찾을 수 없습니다');
        return;
    }
    
    // 기본값 설정 (파라미터가 없는 경우)
    if (!monthlyData) {
        monthlyData = userData.data?.monthlyData || {};
    }
    if (!currentYear) {
        currentYear = new Date().getFullYear();
    }
    if (!lastYear) {
        lastYear = currentYear - 1;
    }
    
    console.log('[차트] 생성 시작 - 올해:', currentYear, ', 전년:', lastYear);
    console.log('[차트] monthlyData:', monthlyData);
    
    // 1월~12월 레이블
    const labels = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    
    // 올해 데이터 (2026년)
    const thisYearData = [];
    for (let m = 1; m <= 12; m++) {
        const key = `${currentYear}-${m}`;
        thisYearData.push(monthlyData[key] || 0);
    }
    
    // 전년 데이터 (2025년)
    const lastYearData = [];
    for (let m = 1; m <= 12; m++) {
        const key = `${lastYear}-${m}`;
        lastYearData.push(monthlyData[key] || 0);
    }
    
    console.log('[차트] 2026년 데이터:', thisYearData);
    console.log('[차트] 2025년 데이터:', lastYearData);
    
    // Chart.js 렌더링
    charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `${currentYear}년`,
                    data: thisYearData,
                    borderColor: '#4F46E5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: `${lastYear}년`,
                    data: lastYearData,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'point',
                intersect: true
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += formatCurrency(context.parsed.y);
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            onClick: function(event, elements) {
                console.log('[차트 클릭] elements:', elements);
                
                if (elements.length > 0) {
                    const element = elements[0];
                    const datasetIndex = element.datasetIndex;
                    const monthIndex = element.index;
                    
                    console.log('[차트 클릭] 데이터셋:', datasetIndex, '월:', monthIndex + 1);
                    
                    // datasetIndex: 0 = 2026년, 1 = 2025년
                    const year = datasetIndex === 0 ? currentYear : lastYear;
                    const month = monthIndex + 1;
                    const key = `${year}-${month}`;
                    const revenue = monthlyData[key] || 0;
                    
                    console.log('[차트 클릭] 상세 보기:', year, '년', month, '월, 매출:', revenue);
                    
                    // 매출이 0원이 아닐 때만 모달 표시
                    if (revenue > 0) {
                        showRevenueDetailModal(year, month, revenue);
                    } else {
                        showNotification(`${year}년 ${month}월 데이터가 없습니다.`, 'info');
                    }
                }
            }
        }
    });
    
    console.log('[차트] 생성 완료');
}

// 통화 포맷 함수
function formatCurrency(value) {
    if (typeof value !== 'number') value = 0;
    return '₩' + Math.round(value).toLocaleString('ko-KR');
}

// 퍼센트 포맷 함수
function formatPercent(value) {
    if (typeof value !== 'number') value = 0;
    return value.toFixed(1) + '%';
}

// 월 포맷 함수
function formatMonthKo(monthStr) {
    // "2026-1" → "2026년 1월"
    if (typeof monthStr === 'string' && monthStr.includes('-')) {
        const parts = monthStr.split('-');
        return `${parts[0]}년 ${parts[1]}월`;
    }
    return monthStr;
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('로그아웃 하시겠습니까?')) {
                Storage.removeUser();
                window.location.href = 'index.html';
            }
        });
    }
    
    // 빠른 메뉴 버튼들
    const quickMenuBtns = document.querySelectorAll('.quick-menu-btn');
    quickMenuBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (index === 0) {
                alert('상세 리포트 페이지로 이동합니다.');
            } else if (index === 1) {
                alert('거래 내역 페이지로 이동합니다.');
            } else if (index === 2) {
                alert('설정 페이지로 이동합니다.');
            } else if (index === 3) {
                window.location.href = 'admin.html';
            }
        });
    });
    
    // 기간 선택
    const periodSelect = document.getElementById('periodSelect');
    if (periodSelect) {
        periodSelect.addEventListener('change', (e) => {
            console.log('기간 변경:', e.target.value);
            showNotification('데이터를 불러오는 중...', 'info');
            // 실제로는 여기서 데이터를 다시 로드하고 차트를 업데이트합니다
        });
    }
    
    // 내보내기 버튼
    const exportBtn = document.querySelector('.btn-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportToPDF();
        });
    }
    
    
    // 공지사항 아이템 클릭
    const noticeItems = document.querySelectorAll('.notice-item');
    noticeItems.forEach((item) => {
        item.addEventListener('click', () => {
            const title = item.querySelector('.notice-title').textContent;
            showNotification(`"${title}" 공지사항을 확인합니다.`, 'info');
        });
    });
    
    // 도움말 링크
    const helpItems = document.querySelectorAll('.help-item');
    helpItems.forEach((item) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const text = item.querySelector('span:last-child').textContent;
            showNotification(`${text} 페이지로 이동합니다.`, 'info');
        });
    });
    
    // 모달 닫기 버튼
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeRevenueModal);
    }
    
    // 모달 배경 클릭 시 닫기
    const modal = document.getElementById('revenueModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeRevenueModal();
            }
        });
    }
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('revenueModal');
            if (modal && modal.classList.contains('active')) {
                closeRevenueModal();
            }
        }
    });
}

// 매출 상세 모달 표시
function showRevenueDetailModal(year, month, revenue) {
    console.log('[모달] 상세 내역 표시:', year, '년', month, '월, 매출:', revenue);
    
    const modal = document.getElementById('revenueModal');
    if (!modal) {
        console.error('[모달] revenueModal을 찾을 수 없습니다');
        return;
    }
    
    const monthlyData = userData.data?.monthlyData || {};
    
    // 모달 타이틀 및 기간 설정
    document.getElementById('modalTitle').textContent = '매출 상세 내역';
    document.getElementById('modalPeriod').textContent = `${year}년 ${month}월`;
    
    // 총 매출
    document.getElementById('modalTotalRevenue').textContent = formatCurrency(revenue);
    
    // 전월 대비 변화
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevKey = `${prevYear}-${prevMonth}`;
    const prevRevenue = monthlyData[prevKey] || 0;
    
    if (prevRevenue > 0) {
        const change = ((revenue - prevRevenue) / prevRevenue) * 100;
        const changeEl = document.getElementById('modalChange');
        if (change > 0) {
            changeEl.innerHTML = `<span style="color: #10B981">▲ ${formatPercent(change)}</span>`;
        } else if (change < 0) {
            changeEl.innerHTML = `<span style="color: #EF4444">▼ ${formatPercent(Math.abs(change))}</span>`;
        } else {
            changeEl.textContent = '0%';
        }
    } else {
        document.getElementById('modalChange').textContent = '-';
    }
    
    // 거래 건수 계산 (실제 데이터에서)
    const transactions = userData.data?.transactions || [];
    const monthTransactions = transactions.filter(function(t) {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === year && (tDate.getMonth() + 1) === month;
    });
    
    document.getElementById('modalTransactionCount').textContent = monthTransactions.length + '건';
    console.log('[모달] 해당 월 거래 건수:', monthTransactions.length);
    
    // 카테고리별 매출 (실제 데이터에서 집계)
    const categoryData = {};
    monthTransactions.forEach(function(t) {
        const cat = t.category || '기타';
        if (!categoryData[cat]) {
            categoryData[cat] = 0;
        }
        categoryData[cat] += t.amount;
    });
    
    renderCategoryBreakdown(categoryData);
    
    // 전월 비교 차트
    renderMonthComparisonChart(revenue, prevRevenue, month, prevMonth);
    
    // 전년 동월 비교 차트
    const lastYearKey = `${year - 1}-${month}`;
    const lastYearRevenue = monthlyData[lastYearKey] || 0;
    renderComparisonChart(revenue, lastYearRevenue, year, month);
    
    // 모달 표시
    modal.classList.add('active');
    console.log('[모달] 표시 완료');
}

// 카테고리별 매출 렌더링
function renderCategoryBreakdown(categoryData) {
    const container = document.getElementById('modalCategoryBreakdown');
    
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    
    // 카테고리를 배열로 변환
    const categories = Object.keys(categoryData).map(function(name) {
        return { name: name, amount: categoryData[name] };
    });
    
    // 금액 순으로 정렬
    categories.sort(function(a, b) { return b.amount - a.amount; });
    
    // 총 매출
    const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
    
    if (total === 0 || categories.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #9CA3AF; padding: 20px;">카테고리별 데이터가 없습니다</div>';
        return;
    }
    
    container.innerHTML = categories.map((cat, index) => {
        const percentage = ((cat.amount / total) * 100).toFixed(1);
        return `
            <div class="category-item">
                <div class="category-name">
                    <span>
                        <span class="category-dot" style="background: ${colors[index % colors.length]}"></span>
                        ${cat.name}
                    </span>
                    <span class="category-amount">${formatCurrency(cat.amount)}</span>
                </div>
                <div class="category-bar-container">
                    <div class="category-bar" style="width: ${percentage}%; background: linear-gradient(90deg, ${colors[index % colors.length]} 0%, ${colors[index % colors.length]}dd 100%);">
                        <span class="category-percentage">${percentage}%</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 전년 동월 비교 차트 렌더링
function renderComparisonChart(currentRevenue, lastYearRevenue, year, month) {
    const ctx = document.getElementById('modalComparisonChart');
    if (!ctx) return;
    
    // 기존 차트가 있으면 제거
    if (charts.comparison) {
        charts.comparison.destroy();
    }
    
    const growthRate = lastYearRevenue > 0 ? ((currentRevenue - lastYearRevenue) / lastYearRevenue * 100).toFixed(1) : 0;
    
    charts.comparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [`${year - 1}년 ${month}월`, `${year}년 ${month}월`],
            datasets: [{
                label: '매출',
                data: [
                    lastYearRevenue,
                    currentRevenue
                ],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(79, 70, 229, 0.8)'
                ],
                borderColor: [
                    '#10B981',
                    '#4F46E5'
                ],
                borderWidth: 2,
                borderRadius: 12,
                barThickness: 80
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 3,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: `전년 대비 ${growthRate > 0 ? '+' : ''}${growthRate}% ${growthRate > 0 ? '증가' : '감소'}`,
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    color: growthRate > 0 ? '#10B981' : '#EF4444',
                    padding: {
                        bottom: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return '매출: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            size: 12
                        },
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 13,
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });
}

// 전월 비교 차트 렌더링
function renderMonthComparisonChart(currentRevenue, prevRevenue, currentMonth, prevMonth) {
    const ctx = document.getElementById('modalMonthComparisonChart');
    if (!ctx) return;
    
    // 기존 차트가 있으면 제거
    if (charts.monthComparison) {
        charts.monthComparison.destroy();
    }
    
    const growthRate = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : 0;
    const currentMonthLabel = `${currentMonth}월`;
    const prevMonthLabel = `${prevMonth}월`;
    
    charts.monthComparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [prevMonthLabel, currentMonthLabel],
            datasets: [{
                label: '매출',
                data: [
                    prevRevenue,
                    currentRevenue
                ],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(79, 70, 229, 0.8)'
                ],
                borderColor: [
                    '#6366f1',
                    '#4F46E5'
                ],
                borderWidth: 2,
                borderRadius: 12,
                barThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: `전월 대비 ${growthRate > 0 ? '+' : ''}${growthRate}% ${growthRate > 0 ? '증가' : '감소'}`,
                    font: {
                        size: 13,
                        weight: 'bold'
                    },
                    color: growthRate > 0 ? '#10B981' : '#EF4444',
                    padding: {
                        bottom: 16
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 13
                    },
                    bodyFont: {
                        size: 12
                    },
                    callbacks: {
                        label: function(context) {
                            return '매출: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });
}

// 모달 닫기
function closeRevenueModal() {
    const modal = document.getElementById('revenueModal');
    modal.classList.remove('active');
    
    // 비교 차트 제거
    if (charts.comparison) {
        charts.comparison.destroy();
        charts.comparison = null;
    }
    
    // 전월 비교 차트 제거
    if (charts.monthComparison) {
        charts.monthComparison.destroy();
        charts.monthComparison = null;
    }
}

// 알림 메시지 표시
function showNotification(message, type = 'info') {
    const existingMsg = document.querySelector('.notification-box');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    const notificationBox = document.createElement('div');
    notificationBox.className = `notification-box notification-${type}`;
    notificationBox.textContent = message;
    
    notificationBox.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    `;
    
    if (type === 'success') {
        notificationBox.style.background = '#10B981';
        notificationBox.style.color = 'white';
    } else if (type === 'error') {
        notificationBox.style.background = '#EF4444';
        notificationBox.style.color = 'white';
    } else {
        notificationBox.style.background = '#3B82F6';
        notificationBox.style.color = 'white';
    }
    
    document.body.appendChild(notificationBox);
    
    setTimeout(() => {
        notificationBox.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notificationBox.remove(), 300);
    }, 2000);
}

// PDF로 내보내기
function exportToPDF() {
    showNotification('PDF 생성 중입니다. 잠시만 기다려주세요...', 'info');
    
    // PDF 생성을 위한 HTML 콘텐츠 준비
    const element = document.createElement('div');
    element.style.padding = '40px';
    element.style.backgroundColor = '#ffffff';
    element.style.width = '210mm'; // A4 너비
    
    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
    
    // 헤더
    element.innerHTML = `
        <div style="margin-bottom: 30px; text-align: center; border-bottom: 3px solid #4F46E5; padding-bottom: 20px;">
            <h1 style="font-size: 28px; color: #1F2937; margin-bottom: 10px;">${userData.companyName}</h1>
            <h2 style="font-size: 20px; color: #4F46E5; margin-bottom: 10px;">매출 대시보드 리포트</h2>
            <p style="font-size: 14px; color: #6B7280;">${dateStr} 기준</p>
        </div>
        
        <!-- 요약 통계 -->
        <div style="margin-bottom: 30px;">
            <h3 style="font-size: 18px; color: #1F2937; margin-bottom: 15px; border-left: 4px solid #4F46E5; padding-left: 12px;">주요 지표</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                    <td style="padding: 12px; border: 1px solid #E5E7EB; background: #F9FAFB; font-weight: 600;">이번 달 매출</td>
                    <td style="padding: 12px; border: 1px solid #E5E7EB; color: #4F46E5; font-weight: 700; font-size: 18px;">${formatCurrency(userData.data.currentMonthRevenue)}</td>
                    <td style="padding: 12px; border: 1px solid #E5E7EB; background: #F9FAFB; font-weight: 600;">전월 매출</td>
                    <td style="padding: 12px; border: 1px solid #E5E7EB;">${formatCurrency(userData.data.lastMonthRevenue)}</td>
                </tr>
                <tr>
                    <td style="padding: 12px; border: 1px solid #E5E7EB; background: #F9FAFB; font-weight: 600;">전월 대비</td>
                    <td style="padding: 12px; border: 1px solid #E5E7EB; color: #10B981; font-weight: 600;">${formatPercent(((userData.data.currentMonthRevenue - userData.data.lastMonthRevenue) / userData.data.lastMonthRevenue) * 100)} ↑</td>
                    <td style="padding: 12px; border: 1px solid #E5E7EB; background: #F9FAFB; font-weight: 600;">목표 달성률</td>
                    <td style="padding: 12px; border: 1px solid #E5E7EB;">${formatPercent((userData.data.currentMonthRevenue / userData.monthlyGoal) * 100)}</td>
                </tr>
            </table>
        </div>
        
        <!-- 카테고리별 매출 -->
        <div style="margin-bottom: 30px;">
            <h3 style="font-size: 18px; color: #1F2937; margin-bottom: 15px; border-left: 4px solid #4F46E5; padding-left: 12px;">카테고리별 매출</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background: #F9FAFB;">
                        <th style="padding: 12px; border: 1px solid #E5E7EB; text-align: left; font-size: 14px;">카테고리</th>
                        <th style="padding: 12px; border: 1px solid #E5E7EB; text-align: right; font-size: 14px;">금액</th>
                        <th style="padding: 12px; border: 1px solid #E5E7EB; text-align: right; font-size: 14px;">비중</th>
                    </tr>
                </thead>
                <tbody>
                    ${userData.data.categories.map(cat => `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #E5E7EB;">${cat.name}</td>
                            <td style="padding: 10px; border: 1px solid #E5E7EB; text-align: right; font-weight: 600;">${formatCurrency(cat.amount)}</td>
                            <td style="padding: 10px; border: 1px solid #E5E7EB; text-align: right;">${cat.value}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <!-- 월별 매출 추이 -->
        <div style="margin-bottom: 30px;">
            <h3 style="font-size: 18px; color: #1F2937; margin-bottom: 15px; border-left: 4px solid #4F46E5; padding-left: 12px;">월별 매출 추이</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background: #F9FAFB;">
                        <th style="padding: 12px; border: 1px solid #E5E7EB; text-align: left; font-size: 14px;">월</th>
                        <th style="padding: 12px; border: 1px solid #E5E7EB; text-align: right; font-size: 14px;">2026년</th>
                        <th style="padding: 12px; border: 1px solid #E5E7EB; text-align: right; font-size: 14px;">2025년</th>
                        <th style="padding: 12px; border: 1px solid #E5E7EB; text-align: right; font-size: 14px;">증감률</th>
                    </tr>
                </thead>
                <tbody>
                    ${userData.data.monthlyRevenue.map((item, index) => {
                        const lastYear = userData.data.lastYearRevenue[index];
                        const change = ((item.revenue - lastYear.revenue) / lastYear.revenue) * 100;
                        return `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #E5E7EB;">${formatMonthKo(item.month)}</td>
                            <td style="padding: 10px; border: 1px solid #E5E7EB; text-align: right; font-weight: 600;">${formatCurrency(item.revenue)}</td>
                            <td style="padding: 10px; border: 1px solid #E5E7EB; text-align: right;">${formatCurrency(lastYear.revenue)}</td>
                            <td style="padding: 10px; border: 1px solid #E5E7EB; text-align: right; color: ${change > 0 ? '#10B981' : '#EF4444'}; font-weight: 600;">${change > 0 ? '↑' : '↓'} ${formatPercent(Math.abs(change))}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <!-- 푸터 -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 12px;">
            <p>본 리포트는 ${dateStr}에 생성되었습니다.</p>
            <p>문의사항: ${currentUser.email}</p>
        </div>
    `;
    
    // PDF 옵션 설정
    const opt = {
        margin: [10, 10, 10, 10],
        filename: `${userData.companyName}_매출리포트_${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
        }
    };
    
    // PDF 생성
    html2pdf().set(opt).from(element).save().then(() => {
        showNotification('PDF 다운로드가 완료되었습니다!', 'success');
    }).catch(err => {
        console.error('PDF 생성 오류:', err);
        showNotification('PDF 생성 중 오류가 발생했습니다.', 'error');
    });
}
