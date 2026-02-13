// 로그인 기능

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const demoBtns = document.querySelectorAll('.btn-demo');
    
    // 이미 로그인된 경우 권한에 따라 리다이렉트
    if (Storage.isLoggedIn()) {
        const user = Storage.getUser();
        window.location.href = isAdminUser(user.email) ? 'admin.html' : 'dashboard.html';
        return;
    }
    
    // 로그인 폼 제출 (Supabase Auth 우선 시도 후 데모 계정 폴백)
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;
        
        // 1) Supabase 연동 시 Supabase Auth 먼저 시도
        if (typeof supabase !== 'undefined' && supabase && supabase.auth) {
            try {
                var res = await supabase.auth.signInWithPassword({ email: email, password: password });
                if (res.data && res.data.user) {
                    var u = res.data.user;
                    var meta = u.user_metadata || {};
                    Storage.setUser({
                        email: u.email,
                        companyName: meta.company_name || meta.companyName || '',
                        fullName: meta.full_name || meta.fullName || u.email,
                        remember: remember
                    });
                    showMessage('로그인 성공!', 'success');
                    var isAdmin = meta.is_admin === true || meta.isAdmin === true;
                    setTimeout(function() {
                        window.location.href = isAdmin ? 'admin.html' : 'dashboard.html';
                    }, 500);
                    return;
                }
                if (res.error) {
                    // Supabase에서 실패 시 아래 데모 계정으로 폴백
                }
            } catch (err) {
                console.warn('Supabase 로그인 시도 실패:', err);
            }
        }
        
        // 2) 데모 계정 확인 (로컬 DEMO_USERS)
        if (typeof DEMO_USERS !== 'undefined' && DEMO_USERS[email]) {
            var user = DEMO_USERS[email];
            if (user.password === password) {
                Storage.setUser({
                    email: email,
                    companyName: user.companyName || '',
                    fullName: user.fullName || email,
                    remember: remember
                });
                showMessage('로그인 성공!', 'success');
                setTimeout(function() {
                    window.location.href = (typeof isAdminUser === 'function' && isAdminUser(email)) ? 'admin.html' : 'dashboard.html';
                }, 500);
                return;
            }
            showMessage('비밀번호가 올바르지 않습니다.', 'error');
            return;
        }
        showMessage('등록되지 않은 이메일이거나 비밀번호가 올바르지 않습니다.', 'error');
    });
    
    // 데모 계정 버튼 클릭
    demoBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const email = btn.dataset.email;
            const password = btn.dataset.password;
            
            document.getElementById('email').value = email;
            document.getElementById('password').value = password;
            
            // 자동으로 로그인 폼 제출
            loginForm.dispatchEvent(new Event('submit'));
        });
    });
});

// 메시지 표시 함수
function showMessage(message, type = 'info') {
    // 기존 메시지 제거
    const existingMsg = document.querySelector('.message-box');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    const messageBox = document.createElement('div');
    messageBox.className = `message-box message-${type}`;
    messageBox.textContent = message;
    
    // 스타일 추가
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
    
    // 3초 후 자동 제거
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
