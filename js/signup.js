// 회원가입 기능

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const businessNumberInput = document.getElementById('businessNumber');
    const phoneInput = document.getElementById('phone');
    
    // 이미 로그인된 경우 대시보드로 리다이렉트
    if (Storage.isLoggedIn()) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // 사업자등록번호 포맷팅
    businessNumberInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        
        if (value.length > 3 && value.length <= 5) {
            value = value.slice(0, 3) + '-' + value.slice(3);
        } else if (value.length > 5) {
            value = value.slice(0, 3) + '-' + value.slice(3, 5) + '-' + value.slice(5, 10);
        }
        
        e.target.value = value;
    });
    
    // 전화번호 포맷팅
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        
        if (value.length > 3 && value.length <= 7) {
            value = value.slice(0, 3) + '-' + value.slice(3);
        } else if (value.length > 7) {
            value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
        }
        
        e.target.value = value;
    });
    
    // 회원가입 폼 제출
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = {
            companyName: document.getElementById('companyName').value,
            businessNumber: document.getElementById('businessNumber').value,
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value,
            agree: document.getElementById('agree').checked
        };
        
        // 유효성 검사
        if (!validateForm(formData)) {
            return;
        }
        
        // 비밀번호 확인
        if (formData.password !== formData.confirmPassword) {
            showMessage('비밀번호가 일치하지 않습니다.', 'error');
            return;
        }
        
        // 비밀번호 강도 검사
        if (formData.password.length < 8) {
            showMessage('비밀번호는 8자 이상이어야 합니다.', 'error');
            return;
        }
        
        // 이메일 중복 확인 (데모용)
        if (DEMO_USERS[formData.email]) {
            showMessage('이미 등록된 이메일입니다.', 'error');
            return;
        }
        
        // 동의 확인
        if (!formData.agree) {
            showMessage('이용약관에 동의해주세요.', 'error');
            return;
        }
        
        // 회원가입 성공 (실제로는 서버에 저장)
        showMessage('회원가입이 완료되었습니다!', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    });
});

// 폼 유효성 검사
function validateForm(data) {
    if (!data.companyName || data.companyName.trim().length < 2) {
        showMessage('회사명을 올바르게 입력해주세요.', 'error');
        return false;
    }
    
    // 사업자등록번호 검사 (000-00-00000 형식)
    const businessNumberPattern = /^\d{3}-\d{2}-\d{5}$/;
    if (!businessNumberPattern.test(data.businessNumber)) {
        showMessage('사업자등록번호를 올바르게 입력해주세요.', 'error');
        return false;
    }
    
    if (!data.fullName || data.fullName.trim().length < 2) {
        showMessage('이름을 올바르게 입력해주세요.', 'error');
        return false;
    }
    
    // 이메일 검사
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(data.email)) {
        showMessage('이메일 형식이 올바르지 않습니다.', 'error');
        return false;
    }
    
    // 전화번호 검사 (010-0000-0000 형식)
    const phonePattern = /^\d{3}-\d{4}-\d{4}$/;
    if (!phonePattern.test(data.phone)) {
        showMessage('전화번호를 올바르게 입력해주세요.', 'error');
        return false;
    }
    
    return true;
}

// 메시지 표시 함수 (auth.js와 동일)
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
`;
document.head.appendChild(style);
