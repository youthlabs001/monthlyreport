// 관리자 페이지 기능

function initAdmin() {
    console.log('[initAdmin] 시작');
    console.log('[initAdmin] supabase 상태:', typeof supabase !== 'undefined' && supabase ? '연결됨' : '미연결');
    
    // 로그인 및 관리자 권한 확인
    const currentUser = Storage.getUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    console.log('[initAdmin] currentUser:', currentUser.email);
    
    if (!isAdminUser(currentUser.email)) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    var steps = [
        ['updateUserInfo', updateUserInfo],
        ['setupTabs', setupTabs],
        ['setupLogout', setupLogout],
        ['setupButtons', setupButtons],
        ['setupSheetsImport', setupSheetsImport],
        ['setupManualEntry', setupManualEntry],
        ['updateUsersTable', updateUsersTable],
        ['updateAdminsTable', updateAdminsTable],
        ['updateUserSelects', updateUserSelects],
        ['updateCompaniesTable', updateCompaniesTable],
        ['updateStats', updateStats],
        ['setupNoticeButton', setupNoticeButton],
        ['updateNoticesTable', updateNoticesTable],
        ['loadAdminDataFromSupabase', loadAdminDataFromSupabase]
    ];
    
    steps.forEach(function(step) {
        try {
            step[1]();
        } catch (e) {
            console.error('[initAdmin] ' + step[0] + ' 실패:', e);
        }
    });
    
    console.log('[initAdmin] 초기화 완료');
}

// DOM 로드 완료 여부 확인 후 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
} else {
    initAdmin();
}

// 사용자 정보 업데이트
function updateUserInfo() {
    var currentUser = Storage.getUser();
    if (!currentUser) return;
    var userNameEls = document.querySelectorAll('#userName, .admin-user-name');
    var userEmailEls = document.querySelectorAll('#userEmail, .admin-user-email');
    
    userNameEls.forEach(function(el) { el.textContent = currentUser.fullName || '관리자'; });
    userEmailEls.forEach(function(el) { el.textContent = currentUser.email; });
}

// 메뉴 전환 설정
function setupTabs() {
    const menuItems = document.querySelectorAll('.menu-item');
    const menuContents = document.querySelectorAll('.menu-content');
    
    // 메뉴 제목 매핑
    const menuTitles = {
        'users': { title: '사용자 목록', subtitle: '등록된 사용자를 관리합니다' },
        'companies': { title: '회사 관리', subtitle: '등록된 회사 정보를 관리합니다' },
        'manual-entry': { title: '매출 데이터 수기 등록', subtitle: '소량의 매출 데이터를 직접 입력하여 등록합니다' },
        'upload': { title: '매출 데이터 업로드', subtitle: '엑셀 파일을 통해 매출 데이터를 일괄 등록합니다' },
        'backup': { title: '백업/복원', subtitle: '데이터베이스 백업 및 복원 작업을 수행합니다' },
        'stats': { title: '통계 현황', subtitle: '전체 시스템 통계를 확인합니다' },
        'notices': { title: '공지사항 관리', subtitle: '공지사항을 등록하고 관리합니다' },
        'settings': { title: '시스템 설정', subtitle: '시스템 환경 설정 및 권한 관리' }
    };
    
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const menuName = item.dataset.menu;
            
            // 모든 메뉴 비활성화
            menuItems.forEach(m => m.classList.remove('active'));
            menuContents.forEach(c => c.classList.remove('active'));
            
            // 선택한 메뉴 활성화
            item.classList.add('active');
            const content = document.getElementById(`${menuName}-menu`);
            if (content) {
                content.classList.add('active');
            }
            if (menuName === 'notices') {
                updateNoticesTable();
            }
            
            // 헤더 제목 업데이트
            const titleInfo = menuTitles[menuName];
            if (titleInfo) {
                document.getElementById('contentTitle').textContent = titleInfo.title;
                document.getElementById('contentSubtitle').textContent = titleInfo.subtitle;
            }
        });
    });
}

// 로그아웃 설정
function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            Storage.removeUser();
            window.location.href = 'index.html';
        }
    });
}

// 버튼 이벤트 설정
function setupButtons() {
    // 사용자 추가 버튼
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', openAddUserModal);
    }
    
    // 관리자 추가 버튼
    const addAdminBtn = document.getElementById('addAdminBtn');
    if (addAdminBtn) {
        addAdminBtn.addEventListener('click', openAddAdminModal);
    }
    
    // 회사 추가 버튼
    const addCompanyBtn = document.getElementById('addCompanyBtn');
    if (addCompanyBtn) {
        addCompanyBtn.addEventListener('click', openAddCompanyModal);
    }
    
    // 기타 .btn-add (사용자/관리자/회사/공지 추가가 아닌 것)
    document.querySelectorAll('.btn-add').forEach(btn => {
        if (btn.id === 'addUserBtn' || btn.id === 'addAdminBtn' || btn.id === 'addCompanyBtn' || btn.id === 'addNoticeBtn') return;
        btn.addEventListener('click', () => {
            showMessage('기능 준비 중입니다.', 'info');
        });
    });
    
    // 수정 버튼
    const editBtns = document.querySelectorAll('.btn-edit');
    editBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const userId = row.cells[0].textContent;
            const email = row.cells[2].textContent;
            openEditUserModal(email, userId);
        });
    });
    
    // 삭제 버튼
    const deleteBtns = document.querySelectorAll('.btn-delete');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (confirm('정말 삭제하시겠습니까?')) {
                const row = e.target.closest('tr');
                const name = row.cells[1].textContent;
                showMessage(`${name} 삭제가 완료되었습니다.`, 'success');
                // 실제로는 서버에 삭제 요청을 보냄
            }
        });
    });
    
    // 상세보기 버튼
    const viewBtns = document.querySelectorAll('.btn-view');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            showMessage('상세보기 기능은 준비 중입니다.', 'info');
        });
    });
    
    // 액션 카드 버튼들
    const actionBtns = document.querySelectorAll('.action-card .btn-primary');
    actionBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            if (index === 0) {
                // 백업
                showMessage('데이터베이스 백업을 시작합니다...', 'info');
                setTimeout(() => {
                    showMessage('백업이 완료되었습니다!', 'success');
                }, 2000);
            } else if (index === 1) {
                // 내보내기
                showMessage('데이터를 CSV 파일로 내보냅니다...', 'info');
                setTimeout(() => {
                    showMessage('내보내기가 완료되었습니다!', 'success');
                }, 1500);
            } else if (index === 2) {
                // 동기화
                showMessage('데이터 동기화를 시작합니다...', 'info');
                setTimeout(() => {
                    showMessage('동기화가 완료되었습니다!', 'success');
                }, 2500);
            }
        });
    });
}

// 메시지 표시 함수
function showMessage(message, type = 'info') {
    const existingMsg = document.querySelector('.message-box');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    const messageBox = document.createElement('div');
    messageBox.className = `message-box message-${type}`;
    messageBox.textContent = message;
    
    messageBox.style.cssText = `
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
        messageBox.style.background = '#10B981';
        messageBox.style.color = 'white';
    } else if (type === 'error') {
        messageBox.style.background = '#EF4444';
        messageBox.style.color = 'white';
    } else {
        messageBox.style.background = '#3B82F6';
        messageBox.style.color = 'white';
    }
    
    document.body.appendChild(messageBox);
    
    setTimeout(() => {
        messageBox.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => messageBox.remove(), 300);
    }, 3000);
}

// 엑셀 업로드 기능 설정
function setupExcelUpload() {
    const downloadBtn = document.getElementById('downloadTemplateBtn');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('excelFileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const closeResultBtn = document.getElementById('closeResultBtn');
    
    // 양식 다운로드
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadExcelTemplate);
    }
    
    // 파일 업로드 영역 클릭
    if (uploadArea) {
        uploadArea.addEventListener('click', () => fileInput.click());
        
        // 드래그 앤 드롭
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        });
    }
    
    // 파일 선택
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
            }
        });
    }
    
    // 업로드 버튼
    if (uploadBtn) {
        uploadBtn.addEventListener('click', uploadExcelData);
    }
    
    // 결과 닫기
    if (closeResultBtn) {
        closeResultBtn.addEventListener('click', () => {
            document.getElementById('uploadResult').style.display = 'none';
        });
    }
}

// 엑셀 양식 다운로드
function downloadExcelTemplate() {
    // 양식 데이터
    const templateData = [
        ['날짜', '거래처', '매출종류', '금액', '상태', '비고'],
        ['2026-02-01', '(주)샘플거래처', '제품 판매', '15000000', 'completed', ''],
        ['2026-02-02', '테스트기업', '서비스', '8500000', 'completed', ''],
        ['2026-02-03', '예시회사', '구독', '2500000', 'pending', '확인 필요'],
    ];
    
    // 워크북 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    
    // 열 너비 설정
    ws['!cols'] = [
        { wch: 12 },  // 날짜
        { wch: 20 },  // 거래처
        { wch: 15 },  // 매출종류
        { wch: 15 },  // 금액
        { wch: 12 },  // 상태
        { wch: 20 }   // 비고
    ];
    
    // 헤더 스타일 (첫 행)
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "4F46E5" } }
        };
    }
    
    XLSX.utils.book_append_sheet(wb, ws, "매출데이터");
    
    // 파일 다운로드
    XLSX.writeFile(wb, "매출데이터_업로드양식.xlsx");
    
    showMessage('엑셀 양식이 다운로드되었습니다!', 'success');
}

// 파일 선택 처리
let selectedFile = null;

function handleFileSelect(file) {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
        showMessage('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.', 'error');
        return;
    }
    
    selectedFile = file;
    
    // 업로드 영역 업데이트
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.querySelector('.upload-content').innerHTML = `
        <div class="upload-icon">✓</div>
        <p><strong>${file.name}</strong></p>
        <p class="file-info">크기: ${(file.size / 1024).toFixed(2)} KB</p>
    `;
    
    // 업로드 버튼 활성화
    document.getElementById('uploadBtn').disabled = false;
}

// 사용자 선택 시 회사 목록 표시
function updateCompanySelection() {
    const targetUser = document.getElementById('targetUserSelect').value;
    const companySelectionArea = document.getElementById('companySelectionArea');
    const companyCheckboxes = document.getElementById('companyCheckboxes');
    
    if (!targetUser) {
        companySelectionArea.style.display = 'none';
        companyCheckboxes.innerHTML = '';
        return;
    }
    
    // 선택된 사용자 찾기
    const user = usersData.find(u => u.email === targetUser);
    if (!user || !user.companies || user.companies.length === 0) {
        companySelectionArea.style.display = 'none';
        companyCheckboxes.innerHTML = '';
        return;
    }
    
    // 회사 체크박스 생성
    companyCheckboxes.innerHTML = user.companies.map((companyName, index) => {
        const company = availableCompanies.find(c => c.name === companyName);
        const companyNumber = company ? company.number : '';
        return `
            <div class="company-checkbox-item">
                <input type="checkbox" id="company_${index}" name="targetCompany" value="${companyName}" ${index === 0 ? 'checked' : ''}>
                <label for="company_${index}">
                    ${companyName}
                    ${companyNumber ? `<span class="company-number">(${companyNumber})</span>` : ''}
                </label>
            </div>
        `;
    }).join('');
    
    companySelectionArea.style.display = 'block';
}

// 엑셀 데이터 업로드
function uploadExcelData() {
    const targetUser = document.getElementById('targetUserSelect').value;
    
    if (!targetUser) {
        showMessage('대상 사용자를 선택해주세요.', 'error');
        return;
    }
    
    // 선택된 회사들 가져오기
    const selectedCompanies = Array.from(document.querySelectorAll('input[name="targetCompany"]:checked'))
        .map(cb => cb.value);
    
    if (selectedCompanies.length === 0) {
        showMessage('업로드할 회사를 최소 1개 이상 선택해주세요.', 'error');
        return;
    }
    
    if (!selectedFile) {
        showMessage('파일을 선택해주세요.', 'error');
        return;
    }
    
    showMessage('데이터를 업로드하는 중...', 'info');
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // 첫 번째 시트 읽기
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // JSON으로 변환 (헤더 첫 행)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // 데이터 검증 및 변환
            const result = processExcelData(jsonData, targetUser, selectedCompanies);
            
            // 결과 표시
            displayUploadResult(result);
            
            if (result.errors.length === 0) {
                showMessage('데이터 업로드가 완료되었습니다!', 'success');
                
                // 파일 입력 초기화
                document.getElementById('excelFileInput').value = '';
                selectedFile = null;
                document.getElementById('uploadBtn').disabled = true;
                
                // 업로드 영역 초기화
                const uploadArea = document.getElementById('uploadArea');
                uploadArea.querySelector('.upload-content').innerHTML = `
                    <div class="upload-icon">+</div>
                    <p><strong>파일을 드래그하거나 클릭하여 선택하세요</strong></p>
                    <p class="file-info">지원 형식: .xlsx, .xls</p>
                `;
            } else {
                showMessage(`${result.errors.length}개의 오류가 발생했습니다.`, 'error');
            }
            
        } catch (error) {
            console.error('파일 읽기 오류:', error);
            showMessage('파일을 읽는 중 오류가 발생했습니다.', 'error');
        }
    };
    
    reader.readAsArrayBuffer(selectedFile);
}

// 엑셀 데이터 처리
function processExcelData(jsonData, targetUser, selectedCompanies) {
    const result = {
        total: 0,
        success: 0,
        errors: [],
        validTransactions: [],
        companies: selectedCompanies || []
    };
    
    // 헤더 제외 (첫 행)
    const dataRows = jsonData.slice(1);
    result.total = dataRows.length;
    
    dataRows.forEach((row, index) => {
        const rowNum = index + 2; // 엑셀 행 번호 (헤더 다음부터)
        
        // 빈 행 건너뛰기
        if (!row || row.length === 0 || !row[0]) {
            return;
        }
        
        try {
            // 데이터 검증
            const transaction = {
                date: row[0],
                client: row[1],
                category: row[2],
                amount: parseFloat(row[3]),
                status: row[4] || 'completed'
            };
            
            // 필수 필드 검증
            if (!transaction.date) {
                throw new Error('날짜가 없습니다');
            }
            if (!transaction.client) {
                throw new Error('거래처가 없습니다');
            }
            if (!transaction.category) {
                throw new Error('매출종류가 없습니다');
            }
            if (isNaN(transaction.amount) || transaction.amount < 0) {
                throw new Error('금액이 올바르지 않습니다 (음수 불가)');
            }
            
            // 상태 검증
            if (!['completed', 'pending', 'cancelled'].includes(transaction.status)) {
                transaction.status = 'completed';
            }
            
            result.validTransactions.push(transaction);
            result.success++;
            
        } catch (error) {
            result.errors.push({
                row: rowNum,
                message: error.message
            });
        }
    });
    
    // localStorage에 데이터 저장 (선택된 각 회사별로)
    if (result.validTransactions.length > 0 && selectedCompanies && selectedCompanies.length > 0) {
        selectedCompanies.forEach(companyName => {
            saveTransactionsToStorage(targetUser, companyName, result.validTransactions);
        });
    }
    
    return result;
}

// localStorage 및 Supabase DB에 거래 데이터 저장 (회사별)
function saveTransactionsToStorage(userEmail, companyName, transactions) {
    const storageKey = `transactions_${userEmail}_${companyName}`;
    
    // 1) localStorage에 저장 (캐시용)
    let existingData = localStorage.getItem(storageKey);
    let allTransactions = existingData ? JSON.parse(existingData) : [];
    allTransactions = [...allTransactions, ...transactions];
    localStorage.setItem(storageKey, JSON.stringify(allTransactions));
    
    console.log(`[localStorage] ${companyName}에 ${transactions.length}건 저장됨`);
    
    // 2) Supabase DB에 저장
    if (typeof supabase !== 'undefined' && supabase) {
        const rows = transactions.map(function(t) {
            return {
                user_email: userEmail,
                company_name: companyName,
                transaction_date: t.date,
                client: t.client,
                category: t.category,
                amount: t.amount,
                status: t.status || 'completed',
                note: t.note || ''
            };
        });
        
        supabase.from('transactions').insert(rows).then(function(result) {
            if (result.error) {
                console.error('[Supabase] 거래 데이터 저장 실패:', result.error);
                showMessage('Supabase 저장 실패: ' + result.error.message, 'error');
            } else {
                console.log(`[Supabase] ${companyName}에 ${transactions.length}건 저장 성공`);
                showMessage(`Supabase DB에 ${transactions.length}건 저장 완료!`, 'success');
            }
        }).catch(function(e) {
            console.error('[Supabase] 거래 데이터 저장 오류:', e);
            showMessage('Supabase 저장 오류: ' + (e.message || e), 'error');
        });
    } else {
        console.warn('[Supabase] 연결 안 됨, localStorage만 저장');
        showMessage('localStorage에만 저장됨 (Supabase 미연결)', 'info');
    }
}

// 업로드 결과 표시
function displayUploadResult(result) {
    const resultDiv = document.getElementById('uploadResult');
    
    document.getElementById('totalRows').textContent = result.total;
    document.getElementById('successRows').textContent = result.success;
    document.getElementById('errorRows').textContent = result.errors.length;
    
    const errorDetails = document.getElementById('errorDetails');
    
    // 업로드된 회사 목록 표시
    if (result.companies && result.companies.length > 0) {
        const companyList = '<div style="margin-bottom: 16px; padding: 12px; background: #EFF6FF; border-radius: 8px;">' +
            '<strong style="color: #1E40AF;">업로드된 회사:</strong> ' +
            result.companies.join(', ') +
            '</div>';
        errorDetails.innerHTML = companyList;
    } else {
        errorDetails.innerHTML = '';
    }
    
    // 오류 상세 추가
    if (result.errors.length > 0) {
        errorDetails.innerHTML += '<h5 style="margin-bottom: 12px; margin-top: 16px;">오류 상세:</h5>' +
            result.errors.map(err => `
                <div class="error-item">
                    <strong>행 ${err.row}:</strong> ${err.message}
                </div>
            `).join('');
    }
    
    resultDiv.style.display = 'block';
}

function addActivityLog(message) {
    // 활동 로그 기능 제거됨 (기존 호출부 호환용 no-op)
}

// ============================================
// Google Sheets 연동 기능
// ============================================

let sheetsPreviewData = [];
let sheetsPreviewChart = null;

// Google Sheets 연동 초기화
function setupSheetsImport() {
    const fetchBtn = document.getElementById('fetchSheetsBtn');
    const saveBtn = document.getElementById('saveSheetsDataBtn');
    const targetUserSelect = document.getElementById('sheetsTargetUser');
    
    // 사용자 목록 채우기
    if (targetUserSelect) {
        updateSheetsUserSelect();
    }
    
    // 데이터 가져오기 버튼
    if (fetchBtn) {
        fetchBtn.addEventListener('click', fetchGoogleSheetsData);
    }
    
    // 저장 버튼
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSheetsDataToSupabase);
    }
}

// 사용자 선택 드롭다운 업데이트
function updateSheetsUserSelect() {
    const select = document.getElementById('sheetsTargetUser');
    if (!select) return;
    
    select.innerHTML = '<option value="">사용자 선택</option>';
    usersData.forEach(user => {
        const option = document.createElement('option');
        option.value = user.email;
        option.textContent = `${user.name} (${user.email})`;
        select.appendChild(option);
    });
}

// 사용자 선택 시 회사 목록 업데이트
function updateSheetsCompanySelection() {
    const userEmail = document.getElementById('sheetsTargetUser').value;
    const companySelect = document.getElementById('sheetsTargetCompany');
    
    if (!companySelect) return;
    
    companySelect.innerHTML = '<option value="">회사 선택</option>';
    
    if (!userEmail) return;
    
    const user = usersData.find(u => u.email === userEmail);
    if (!user || !user.companies || user.companies.length === 0) return;
    
    user.companies.forEach(companyName => {
        const option = document.createElement('option');
        option.value = companyName;
        option.textContent = companyName;
        companySelect.appendChild(option);
    });
    
    // 첫 번째 회사 자동 선택
    if (user.companies.length > 0) {
        companySelect.value = user.companies[0];
    }
}

// Google Sheets에서 데이터 가져오기
async function fetchGoogleSheetsData() {
    const url = document.getElementById('sheetsUrl').value.trim();
    const userEmail = document.getElementById('sheetsTargetUser').value;
    const companyName = document.getElementById('sheetsTargetCompany').value;
    
    // 유효성 검사
    if (!url) {
        showMessage('Google Sheets URL을 입력해주세요.', 'error');
        return;
    }
    if (!userEmail) {
        showMessage('대상 사용자를 선택해주세요.', 'error');
        return;
    }
    if (!companyName) {
        showMessage('대상 회사를 선택해주세요.', 'error');
        return;
    }
    
    // URL 변환: 편집 URL → CSV 내보내기 URL
    let csvUrl = url;
    
    // Google Sheets URL 형식 감지 및 변환
    if (url.includes('/edit')) {
        // https://docs.google.com/spreadsheets/d/SHEET_ID/edit... → CSV
        const sheetId = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (sheetId && sheetId[1]) {
            csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId[1]}/export?format=csv`;
        }
    } else if (url.includes('/pubhtml')) {
        // https://docs.google.com/spreadsheets/d/e/2PACX-.../pubhtml → CSV
        csvUrl = url.replace('/pubhtml', '/pub?output=csv');
    } else if (url.includes('/d/e/2PACX-')) {
        // 웹에 게시된 URL 형식 처리
        if (!url.includes('output=csv') && !url.includes('export?format=csv')) {
            // pubhtml이 없으면 끝에 추가
            csvUrl = url.split('?')[0].split('#')[0];
            if (csvUrl.endsWith('/')) {
                csvUrl = csvUrl.slice(0, -1);
            }
            csvUrl += '/pub?output=csv';
        }
    } else if (!url.includes('export?format=csv') && !url.includes('output=csv')) {
        showMessage('올바른 Google Sheets URL이 아닙니다. "웹에 게시" 또는 "공유 링크"를 사용하세요.', 'error');
        return;
    }
    
    showMessage('데이터를 가져오는 중...', 'info');
    
    try {
        console.log('[Google Sheets] CSV URL:', csvUrl);
        
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
            throw new Error('데이터를 가져올 수 없습니다. 시트가 "웹에 게시"되었는지 확인하세요.');
        }
        
        const csvText = await response.text();
        console.log('[Google Sheets] CSV 원본 데이터 (첫 500자):', csvText.substring(0, 500));
        
        // CSV 파싱
        const parsedData = parseCSV(csvText);
        console.log('[Google Sheets] 파싱된 데이터:', parsedData);
        
        if (parsedData.length === 0) {
            showMessage('데이터가 없습니다. 콘솔(F12)에서 원본 데이터를 확인하세요.', 'error');
            return;
        }
        
        // 전역 변수에 저장 (저장 시 사용)
        sheetsPreviewData = {
            userEmail: userEmail,
            companyName: companyName,
            transactions: parsedData
        };
        
        // 차트 렌더링
        renderSheetsPreviewChart(parsedData);
        
        // 통계 업데이트
        updateSheetsStats(parsedData);
        
        // 미리보기 섹션 표시
        document.getElementById('sheetsPreviewSection').style.display = 'block';
        
        showMessage(`${parsedData.length}건의 데이터를 가져왔습니다!`, 'success');
        
    } catch (error) {
        console.error('Google Sheets 데이터 가져오기 실패:', error);
        showMessage('데이터 가져오기 실패: ' + error.message, 'error');
    }
}

// CSV 파싱 함수 (개선된 버전 - 다양한 형식 지원)
function parseCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    const transactions = [];
    
    console.log('[CSV 파싱] 총 라인 수:', lines.length);
    
    // 헤더 확인
    if (lines.length === 0) return transactions;
    
    const header = lines[0].toLowerCase();
    console.log('[CSV 파싱] 헤더:', lines[0]);
    
    // 데이터 형식 자동 감지
    const isFormat1 = header.includes('매출월') && header.includes('매출액'); // 3컬럼 형식
    const isFormat2 = header.includes('날짜') && header.includes('거래처'); // 6컬럼 형식
    
    console.log('[CSV 파싱] 형식 감지:', isFormat1 ? '3컬럼(매출월,매출액,매출종류)' : isFormat2 ? '6컬럼(날짜,거래처,매출종류,금액)' : '알 수 없음');
    
    // 헤더 제외 (첫 행)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // CSV 파싱 - 쉼표로 구분하되 따옴표 안의 쉼표는 무시
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim()); // 마지막 값 추가
        
        // 따옴표 제거
        const cleanValues = values.map(v => v.replace(/^"|"$/g, '').trim());
        
        let transaction = null;
        
        // 형식 1: 매출월, 매출액, 매출종류 (3컬럼)
        if (isFormat1 && cleanValues.length >= 3) {
            // 날짜 형식 변환: 20250131 → 2025-01-31
            const dateStr = cleanValues[0];
            let formattedDate = dateStr;
            if (dateStr.length === 8) {
                formattedDate = `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
            }
            
            // 금액 파싱 (쉼표 제거)
            const amountStr = cleanValues[1].replace(/[,\s]/g, '');
            const amount = parseFloat(amountStr);
            
            transaction = {
                date: formattedDate,
                client: cleanValues[2] || '매출', // 매출종류를 거래처로 사용
                category: cleanValues[2] || '기타',
                amount: isNaN(amount) ? 0 : amount,
                status: 'completed',
                note: ''
            };
        }
        // 형식 2: 날짜, 거래처, 매출종류, 금액, 상태, 비고 (4-6컬럼)
        else if (cleanValues.length >= 4) {
            // 금액 파싱 (쉼표, 공백 등 제거)
            const amountStr = cleanValues[3].replace(/[,\s]/g, '');
            const amount = parseFloat(amountStr);
            
            transaction = {
                date: cleanValues[0],
                client: cleanValues[1],
                category: cleanValues[2],
                amount: isNaN(amount) ? 0 : amount,
                status: cleanValues[4] || 'completed',
                note: cleanValues[5] || ''
            };
        }
        
        // 유효성 검사
        if (transaction && transaction.date && transaction.amount >= 0) {
            transactions.push(transaction);
            if (i <= 5) { // 처음 5개만 로그 출력
                console.log(`[CSV 파싱] 행 ${i} 성공:`, transaction);
            }
        } else {
            if (i <= 5) {
                console.log(`[CSV 파싱] 행 ${i} 유효성 실패:`, cleanValues);
            }
        }
    }
    
    console.log('[CSV 파싱] 최종 결과:', transactions.length + '건');
    return transactions;
}

// 월별 매출 차트 렌더링 (전년 vs 올해)
function renderSheetsPreviewChart(transactions) {
    const canvas = document.getElementById('sheetsPreviewChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 기존 차트 제거
    if (sheetsPreviewChart) {
        sheetsPreviewChart.destroy();
    }
    
    // 현재 연도 및 전년도
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    // 월별 데이터 집계
    const monthlyData = {};
    
    transactions.forEach(t => {
        const date = new Date(t.date);
        if (isNaN(date.getTime())) return;
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 1-12
        
        if (year !== currentYear && year !== lastYear) return;
        
        const key = `${year}-${month}`;
        
        if (!monthlyData[key]) {
            monthlyData[key] = 0;
        }
        
        monthlyData[key] += t.amount;
    });
    
    // 1월~12월 레이블
    const labels = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    
    // 올해 데이터
    const thisYearData = [];
    for (let m = 1; m <= 12; m++) {
        const key = `${currentYear}-${m}`;
        thisYearData.push(monthlyData[key] || 0);
    }
    
    // 전년 데이터
    const lastYearData = [];
    for (let m = 1; m <= 12; m++) {
        const key = `${lastYear}-${m}`;
        lastYearData.push(monthlyData[key] || 0);
    }
    
    // Chart.js 렌더링
    sheetsPreviewChart = new Chart(ctx, {
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
            maintainAspectRatio: true,
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
            }
        }
    });
}

// 통계 업데이트
function updateSheetsStats(transactions) {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;
    
    let thisYearTotal = 0;
    let lastYearTotal = 0;
    
    transactions.forEach(t => {
        const date = new Date(t.date);
        if (isNaN(date.getTime())) return;
        
        const year = date.getFullYear();
        
        if (year === currentYear) {
            thisYearTotal += t.amount;
        } else if (year === lastYear) {
            lastYearTotal += t.amount;
        }
    });
    
    document.getElementById('sheetsStatTotal').textContent = `${transactions.length}건`;
    document.getElementById('sheetsStatThisYear').textContent = formatCurrency(thisYearTotal);
    document.getElementById('sheetsStatLastYear').textContent = formatCurrency(lastYearTotal);
}

// Supabase에 데이터 저장 (기존 데이터 삭제 후 재등록)
function saveSheetsDataToSupabase() {
    if (!sheetsPreviewData || !sheetsPreviewData.transactions || sheetsPreviewData.transactions.length === 0) {
        showMessage('저장할 데이터가 없습니다.', 'error');
        return;
    }
    
    const { userEmail, companyName, transactions } = sheetsPreviewData;
    
    showMessage('기존 데이터 삭제 중...', 'info');
    
    // Supabase DB에 저장
    if (typeof supabase !== 'undefined' && supabase) {
        console.log(`[Supabase] ${companyName}의 기존 데이터 삭제 시작...`);
        
        // 1단계: 기존 데이터 삭제
        supabase.from('transactions')
            .delete()
            .eq('user_email', userEmail)
            .eq('company_name', companyName)
            .then(function(deleteResult) {
                console.log('[Supabase] 기존 데이터 삭제 결과:', deleteResult);
                
                if (deleteResult.error) {
                    console.error('[Supabase] 삭제 실패:', deleteResult.error);
                    showMessage('❌ 기존 데이터 삭제 실패: ' + deleteResult.error.message, 'error');
                    return;
                }
                
                console.log(`[Supabase] 기존 데이터 삭제 완료`);
                showMessage('새로운 데이터 저장 중...', 'info');
                
                // 2단계: 새 데이터 저장
                const rows = transactions.map(function(t) {
                    return {
                        user_email: userEmail,
                        company_name: companyName,
                        transaction_date: t.date,
                        client: t.client,
                        category: t.category,
                        amount: t.amount,
                        status: t.status || 'completed',
                        note: t.note || ''
                    };
                });
                
                console.log('[Supabase] 저장할 데이터 샘플:', rows[0]);
                console.log(`[Supabase] 총 ${rows.length}건 저장 시작...`);
                
                supabase.from('transactions').insert(rows).then(function(result) {
                    console.log('[Supabase] 저장 응답:', result);
                    
                    if (result.error) {
                        console.error('[Supabase] 거래 데이터 저장 실패:', result.error);
                        showMessage('❌ Supabase 저장 실패: ' + result.error.message, 'error');
                    } else {
                        console.log(`[Supabase] ${companyName}에 ${transactions.length}건 저장 성공`);
                        
                        // localStorage도 업데이트 (덮어쓰기)
                        const storageKey = `transactions_${userEmail}_${companyName}`;
                        localStorage.setItem(storageKey, JSON.stringify(transactions));
                        console.log(`[localStorage] ${storageKey}에 ${transactions.length}건 덮어쓰기 완료`);
                        
                        showMessage(`✅ Supabase DB에 ${transactions.length}건 저장 완료!\n\n이전 데이터는 삭제되었습니다.`, 'success');
                        
                        // 성공 후 초기화
                        document.getElementById('sheetsUrl').value = '';
                        document.getElementById('sheetsPreviewSection').style.display = 'none';
                        sheetsPreviewData = [];
                    }
                }).catch(function(e) {
                    console.error('[Supabase] 거래 데이터 저장 오류:', e);
                    showMessage('❌ Supabase 저장 오류: ' + (e.message || e), 'error');
                });
            })
            .catch(function(e) {
                console.error('[Supabase] 삭제 오류:', e);
                showMessage('❌ 기존 데이터 삭제 오류: ' + (e.message || e), 'error');
            });
    } else {
        console.warn('[Supabase] 연결 안 됨, localStorage만 저장');
        // localStorage에 저장 (덮어쓰기)
        const storageKey = `transactions_${userEmail}_${companyName}`;
        localStorage.setItem(storageKey, JSON.stringify(transactions));
        console.log(`[localStorage] ${companyName}에 ${transactions.length}건 저장됨`);
        showMessage('⚠️ localStorage에만 저장됨 (Supabase 미연결)\n\n브라우저 콘솔(F12)을 확인하세요.', 'error');
    }
}

// 수기 등록 설정
function setupManualEntry() {
    const form = document.getElementById('manualEntryForm');
    if (!form) return;
    
    // 오늘 날짜를 기본값으로 설정
    const dateInput = document.getElementById('entryDate');
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.max = today; // 미래 날짜 선택 불가
    
    // 폼 제출 이벤트
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 폼 데이터 수집 (상태·대상 사용자 제거, 기본값 사용)
        const defaultUser = usersData.length > 0 ? usersData[0].email : '';
        const formData = {
            date: document.getElementById('entryDate').value,
            client: document.getElementById('entryClient').value.trim(),
            category: document.getElementById('entryCategory').value,
            amount: parseInt(document.getElementById('entryAmount').value),
            status: 'completed',
            user: defaultUser,
            note: document.getElementById('entryNote').value.trim(),
            id: Date.now() // 고유 ID 생성
        };
        
        // 유효성 검사
        if (!formData.date || !formData.client || !formData.category || !formData.amount) {
            alert('필수 항목을 모두 입력해주세요.');
            return;
        }
        if (!defaultUser) {
            alert('등록된 사용자가 없습니다.');
            return;
        }
        
        if (formData.amount < 0) {
            alert('금액은 음수가 될 수 없습니다.');
            return;
        }
        
        // 데이터 저장
        saveManualEntry(formData);
        
        // 성공 메시지 표시
        showEntrySuccess();
        
        // 폼 초기화
        form.reset();
        dateInput.value = today;
        
        // 활동 로그 추가
        const targetUser = usersData.find(u => u.email === formData.user);
        const userName = targetUser ? (targetUser.companies[0] || targetUser.email) : formData.user;
        addActivityLog(`${userName}에 매출 데이터 1건을 등록했습니다`);
    });
    
    // 금액 입력 포맷팅
    const amountInput = document.getElementById('entryAmount');
    amountInput.addEventListener('blur', function() {
        if (this.value) {
            // 천 단위 구분 (표시용)
            const value = parseInt(this.value);
            if (!isNaN(value)) {
                this.dataset.formattedValue = formatCurrency(value);
            }
        }
    });
}

// 수기 등록 데이터 저장
function saveManualEntry(data) {
    const targetEmail = data.user;
    const targetUser = usersData.find(u => u.email === targetEmail);
    if (!targetUser) {
        alert('사용자를 찾을 수 없습니다.');
        return;
    }
    
    // 사용자의 모든 회사에 저장
    const userCompanies = targetUser.companies || [];
    if (userCompanies.length === 0) {
        alert('사용자에게 등록된 회사가 없습니다.');
        return;
    }
    
    const transaction = {
        id: data.id,
        date: data.date,
        client: data.client,
        category: data.category,
        amount: data.amount,
        status: data.status,
        note: data.note || ''
    };
    
    // 각 회사별로 저장 (Supabase + localStorage)
    userCompanies.forEach(companyName => {
        saveTransactionsToStorage(targetEmail, companyName, [transaction]);
    });
    
    console.log(`매출 데이터 ${userCompanies.length}개 회사에 저장 완료:`, transaction);
}

// 등록 성공 메시지 표시
function showEntrySuccess() {
    const form = document.querySelector('.entry-form');
    const successDiv = document.getElementById('entrySuccess');
    
    if (form && successDiv) {
        form.style.display = 'none';
        successDiv.style.display = 'block';
        
        // 확인 버튼 클릭 시 폼 다시 표시
        const confirmBtn = successDiv.querySelector('.btn-primary');
        confirmBtn.onclick = () => {
            successDiv.style.display = 'none';
            form.style.display = 'block';
        };
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// 사용자 및 회사 데이터 (localStorage에 저장·로드하여 새로고침 후에도 유지)
var ADMIN_USERS_STORAGE_KEY = 'admin_users_data';
var ADMIN_COMPANIES_STORAGE_KEY = 'admin_companies_data';

var DEFAULT_USERS_DATA = [
    { id: 1, name: '김철수', email: 'demo1@company.com', companies: ['테크노바 주식회사', '글로벌테크 주식회사'], joinDate: '2025.12.01', status: '활성' },
    { id: 2, name: '이영희', email: 'demo2@company.com', companies: ['미래산업 코퍼레이션'], joinDate: '2025.12.15', status: '활성' }
];
var DEFAULT_COMPANIES_DATA = [
    { name: '테크노바 주식회사', number: '123-45-67890' },
    { name: '미래산업 코퍼레이션', number: '987-65-43210' },
    { name: '글로벌테크 주식회사', number: '345-67-89012' },
    { name: '혁신솔루션즈', number: '456-78-90123' },
    { name: '디지털플러스', number: '567-89-01234' }
];

function loadUsersData() {
    try {
        var raw = localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
        if (raw) {
            var parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) { }
    return JSON.parse(JSON.stringify(DEFAULT_USERS_DATA));
}
function loadCompaniesData() {
    try {
        var raw = localStorage.getItem(ADMIN_COMPANIES_STORAGE_KEY);
        if (raw) {
            var parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) { }
    return JSON.parse(JSON.stringify(DEFAULT_COMPANIES_DATA));
}
function saveUsersData() {
    try {
        localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(usersData));
        syncUsersToSupabase();
    } catch (e) {
        console.warn('사용자 데이터 저장 실패:', e);
    }
}
function saveCompaniesData() {
    try {
        localStorage.setItem(ADMIN_COMPANIES_STORAGE_KEY, JSON.stringify(availableCompanies));
        syncCompaniesToSupabase();
    } catch (e) {
        console.warn('회사 데이터 저장 실패:', e);
    }
}

// Supabase에서 회사/사용자 로드 (세션 불필요 - anon 허용)
function loadAdminDataFromSupabase() {
    var statusEl = document.getElementById('contentSubtitle');
    
    if (typeof supabase === 'undefined' || !supabase) {
        console.warn('[Supabase] 연결 안 됨, localStorage만 사용');
        if (statusEl) statusEl.textContent = '⚠️ Supabase 미연결 - 로컬 데이터만 표시됩니다';
        return;
    }
    
    console.log('[Supabase] 관리자 데이터 로드 시작...');
    if (statusEl) statusEl.textContent = 'Supabase에서 데이터 로드 중...';
    
    var loadedCompanies = false;
    var loadedUsers = false;
    
    function checkComplete() {
        if (loadedCompanies && loadedUsers) {
            if (statusEl) statusEl.textContent = '등록된 사용자를 관리합니다';
            // Google Sheets 사용자/회사 드롭다운도 갱신
            try { updateSheetsUserSelect(); } catch(e) {}
        }
    }
    
    // 회사 데이터 로드
    supabase.from('companies').select('id,name,number').then(function(r) {
        console.log('[Supabase] companies 결과:', r);
        if (r.error) {
            console.error('[Supabase] companies 에러:', r.error);
            if (statusEl) statusEl.textContent = '⚠️ 회사 로드 실패: ' + (r.error.message || 'RLS 정책 확인 필요');
            loadedCompanies = true;
            checkComplete();
            return;
        }
        if (r.data && r.data.length > 0) {
            availableCompanies.length = 0;
            r.data.forEach(function(c) {
                availableCompanies.push({ name: c.name, number: c.number });
            });
            try { localStorage.setItem(ADMIN_COMPANIES_STORAGE_KEY, JSON.stringify(availableCompanies)); } catch(e) {}
            updateCompaniesTable();
            updateUserSelects();
            updateStats();
            console.log('[Supabase] companies ' + r.data.length + '건 로드 완료');
        } else {
            console.log('[Supabase] companies 테이블 비어있음, 로컬 데이터 업로드 시도');
            if (availableCompanies.length > 0) {
                syncCompaniesToSupabase();
            }
        }
        loadedCompanies = true;
        checkComplete();
    }).catch(function(e) {
        console.error('[Supabase] companies 로드 실패:', e);
        loadedCompanies = true;
        checkComplete();
    });
    
    // 사용자 데이터 로드
    supabase.from('app_users').select('id,name,email,companies,join_date,status,password_hash,is_admin').then(function(r) {
        console.log('[Supabase] app_users 결과:', r);
        if (r.error) {
            console.error('[Supabase] app_users 에러:', r.error);
            if (statusEl) statusEl.textContent = '⚠️ 사용자 로드 실패: ' + (r.error.message || 'RLS 정책 확인 필요');
            loadedUsers = true;
            checkComplete();
            return;
        }
        if (r.data && r.data.length > 0) {
            usersData.length = 0;
            r.data.forEach(function(u) {
                var companies = [];
                try {
                    companies = Array.isArray(u.companies) ? u.companies : (u.companies ? JSON.parse(u.companies) : []);
                } catch(e) { companies = []; }
                
                usersData.push({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    companies: companies,
                    joinDate: u.join_date || '',
                    status: u.status || '활성'
                });
                
                if (typeof DEMO_USERS !== 'undefined' && u.password_hash) {
                    DEMO_USERS[u.email] = {
                        password: u.password_hash,
                        fullName: u.name,
                        isAdmin: u.is_admin === true,
                        companyName: companies.length > 0 ? companies[0] : '',
                        companies: companies,
                        data: { currentMonthRevenue: 0, lastMonthRevenue: 0, monthlyRevenue: [], lastYearRevenue: [], categories: [], weeklyData: [], quarterlyGrowth: [], transactions: [] }
                    };
                }
            });
            try { localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(usersData)); } catch(e) {}
            updateUsersTable();
            updateAdminsTable();
            updateUserSelects();
            updateStats();
            console.log('[Supabase] app_users ' + r.data.length + '건 로드 완료');
        } else {
            console.log('[Supabase] app_users 테이블 비어있음, 로컬 데이터 업로드 시도');
            if (usersData.length > 0) {
                syncUsersToSupabase();
            }
        }
        loadedUsers = true;
        checkComplete();
    }).catch(function(e) {
        console.error('[Supabase] app_users 로드 실패:', e);
        loadedUsers = true;
        checkComplete();
    });
}

function syncCompaniesToSupabase() {
    if (typeof supabase === 'undefined' || !supabase) return;
    
    console.log('[Supabase] companies 동기화 시작...');
    
    supabase.from('companies').select('id').then(function(r) {
        var ids = (r.data || []).map(function(x) { return x.id; });
        if (ids.length === 0) {
            if (availableCompanies.length === 0) return;
            var rows = availableCompanies.map(function(c) { return { name: c.name, number: c.number }; });
            supabase.from('companies').insert(rows).then(function(res) {
                console.log('[Supabase] companies 저장 완료:', res);
            }).catch(function(e) {
                console.warn('[Supabase] companies 저장 실패:', e && e.message);
            });
            return;
        }
        supabase.from('companies').delete().in('id', ids).then(function() {
            if (availableCompanies.length === 0) return;
            var rows = availableCompanies.map(function(c) { return { name: c.name, number: c.number }; });
            supabase.from('companies').insert(rows).then(function(res) {
                console.log('[Supabase] companies 저장 완료:', res);
            }).catch(function(e) {
                console.warn('[Supabase] companies 저장 실패:', e && e.message);
            });
        }).catch(function(e) {
            console.warn('[Supabase] companies 삭제 실패:', e && e.message);
        });
    }).catch(function(e) {
        console.warn('[Supabase] companies id 조회 실패:', e && e.message);
    });
}

function syncUsersToSupabase() {
    if (typeof supabase === 'undefined' || !supabase) {
        console.warn('[Supabase] 연결되지 않음');
        return;
    }
    
    if (usersData.length === 0) {
        console.warn('[Supabase] 저장할 사용자 데이터 없음');
        return;
    }
    
    console.log('[Supabase] app_users 동기화 시작...', usersData.length, '명');
    
    // localStorage의 비밀번호 정보 가져오기
    var additions = {};
    try {
        var stored = localStorage.getItem('demo_users_additions');
        if (stored) additions = JSON.parse(stored);
    } catch (e) {}
    
    // 각 사용자를 개별적으로 upsert
    usersData.forEach(function(u) {
        var userAuth = additions[u.email] || (DEMO_USERS[u.email] || {});
        var userData = {
            name: u.name,
            email: u.email,
            password_hash: userAuth.password || '',
            companies: u.companies || [],
            join_date: u.joinDate || new Date().toISOString().split('T')[0],
            status: u.status || '활성'
        };
        
        console.log('[Supabase] 사용자 저장:', u.email, '비밀번호:', userData.password_hash);
        
        // 이메일로 중복 확인 후 insert 또는 update
        supabase.from('app_users')
            .select('email')
            .eq('email', u.email)
            .maybeSingle()
            .then(function(checkResult) {
                if (checkResult.data) {
                    // 이미 존재 - update
                    supabase.from('app_users')
                        .update(userData)
                        .eq('email', u.email)
                        .then(function(updateResult) {
                            if (updateResult.error) {
                                console.error('[Supabase] 사용자 업데이트 실패:', u.email, updateResult.error);
                            } else {
                                console.log('[Supabase] 사용자 업데이트 성공:', u.email);
                            }
                        });
                } else {
                    // 존재하지 않음 - insert
                    supabase.from('app_users')
                        .insert([userData])
                        .then(function(insertResult) {
                            if (insertResult.error) {
                                console.error('[Supabase] 사용자 추가 실패:', u.email, insertResult.error);
                            } else {
                                console.log('[Supabase] 사용자 추가 성공:', u.email);
                            }
                        });
                }
            })
            .catch(function(e) {
                console.error('[Supabase] 사용자 확인 실패:', u.email, e);
            });
    });
    
    console.log('[Supabase] app_users 동기화 요청 완료');
}
            supabase.from('app_users').delete().in('id', ids).then(function() {
                if (usersData.length === 0) return;
                var rows = usersData.map(function(u) {
                    return { name: u.name, email: u.email, companies: u.companies || [], join_date: u.joinDate || '', status: u.status || '활성' };
                });
                supabase.from('app_users').insert(rows).then(function() {}).catch(function(e) {
                    console.warn('[Supabase] app_users 저장 실패:', e && e.message);
                });
            }).catch(function(e) {
                console.warn('[Supabase] app_users 삭제 실패:', e && e.message);
            });
        }).catch(function(e) {
            console.warn('[Supabase] app_users id 조회 실패:', e && e.message);
        });
    });
}

var usersData = loadUsersData();
var availableCompanies = loadCompaniesData();

// 현재 편집 중인 사용자
let currentEditingUser = null;

// 관리자 추가 모달 열기/닫기
function openAddAdminModal() {
    document.getElementById('newAdminName').value = '';
    document.getElementById('newAdminEmail').value = '';
    document.getElementById('newAdminPassword').value = '';
    document.getElementById('addAdminModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeAddAdminModal() {
    document.getElementById('addAdminModal').style.display = 'none';
    document.body.style.overflow = '';
}

function saveNewAdmin() {
    const name = document.getElementById('newAdminName').value.trim();
    const email = document.getElementById('newAdminEmail').value.trim();
    const password = document.getElementById('newAdminPassword').value;
    if (!name || !email || !password) {
        alert('이름, 이메일, 비밀번호를 모두 입력해주세요.');
        return;
    }
    if (password.length < 8) {
        alert('비밀번호는 8자 이상이어야 합니다.');
        return;
    }
    if (typeof DEMO_USERS === 'undefined') {
        alert('시스템 오류: DEMO_USERS를 사용할 수 없습니다.');
        return;
    }
    if (DEMO_USERS[email]) {
        alert('이미 등록된 이메일입니다.');
        return;
    }
    const newAdmin = {
        password: password,
        fullName: name,
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
    };
    DEMO_USERS[email] = newAdmin;
    // 로그인 페이지에서도 인식하도록 localStorage에 저장
    try {
        const stored = localStorage.getItem('demo_users_additions') || '{}';
        const additions = JSON.parse(stored);
        additions[email] = newAdmin;
        localStorage.setItem('demo_users_additions', JSON.stringify(additions));
    } catch (e) {
        console.warn('추가 계정 저장 실패:', e);
    }
    closeAddAdminModal();
    updateAdminsTable();
    showMessage(`관리자 ${name}이(가) 추가되었습니다. 로그인 화면에서 해당 이메일로 로그인할 수 있습니다.`, 'success');
    addActivityLog(`관리자 추가: ${name} (${email})`);
}

// 사용자 추가 모달 열기
function openAddUserModal() {
    const titleEl = document.getElementById('editUserModalTitle');
    if (titleEl) titleEl.textContent = '사용자 추가';
    document.getElementById('editUserId').value = '';
    currentEditingUser = {
        id: null,
        name: '',
        email: '',
        companies: availableCompanies.length ? [availableCompanies[0].name] : [],
        status: '활성'
    };
    document.getElementById('editUserName').value = '';
    document.getElementById('editUserEmail').value = '';
    document.getElementById('editUserEmail').removeAttribute('readonly');
    document.getElementById('editUserPassword').value = '';
    document.getElementById('editUserPassword').placeholder = '8자 이상';
    const passwordHelp = document.getElementById('passwordHelp');
    if (passwordHelp) passwordHelp.textContent = '로그인 가능한 계정으로 생성하려면 비밀번호를 입력하세요.';
    const passwordReqMark = document.getElementById('passwordRequiredMark');
    if (passwordReqMark) passwordReqMark.style.display = 'none';
    document.getElementById('editUserStatus').value = '활성';
    renderUserCompanies();
    populateCompanySelect();
    document.getElementById('addCompanySelect').style.display = 'none';
    document.getElementById('editUserModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    addActivityLog('사용자 추가 모달을 열었습니다');
}

// 사용자 수정 모달 열기
function openEditUserModal(email, userId) {
    const titleEl = document.getElementById('editUserModalTitle');
    if (titleEl) titleEl.textContent = '사용자 정보 수정';
    const user = usersData.find(u => u.email === email || u.id == userId);
    if (!user) {
        alert('사용자를 찾을 수 없습니다.');
        return;
    }
    
    currentEditingUser = { ...user };
    
    // 폼 필드 채우기
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserName').value = user.name;
    document.getElementById('editUserEmail').value = user.email;
    document.getElementById('editUserEmail').setAttribute('readonly', 'readonly');
    document.getElementById('editUserPassword').value = '';
    document.getElementById('editUserPassword').placeholder = '변경 시에만 입력 (8자 이상)';
    const passwordHelp = document.getElementById('passwordHelp');
    if (passwordHelp) passwordHelp.textContent = '변경하지 않으려면 비워두세요.';
    const passwordReqMark = document.getElementById('passwordRequiredMark');
    if (passwordReqMark) passwordReqMark.style.display = 'none';
    document.getElementById('editUserStatus').value = user.status;
    
    // 회사 목록 표시
    renderUserCompanies();
    
    // 회사 추가 셀렉트 초기화
    populateCompanySelect();
    
    // 모달 표시
    document.getElementById('editUserModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    addActivityLog(`${user.name} 사용자 정보 수정 모달을 열었습니다`);
}

// 사용자 수정 모달 닫기
function closeEditUserModal() {
    document.getElementById('editUserModal').style.display = 'none';
    document.body.style.overflow = '';
    currentEditingUser = null;
    
    // 회사 추가 영역 숨기기
    document.getElementById('addCompanySelect').style.display = 'none';
}

// 사용자의 회사 목록 렌더링
function renderUserCompanies() {
    const container = document.getElementById('editUserCompanies');
    
    if (!currentEditingUser.companies || currentEditingUser.companies.length === 0) {
        container.innerHTML = '<div class="companies-empty">등록된 회사가 없습니다</div>';
        return;
    }
    
    container.innerHTML = currentEditingUser.companies.map(companyName => {
        const company = availableCompanies.find(c => c.name === companyName);
        return `
            <div class="company-item">
                <div class="company-info">
                    <div class="company-name">${companyName}</div>
                    <div class="company-number">${company ? company.number : '사업자번호 없음'}</div>
                </div>
                <button type="button" class="btn-remove-company" onclick="removeCompanyFromUser('${companyName}')">
                    삭제
                </button>
            </div>
        `;
    }).join('');
}

// 회사 선택 드롭다운 채우기
function populateCompanySelect() {
    const select = document.getElementById('companyToAdd');
    
    // 이미 추가된 회사 제외
    const availableToAdd = availableCompanies.filter(company => 
        !currentEditingUser.companies.includes(company.name)
    );
    
    select.innerHTML = '<option value="">회사를 선택하세요</option>' + 
        availableToAdd.map(company => 
            `<option value="${company.name}">${company.name} (${company.number})</option>`
        ).join('');
}

// 회사 추가 영역 표시
function showAddCompanySelect() {
    populateCompanySelect();
    document.getElementById('addCompanySelect').style.display = 'block';
}

// 회사 추가 취소
function cancelAddCompany() {
    document.getElementById('addCompanySelect').style.display = 'none';
    document.getElementById('companyToAdd').value = '';
}

// 사용자에게 회사 추가
function addCompanyToUser() {
    const select = document.getElementById('companyToAdd');
    const companyName = select.value;
    
    if (!companyName) {
        alert('회사를 선택해주세요.');
        return;
    }
    
    if (currentEditingUser.companies.includes(companyName)) {
        alert('이미 추가된 회사입니다.');
        return;
    }
    
    currentEditingUser.companies.push(companyName);
    renderUserCompanies();
    cancelAddCompany();
    
    addActivityLog(`${currentEditingUser.name}에게 ${companyName}를 추가했습니다`);
}

// 사용자에게서 회사 제거
function removeCompanyFromUser(companyName) {
    if (currentEditingUser.companies.length <= 1) {
        alert('최소 1개 이상의 회사가 필요합니다.');
        return;
    }
    
    if (confirm(`${companyName}을(를) 삭제하시겠습니까?`)) {
        currentEditingUser.companies = currentEditingUser.companies.filter(c => c !== companyName);
        renderUserCompanies();
        populateCompanySelect();
        
        addActivityLog(`${currentEditingUser.name}에게서 ${companyName}를 제거했습니다`);
    }
}

// 사용자 변경사항 저장
function saveUserChanges() {
    if (!currentEditingUser) return;
    
    const name = document.getElementById('editUserName').value.trim();
    const email = document.getElementById('editUserEmail').value.trim();
    const status = document.getElementById('editUserStatus').value;
    
    if (!name) {
        alert('이름을 입력해주세요.');
        return;
    }
    
    if (currentEditingUser.companies.length === 0) {
        alert('최소 1개 이상의 회사를 추가해주세요.');
        return;
    }
    
    // 추가 모드
    if (!currentEditingUser.id) {
        if (!email) {
            alert('이메일을 입력해주세요.');
            return;
        }
        if (usersData.some(u => u.email === email)) {
            alert('이미 등록된 이메일입니다.');
            return;
        }
        const password = document.getElementById('editUserPassword').value;
        if (password && password.length > 0 && password.length < 8) {
            alert('비밀번호는 8자 이상이어야 합니다.');
            return;
        }
        
        // 비밀번호 입력 시 로그인 가능한 계정으로 DEMO_USERS에 등록
        if (password && password.length >= 8) {
            if (typeof DEMO_USERS !== 'undefined' && !DEMO_USERS[email]) {
                const companyName = currentEditingUser.companies.length > 0 ? currentEditingUser.companies[0] : '';
                const newAuthUser = {
                    password: password,
                    fullName: name,
                    isAdmin: false,
                    companyName: companyName,
                    companies: [...currentEditingUser.companies],
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
                };
                DEMO_USERS[email] = newAuthUser;
                try {
                    const stored = localStorage.getItem('demo_users_additions') || '{}';
                    const additions = JSON.parse(stored);
                    additions[email] = newAuthUser;
                    localStorage.setItem('demo_users_additions', JSON.stringify(additions));
                } catch (e) {
                    console.warn('사용자 계정 저장 실패:', e);
                }
            }
        }
        
        const newId = usersData.length ? Math.max(...usersData.map(u => u.id)) + 1 : 1;
        usersData.push({
            id: newId,
            name: name,
            email: email,
            companies: [...currentEditingUser.companies],
            joinDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
            status: status
        });
        saveUsersData();
        updateUsersTable();
        updateUserSelects();
        updateCompaniesTable();
        updateStats();
        const msg = password && password.length >= 8 
            ? `${name} 사용자가 추가되었습니다. 로그인 화면에서 ${email} 로 로그인할 수 있습니다.`
            : `${name} 사용자가 추가되었습니다.`;
        showMessage(msg, 'success');
        addActivityLog(`사용자 추가: ${name} (${email})`);
        closeEditUserModal();
        return;
    }
    
    // 수정 모드
    const userIndex = usersData.findIndex(u => u.id === currentEditingUser.id);
    if (userIndex !== -1) {
        const password = document.getElementById('editUserPassword').value;
        if (password && password.length > 0 && password.length < 8) {
            alert('비밀번호는 8자 이상이어야 합니다.');
            return;
        }
        
        // 비밀번호 변경 시 DEMO_USERS에 반영
        if (password && password.length >= 8) {
            const companyName = currentEditingUser.companies.length > 0 ? currentEditingUser.companies[0] : '';
            const authUser = {
                password: password,
                fullName: name,
                isAdmin: false,
                companyName: companyName,
                companies: [...currentEditingUser.companies],
                data: typeof DEMO_USERS !== 'undefined' && DEMO_USERS[email] && DEMO_USERS[email].data 
                    ? DEMO_USERS[email].data 
                    : {
                        currentMonthRevenue: 0,
                        lastMonthRevenue: 0,
                        monthlyRevenue: [],
                        lastYearRevenue: [],
                        categories: [],
                        weeklyData: [],
                        quarterlyGrowth: [],
                        transactions: []
                    }
            };
            if (typeof DEMO_USERS !== 'undefined') {
                DEMO_USERS[email] = authUser;
                try {
                    const stored = localStorage.getItem('demo_users_additions') || '{}';
                    const additions = JSON.parse(stored);
                    additions[email] = authUser;
                    localStorage.setItem('demo_users_additions', JSON.stringify(additions));
                } catch (e) {
                    console.warn('비밀번호 저장 실패:', e);
                }
            }
        }
        
        usersData[userIndex] = {
            ...usersData[userIndex],
            name: name,
            status: status,
            companies: [...currentEditingUser.companies]
        };
        
        // DEMO_USERS에도 companies 정보 업데이트 (로그인한 사용자가 회사 목록을 올바르게 보도록)
        if (typeof DEMO_USERS !== 'undefined' && DEMO_USERS[email]) {
            DEMO_USERS[email].companies = [...currentEditingUser.companies];
            DEMO_USERS[email].companyName = currentEditingUser.companies.length > 0 ? currentEditingUser.companies[0] : '';
            DEMO_USERS[email].fullName = name;
            // localStorage의 demo_users_additions에도 업데이트
            try {
                const stored = localStorage.getItem('demo_users_additions') || '{}';
                const additions = JSON.parse(stored);
                if (additions[email]) {
                    additions[email].companies = [...currentEditingUser.companies];
                    additions[email].companyName = currentEditingUser.companies.length > 0 ? currentEditingUser.companies[0] : '';
                    additions[email].fullName = name;
                    localStorage.setItem('demo_users_additions', JSON.stringify(additions));
                }
            } catch (e) {
                console.warn('사용자 정보 저장 실패:', e);
            }
        }
        
        saveUsersData();
        updateUsersTable();
        updateUserSelects();
        updateCompaniesTable();
        updateStats();
        const msg = password && password.length >= 8
            ? `${name} 사용자 정보가 업데이트되었습니다. 비밀번호도 변경되었습니다.`
            : `${name} 사용자 정보가 업데이트되었습니다.`;
        showMessage(msg, 'success');
        addActivityLog(`${name} 사용자 정보를 수정했습니다`);
        closeEditUserModal();
    }
}

// 회사 테이블 업데이트
function updateCompaniesTable() {
    const tbody = document.getElementById('companiesTable');
    if (!tbody) return;
    
    tbody.innerHTML = availableCompanies.map((company, index) => {
        // 이 회사를 사용하는 사용자 수 계산
        const userCount = usersData.filter(user => 
            user.companies.includes(company.name)
        ).length;
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${company.name}</td>
                <td>${company.number}</td>
                <td>${userCount}명</td>
                <td>
                    <button type="button" class="btn-small btn-edit" onclick="openEditCompanyModal(${index})">수정</button>
                    <button type="button" class="btn-small btn-delete" onclick="deleteCompany(${index})">삭제</button>
                </td>
            </tr>
        `;
    }).join('');
}

// 회사 삭제
function deleteCompany(index) {
    const company = availableCompanies[index];
    if (!company) return;
    const userCount = usersData.filter(user => user.companies.includes(company.name)).length;
    const msg = userCount > 0
        ? '"' + company.name + '" 회사를 삭제하시겠습니까?\n이 회사를 사용 중인 사용자 ' + userCount + '명의 회사 목록에서도 제거됩니다.'
        : '"' + company.name + '" 회사를 삭제하시겠습니까?';
    if (!confirm(msg)) return;
    availableCompanies.splice(index, 1);
    usersData.forEach(user => {
        const i = user.companies.indexOf(company.name);
        if (i !== -1) user.companies.splice(i, 1);
    });
    saveUsersData();
    saveCompaniesData();
    updateCompaniesTable();
    updateUsersTable();
    updateUserSelects();
    updateStats();
    showMessage('회사가 삭제되었습니다.', 'success');
    addActivityLog('회사 삭제: ' + company.name);
}

// 회사 추가 모달 열기
function openAddCompanyModal() {
    const titleEl = document.getElementById('editCompanyModalTitle');
    if (titleEl) titleEl.textContent = '회사 추가';
    document.getElementById('editCompanyIndex').value = '-1';
    document.getElementById('editCompanyName').value = '';
    document.getElementById('editCompanyNumber').value = '';
    document.getElementById('editCompanyModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// 회사 수정 모달 열기
function openEditCompanyModal(index) {
    const company = availableCompanies[index];
    if (!company) return;
    const titleEl = document.getElementById('editCompanyModalTitle');
    if (titleEl) titleEl.textContent = '회사 정보 수정';
    document.getElementById('editCompanyIndex').value = index;
    document.getElementById('editCompanyName').value = company.name;
    document.getElementById('editCompanyNumber').value = company.number;
    document.getElementById('editCompanyModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// 회사 수정 모달 닫기
function closeEditCompanyModal() {
    document.getElementById('editCompanyModal').style.display = 'none';
    document.body.style.overflow = '';
}

// 회사 추가/수정 저장
function saveCompanyEdit() {
    const index = parseInt(document.getElementById('editCompanyIndex').value, 10);
    const name = document.getElementById('editCompanyName').value.trim();
    const number = document.getElementById('editCompanyNumber').value.trim();
    if (!name || !number) {
        alert('회사명과 사업자등록번호를 입력해주세요.');
        return;
    }
    if (isNaN(index) || index < 0) {
        // 추가 모드
        if (availableCompanies.some(c => c.name === name)) {
            alert('이미 등록된 회사명입니다.');
            return;
        }
        availableCompanies.push({ name: name, number: number });
        saveCompaniesData();
        updateCompaniesTable();
        updateUserSelects();
        updateStats();
        closeEditCompanyModal();
        showMessage('회사가 추가되었습니다.', 'success');
        addActivityLog('회사 추가: ' + name);
        return;
    }
    // 수정 모드
    const company = availableCompanies[index];
    if (!company) return;
    const oldName = company.name;
    company.name = name;
    company.number = number;
    usersData.forEach(user => {
        const i = user.companies.indexOf(oldName);
        if (i !== -1) user.companies[i] = name;
    });
    saveUsersData();
    saveCompaniesData();
    updateCompaniesTable();
    updateUsersTable();
    updateUserSelects();
    closeEditCompanyModal();
    showMessage('회사 정보가 수정되었습니다.', 'success');
    addActivityLog('회사 정보를 수정했습니다: ' + name);
}

// 공지사항 데이터 (localStorage)
const NOTICES_STORAGE_KEY = 'admin_notices';

function getNotices() {
    try {
        const raw = localStorage.getItem(NOTICES_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveNotices(notices) {
    localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(notices));
}

function setupNoticeButton() {
    const btn = document.getElementById('addNoticeBtn');
    if (!btn) return;
    btn.addEventListener('click', () => openNoticeModal());
}

function openNoticeModal(id) {
    document.getElementById('noticeModalTitle').textContent = id ? '공지사항 수정' : '공지사항 등록';
    document.getElementById('noticeId').value = id || '';
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('noticeDate').value = today;
    if (id) {
        const notices = getNotices();
        const notice = notices.find(n => n.id === id);
        if (notice) {
            document.getElementById('noticeTitle').value = notice.title;
            document.getElementById('noticeContent').value = notice.content || '';
            document.getElementById('noticeDate').value = (notice.date || today).slice(0, 10);
        }
    } else {
        document.getElementById('noticeTitle').value = '';
        document.getElementById('noticeContent').value = '';
        document.getElementById('noticeDate').value = today;
    }
    document.getElementById('noticeModal').style.display = 'flex';
}

function closeNoticeModal() {
    document.getElementById('noticeModal').style.display = 'none';
}

function saveNotice() {
    const id = document.getElementById('noticeId').value;
    const title = document.getElementById('noticeTitle').value.trim();
    const content = document.getElementById('noticeContent').value.trim();
    const date = document.getElementById('noticeDate').value;
    if (!title) {
        alert('제목을 입력해주세요.');
        return;
    }
    const notices = getNotices();
    if (id) {
        const idx = notices.findIndex(n => n.id === id);
        if (idx !== -1) {
            notices[idx] = { ...notices[idx], title, content, date };
        }
    } else {
        notices.unshift({
            id: 'n' + Date.now(),
            title,
            content,
            date: date || new Date().toISOString().slice(0, 10),
            createdAt: new Date().toISOString()
        });
    }
    saveNotices(notices);
    updateNoticesTable();
    closeNoticeModal();
    addActivityLog('공지사항을 저장했습니다.');
}

function updateNoticesTable() {
    const tbody = document.getElementById('noticesTable');
    if (!tbody) return;
    const notices = getNotices();
    if (notices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-message">등록된 공지사항이 없습니다.</td></tr>';
        return;
    }
    tbody.innerHTML = notices.map((n, i) => {
        const dateStr = n.date ? n.date.slice(0, 10).replace(/-/g, '.') : '-';
        return `
            <tr>
                <td>${notices.length - i}</td>
                <td>${n.title}</td>
                <td>${dateStr}</td>
                <td>
                    <button type="button" class="btn-small btn-edit" onclick="openNoticeModal('${n.id}')">수정</button>
                    <button type="button" class="btn-small btn-view" onclick="deleteNotice('${n.id}')">삭제</button>
                </td>
            </tr>
        `;
    }).join('');
}

function deleteNotice(id) {
    if (!confirm('이 공지사항을 삭제하시겠습니까?')) return;
    const notices = getNotices().filter(n => n.id !== id);
    saveNotices(notices);
    updateNoticesTable();
    addActivityLog('공지사항을 삭제했습니다.');
}

// 통계 업데이트
function updateStats() {
    // 총 회사 수
    const totalCompaniesEl = document.querySelector('.stats-grid .stat-card:nth-child(1) .stat-value');
    if (totalCompaniesEl) {
        totalCompaniesEl.textContent = availableCompanies.length;
    }
    
    // 총 사용자 수
    const totalUsersEl = document.querySelector('.stats-grid .stat-card:nth-child(2) .stat-value');
    if (totalUsersEl) {
        totalUsersEl.textContent = usersData.length;
    }
}

// 관리자 목록 테이블 업데이트 (DEMO_USERS 중 isAdmin === true)
function updateAdminsTable() {
    const tbody = document.getElementById('adminsTable');
    if (!tbody) return;
    
    const admins = typeof DEMO_USERS !== 'undefined'
        ? Object.entries(DEMO_USERS).filter(function(entry) { return entry[1].isAdmin === true; })
        : [];
    
    tbody.innerHTML = admins.map(function(entry, index) {
        const email = entry[0];
        const u = entry[1];
        const name = (u && u.fullName) ? u.fullName : '-';
        const safeEmail = String(email).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${name}</td>
                <td>${email}</td>
                <td>
                    <button type="button" class="btn-small btn-edit" data-admin-email="${safeEmail}" onclick="openEditAdminModal(this.getAttribute('data-admin-email'))">수정</button>
                    <button type="button" class="btn-small btn-delete" data-admin-email="${safeEmail}" onclick="deleteAdmin(this.getAttribute('data-admin-email'))">삭제</button>
                </td>
            </tr>
        `;
    }).join('');
}

// 관리자 수정 모달 열기
function openEditAdminModal(email) {
    if (typeof DEMO_USERS === 'undefined' || !DEMO_USERS[email] || !DEMO_USERS[email].isAdmin) {
        alert('관리자 정보를 찾을 수 없습니다.');
        return;
    }
    document.getElementById('editAdminEmail').value = email;
    document.getElementById('editAdminEmailDisplay').value = email;
    document.getElementById('editAdminName').value = DEMO_USERS[email].fullName || '';
    document.getElementById('editAdminPassword').value = '';
    document.getElementById('editAdminModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeEditAdminModal() {
    document.getElementById('editAdminModal').style.display = 'none';
    document.body.style.overflow = '';
}

// 관리자 수정 저장 (이름, 비밀번호 변경 시에만)
function saveEditAdmin() {
    const email = document.getElementById('editAdminEmail').value.trim();
    const name = document.getElementById('editAdminName').value.trim();
    const newPassword = document.getElementById('editAdminPassword').value;
    if (!email || !DEMO_USERS[email] || !DEMO_USERS[email].isAdmin) {
        alert('관리자 정보를 찾을 수 없습니다.');
        return;
    }
    if (!name) {
        alert('이름을 입력해주세요.');
        return;
    }
    if (newPassword.length > 0 && newPassword.length < 8) {
        alert('비밀번호는 8자 이상이어야 합니다.');
        return;
    }
    var user = DEMO_USERS[email];
    user.fullName = name;
    if (newPassword.length >= 8) {
        user.password = newPassword;
    }
    try {
        var stored = localStorage.getItem('demo_users_additions') || '{}';
        var additions = JSON.parse(stored);
        additions[email] = user;
        localStorage.setItem('demo_users_additions', JSON.stringify(additions));
    } catch (e) {
        console.warn('관리자 수정 저장 실패:', e);
    }
    closeEditAdminModal();
    updateAdminsTable();
    showMessage('관리자 정보가 수정되었습니다.', 'success');
    addActivityLog('관리자 수정: ' + name + ' (' + email + ')');
}

// 관리자 삭제 (추가 계정은 제거, 기본 계정은 삭제 목록에 넣어 로그인/목록에서 제외)
function deleteAdmin(email) {
    if (typeof DEMO_USERS === 'undefined' || !DEMO_USERS[email] || !DEMO_USERS[email].isAdmin) {
        alert('관리자 정보를 찾을 수 없습니다.');
        return;
    }
    var name = (DEMO_USERS[email].fullName || email);
    if (!confirm('관리자 "' + name + '" 계정을 삭제하시겠습니까?\n삭제 후에는 해당 이메일로 로그인할 수 없습니다.')) {
        return;
    }
    try {
        var additionsRaw = localStorage.getItem('demo_users_additions') || '{}';
        var additions = JSON.parse(additionsRaw);
        if (additions[email]) {
            delete additions[email];
            localStorage.setItem('demo_users_additions', JSON.stringify(additions));
        } else {
            var deletedRaw = localStorage.getItem('demo_users_deleted') || '[]';
            var deleted = JSON.parse(deletedRaw);
            if (deleted.indexOf(email) === -1) {
                deleted.push(email);
                localStorage.setItem('demo_users_deleted', JSON.stringify(deleted));
            }
        }
        delete DEMO_USERS[email];
    } catch (e) {
        console.warn('관리자 삭제 저장 실패:', e);
    }
    updateAdminsTable();
    showMessage('관리자가 삭제되었습니다.', 'success');
    addActivityLog('관리자 삭제: ' + name + ' (' + email + ')');
}

// 사용자 삭제
function deleteUser(email) {
    const user = usersData.find(u => u.email === email);
    if (!user) {
        alert('사용자를 찾을 수 없습니다.');
        return;
    }
    if (!confirm('사용자 "' + user.name + '" (' + email + ')을(를) 삭제하시겠습니까?')) {
        return;
    }
    const index = usersData.findIndex(u => u.email === email);
    if (index !== -1) {
        usersData.splice(index, 1);
    }
    saveUsersData();
    updateUsersTable();
    updateUserSelects();
    updateStats();
    showMessage('사용자가 삭제되었습니다.', 'success');
}

// 사용자 테이블 업데이트
function updateUsersTable() {
    const tbody = document.getElementById('usersTable');
    if (!tbody) return;
    
    tbody.innerHTML = usersData.map(user => {
        let companiesHtml;
        if (user.companies.length === 1) {
            // 회사가 1개인 경우 텍스트로 표시
            companiesHtml = user.companies[0];
        } else {
            // 회사가 2개 이상인 경우 드롭다운으로 표시
            companiesHtml = `
                <div class="company-dropdown">
                    <button class="company-dropdown-btn" onclick="toggleCompanyDropdown(${user.id}, event)">
                        <span>${user.companies[0]} 외 ${user.companies.length - 1}개</span>
                        <span class="dropdown-arrow">▼</span>
                    </button>
                    <div class="company-dropdown-menu" id="companyMenu${user.id}">
                        ${user.companies.map(company => `
                            <div class="company-dropdown-item">${company}</div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        return `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${companiesHtml}</td>
                <td><span class="status-badge completed">${user.status}</span></td>
                <td>
                    <button type="button" class="btn-small btn-view" onclick="viewAsUser('${user.email}')" title="해당 사용자 화면으로 접속하여 등록 데이터를 확인합니다">사용자 화면</button>
                    <button type="button" class="btn-small btn-edit" onclick="openEditUserModal('${user.email}', ${user.id})">수정</button>
                    <button type="button" class="btn-small btn-delete" data-user-email="${String(user.email).replace(/"/g, '&quot;').replace(/</g, '&lt;')}" onclick="deleteUser(this.getAttribute('data-user-email'))">삭제</button>
                </td>
            </tr>
        `;
    }).join('');
}

// 사용자 계정으로 대시보드 접속 (테스트용)
function viewAsUser(email) {
    const user = usersData.find(u => u.email === email);
    if (!user) {
        alert('사용자 정보를 찾을 수 없습니다.');
        return;
    }
    const companyName = user.companies && user.companies.length > 0 ? user.companies[0] : '';
    const currentAdmin = Storage.getUser();
    if (!currentAdmin || !isAdminUser(currentAdmin.email)) {
        alert('관리자만 사용할 수 있는 기능입니다.');
        return;
    }
    sessionStorage.setItem('adminUserBackup', JSON.stringify(currentAdmin));
    sessionStorage.setItem('adminImpersonating', '1');
    Storage.setUser({
        email: user.email,
        companyName: companyName,
        fullName: user.name,
        remember: false
    });
    location.href = 'dashboard.html';
}

// 회사 드롭다운 토글
function toggleCompanyDropdown(userId, event) {
    if (event) {
        event.stopPropagation();
    }
    
    const menu = document.getElementById(`companyMenu${userId}`);
    const btn = menu.previousElementSibling;
    const allMenus = document.querySelectorAll('.company-dropdown-menu');
    const allBtns = document.querySelectorAll('.company-dropdown-btn');
    
    // 다른 드롭다운 닫기
    allMenus.forEach((m, index) => {
        if (m !== menu) {
            m.classList.remove('active');
            allBtns[index]?.classList.remove('active');
        }
    });
    
    // 현재 드롭다운 토글
    menu.classList.toggle('active');
    btn.classList.toggle('active');
}

// 드롭다운 외부 클릭시 닫기
document.addEventListener('click', (e) => {
    if (!e.target.closest('.company-dropdown')) {
        document.querySelectorAll('.company-dropdown-menu').forEach(menu => {
            menu.classList.remove('active');
        });
        document.querySelectorAll('.company-dropdown-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }
});

// 사용자 선택 드롭다운 업데이트 (엑셀 업로드용 대상 사용자만)
function updateUserSelects() {
    const targetUserSelect = document.getElementById('targetUserSelect');
    if (!targetUserSelect) return;
    
    const options = usersData.map(user => {
        const companyText = user.companies.length > 0 ? user.companies[0] : '회사 없음';
        return `<option value="${user.email}">${user.name} - ${companyText} (${user.email})</option>`;
    }).join('');
    targetUserSelect.innerHTML = '<option value="">회사를 선택하세요</option>' + options;
}
