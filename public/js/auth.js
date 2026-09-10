// ============================================================
// BOGAYA - AUTENTICACIÓN
// ============================================================

async function checkAuth() {
    const token = localStorage.getItem('bogaya_token');
    const userName = localStorage.getItem('bogaya_name');

    if (!token) {
        showLoginModal();
        return false;
    }

    document.getElementById('user-name').textContent = '👋 ' + (userName || 'Usuario');
    document.getElementById('logout-btn').style.display = 'inline-block';

    // Iniciar notificaciones solo después de que todo esté cargado
    setTimeout(() => {
        if (typeof startNotificationPolling === 'function') {
            startNotificationPolling();
        }
    }, 1000);

    return true;
}

window.showLoginModal = function () {
    if (document.getElementById('loginModal')) return;

    const html = `
        <div class="modal" id="loginModal">
            <div class="modal-content">
                <h2><i class="fas fa-sign-in-alt"></i> Iniciar sesión</h2>
                <input type="email" id="login-email" placeholder="Email">
                <input type="password" id="login-password" placeholder="Contraseña">
                <div style="display:flex; align-items:center; gap:8px; margin:8px 0;">
                    <input type="checkbox" id="login-remember">
                    <label for="login-remember" style="font-size:13px; color:#64748b; margin:0;">Recordarme</label>
                </div>
                <button class="btn-primary btn-block" onclick="window.doLogin()">Ingresar</button>
                <hr style="margin:12px 0;">
                <h3><i class="fas fa-user-plus"></i> Registrarse</h3>
                <input type="text" id="reg-name" placeholder="Nombre completo">
                <input type="email" id="reg-email" placeholder="Email">
                <input type="password" id="reg-password" placeholder="Contraseña">
                <input type="text" id="reg-phone" placeholder="Teléfono (opcional)">
                <select id="reg-role" onchange="window.toggleSpecialties(this.value)">
                    <option value="client">Cliente</option>
                    <option value="lawyer">Abogado</option>
                </select>
                <div id="reg-specialties-container" style="display:none; margin-top:8px;">
                    
                    <label style="font-size:13px; color:#64748b;">Especialidades</label>
                    <select
                        name="especialidades[]"
                        multiple
                        size="7"
                        id="reg-especialidades"
                    >
                        <option value="Laboral">Laboral</option>
                        <option value="Civil">Civil</option>
                        <option value="Penal">Penal</option>
                        <option value="Familia">Familia</option>
                        <option value="Comercial">Comercial</option>
                        <option value="Administrativo">Administrativo</option>
                        <option value="Inmobiliario">Inmobiliario</option>
                        <option value="Tributario">Tributario</option>
                        <option value="Ambiental">Ambiental</option>
                        <option value="Sucesiones">Sucesiones</option>
                    </select>
                    <small>
                        Mantené presionado Ctrl o seleccioná
                        varias opciones en el celular.
                    </small>
                </div>
                <button class="btn-primary btn-block" onclick="window.doRegister()" style="margin-top:8px;">Registrarse</button>
                <button class="btn-secondary btn-block" onclick="window.closeModal('loginModal')" style="margin-top:8px;">Cerrar</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
};

window.toggleSpecialties = function (role) {
    const container = document.getElementById('reg-specialties-container');
    if (role === 'lawyer') {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
};

window.doLogin = async function () {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const remember = document.getElementById('login-remember').checked;

    try {
        await window.loginUser(email, password, remember);
        window.closeModal('loginModal');
        location.reload();
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

window.doRegister = async function () {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;
    const phone = document.getElementById('reg-phone').value || '';
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
        await window.registerUser(email, password, name, role, phone, especialidades);
        alert('✅ Registro exitoso. Revisa tu email para verificar tu cuenta.');
        window.closeModal('loginModal');
        window.showVerificationMessage(email);
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

window.showVerificationMessage = function (email) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'verifyModal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-envelope"></i> Verifica tu email</h2>
            <p>Te enviamos un email a <strong>${email}</strong> con un enlace para activar tu cuenta.</p>
            <p>Si no lo recibiste, podés <button class="btn-link" onclick="window.resendVerification('${email}')">reenviarlo</button>.</p>
            <button class="btn-primary" onclick="window.closeModal('verifyModal')">Entendido</button>
        </div>
    `;
    document.body.appendChild(modal);
};

window.logoutUser = function () {
    localStorage.removeItem('bogaya_token');
    localStorage.removeItem('bogaya_user_id');
    localStorage.removeItem('bogaya_role');
    localStorage.removeItem('bogaya_name');
    localStorage.removeItem('bogaya_remember');
    if (window.stopNotificationPolling) {
        window.stopNotificationPolling();
    }
    location.reload();
};

window.closeModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.remove();
};

window.isLoggedIn = function () {
    return !!localStorage.getItem('bogaya_token');
};

window.getRole = function () {
    return localStorage.getItem('bogaya_role') || 'client';
};

// Evento logout
document.addEventListener('DOMContentLoaded', function () {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', window.logoutUser);
    }
});