// 관리자 페이지 기능

document.addEventListener('DOMContentLoaded', () => {
    // 로그인 확인 (실제로는 관리자 권한 확인 필요)
    const currentUser = Storage.getUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // 사용자 정보 업데이트
    updateUserInfo();
    
    // 탭 전환 이벤트
    setupTabs();
    
    // 로그아웃 버튼
    setupLogout();
    
    // 버튼 이벤트
    setupButtons();
    
    // 엑셀 업로드 기능
    setupExcelUpload();
    
    // 수기 등록 기능
    setupManualEntry();
    
    // 사용자 테이블 초기화
    updateUsersTable();
    
    // 사용자 선택 드롭다운 초기화
    updateUserSelects();
    
    // 회사 테이블 초기화
    updateCompaniesTable();
    
    // 통계 업데이트
    updateStats();
});

// 사용자 정보 업데이트
function updateUserInfo() {
    const currentUser = Storage.getUser();
    const userNameEls = document.querySelectorAll('#userName, .admin-user-name');
    const userEmailEls = document.querySelectorAll('#userEmail, .admin-user-email');
    
    userNameEls.forEach(el => el.textContent = '관리자');
    userEmailEls.forEach(el => el.textContent = currentUser.email);
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
        'settings': { title: '시스템 설정', subtitle: '시스템 환경 설정 및 권한 관리' },
        'logs': { title: '활동 로그', subtitle: '시스템 활동 기록을 확인합니다' }
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
            
            // 헤더 제목 업데이트
            const titleInfo = menuTitles[menuName];
            if (titleInfo) {
                document.getElementById('contentTitle').textContent = titleInfo.title;
                document.getElementById('contentSubtitle').textContent = titleInfo.subtitle;
            }
            
            // 활동 로그에 기록
            addActivityLog(`"${titleInfo.title}" 메뉴 조회`);
        });
    });
    
    // 초기 활동 로그 생성
    generateInitialLogs();
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
    const addUserBtns = document.querySelectorAll('.btn-add');
    addUserBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentTab = document.querySelector('.tab-btn.active').dataset.tab;
            if (currentTab === 'users') {
                showMessage('사용자 추가 기능은 준비 중입니다.', 'info');
            } else if (currentTab === 'companies') {
                showMessage('회사 추가 기능은 준비 중입니다.', 'info');
            }
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
        ['날짜', '거래처', '카테고리', '금액', '상태', '비고'],
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
        { wch: 15 },  // 카테고리
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

// 엑셀 데이터 업로드
function uploadExcelData() {
    const targetUser = document.getElementById('targetUserSelect').value;
    
    if (!targetUser) {
        showMessage('대상 사용자를 선택해주세요.', 'error');
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
            const result = processExcelData(jsonData, targetUser);
            
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
function processExcelData(jsonData, targetUser) {
    const result = {
        total: 0,
        success: 0,
        errors: [],
        validTransactions: []
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
                throw new Error('카테고리가 없습니다');
            }
            if (isNaN(transaction.amount) || transaction.amount <= 0) {
                throw new Error('금액이 올바르지 않습니다');
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
    
    // localStorage에 데이터 저장
    if (result.validTransactions.length > 0) {
        saveTransactionsToStorage(targetUser, result.validTransactions);
    }
    
    return result;
}

// localStorage에 거래 데이터 저장
function saveTransactionsToStorage(userEmail, transactions) {
    const storageKey = `transactions_${userEmail}`;
    
    // 기존 데이터 가져오기
    let existingData = localStorage.getItem(storageKey);
    let allTransactions = existingData ? JSON.parse(existingData) : [];
    
    // 새 데이터 추가
    allTransactions = [...allTransactions, ...transactions];
    
    // 저장
    localStorage.setItem(storageKey, JSON.stringify(allTransactions));
}

// 업로드 결과 표시
function displayUploadResult(result) {
    const resultDiv = document.getElementById('uploadResult');
    
    document.getElementById('totalRows').textContent = result.total;
    document.getElementById('successRows').textContent = result.success;
    document.getElementById('errorRows').textContent = result.errors.length;
    
    const errorDetails = document.getElementById('errorDetails');
    if (result.errors.length > 0) {
        errorDetails.innerHTML = '<h5 style="margin-bottom: 12px;">오류 상세:</h5>' +
            result.errors.map(err => `
                <div class="error-item">
                    <strong>행 ${err.row}:</strong> ${err.message}
                </div>
            `).join('');
    } else {
        errorDetails.innerHTML = '';
    }
    
    resultDiv.style.display = 'block';
}

// 활동 로그 추가
const activityLogs = [];

function addActivityLog(message) {
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    activityLogs.unshift({
        time: timeStr,
        message: message,
        timestamp: now.getTime()
    });
    
    // 최대 10개까지만 유지
    if (activityLogs.length > 10) {
        activityLogs.pop();
    }
    
    updateActivityDisplay();
}

function updateActivityDisplay() {
    const activityList = document.querySelector('.admin-right-panel .activity-list');
    if (!activityList) return;
    
    activityList.innerHTML = activityLogs.slice(0, 5).map((log, index) => `
        <div class="activity-item">
            <div class="activity-content">
                <div class="activity-text">${log.message}</div>
                <div class="activity-time">${log.time}</div>
            </div>
        </div>
    `).join('');
}

function generateInitialLogs() {
    const now = new Date();
    addActivityLog('관리자 페이지 접속');
    
    // 시스템 로그 생성
    const logsContainer = document.getElementById('systemLogs');
    if (logsContainer) {
        const logs = [
            { time: '14:30', text: '관리자(admin@company.com)가 로그인했습니다' },
            { time: '14:25', text: '사용자 목록을 조회했습니다' },
            { time: '12:00', text: '자동 백업이 완료되었습니다' },
            { time: '10:15', text: '데이터 업로드가 완료되었습니다 (5건)' },
            { time: '09:00', text: '시스템 점검이 시작되었습니다' },
            { time: '08:45', text: 'demo1@company.com이 로그인했습니다' },
            { time: '08:30', text: 'demo2@company.com이 로그인했습니다' },
        ];
        
        logsContainer.innerHTML = logs.map(log => `
            <div class="log-item">
                <div class="log-time">${log.time}</div>
                <div class="log-text">${log.text}</div>
            </div>
        `).join('');
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
        
        // 폼 데이터 수집
        const formData = {
            date: document.getElementById('entryDate').value,
            client: document.getElementById('entryClient').value.trim(),
            category: document.getElementById('entryCategory').value,
            amount: parseInt(document.getElementById('entryAmount').value),
            status: document.getElementById('entryStatus').value,
            user: document.getElementById('entryUser').value,
            note: document.getElementById('entryNote').value.trim(),
            id: Date.now() // 고유 ID 생성
        };
        
        // 유효성 검사
        if (!formData.date || !formData.client || !formData.category || 
            !formData.amount || !formData.status || !formData.user) {
            alert('필수 항목을 모두 입력해주세요.');
            return;
        }
        
        if (formData.amount <= 0) {
            alert('금액은 0보다 커야 합니다.');
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
        const userName = DEMO_USERS.find(u => u.email === formData.user)?.company || formData.user;
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
    const storageKey = `transactions_${targetEmail}`;
    
    // 기존 데이터 가져오기
    let transactions = [];
    try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            transactions = JSON.parse(stored);
        }
    } catch (error) {
        console.error('데이터 로드 오류:', error);
    }
    
    // 새 거래 추가
    const newTransaction = {
        id: data.id,
        date: data.date,
        client: data.client,
        category: data.category,
        amount: data.amount,
        status: data.status,
        note: data.note || '',
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
    };
    
    transactions.push(newTransaction);
    
    // 저장
    try {
        localStorage.setItem(storageKey, JSON.stringify(transactions));
        console.log('매출 데이터 저장 완료:', newTransaction);
    } catch (error) {
        console.error('데이터 저장 오류:', error);
        alert('데이터 저장 중 오류가 발생했습니다.');
    }
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

// 사용자 및 회사 데이터 (실제로는 서버에서 관리)
let usersData = [
    {
        id: 1,
        name: '김철수',
        email: 'demo1@company.com',
        companies: ['테크노바 주식회사', '글로벌테크 주식회사'],
        joinDate: '2025.12.01',
        status: '활성'
    },
    {
        id: 2,
        name: '이영희',
        email: 'demo2@company.com',
        companies: ['미래산업 코퍼레이션'],
        joinDate: '2025.12.15',
        status: '활성'
    }
];

const availableCompanies = [
    { name: '테크노바 주식회사', number: '123-45-67890' },
    { name: '미래산업 코퍼레이션', number: '987-65-43210' },
    { name: '글로벌테크 주식회사', number: '345-67-89012' },
    { name: '혁신솔루션즈', number: '456-78-90123' },
    { name: '디지털플러스', number: '567-89-01234' }
];

// 현재 편집 중인 사용자
let currentEditingUser = null;

// 사용자 수정 모달 열기
function openEditUserModal(email, userId) {
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
    
    // 폼 데이터 수집
    const name = document.getElementById('editUserName').value.trim();
    const status = document.getElementById('editUserStatus').value;
    
    // 유효성 검사
    if (!name) {
        alert('이름을 입력해주세요.');
        return;
    }
    
    if (currentEditingUser.companies.length === 0) {
        alert('최소 1개 이상의 회사를 추가해주세요.');
        return;
    }
    
    // 데이터 업데이트
    const userIndex = usersData.findIndex(u => u.id === currentEditingUser.id);
    if (userIndex !== -1) {
        usersData[userIndex] = {
            ...usersData[userIndex],
            name: name,
            status: status,
            companies: [...currentEditingUser.companies]
        };
        
        // 테이블 및 드롭다운 업데이트
        updateUsersTable();
        updateUserSelects();
        updateCompaniesTable();
        updateStats();
        
        // 성공 메시지
        showMessage(`${name} 사용자 정보가 업데이트되었습니다.`, 'success');
        
        addActivityLog(`${name} 사용자 정보를 수정했습니다`);
        
        // 모달 닫기
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
                    <button class="btn-small btn-edit">수정</button>
                    <button class="btn-small btn-view">상세</button>
                </td>
            </tr>
        `;
    }).join('');
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
                    <button class="btn-small btn-edit" onclick="openEditUserModal('${user.email}', ${user.id})">수정</button>
                    <button class="btn-small btn-delete">삭제</button>
                </td>
            </tr>
        `;
    }).join('');
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

// 사용자 선택 드롭다운 업데이트
function updateUserSelects() {
    const entryUserSelect = document.getElementById('entryUser');
    const targetUserSelect = document.getElementById('targetUserSelect');
    
    const options = usersData.map(user => {
        const companyText = user.companies.length > 0 ? user.companies[0] : '회사 없음';
        return `<option value="${user.email}">${user.name} - ${companyText} (${user.email})</option>`;
    }).join('');
    
    if (entryUserSelect) {
        entryUserSelect.innerHTML = '<option value="">선택하세요</option>' + options;
    }
    
    if (targetUserSelect) {
        targetUserSelect.innerHTML = '<option value="">사용자를 선택하세요</option>' + options;
    }
}
