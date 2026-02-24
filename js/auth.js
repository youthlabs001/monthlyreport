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
        
        console.log('[로그인] 시도:', email);
        
        // 1) Supabase DB 사용자 테이블에서 먼저 확인 (다른 PC에서도 접속 가능)
        if (typeof supabase !== 'undefined' && supabase) {
            console.log('[로그인] Supabase app_users 테이블 조회 중...');
            
            supabase.from('app_users')
                .select('*')
                .eq('email', email)
                .maybeSingle()
                .then(function(result) {
                    console.log('[로그인] Supabase 조회 결과:', result);
                    
                    if (result.error) {
                        console.error('[로그인] Supabase 조회 에러:', result.error);
                    }
                    
                    if (result.data) {
                        console.log('[로그인] 사용자 발견:', result.data.email);
                        console.log('[로그인] DB 비밀번호:', result.data.password_hash);
                        console.log('[로그인] 입력 비밀번호:', password);
                        
                        if (result.data.password_hash === password) {
                            console.log('[로그인] 비밀번호 일치 - 로그인 성공!');
                            
                            // Supabase에서 찾은 사용자 정보를 localStorage에 저장
                            var companies = result.data.companies || [];
                            var companyName = companies.length > 0 ? companies[0] : '';
                            
                            // DEMO_USERS에 추가 (다음 로그인부터 빠르게)
                            if (typeof DEMO_USERS !== 'undefined') {
                                DEMO_USERS[email] = {
                                    password: password,
                                    fullName: result.data.name,
                                    isAdmin: false,
                                    companyName: companyName,
                                    companies: companies,
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
                                
                                // localStorage에도 저장
                                try {
                                    var additions = JSON.parse(localStorage.getItem('demo_users_additions') || '{}');
                                    additions[email] = DEMO_USERS[email];
                                    localStorage.setItem('demo_users_additions', JSON.stringify(additions));
                                } catch (e) {}
                            }
                            
                            Storage.setUser({
                                email: email,
                                companyName: companyName,
                                fullName: result.data.name,
                                remember: remember
                            });
                            showMessage('로그인 성공!', 'success');
                            setTimeout(function() {
                                window.location.href = 'dashboard.html';
                            }, 500);
                            return;
                        } else {
                            console.warn('[로그인] 비밀번호 불일치');
                        }
                    } else {
                        console.log('[로그인] Supabase에 사용자 없음, 로컬 확인...');
                    }
                    
                    // Supabase DB에 없으면 로컬 DEMO_USERS 확인
                    if (typeof DEMO_USERS !== 'undefined' && DEMO_USERS[email]) {
                        console.log('[로그인] 로컬 DEMO_USERS에서 사용자 발견');
                        var user = DEMO_USERS[email];
                        if (user.password === password) {
                            console.log('[로그인] 로컬 로그인 성공!');
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
                        } else {
                            console.warn('[로그인] 로컬 비밀번호 불일치');
                        }
                    }
                    
                    showMessage('등록되지 않은 이메일이거나 비밀번호가 올바르지 않습니다.', 'error');
                })
                .catch(function(err) {
                    console.error('[로그인] Supabase 사용자 조회 실패:', err);
                    // Supabase 오류 시 로컬 DEMO_USERS로 폴백
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
                    }
                    showMessage('로그인 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
                });
            return;
        }
        
        // 2) Supabase가 없으면 로컬 DEMO_USERS만 확인
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
