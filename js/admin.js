// DOM Elements
const adminEmailEl = document.getElementById('adminEmail');
const logoutBtn = document.getElementById('logoutBtn');
const salesForm = document.getElementById('salesForm');
const customerSelect = document.getElementById('customerSelect');
const yearSelect = document.getElementById('yearSelect');
const monthSelect = document.getElementById('monthSelect');
const categoryInput = document.getElementById('category');
const categoryList = document.getElementById('categoryList');
const amountInput = document.getElementById('amount');
const salesCountInput = document.getElementById('salesCount');
const noteInput = document.getElementById('note');
const messageEl = document.getElementById('message');
const customerListEl = document.getElementById('customerList');
const recentSalesEl = document.getElementById('recentSales');
const refreshCustomersBtn = document.getElementById('refreshCustomers');
const refreshSalesBtn = document.getElementById('refreshSales');

// Bulk Upload Elements
const bulkCustomerSelect = document.getElementById('bulkCustomerSelect');
const pasteArea = document.getElementById('pasteArea');
const previewSection = document.getElementById('previewSection');
const previewTable = document.getElementById('previewTable');
const previewCount = document.getElementById('previewCount');
const bulkUploadBtn = document.getElementById('bulkUploadBtn');
const clearBulkBtn = document.getElementById('clearBulkBtn');
const clearPreviewBtn = document.getElementById('clearPreview');
const bulkMessageEl = document.getElementById('bulkMessage');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// Tab Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// 관리자 이메일 목록 (여기에 관리자 이메일 추가)
const ADMIN_EMAILS = ['anteater1@naver.com', 'mlbooks001@gmail.com'];

// 현재 사용자
let currentUser = null;
let parsedData = []; // 파싱된 데이터 저장

// 페이지 로드 시 인증 확인
document.addEventListener('DOMContentLoaded', async () => {
    await checkAdminAuth();
    await loadCustomers();
    await loadRecentSales();
    await loadCategories();
    setCurrentMonth();
});

// 관리자 인증 확인
async function checkAdminAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = session.user;
    
    // 관리자 권한 확인
    if (!ADMIN_EMAILS.includes(currentUser.email)) {
        alert('관리자 권한이 없습니다.');
        window.location.href = 'dashboard.html';
        return;
    }
    
    adminEmailEl.textContent = currentUser.email;
}

// 로그아웃
logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
});

// 현재 월 설정
function setCurrentMonth() {
    const currentMonth = new Date().getMonth() + 1;
    monthSelect.value = currentMonth;
}

// 고객 목록 로드
async function loadCustomers() {
    customerListEl.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        // auth.users에서 모든 사용자 가져오기 (관리자 제외)
        const { data: { users }, error } = await supabaseClient.auth.admin.listUsers();
        
        if (error) {
            // admin API 접근 불가시 대체 방법
            await loadCustomersFromProfiles();
            return;
        }
        
        const customers = users.filter(user => !ADMIN_EMAILS.includes(user.email));
        displayCustomers(customers);
        populateCustomerSelect(customers);
        
    } catch (error) {
        console.error('Error loading customers:', error);
        await loadCustomersFromProfiles();
    }
}

// profiles 테이블에서 고객 로드 (대체 방법)
async function loadCustomersFromProfiles() {
    try {
        const { data: profiles, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error && error.code === '42P01') {
            // 테이블이 없는 경우 - 기본 사용자 목록 표시
            displayNoCustomers();
            return;
        }
        
        if (profiles && profiles.length > 0) {
            displayCustomers(profiles);
            populateCustomerSelect(profiles);
        } else {
            // profiles 테이블은 있지만 데이터가 없는 경우 - auth users 직접 조회
            await loadCustomersDirectly();
        }
    } catch (error) {
        console.error('Error loading profiles:', error);
        await loadCustomersDirectly();
    }
}

// 직접 사용자 조회 (Supabase에서 가입한 사용자)
async function loadCustomersDirectly() {
    try {
        // sales_reports 테이블에서 user_id 목록 가져오기
        const { data: salesData, error } = await supabaseClient
            .from('sales_reports')
            .select('user_id')
            .limit(100);
        
        if (error && error.code === '42P01') {
            displayNoCustomers();
            return;
        }
        
        if (salesData && salesData.length > 0) {
            const uniqueUserIds = [...new Set(salesData.map(s => s.user_id))];
            const customers = uniqueUserIds.map(id => ({ id, email: `User ${id.slice(0, 8)}...` }));
            displayCustomers(customers);
            populateCustomerSelect(customers);
        } else {
            displayNoCustomers();
        }
    } catch (error) {
        console.error('Error:', error);
        displayNoCustomers();
    }
}

// 고객 없음 표시
function displayNoCustomers() {
    customerListEl.innerHTML = `
        <div class="empty-state">
            <h4>👥 등록된 고객이 없습니다</h4>
            <p>회원가입한 고객이 여기에 표시됩니다.</p>
        </div>
    `;
    customerSelect.innerHTML = '<option value="">등록된 고객이 없습니다</option>';
}

// 고객 목록 표시
function displayCustomers(customers) {
    if (!customers || customers.length === 0) {
        displayNoCustomers();
        return;
    }
    
    const html = `
        <div class="customer-grid">
            ${customers.map(customer => `
                <div class="customer-card">
                    <div class="customer-name">${customer.user_metadata?.company_name || customer.company_name || '회사명 없음'}</div>
                    <div class="customer-email">${customer.email}</div>
                    <div class="customer-meta">ID: ${customer.id.slice(0, 8)}...</div>
                </div>
            `).join('')}
        </div>
    `;
    
    customerListEl.innerHTML = html;
}

// 고객 선택 옵션 채우기
function populateCustomerSelect(customers) {
    customerSelect.innerHTML = '<option value="">고객을 선택하세요</option>';
    bulkCustomerSelect.innerHTML = '<option value="">고객을 선택하세요</option>';
    
    customers.forEach(customer => {
        const option1 = document.createElement('option');
        option1.value = customer.id;
        option1.textContent = `${customer.user_metadata?.company_name || customer.company_name || '회사명 없음'} (${customer.email})`;
        customerSelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = customer.id;
        option2.textContent = `${customer.user_metadata?.company_name || customer.company_name || '회사명 없음'} (${customer.email})`;
        bulkCustomerSelect.appendChild(option2);
    });
}

// 매출 데이터 등록
salesForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = customerSelect.value;
    const year = parseInt(yearSelect.value);
    const month = parseInt(monthSelect.value);
    const category = categoryInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const salesCount = salesCountInput.value ? parseInt(salesCountInput.value) : null;
    const note = noteInput.value.trim() || null;
    
    if (!userId) {
        showMessage('고객을 선택해주세요.', 'error');
        return;
    }
    
    if (!category) {
        showMessage('매출 종류를 입력해주세요.', 'error');
        return;
    }
    
    const submitBtn = salesForm.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '등록 중...';
    
    try {
        // 기존 데이터 확인 (같은 사용자, 연도, 월, 카테고리)
        const { data: existing } = await supabaseClient
            .from('sales_reports')
            .select('id')
            .eq('user_id', userId)
            .eq('year', year)
            .eq('month', month)
            .eq('category', category)
            .single();
        
        if (existing) {
            // 업데이트
            const { error } = await supabaseClient
                .from('sales_reports')
                .update({
                    amount,
                    sales_count: salesCount,
                    note,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);
            
            if (error) throw error;
            showMessage('매출 데이터가 업데이트되었습니다.', 'success');
        } else {
            // 새로 등록
            const { error } = await supabaseClient
                .from('sales_reports')
                .insert({
                    user_id: userId,
                    year,
                    month,
                    category,
                    amount,
                    sales_count: salesCount,
                    note
                });
            
            if (error) throw error;
            showMessage('매출 데이터가 등록되었습니다.', 'success');
        }
        
        // 폼 초기화 및 목록 새로고침
        salesForm.reset();
        setCurrentMonth();
        await loadRecentSales();
        await loadCategories();
        
    } catch (error) {
        console.error('Error saving sales:', error);
        showMessage('저장 중 오류가 발생했습니다: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '매출 등록';
    }
});

// 카테고리 목록 로드 (자동완성용)
async function loadCategories() {
    try {
        const { data, error } = await supabaseClient
            .from('sales_reports')
            .select('category')
            .not('category', 'is', null);
        
        if (error) throw error;
        
        // 중복 제거
        const uniqueCategories = [...new Set(data.map(d => d.category).filter(c => c))];
        
        // datalist 업데이트
        categoryList.innerHTML = uniqueCategories
            .map(cat => `<option value="${cat}">`)
            .join('');
            
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// 최근 매출 로드
async function loadRecentSales() {
    recentSalesEl.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const { data: sales, error } = await supabaseClient
            .from('sales_reports')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) {
            if (error.code === '42P01') {
                recentSalesEl.innerHTML = `
                    <div class="empty-state">
                        <h4>📋 테이블이 없습니다</h4>
                        <p>Supabase에서 sales_reports 테이블을 생성해주세요.</p>
                    </div>
                `;
                return;
            }
            throw error;
        }
        
        displayRecentSales(sales);
        
    } catch (error) {
        console.error('Error loading sales:', error);
        recentSalesEl.innerHTML = `
            <div class="empty-state">
                <h4>오류 발생</h4>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// 최근 매출 표시
function displayRecentSales(sales) {
    if (!sales || sales.length === 0) {
        recentSalesEl.innerHTML = `
            <div class="empty-state">
                <h4>📋 등록된 매출이 없습니다</h4>
                <p>위 폼에서 매출 데이터를 등록해주세요.</p>
            </div>
        `;
        return;
    }
    
    const html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>고객 ID</th>
                    <th>기간</th>
                    <th>매출종류</th>
                    <th>매출액</th>
                    <th>판매건수</th>
                    <th>비고</th>
                    <th>등록일</th>
                    <th>관리</th>
                </tr>
            </thead>
            <tbody>
                ${sales.map(sale => `
                    <tr>
                        <td>${sale.user_id.slice(0, 8)}...</td>
                        <td>${sale.year}년 ${sale.month}월</td>
                        <td><span class="category-badge">${sale.category || '일반'}</span></td>
                        <td class="amount">${formatCurrency(sale.amount)}</td>
                        <td>${sale.sales_count || '-'}</td>
                        <td>${sale.note || '-'}</td>
                        <td>${formatDate(sale.created_at)}</td>
                        <td>
                            <button class="delete-btn" onclick="deleteSale('${sale.id}')">삭제</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    recentSalesEl.innerHTML = html;
}

// 매출 삭제
async function deleteSale(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
        const { error } = await supabaseClient
            .from('sales_reports')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        showMessage('삭제되었습니다.', 'success');
        await loadRecentSales();
        
    } catch (error) {
        console.error('Error deleting:', error);
        showMessage('삭제 중 오류가 발생했습니다.', 'error');
    }
}

// 메시지 표시
function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    
    setTimeout(() => {
        messageEl.className = 'message';
    }, 5000);
}

// 통화 포맷
function formatCurrency(amount) {
    return '₩' + Math.round(amount).toLocaleString('ko-KR');
}

// 날짜 포맷
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
}

// 새로고침 버튼
refreshCustomersBtn.addEventListener('click', loadCustomers);
refreshSalesBtn.addEventListener('click', loadRecentSales);

// ==========================================
// 탭 메뉴 기능
// ==========================================
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        // 모든 탭 버튼 비활성화
        tabBtns.forEach(b => b.classList.remove('active'));
        // 모든 탭 콘텐츠 숨기기
        tabContents.forEach(c => c.classList.remove('active'));
        
        // 선택한 탭 활성화
        btn.classList.add('active');
        document.getElementById(tabId + 'Tab').classList.add('active');
    });
});

// ==========================================
// 일괄 등록 (복사/붙여넣기) 기능
// ==========================================

// 붙여넣기 영역 이벤트
pasteArea.addEventListener('input', handlePasteData);
pasteArea.addEventListener('paste', (e) => {
    // 약간의 딜레이 후 처리 (붙여넣기 완료 대기)
    setTimeout(handlePasteData, 100);
});

// 데이터 파싱 및 미리보기
function handlePasteData() {
    const rawData = pasteArea.value.trim();
    
    if (!rawData) {
        previewSection.style.display = 'none';
        bulkUploadBtn.disabled = true;
        parsedData = [];
        return;
    }
    
    // 데이터 파싱
    parsedData = parseSpreadsheetData(rawData);
    
    if (parsedData.length > 0) {
        displayPreview(parsedData);
        previewSection.style.display = 'block';
        bulkUploadBtn.disabled = false;
    } else {
        previewSection.style.display = 'none';
        bulkUploadBtn.disabled = true;
        showBulkMessage('데이터 형식이 올바르지 않습니다. 형식을 확인해주세요.', 'error');
    }
}

// 스프레드시트 데이터 파싱
function parseSpreadsheetData(rawData) {
    const lines = rawData.split('\n').filter(line => line.trim());
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // 탭 또는 여러 공백으로 분리
        const columns = line.split(/\t+/);
        
        // 최소 3개 컬럼 필요
        if (columns.length < 3) {
            result.push({
                row: i + 1,
                error: true,
                errorMessage: '컬럼 수 부족 (최소 3개 필요)',
                raw: line
            });
            continue;
        }
        
        let year, month, category, amount, salesCount = null, note = null;
        
        // 첫 번째 컬럼 확인: YYYYMMDD 형식인지, YYYY 형식인지
        const firstCol = columns[0].trim();
        
        if (firstCol.length === 8 && /^\d{8}$/.test(firstCol)) {
            // YYYYMMDD 형식 (예: 20251231)
            year = parseInt(firstCol.substring(0, 4));
            month = parseInt(firstCol.substring(4, 6));
            // 형식: YYYYMMDD, 매출액, 매출종류, [판매건수], [비고]
            amount = parseNumber(columns[1]);
            category = columns[2]?.trim();
            salesCount = columns[3] ? parseInt(parseNumber(columns[3])) : null;
            note = columns[4]?.trim() || null;
        } else if (firstCol.length === 6 && /^\d{6}$/.test(firstCol)) {
            // YYYYMM 형식 (예: 202512)
            year = parseInt(firstCol.substring(0, 4));
            month = parseInt(firstCol.substring(4, 6));
            // 형식: YYYYMM, 매출액, 매출종류, [판매건수], [비고]
            amount = parseNumber(columns[1]);
            category = columns[2]?.trim();
            salesCount = columns[3] ? parseInt(parseNumber(columns[3])) : null;
            note = columns[4]?.trim() || null;
        } else {
            // 기본 형식: 연도, 월, 매출종류, 매출액, [판매건수], [비고]
            year = parseInt(columns[0]);
            month = parseInt(columns[1]);
            category = columns[2]?.trim();
            amount = parseNumber(columns[3]);
            salesCount = columns[4] ? parseInt(parseNumber(columns[4])) : null;
            note = columns[5]?.trim() || null;
        }
        
        // 유효성 검사
        if (isNaN(year) || year < 2000 || year > 2100) {
            result.push({
                row: i + 1,
                error: true,
                errorMessage: '연도 형식 오류',
                raw: line
            });
            continue;
        }
        
        if (isNaN(month) || month < 1 || month > 12) {
            result.push({
                row: i + 1,
                error: true,
                errorMessage: '월 형식 오류 (1-12)',
                raw: line
            });
            continue;
        }
        
        if (!category) {
            result.push({
                row: i + 1,
                error: true,
                errorMessage: '매출종류 누락',
                raw: line
            });
            continue;
        }
        
        if (isNaN(amount) || amount < 0) {
            result.push({
                row: i + 1,
                error: true,
                errorMessage: '매출액 형식 오류',
                raw: line
            });
            continue;
        }
        
        result.push({
            row: i + 1,
            error: false,
            year,
            month,
            category,
            amount,
            salesCount: isNaN(salesCount) ? null : salesCount,
            note
        });
    }
    
    return result;
}

// 숫자 파싱 (쉼표, 공백 제거)
function parseNumber(str) {
    if (!str) return NaN;
    // 쉼표, 공백, 원화 기호 등 제거
    const cleaned = str.toString().replace(/[,\s₩원]/g, '');
    return parseFloat(cleaned);
}

// 미리보기 표시
function displayPreview(data) {
    const validData = data.filter(d => !d.error);
    const errorData = data.filter(d => d.error);
    
    previewCount.textContent = validData.length;
    
    let html = `
        <table class="preview-table">
            <thead>
                <tr>
                    <th>행</th>
                    <th>연도</th>
                    <th>월</th>
                    <th>매출종류</th>
                    <th>매출액</th>
                    <th>판매건수</th>
                    <th>비고</th>
                    <th>상태</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.forEach(item => {
        if (item.error) {
            html += `
                <tr class="error-row">
                    <td>${item.row}</td>
                    <td colspan="6">${item.raw}</td>
                    <td>❌ ${item.errorMessage}</td>
                </tr>
            `;
        } else {
            html += `
                <tr>
                    <td>${item.row}</td>
                    <td>${item.year}년</td>
                    <td>${item.month}월</td>
                    <td>${item.category}</td>
                    <td class="amount">${formatCurrency(item.amount)}</td>
                    <td>${item.salesCount || '-'}</td>
                    <td>${item.note || '-'}</td>
                    <td>✅</td>
                </tr>
            `;
        }
    });
    
    html += '</tbody></table>';
    
    if (errorData.length > 0) {
        html += `<p style="color: #dc2626; padding: 12px 16px; font-size: 14px;">⚠️ ${errorData.length}개 행에 오류가 있습니다. 오류 행은 제외하고 업로드됩니다.</p>`;
    }
    
    previewTable.innerHTML = html;
}

// 일괄 등록 버튼 클릭
bulkUploadBtn.addEventListener('click', async () => {
    const userId = bulkCustomerSelect.value;
    
    if (!userId) {
        showBulkMessage('고객을 선택해주세요.', 'error');
        return;
    }
    
    const validData = parsedData.filter(d => !d.error);
    
    if (validData.length === 0) {
        showBulkMessage('업로드할 유효한 데이터가 없습니다.', 'error');
        return;
    }
    
    // 확인 메시지
    if (!confirm(`${validData.length}건의 매출 데이터를 등록하시겠습니까?`)) {
        return;
    }
    
    bulkUploadBtn.disabled = true;
    uploadProgress.style.display = 'block';
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < validData.length; i++) {
        const item = validData[i];
        
        try {
            // 기존 데이터 확인 (카테고리 포함)
            const { data: existing } = await supabaseClient
                .from('sales_reports')
                .select('id')
                .eq('user_id', userId)
                .eq('year', item.year)
                .eq('month', item.month)
                .eq('category', item.category)
                .single();
            
            if (existing) {
                // 업데이트
                const { error } = await supabaseClient
                    .from('sales_reports')
                    .update({
                        amount: item.amount,
                        sales_count: item.salesCount,
                        note: item.note,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id);
                
                if (error) throw error;
            } else {
                // 새로 등록
                const { error } = await supabaseClient
                    .from('sales_reports')
                    .insert({
                        user_id: userId,
                        year: item.year,
                        month: item.month,
                        category: item.category,
                        amount: item.amount,
                        sales_count: item.salesCount,
                        note: item.note
                    });
                
                if (error) throw error;
            }
            
            successCount++;
        } catch (error) {
            console.error('Error uploading row:', item, error);
            errorCount++;
        }
        
        // 진행률 업데이트
        const progress = Math.round(((i + 1) / validData.length) * 100);
        progressFill.style.width = progress + '%';
        progressText.textContent = `업로드 중... ${progress}% (${i + 1}/${validData.length})`;
    }
    
    // 완료
    uploadProgress.style.display = 'none';
    bulkUploadBtn.disabled = false;
    
    if (errorCount > 0) {
        showBulkMessage(`완료: ${successCount}건 성공, ${errorCount}건 실패`, 'error');
    } else {
        showBulkMessage(`${successCount}건의 매출 데이터가 성공적으로 등록되었습니다.`, 'success');
    }
    
    // 초기화 및 새로고침
    clearBulkForm();
    await loadRecentSales();
});

// 일괄 등록 폼 초기화
function clearBulkForm() {
    pasteArea.value = '';
    parsedData = [];
    previewSection.style.display = 'none';
    bulkUploadBtn.disabled = true;
    progressFill.style.width = '0%';
}

clearBulkBtn.addEventListener('click', clearBulkForm);
clearPreviewBtn.addEventListener('click', clearBulkForm);

// 벌크 메시지 표시
function showBulkMessage(text, type) {
    bulkMessageEl.textContent = text;
    bulkMessageEl.className = `message ${type}`;
    
    setTimeout(() => {
        bulkMessageEl.className = 'message';
    }, 5000);
}

// 고객 선택 옵션 동기화 (bulkCustomerSelect에도 추가)
function syncCustomerSelects(customers) {
    bulkCustomerSelect.innerHTML = '<option value="">고객을 선택하세요</option>';
    
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = `${customer.user_metadata?.company_name || customer.company_name || '회사명 없음'} (${customer.email})`;
        bulkCustomerSelect.appendChild(option);
    });
}
