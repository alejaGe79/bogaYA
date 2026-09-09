const API_BASE = '/bogaya/api';

async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('bogaya_token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    try {
        const res = await fetch(API_BASE + endpoint, {
            ...options,
            headers
        });

        // Verificar si la respuesta es JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            // Si es HTML, mostrar un error claro
            if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
                throw new Error('El servidor devolvió HTML en lugar de JSON. Verifica que la URL de la API sea correcta.');
            }
            throw new Error('Respuesta inesperada del servidor: ' + text.substring(0, 100));
        }

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Error en la petición (código ' + res.status + ')');
        }
        return data;
    } catch (e) {
        // Si es un error de red, lanzar un mensaje más claro
        if (e.name === 'TypeError' && e.message.includes('fetch')) {
            throw new Error('No se pudo conectar con el servidor. Verifica que el servidor esté corriendo.');
        }
        throw e;
    }
}

// ========== AUTH ==========
async function registerUser(email, password, name, role, phone = '') {
    return apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role, phone })
    });
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

// ========== CASOS (cliente) ==========
async function getMyCases() {
    return apiFetch('/cases');
}

async function getCase(id) {
    return apiFetch('/cases/' + id);
}

async function closeCaseApi(id) {
    return apiFetch('/cases/' + id + '/close', {
        method: 'PUT'
    });
}

// ========== CASOS (abogado) ==========
async function getLawyerCases(tipo) {
    // tipo: 'aceptados', 'ofrecidos', 'cerrados'
    return apiFetch('/proposals/lawyer?type=' + tipo);
}

async function getAvailableCases() {
    return apiFetch('/cases?estado=abierto');
}

// ========== ABOGADOS ==========
async function getLawyers(filters = '') {
    return apiFetch('/lawyers?' + filters);
}

// ========== CASOS ==========
async function createCase(titulo, descripcion, area_legal, provincia, vigencia_dias = 30) {
    return apiFetch('/cases', {
        method: 'POST',
        body: JSON.stringify({ titulo, descripcion, area_legal, provincia, vigencia_dias })
    });
}

async function getMyCases() {
    return apiFetch('/cases');
}

async function getCase(id) {
    return apiFetch('/cases/' + id);
}

async function closeCase(id) {
    return apiFetch('/cases/' + id + '/close', {
        method: 'PUT'
    });
}

async function getAvailableCases() {
    return apiFetch('/cases?estado=abierto');
}

// ========== PROPUESTAS ==========
async function createProposal(case_id, presupuesto, mensaje) {
    return apiFetch('/proposals', {
        method: 'POST',
        body: JSON.stringify({ case_id, presupuesto, mensaje })
    });
}

async function getProposalsByCase(caseId) {
    return apiFetch('/proposals/case/' + caseId);
}

async function getMyProposals() {
    return apiFetch('/proposals/lawyer');
}

async function updateProposalStatus(id, status) {
    return apiFetch('/proposals/' + id + '/status', {
        method: 'PUT',
        body: JSON.stringify({ status })
    });
}

// ========== RESEÑAS ==========
async function createReview(lawyer_id, case_id, rating, comment, resumen) {
    return apiFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify({ lawyer_id, case_id, rating, comment, resumen })
    });
}

async function getRatingStats(lawyer_id) {
    return apiFetch('/reviews/stats/' + lawyer_id);
}


// ========== MENSAJES ==========
async function sendMessageApi(receiver_id, message, case_id = null) {
    return apiFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({ receiver_id, message, case_id })
    });
}

async function getConversation(userId) {
    return apiFetch('/messages/' + userId);
}

// ========== TURNOS ==========
async function createAppointment(lawyer_id, fecha_hora, modalidad = 'virtual', case_id = null, notas_cliente = '') {
    return apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({ lawyer_id, fecha_hora, modalidad, case_id, notas_cliente })
    });
}

async function getLawyerAppointments() {
    return apiFetch('/appointments/lawyer');
}

async function getClientAppointments() {
    return apiFetch('/appointments/client');
}

async function updateAppointmentStatus(id, status) {
    return apiFetch('/appointments/' + id + '/status', {
        method: 'PUT',
        body: JSON.stringify({ status })
    });
}

// ========== MENSAJES ==========

async function getConversation(userId) {
    return apiFetch('/messages/' + userId);
}

// ========== PERFIL ==========
async function updateLawyerProfile(data) {
    return apiFetch('/lawyers/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

// ========== PAGOS ==========
async function createPaymentPreference(plan) {
    return apiFetch('/payments/create-preference', {
        method: 'POST',
        body: JSON.stringify({ plan })
    });
}

// ========== PUSH ==========
async function registerPushToken(token, device = 'web') {
    return apiFetch('/auth/push-token', {
        method: 'POST',
        body: JSON.stringify({ token, device })
    });
}

// ========== CASOS (crear con vigencia) ==========
async function createCase(titulo, descripcion, area_legal, provincia, vigencia_dias = 30) {
    return apiFetch('/cases', {
        method: 'POST',
        body: JSON.stringify({ titulo, descripcion, area_legal, provincia, vigencia_dias })
    });
}

// ========== PUSH TOKEN ==========
async function registerPushTokenApi(token, device = 'web') {
    return apiFetch('/auth/push-token', {
        method: 'POST',
        body: JSON.stringify({ token, device })
    });
}

// ========== ADMIN ==========
async function adminGetLawyers() {
    return apiFetch('/admin/lawyers');
}
async function adminVerifyLawyer(userId) {
    return apiFetch('/admin/lawyers/' + userId + '/verify', { method: 'PUT' });
}
async function adminGetUsers() {
    return apiFetch('/admin/users');
}
async function adminGetReviews() {
    return apiFetch('/admin/reviews');
}
async function adminDeleteReview(id) {
    return apiFetch('/admin/reviews/' + id, { method: 'DELETE' });
}

// ========== PERFIL ==========
async function updateUserProfile(data) {
    return apiFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

// ========== ADMIN ==========
async function getUsers() {
    return apiFetch('/admin/users');
}

async function updateLawyerVerification(userId, verified) {
    return apiFetch('/admin/verify', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, verified })
    });
}

async function updateUserRole(userId, role) {
    return apiFetch('/admin/role', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, role })
    });
}

// ========== CASOS (abogado) ==========
async function getLawyerAcceptedCases() {
    return apiFetch('/cases/lawyer/aceptados');
}

async function getLawyerOfferedCases() {
    return apiFetch('/cases/lawyer/ofrecidos');
}

async function getLawyerClosedCases() {
    return apiFetch('/cases/lawyer/cerrados');
}

async function getAvailableCases() {
    return apiFetch('/cases?estado=abierto');
}

// ========== RESEÑAS ==========
async function getLawyerReviews(lawyerId) {
    return apiFetch('/reviews/lawyer/' + lawyerId);
}

// ========== CIERRE DE CASO ==========
async function closeCaseApi(caseId) {
    return apiFetch('/cases/' + caseId + '/close', {
        method: 'PUT'
    });
}

// ========== OBTENER ABOGADO ==========
async function getLawyer(id) {
    return apiFetch('/lawyers/' + id);
}

// ========== ADMIN ==========
async function getAllCases() {
    return apiFetch('/admin/cases');
}

async function getAllReviews() {
    return apiFetch('/admin/reviews');
}

async function getStats() {
    return apiFetch('/admin/stats');
}

async function deleteUserApi(userId) {
    return apiFetch('/admin/users/' + userId, { method: 'DELETE' });
}

async function deleteCaseApi(caseId) {
    return apiFetch('/admin/cases/' + caseId, { method: 'DELETE' });
}

async function deleteReviewApi(reviewId) {
    return apiFetch('/admin/reviews/' + reviewId, { method: 'DELETE' });
}

// ========== PERFIL ==========
async function updateUserProfile(data) {
    return apiFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

// ========== AGENDA ==========
async function rescheduleAppointment(id, fecha_hora, motivo) {
    return apiFetch('/appointments/' + id + '/reschedule', {
        method: 'PUT',
        body: JSON.stringify({ fecha_hora, motivo })
    });
}

// ========== VERIFICACIÓN ==========
async function verifyEmail(token) {
    return apiFetch('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token })
    });
}

async function resendVerification(email) {
    return apiFetch('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email })
    });
}

// ========== REGISTRO CON ESPECIALIDADES MÚLTIPLES ==========
async function registerUser(email, password, name, role, phone = '', especialidades = []) {
    return apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role, phone, especialidades })
    });
}

// ========== ACTUALIZAR PERFIL CON FOTO (multipart/form-data) ==========
async function updateLawyerProfileFormData(formData) {
    const token = localStorage.getItem('bogaya_token');
    const res = await fetch(API_BASE + '/lawyers/profile', {
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer ' + token
            // NO pongas Content-Type, el navegador lo pone automáticamente con boundary
        },
        body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error en la petición');
    return data;
}

// ========== ADMIN ==========
async function getPendingVerifications() {
    return apiFetch('/admin/pending-verifications');
}

async function verifyEmailAdmin(userId) {
    return apiFetch('/admin/verify-email', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId })
    });
}