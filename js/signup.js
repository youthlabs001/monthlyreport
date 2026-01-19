// DOM Elements
const signupForm = document.getElementById('signupForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const companyNameInput = document.getElementById('companyName');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const signupBtn = document.querySelector('.login-btn');

// 회원가입 폼 제출 처리
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const companyName = companyNameInput.value.trim();
    
    // 비밀번호 확인
    if (password !== confirmPassword) {
        showError('비밀번호가 일치하지 않습니다.');
        return;
    }
    
    // 버튼 비활성화 및 로딩 상태
    signupBtn.disabled = true;
    signupBtn.textContent = '가입 중...';
    hideError();
    hideSuccess();
    
    try {
        // Supabase Auth로 회원가입
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    company_name: companyName
                }
            }
        });
        
        if (error) {
            throw error;
        }
        
        // 회원가입 성공
        showSuccess('회원가입이 완료되었습니다! 이메일을 확인해주세요.');
        signupForm.reset();
        
        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        
    } catch (error) {
        console.error('Signup error:', error);
        showError(getErrorMessage(error));
    } finally {
        signupBtn.disabled = false;
        signupBtn.textContent = '회원가입';
    }
});

// 에러 메시지 표시
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    successMessage.classList.remove('show');
}

// 에러 메시지 숨기기
function hideError() {
    errorMessage.classList.remove('show');
}

// 성공 메시지 표시
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.add('show');
    errorMessage.classList.remove('show');
}

// 성공 메시지 숨기기
function hideSuccess() {
    successMessage.classList.remove('show');
}

// 에러 메시지 한글화
function getErrorMessage(error) {
    const errorMessages = {
        'User already registered': '이미 등록된 이메일입니다.',
        'Password should be at least 6 characters': '비밀번호는 최소 6자 이상이어야 합니다.',
        'Invalid email': '올바른 이메일 형식이 아닙니다.',
        'Signup requires a valid password': '유효한 비밀번호를 입력해주세요.'
    };
    
    return errorMessages[error.message] || '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.';
}
