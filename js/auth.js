// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');
const loginBtn = document.querySelector('.login-btn');

// 페이지 로드 시 로그인 상태 확인
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        // 이미 로그인된 경우 대시보드로 이동
        window.location.href = 'dashboard.html';
    }
});

// 로그인 폼 제출 처리
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // 버튼 비활성화 및 로딩 상태
    loginBtn.disabled = true;
    loginBtn.textContent = '로그인 중...';
    hideError();
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            throw error;
        }
        
        // 로그인 성공 - 대시보드로 이동
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Login error:', error);
        showError(getErrorMessage(error));
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = '로그인';
    }
});

// 에러 메시지 표시
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

// 에러 메시지 숨기기
function hideError() {
    errorMessage.classList.remove('show');
}

// 에러 메시지 한글화
function getErrorMessage(error) {
    const errorMessages = {
        'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
        'Email not confirmed': '이메일 인증이 필요합니다. 이메일을 확인해주세요.',
        'Too many requests': '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
        'User not found': '등록되지 않은 사용자입니다.',
        'Invalid email': '올바른 이메일 형식이 아닙니다.'
    };
    
    return errorMessages[error.message] || '로그인 중 오류가 발생했습니다. 다시 시도해주세요.';
}
