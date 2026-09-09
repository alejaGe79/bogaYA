// ============================================================
// AUTH - LOGIN, REGISTRO, LOGOUT
// ============================================================

async function checkAuth() {
    const token = localStorage.getItem('bogaya_token');
    if (!token) {
        showLoginModal();
        return false;
    }
    const userId = localStorage.getItem('bogaya_user_id');
    const role = localStorage.getItem('bogaya_role');
    const name = localStorage.getItem('bogaya_name') || 'Usuario';
    document.getElementById('user-name').textContent = '👋 ' + name;
    document.getElementById('logout-btn').style.display = 'inline-block';
    return true;
}

function showLoginModal() {
    if (document.getElementById('loginModal')) return;
    const html = `
        <div class="modal" id="loginModal">
            <div class="modal-content">
                <h2>Iniciar sesión</h2>
                <input type="email" id="login-email" placeholder="Email">
                <input type="password" id="login-password" placeholder="Contraseña">
                <button class="btn-primary" onclick="doLogin()">Ingresar</button>
                <hr>
                <h3>Registrarse</h3>
                <input type="text" id="reg-name" placeholder="Nombre completo">
                <input type="email" id="reg-email" placeholder="Email">
                <input type="password" id="reg-password" placeholder="Contraseña">
                <select id="reg-role">
                    <option value="client">Cliente</option>
                    <option value="lawyer">Abogado</option>
                </select>
                <button class="btn-primary" onclick="doRegister()">Registrarse</button>
                <button class="btn-secondary" onclick="closeModal('loginModal')">Cerrar</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

async function loginUser(email, password) {
    const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    if (data.success && data.data.token) {
        localStorage.setItem('bogaya_token', data.data.token);
        localStorage.setItem('bogaya_user_id', data.data.user_id);
        localStorage.setItem('bogaya_role', data.data.role);
        localStorage.setItem('bogaya_name', data.data.name || 'Usuario');
    }
    return data;
}

async function doLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await loginUser(email, password);
        closeModal('loginModal');
        location.reload();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function doRegister() {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;
    const phone = document.getElementById('reg-phone')?.value || '';

    // Especialidades (si es abogado)
    let especialidades = [];
    if (role === 'lawyer') {
        const espInput = document.getElementById('reg-especialidades');
        if (espInput) {
            especialidades = espInput.value.split(',').map(s => s.trim()).filter(s => s);
        }
    }

    if (!name || !email || !password) {
        alert('Completa todos los campos');
        return;
    }
    try {
        await registerUser(email, password, name, role, phone, especialidades);
        alert('✅ Registro exitoso. Revisa tu email para verificar tu cuenta.');
        // Cerrar modal y mostrar mensaje de verificación
        closeModal('loginModal');
        showVerificationMessage(email);
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

function showVerificationMessage(email) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'verifyModal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-envelope"></i> Verifica tu email</h2>
            <p>Te enviamos un email a <strong>${email}</strong> con un enlace para activar tu cuenta.</p>
            <p>Si no lo recibiste, podés <button class="btn-link" onclick="resendVerification('${email}')">reenviarlo</button>.</p>
            <button class="btn-primary" onclick="closeModal('verifyModal')">Entendido</button>
        </div>
    `;
    document.body.appendChild(modal);
}

async function resendVerification(email) {
    try {
        await resendVerification(email);
        alert('✅ Nuevo email enviado. Revisa tu bandeja de entrada.');
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// Logout
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('bogaya_token');
        localStorage.removeItem('bogaya_user_id');
        localStorage.removeItem('bogaya_role');
        localStorage.removeItem('bogaya_name');
        location.reload();
    });
});

// Push token (evitar bucle infinito)
let pushRegistered = false;
async function registerPushToken() {
    if (pushRegistered) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (Notification.permission !== 'granted') {
        await Notification.requestPermission();
    }
    if (Notification.permission !== 'granted') return;
    const token = 'dummy_token_' + Date.now();
    try {
        await registerPushTokenApi(token, 'web');
        pushRegistered = true;
        console.log('Push token registrado');
    } catch (e) {
        console.log('Error registrando push:', e);
    }
}