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

        const contentType = res.headers.get('content-type');

        if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();

            if (
                text.includes('<!DOCTYPE') ||
                text.includes('<html')
            ) {
                throw new Error(
                    'El servidor devolvió HTML. Verifica que el controlador exista y la ruta sea correcta.'
                );
            }

            throw new Error(
                'Respuesta no JSON: ' +
                text.substring(0, 100)
            );
        }

        const data = await res.json();

        if (!res.ok) {
            throw new Error(
                data.error ||
                data.message ||
                'Error en la petición'
            );
        }

        return data;

    } catch (e) {
        if (e.message === 'Failed to fetch') {
            throw new Error(
                'Error de conexión. Verifica que el servidor esté funcionando.'
            );
        }

        throw e;
    }
}


// ============================================================
// AUTENTICACIÓN
// ============================================================

async function registerUser(
    email,
    password,
    name,
    role,
    phone = '',
    especialidades = [],
    avatar = 'avatar_01'
) {
    return apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            email,
            password,
            name,
            role,
            phone,
            especialidades,
            avatar
        })
    });
}


async function loginUser(
    email,
    password,
    remember = false
) {
    const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            email,
            password,
            remember
        })
    });

    if (
        data.success &&
        data.data &&
        data.data.token
    ) {
        localStorage.setItem(
            'bogaya_token',
            data.data.token
        );

        localStorage.setItem(
            'bogaya_user_id',
            data.data.user_id
        );

        localStorage.setItem(
            'bogaya_role',
            data.data.role
        );

        localStorage.setItem(
            'bogaya_name',
            data.data.name || 'Usuario'
        );

        if (remember) {
            localStorage.setItem(
                'bogaya_remember',
                'true'
            );
        }
    }

    return data;
}


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


async function registerPushToken(
    token,
    device = 'web'
) {
    return apiFetch('/auth/push-token', {
        method: 'POST',
        body: JSON.stringify({
            token,
            device
        })
    });
}


// ============================================================
// ABOGADOS
// ============================================================

async function getLawyers(params = '') {
    return apiFetch('/lawyers?' + params);
}


async function getLawyer(id) {
    return apiFetch('/lawyers/' + id);
}


/**
 * Actualizar perfil de abogado.
 *
 * Se utiliza fetch directamente porque estamos enviando
 * multipart/form-data mediante FormData.
 *
 * NO establecer Content-Type manualmente:
 * el navegador agrega automáticamente el boundary.
 */
async function updateLawyerProfileFormData(formData) {
    const token = localStorage.getItem(
        'bogaya_token'
    );

    const headers = {};

    if (token) {
        headers['Authorization'] =
            'Bearer ' + token;
    }

    try {
        const res = await fetch(
            API_BASE + '/lawyers/profile',
            {
                method: 'POST',
                headers,
                body: formData
            }
        );

        const contentType =
            res.headers.get('content-type');

        if (
            !contentType ||
            !contentType.includes('application/json')
        ) {
            const text = await res.text();

            throw new Error(
                text
                    ? 'Respuesta inesperada del servidor: ' +
                    text.substring(0, 200)
                    : 'El servidor no devolvió una respuesta válida.'
            );
        }

        const data = await res.json();

        if (!res.ok) {
            throw new Error(
                data.error ||
                data.message ||
                'Error al actualizar el perfil'
            );
        }

        return data;

    } catch (e) {
        if (e.message === 'Failed to fetch') {
            throw new Error(
                'Error de conexión. Verifica que el servidor esté funcionando.'
            );
        }

        throw e;
    }
}


// ============================================================
// PERFIL USUARIO
// ============================================================

async function getUserProfile() {
    return apiFetch('/users/profile');
}

async function updateUserProfile(data) {
    return apiFetch('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}


// ============================================================
// CASOS
// ============================================================

async function createCase(
    titulo,
    descripcion,
    area_legal,
    provincia,
    vigencia_dias = 30
) {
    return apiFetch('/cases', {
        method: 'POST',
        body: JSON.stringify({
            titulo,
            descripcion,
            area_legal,
            provincia,
            vigencia_dias
        })
    });
}


async function getMyCases() {
    return apiFetch('/cases');
}


async function getCase(id) {
    return apiFetch('/cases/' + id);
}

async function getConversation(userId) {
    const response = await apiFetch(
        '/messages/' + userId
    );

    // El backend devuelve:
    // {
    //   success: true,
    //   data: {
    //      user: {...},
    //      messages: [...]
    //   }
    // }
    //
    // Normalizamos la respuesta para que app.js
    // pueda trabajar con response.user y response.messages.

    if (
        response &&
        response.success &&
        response.data &&
        !Array.isArray(response.data)
    ) {
        return {
            ...response,
            user: response.data.user || {},
            messages: Array.isArray(
                response.data.messages
            )
                ? response.data.messages
                : []
        };
    }

    // Compatibilidad por si en algún momento
    // otro endpoint devuelve directamente un array.
    return {
        ...response,
        user: response.user || {},
        messages: Array.isArray(response.messages)
            ? response.messages
            : Array.isArray(response.data)
                ? response.data
                : []
    };
}


async function closeCaseApi(id) {
    return apiFetch(
        '/cases/' + id + '/close',
        {
            method: 'PUT'
        }
    );
}


async function getLawyerAcceptedCases() {
    return apiFetch(
        '/cases/lawyer/aceptados'
    );
}


async function getLawyerOfferedCases() {
    return apiFetch(
        '/cases/lawyer/ofrecidos'
    );
}


async function getLawyerClosedCases() {
    return apiFetch(
        '/cases/lawyer/cerrados'
    );
}


async function getAvailableCases() {
    return apiFetch(
        '/cases?estado=abierto'
    );
}


// ============================================================
// TURNOS
// ============================================================

async function createAppointment(
    lawyer_id,
    fecha_hora,
    modalidad = 'virtual',
    case_id = null,
    notas_cliente = '',
    direccion = ''
) {
    return apiFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify({
            lawyer_id,
            fecha_hora,
            modalidad,
            case_id,
            notas_cliente,
            direccion
        })
    });
}


async function getLawyerAppointments() {
    return apiFetch(
        '/appointments/lawyer'
    );
}


async function getClientAppointments() {
    return apiFetch(
        '/appointments/client'
    );
}


async function updateAppointmentStatus(
    id,
    status
) {
    return apiFetch(
        '/appointments/' + id + '/status',
        {
            method: 'PUT',
            body: JSON.stringify({
                status
            })
        }
    );
}


async function rescheduleAppointment(
    id,
    fecha_hora,
    motivo
) {
    return apiFetch(
        '/appointments/' + id + '/reschedule',
        {
            method: 'PUT',
            body: JSON.stringify({
                fecha_hora,
                motivo
            })
        }
    );
}


// ============================================================
// RESEÑAS
// ============================================================

async function createReview(
    lawyer_id,
    case_id,
    rating,
    comment,
    resumen
) {
    return apiFetch('/reviews', {
        method: 'POST',
        body: JSON.stringify({
            lawyer_id,
            case_id,
            rating,
            comment,
            resumen
        })
    });
}


async function getLawyerReviews(
    lawyerId
) {
    return apiFetch(
        '/reviews/lawyer/' + lawyerId
    );
}


async function getReviewStats(
    lawyerId
) {
    return apiFetch(
        '/reviews/stats/' + lawyerId
    );
}


// ============================================================
// PROPUESTAS
// ============================================================

async function createProposal(
    case_id,
    presupuesto,
    mensaje
) {
    return apiFetch('/proposals', {
        method: 'POST',
        body: JSON.stringify({
            case_id,
            presupuesto,
            mensaje
        })
    });
}


async function getProposalsByCase(
    caseId
) {
    return apiFetch(
        '/proposals/case/' + caseId
    );
}


async function getMyProposals() {
    return apiFetch(
        '/proposals/lawyer'
    );
}


async function updateProposalStatus(
    id,
    status
) {
    return apiFetch(
        '/proposals/' + id + '/status',
        {
            method: 'PUT',
            body: JSON.stringify({
                status
            })
        }
    );
}


// ============================================================
// MENSAJES
// ============================================================

async function sendMessageApi(
    receiver_id,
    message,
    case_id = null
) {
    return apiFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({
            receiver_id,
            message,
            case_id
        })
    });
}

async function getConversations() {
    return apiFetch(
        '/messages'
    );
}

// ============================================================
// PAGOS
// ============================================================

async function createPaymentPreference(
    plan
) {
    return apiFetch(
        '/payments/create-preference',
        {
            method: 'POST',
            body: JSON.stringify({
                plan
            })
        }
    );
}


// ============================================================
// NOTIFICACIONES
// ============================================================

async function getNotifications() {
    return apiFetch('/notifications');
}


async function markNotificationRead(
    id = 0
) {
    return apiFetch(
        '/notifications/mark-read',
        {
            method: 'POST',
            body: JSON.stringify({
                id
            })
        }
    );
}


// ============================================================
// ADMIN
// ============================================================

async function getUsers() {
    return apiFetch('/admin/users');
}


async function deleteUserApi(
    userId
) {
    return apiFetch(
        '/admin/users/' + userId,
        {
            method: 'DELETE'
        }
    );
}


async function updateLawyerVerification(
    userId,
    verified
) {
    return apiFetch('/admin/verify', {
        method: 'POST',
        body: JSON.stringify({
            user_id: userId,
            verified
        })
    });
}


async function updateUserRole(
    userId,
    role
) {
    return apiFetch('/admin/role', {
        method: 'POST',
        body: JSON.stringify({
            user_id: userId,
            role
        })
    });
}


async function getAllCases() {
    return apiFetch('/admin/cases');
}


async function deleteCaseApi(
    caseId
) {
    return apiFetch(
        '/admin/cases/' + caseId,
        {
            method: 'DELETE'
        }
    );
}


async function getAllReviews() {
    return apiFetch('/admin/reviews');
}


async function deleteReviewApi(
    reviewId
) {
    return apiFetch(
        '/admin/reviews/' + reviewId,
        {
            method: 'DELETE'
        }
    );
}


async function getStats() {
    return apiFetch('/admin/stats');
}


async function getPendingVerifications() {
    return apiFetch('/admin/pending');
}


async function adminVerifyMatricula(userId, verified = 1) {
    return apiFetch('/admin/verify-matricula', {
        method: 'POST',
        body: JSON.stringify({
            user_id: userId,
            verified: verified
        })
    });
}

async function adminVerifyEmail(userId) {
    return apiFetch('/admin/verify-email', {
        method: 'POST',
        body: JSON.stringify({
            user_id: userId
        })
    });
}


async function resetPasswordAdmin(
    userId,
    password
) {
    return apiFetch(
        '/admin/reset-password',
        {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                password
            })
        }
    );
}


// ============================================================
// AVATARS
// ============================================================

async function getAvatars() {
    return apiFetch('/avatars');
}