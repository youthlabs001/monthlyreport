// 대시보드 기능

let currentUser = null;
let userData = null;
let charts = {};
let currentCompany = null;

document.addEventListener('DOMContentLoaded', () => {
    // 로그인 확인
    currentUser = Storage.getUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // 사용자 데이터 로드
    const baseUserData = DEMO_USERS[currentUser.email];
    if (!baseUserData) {
        Storage.removeUser();
        window.location.href = 'index.html';
        return;
    }
    
    // 회사 선택 초기화
    initCompanySelector(baseUserData);
    
    // 초기화
    initDashboard();
    setupEventListeners();
});

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
    
    // 첫 번째 회사 (기본 데이터)
    if (currentCompany === baseUserData.companyName) {
        userData = baseUserData;
    } 
    // 추가 회사들
    else if (COMPANY_DATA[currentUser.email] && COMPANY_DATA[currentUser.email][currentCompany]) {
        userData = COMPANY_DATA[currentUser.email][currentCompany];
    }
    // 데이터가 없으면 기본 데이터 사용
    else {
        userData = baseUserData;
    }
    
    // 선택한 회사 저장
    Storage.setSelectedCompany(currentUser.email, currentCompany);
}

// 회사 전환
function switchCompany(companyName) {
    currentCompany = companyName;
    
    // 데이터 로드
    loadCompanyData();
    
    // 차트 제거
    destroyAllCharts();
    
    // 대시보드 전체 재초기화
    initDashboard();
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
    
    // 차트 생성
    createRevenueChart();
    createWeeklyChart();
    createGrowthChart();
    
    // 거래 내역 테이블 업데이트
    updateTransactionTable();
}

// 사용자 정보 업데이트
function updateUserInfo() {
    // 좌측 패널 사용자 정보
    const userNameLarge = document.getElementById('userNameLarge');
    const userEmailLarge = document.getElementById('userEmailLarge');
    
    if (userNameLarge) userNameLarge.textContent = userData.companyName || currentCompany;
    if (userEmailLarge) userEmailLarge.textContent = currentUser.email;
    
    // 날짜 정보
    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 기준`;
    const dateInfo = document.getElementById('dateInfo');
    if (dateInfo) dateInfo.textContent = dateStr;
}

// 빠른 통계 업데이트
// 빠른 통계 업데이트 (사용하지 않음 - 삭제됨)
function updateQuickStats() {
    // 빠른 통계 섹션이 제거되었으므로 더 이상 필요 없음
}

// 통계 카드 업데이트
function updateStatCards() {
    const data = userData.data;
    
    // 업로드된 데이터 가져오기
    const storageKey = `transactions_${currentUser.email}`;
    const uploadedData = localStorage.getItem(storageKey);
    
    let uploadedRevenue = 0;
    let uploadedCount = 0;
    
    if (uploadedData) {
        try {
            const uploadedTransactions = JSON.parse(uploadedData);
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            
            uploadedTransactions.forEach(t => {
                const tDate = new Date(t.date);
                if (tDate.getMonth() === currentMonth && 
                    tDate.getFullYear() === currentYear && 
                    t.status === 'completed') {
                    uploadedRevenue += t.amount;
                    uploadedCount++;
                }
            });
        } catch (error) {
            console.error('업로드 데이터 처리 오류:', error);
        }
    }
    
    // 전체 이번 달 매출 (기본 + 업로드)
    const totalCurrentRevenue = data.currentMonthRevenue + uploadedRevenue;
    document.getElementById('currentRevenue').textContent = formatCurrency(totalCurrentRevenue);
    
    // 전월 대비 증감률
    const revenueChange = ((totalCurrentRevenue - data.lastMonthRevenue) / data.lastMonthRevenue) * 100;
    const revenueChangeEl = document.getElementById('revenueChange');
    revenueChangeEl.textContent = formatPercent(Math.abs(revenueChange));
    
    const statChange = revenueChangeEl.closest('.stat-change');
    if (revenueChange > 0) {
        statChange.classList.add('positive');
        statChange.querySelector('.arrow').textContent = '↑';
    } else {
        statChange.classList.add('negative');
        statChange.querySelector('.arrow').textContent = '↓';
    }
    
    // 전월 매출
    document.getElementById('lastRevenue').textContent = formatCurrency(data.lastMonthRevenue);
    
    // 평균 거래액 (전체 거래 건수로 계산)
    const totalTransactions = data.transactions.length + uploadedCount;
    const avgTransaction = totalCurrentRevenue / totalTransactions;
    document.getElementById('avgTransaction').textContent = formatCurrency(Math.round(avgTransaction));
}

// 월별 매출 추이 차트
function createRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    const data = userData.data;
    
    charts.revenue = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.monthlyRevenue.map(item => formatMonthKo(item.month)),
            datasets: [
                {
                    label: '2026년',
                    data: data.monthlyRevenue.map(item => item.revenue / 1000000),
                    borderColor: '#4F46E5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 8,
                    pointHoverRadius: 12,
                    pointBackgroundColor: '#4F46E5',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#4F46E5',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 3
                },
                {
                    label: '2025년',
                    data: data.lastYearRevenue.map(item => item.revenue / 1000000),
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 8,
                    pointHoverRadius: 12,
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#10B981',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 3
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
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ₩' + (context.parsed.y * 1000000).toLocaleString('ko-KR');
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₩' + value + 'M';
                        }
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const element = elements[0];
                    const datasetIndex = element.datasetIndex;
                    const index = element.index;
                    
                    // 2026년 데이터만 상세 보기 (datasetIndex === 0)
                    if (datasetIndex === 0) {
                        const monthData = data.monthlyRevenue[index];
                        showRevenueDetailModal(monthData, index);
                    } else {
                        showNotification('2026년 데이터의 점을 클릭하면 상세 내역을 볼 수 있습니다.', 'info');
                    }
                }
            }
        }
    });
}

// 주간 매출 추이 차트
function createWeeklyChart() {
    const ctx = document.getElementById('weeklyChart');
    const data = userData.data;
    
    charts.weekly = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.weeklyData.map(item => item.day),
            datasets: [{
                label: '일별 매출',
                data: data.weeklyData.map(item => item.revenue / 1000000),
                backgroundColor: '#4F46E5',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '매출: ₩' + (context.parsed.y * 1000000).toLocaleString('ko-KR');
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₩' + value + 'M';
                        }
                    }
                }
            }
        }
    });
}

// 분기별 성장률 차트
function createGrowthChart() {
    const ctx = document.getElementById('growthChart');
    const data = userData.data;
    
    charts.growth = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.quarterlyGrowth.map(item => item.quarter),
            datasets: [{
                label: '성장률',
                data: data.quarterlyGrowth.map(item => item.growth),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '성장률: ' + context.parsed.y + '%';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

// 거래 내역 테이블 업데이트
function updateTransactionTable() {
    const tbody = document.getElementById('transactionTable');
    const data = userData.data;
    
    // 기본 거래 데이터
    let allTransactions = [...data.transactions];
    
    // 업로드된 데이터 가져오기
    const storageKey = `transactions_${currentUser.email}`;
    const uploadedData = localStorage.getItem(storageKey);
    
    if (uploadedData) {
        try {
            const uploadedTransactions = JSON.parse(uploadedData);
            allTransactions = [...uploadedTransactions, ...allTransactions];
        } catch (error) {
            console.error('업로드 데이터 로드 오류:', error);
        }
    }
    
    // 날짜순 정렬 (최신순)
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 테이블 렌더링
    tbody.innerHTML = allTransactions.map(transaction => `
        <tr>
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.client}</td>
            <td>${transaction.category}</td>
            <td><strong>${formatCurrency(transaction.amount)}</strong></td>
            <td>
                <span class="status-badge ${transaction.status}">
                    ${transaction.status === 'completed' ? '완료' : transaction.status === 'pending' ? '대기' : '취소'}
                </span>
            </td>
        </tr>
    `).join('');
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
    
    // 전체보기 버튼
    const viewAllBtn = document.querySelector('.btn-view-all');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            showNotification('상세 거래 내역 페이지로 이동합니다.', 'info');
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
function showRevenueDetailModal(monthData, index) {
    const modal = document.getElementById('revenueModal');
    const data = userData.data;
    
    // 모달 타이틀 및 기간 설정
    document.getElementById('modalTitle').textContent = '매출 상세 내역';
    document.getElementById('modalPeriod').textContent = formatMonthKo(monthData.month);
    
    // 총 매출
    document.getElementById('modalTotalRevenue').textContent = formatCurrency(monthData.revenue);
    
    // 전월 대비 변화
    if (index > 0) {
        const prevRevenue = data.monthlyRevenue[index - 1].revenue;
        const change = ((monthData.revenue - prevRevenue) / prevRevenue) * 100;
        const changeEl = document.getElementById('modalChange');
        if (change > 0) {
            changeEl.innerHTML = `<span style="color: #10B981">▲ ${formatPercent(change)}</span>`;
        } else {
            changeEl.innerHTML = `<span style="color: #EF4444">▼ ${formatPercent(Math.abs(change))}</span>`;
        }
    } else {
        document.getElementById('modalChange').textContent = '-';
    }
    
    // 거래 건수 (예시로 랜덤 생성)
    const transactionCount = Math.floor(Math.random() * 30) + 20;
    document.getElementById('modalTransactionCount').textContent = transactionCount + '건';
    
    // 카테고리별 매출
    renderCategoryBreakdown(monthData.revenue);
    
    // 주요 거래처
    renderTopClients();
    
    // 전월 비교 차트
    if (index > 0) {
        const prevMonthData = data.monthlyRevenue[index - 1];
        renderMonthComparisonChart(monthData, prevMonthData);
    }
    
    // 전년 동월 비교 차트
    if (index < data.lastYearRevenue.length) {
        renderComparisonChart(monthData, data.lastYearRevenue[index]);
    }
    
    // 모달 표시
    modal.classList.add('active');
}

// 카테고리별 매출 렌더링
function renderCategoryBreakdown(totalRevenue) {
    const container = document.getElementById('modalCategoryBreakdown');
    const categories = userData.data.categories;
    
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];
    
    // 총 매출 대비 비율 계산
    const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
    
    container.innerHTML = categories.map((cat, index) => {
        const percentage = ((cat.amount / total) * 100).toFixed(1);
        return `
            <div class="category-item">
                <div class="category-name">
                    <span>
                        <span class="category-dot" style="background: ${colors[index]}"></span>
                        ${cat.name}
                    </span>
                    <span class="category-amount">${formatCurrency(cat.amount)}</span>
                </div>
                <div class="category-bar-container">
                    <div class="category-bar" style="width: ${percentage}%; background: linear-gradient(90deg, ${colors[index]} 0%, ${colors[index]}dd 100%);">
                        <span class="category-percentage">${percentage}%</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 주요 거래처 렌더링
function renderTopClients() {
    const container = document.getElementById('modalTopClients');
    const transactions = userData.data.transactions;
    
    // 거래처별 매출 합계 계산
    const clientMap = {};
    transactions.forEach(t => {
        if (!clientMap[t.client]) {
            clientMap[t.client] = {
                name: t.client,
                category: t.category,
                total: 0
            };
        }
        clientMap[t.client].total += t.amount;
    });
    
    // 상위 5개 추출
    const topClients = Object.values(clientMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    
    container.innerHTML = topClients.map((client, index) => `
        <div class="client-item" style="display: flex; align-items: center;">
            <div class="client-rank">${index + 1}</div>
            <div class="client-info">
                <div class="client-name">${client.name}</div>
                <div class="client-category">${client.category}</div>
            </div>
            <div class="client-amount">${formatCurrency(client.total)}</div>
        </div>
    `).join('');
}

// 전년 동월 비교 차트 렌더링
function renderComparisonChart(currentYear, lastYear) {
    const ctx = document.getElementById('modalComparisonChart');
    
    // 기존 차트가 있으면 제거
    if (charts.comparison) {
        charts.comparison.destroy();
    }
    
    const growthRate = ((currentYear.revenue - lastYear.revenue) / lastYear.revenue * 100).toFixed(1);
    
    charts.comparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['2025년', '2026년'],
            datasets: [{
                label: '매출',
                data: [
                    lastYear.revenue / 1000000,
                    currentYear.revenue / 1000000
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
                            return '매출: ' + formatCurrency(context.parsed.y * 1000000);
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
                            return '₩' + value + 'M';
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
function renderMonthComparisonChart(currentMonth, prevMonth) {
    const ctx = document.getElementById('modalMonthComparisonChart');
    
    // 기존 차트가 있으면 제거
    if (charts.monthComparison) {
        charts.monthComparison.destroy();
    }
    
    const growthRate = ((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue * 100).toFixed(1);
    const currentMonthLabel = formatMonthKo(currentMonth.month);
    const prevMonthLabel = formatMonthKo(prevMonth.month);
    
    charts.monthComparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [prevMonthLabel, currentMonthLabel],
            datasets: [{
                label: '매출',
                data: [
                    prevMonth.revenue / 1000000,
                    currentMonth.revenue / 1000000
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
                            return '매출: ' + formatCurrency(context.parsed.y * 1000000);
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
                            return '₩' + value + 'M';
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
        
        <!-- 최근 거래 내역 -->
        <div style="margin-bottom: 20px;">
            <h3 style="font-size: 18px; color: #1F2937; margin-bottom: 15px; border-left: 4px solid #4F46E5; padding-left: 12px;">최근 거래 내역</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #F9FAFB;">
                        <th style="padding: 10px; border: 1px solid #E5E7EB; text-align: left; font-size: 13px;">날짜</th>
                        <th style="padding: 10px; border: 1px solid #E5E7EB; text-align: left; font-size: 13px;">거래처</th>
                        <th style="padding: 10px; border: 1px solid #E5E7EB; text-align: left; font-size: 13px;">카테고리</th>
                        <th style="padding: 10px; border: 1px solid #E5E7EB; text-align: right; font-size: 13px;">금액</th>
                        <th style="padding: 10px; border: 1px solid #E5E7EB; text-align: center; font-size: 13px;">상태</th>
                    </tr>
                </thead>
                <tbody>
                    ${userData.data.transactions.map(t => `
                        <tr>
                            <td style="padding: 8px; border: 1px solid #E5E7EB; font-size: 12px;">${formatDate(t.date)}</td>
                            <td style="padding: 8px; border: 1px solid #E5E7EB; font-size: 12px;">${t.client}</td>
                            <td style="padding: 8px; border: 1px solid #E5E7EB; font-size: 12px;">${t.category}</td>
                            <td style="padding: 8px; border: 1px solid #E5E7EB; text-align: right; font-weight: 600; font-size: 12px;">${formatCurrency(t.amount)}</td>
                            <td style="padding: 8px; border: 1px solid #E5E7EB; text-align: center; font-size: 11px;">${t.status === 'completed' ? '✓ 완료' : t.status === 'pending' ? '⏳ 대기' : '✗ 취소'}</td>
                        </tr>
                    `).join('')}
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
