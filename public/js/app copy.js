// ============================================================
// BOGAYA - APP PRINCIPAL (VERSIÓN COMPLETA CORREGIDA)
// ============================================================

let currentView = 'home';
let currentLawyerTab = 'aceptados';
let currentAdminTab = 'abogados';
let currentCaseId = null;

// ============================================================
// NAVEGACIÓN
// ============================================================

function navigateTo(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById('view-' + view);
    if (target) target.classList.add('active');
    document.querySelectorAll('#bottom-nav button').forEach(b => b.classList.remove('active'));
    const navBtn = document.querySelector(`#bottom-nav button[data-view="${view}"]`);
    if (navBtn) navBtn.classList.add('active');
    currentView = view;

    switch (view) {
        case 'home':
            loadEspecialidades();
            break;
        case 'search':
            loadSearchFilters();
            break;
        case 'agenda':
            loadAgenda();
            break;
        case 'dashboard':
            loadDashboard();
            break;
        case 'dashboard-lawyer':
            loadLawyerCases('aceptados');
            break;
        case 'admin':
            loadAdmin('abogados');
            break;
        case 'profile':
            loadProfile();
            break;
        case 'messages':
            loadMessages();
            break;
    }
}

// ============================================================
// HOME - WIZARD
// ============================================================

// Burbujas llenan el textarea
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.wizard-chip').forEach(chip => {
        chip.addEventListener('click', function () {
            const texto = this.dataset.ejemplo;
            document.getElementById('problemaTexto').value = texto;
        });
    });
});

async function loadEspecialidades() {
    const grid = document.getElementById('especialidadesGrid');
    if (!grid) return;
    const especialidades = ['Laboral', 'Civil', 'Penal', 'Familia', 'Comercial', 'Administrativo', 'Inmobiliario', 'Tributario', 'Ambiental', 'Sucesiones'];
    grid.innerHTML = especialidades.map(esp => `
        <button class="especialidad-chip" onclick="searchBySpecialty('${esp}')">
            <i class="fas fa-gavel"></i> ${esp}
        </button>
    `).join('');
}

function detectSpecialty() {
    const texto = document.getElementById('problemaTexto').value;
    const resultado = document.getElementById('wizardResultado');
    if (!texto.trim()) {
        resultado.style.display = 'block';
        resultado.innerHTML = '<p class="text-muted">Escribí una descripción de tu problema.</p>';
        return;
    }
    const keywords = {
        'laboral': ['despido', 'indemnización', 'sueldo', 'trabajo', 'empleado', 'sindicato', 'accidente laboral'],
        'familia': ['divorcio', 'alimentos', 'custodia', 'hijos', 'pareja', 'violencia familiar', 'adopción', 'herencia', 'sucesión'],
        'penal': ['denuncia', 'agresión', 'robo', 'hurto', 'lesiones', 'pena', 'cárcel', 'delito'],
        'civil': ['contrato', 'alquiler', 'daños', 'perjuicios', 'vecino', 'propiedad', 'deuda', 'desalojo'],
        'comercial': ['sociedad', 'empresa', 'comercio', 'marca', 'patente', 'quiebra'],
        'administrativo': ['estado', 'municipio', 'permiso', 'habilitación', 'multa'],
        'inmobiliario': ['compraventa', 'usufructo', 'loteo', 'escritura']
    };
    let detected = 'General';
    let maxMatches = 0;
    const lowerText = texto.toLowerCase();
    for (const [esp, words] of Object.entries(keywords)) {
        let matches = 0;
        for (const word of words) {
            if (lowerText.includes(word)) matches++;
        }
        if (matches > maxMatches) {
            maxMatches = matches;
            detected = esp.charAt(0).toUpperCase() + esp.slice(1);
        }
    }
    resultado.style.display = 'block';
    resultado.innerHTML = `
        <div class="wizard-result-card">
            <h4><i class="fas fa-lightbulb"></i> Detectamos tu caso como <strong>${detected}</strong></h4>
            <p>Buscando abogados especializados en ${detected}...</p>
            <button class="btn-primary" onclick="searchBySpecialty('${detected}')">
                <i class="fas fa-search"></i> Ver abogados
            </button>
        </div>
    `;
}

function searchBySpecialty(specialty) {
    document.getElementById('search-especialidad').value = specialty;
    navigateTo('search');
    setTimeout(searchLawyers, 300);
}

// ============================================================
// BUSCADOR DE ABOGADOS (con estrellas de color y reseñas de colegas)
// ============================================================

async function loadSearchFilters() {
    const provincias = ['CABA', 'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'];
    const selectProv = document.getElementById('search-provincia');
    if (selectProv) {
        selectProv.innerHTML = '<option value="">Todas las Jurisdicciones</option>' +
            provincias.map(p => `<option value="${p}">${p}</option>`).join('');
    }
    const especialidades = ['Laboral', 'Civil', 'Penal', 'Familia', 'Comercial', 'Administrativo', 'Inmobiliario', 'Tributario', 'Ambiental', 'Sucesiones'];
    const selectEsp = document.getElementById('search-especialidad');
    if (selectEsp) {
        selectEsp.innerHTML = '<option value="">Todas las especialidades</option>' +
            especialidades.map(e => `<option value="${e}">${e}</option>`).join('');
    }
}

async function searchLawyers() {
    const especialidad = document.getElementById('search-especialidad')?.value || '';
    const provincia = document.getElementById('search-provincia')?.value || '';
    const modo = document.getElementById('search-modo')?.value || '';
    const container = document.getElementById('search-results') || document.getElementById('lawyer-list');
    if (!container) return;
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Buscando abogados...</div>';

    try {
        const params = new URLSearchParams();
        if (especialidad) params.append('especialidad', especialidad);
        if (provincia) params.append('provincia', provincia);
        if (modo) params.append('modo', modo);
        const data = await getLawyers(params.toString());
        if (!data.success || !data.data.length) {
            container.innerHTML = '<p class="text-muted">No se encontraron abogados con esos criterios.</p>';
            return;
        }

        container.innerHTML = data.data.map(l => {
            // Calcular estrellas de color
            const avg = l.avg_rating || 0;
            const fullStars = Math.round(avg);
            const stars = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
            // Recomendaciones de colegas (simulamos que vienen del backend)
            const colegasReviews = l.colegas_reviews || [];
            return `
            <div class="card lawyer-card">
                <div class="card-header">
                    <div>
                        <h3>${l.name}</h3>
                        <span class="badge ${l.verified ? 'verified' : ''}">${l.verified ? '✅ Verificado' : '⏳ Pendiente'}</span>
                    </div>
                </div>
                <div class="card-body">
                    <p><i class="fas fa-id-card"></i> Matrícula: ${l.matricula || 'No registrada'}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${l.provincia || 'Sin jurisdicción'}</p>
                    <p>
                        <span class="rating-stars">${stars}</span>
                        (${l.total_ratings || 0} valoraciones)
                    </p>
                    <p>
                        ${l.virtual ? '<span class="badge-mode"><i class="fas fa-video"></i> Virtual</span>' : ''}
                        ${l.presencial ? '<span class="badge-mode"><i class="fas fa-building"></i> Presencial</span>' : ''}
                    </p>
                    ${colegasReviews.length > 0 ? `
                        <div class="colegas-reviews">
                            <p><strong>Recomendado por colegas:</strong></p>
                            ${colegasReviews.map(r => `
                                <div class="review-mini">
                                    <span class="rating-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                                    <p>${r.comment}</p>
                                    <small>${r.lawyer_name}</small>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="card-footer">
                    ${l.phone ? `<button class="btn-outline" onclick="contactLawyer(${l.id}, '${l.name}', '${l.phone}', '${l.email}')">
                        <i class="fas fa-phone"></i> Contactar
                    </button>` : ''}
                    <button class="btn-primary" onclick="showAppointmentModal(${l.id})">
                        <i class="fas fa-calendar-plus"></i> Solicitar turno
                    </button>
                    <button class="btn-secondary" onclick="showCaseModalForLawyer(${l.id})">
                        <i class="fas fa-file-alt"></i> Publicar caso
                    </button>
                </div>
            </div>
        `}).join('');
    } catch (e) {
        container.innerHTML = '<p class="text-danger">Error: ' + e.message + '</p>';
    }
}

// ============================================================
// CONTACTO Y PUBLICACIÓN DE CASO (con verificación de rol)
// ============================================================

function contactLawyer(lawyerId, name, phone, email) {
    if (!isLoggedIn()) { showLoginModal(); return; }
    const role = getRole();
    if (role === 'lawyer') { alert('Los abogados no pueden contactar a otros abogados.'); return; }
    showContactModal(lawyerId, name, phone, email);
}

function showCaseModalForLawyer(lawyerId) {
    if (!isLoggedIn()) { showLoginModal(); return; }
    const role = getRole();
    if (role === 'lawyer') { alert('Los abogados no pueden publicar casos.'); return; }
    currentCaseId = lawyerId;
    showCaseModal();
}

function showAppointmentModal(lawyerId) {
    if (!isLoggedIn()) { showLoginModal(); return; }
    const role = getRole();
    if (role === 'lawyer') { alert('Los abogados no pueden solicitar turnos con otros abogados.'); return; }
    // ... resto de la función (ya la tienes)
}

// ============================================================
// MODALES
// ============================================================

function showContactModal(lawyerId, name, phone, email) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'contactModal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-phone"></i> Contactar a ${name}</h2>
            ${phone ? `<p><i class="fas fa-phone"></i> ${phone}</p>` : ''}
            ${email ? `<p><i class="fas fa-envelope"></i> ${email}</p>` : ''}
            <hr>
            <label>Enviar mensaje</label>
            <textarea id="contact-message" rows="3" placeholder="Escribí tu mensaje..."></textarea>
            <div class="btn-group">
                <button class="btn-primary" onclick="sendMessage(${lawyerId})">Enviar</button>
                <button class="btn-secondary" onclick="closeModal('contactModal')">Cerrar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function sendMessage(receiverId) {
    const message = document.getElementById('contact-message').value;
    if (!message.trim()) { alert('Escribí un mensaje'); return; }
    try {
        await sendMessageApi(receiverId, message);
        alert('✅ Mensaje enviado');
        closeModal('contactModal');
    } catch (e) { alert('Error: ' + e.message); }
}

function showCaseModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'caseModal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-file-alt"></i> Publicar caso</h2>
            <label>Título *</label>
            <input type="text" id="case-titulo" placeholder="Ej: Despido injustificado">
            <label>Descripción</label>
            <textarea id="case-descripcion" rows="3"></textarea>
            <label>Área legal *</label>
            <select id="case-area">
                <option value="">Seleccionar...</option>
                ${['Laboral', 'Civil', 'Penal', 'Familia', 'Comercial', 'Administrativo', 'Inmobiliario', 'Tributario', 'Ambiental', 'Sucesiones'].map(e => `<option value="${e}">${e}</option>`).join('')}
            </select>
            <label>Jurisdiccion</label>
            <select id="case-provincia">
                <option value="">Seleccionar...</option>
                ${['CABA', 'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'].map(p => `<option value="${p}">${p}</option>`).join('')}
            </select>
            <label>Vigencia (días)</label>
            <input type="number" id="case-vigencia" value="30" min="1" max="90">
            <div class="btn-group">
                <button class="btn-primary" onclick="submitCase()">Publicar</button>
                <button class="btn-secondary" onclick="closeModal('caseModal')">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function submitCase() {
    const titulo = document.getElementById('case-titulo').value;
    const descripcion = document.getElementById('case-descripcion').value;
    const area = document.getElementById('case-area').value;
    const provincia = document.getElementById('case-provincia').value;
    const vigencia = document.getElementById('case-vigencia').value || 30;
    if (!titulo || !area) { alert('Título y área legal son obligatorios'); return; }
    try {
        await createCase(titulo, descripcion, area, provincia, vigencia);
        alert('✅ Caso publicado correctamente');
        closeModal('caseModal');
        loadDashboard();
    } catch (e) { alert('Error: ' + e.message); }
}

function showReviewModal(caseId) {
    if (!isLoggedIn()) { showLoginModal(); return; }
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'reviewModal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-star"></i> Dejar reseña</h2>
            <p>Califica al abogado y dejá un comentario sobre cómo fue el trabajo.</p>
            <label>Puntuación (1-5)</label>
            <select id="review-rating">
                ${[5, 4, 3, 2, 1].map(n => `<option value="${n}">${n} - ${['Excelente', 'Muy bueno', 'Bueno', 'Regular', 'Malo'][5 - n]}</option>`).join('')}
            </select>
            <label>Comentario</label>
            <textarea id="review-comment" rows="3" placeholder="¿Cómo fue tu experiencia?"></textarea>
            <label>Resumen del caso</label>
            <textarea id="review-resumen" rows="2" placeholder="Breve resumen de lo que se hizo..."></textarea>
            <div class="btn-group">
                <button class="btn-primary" onclick="submitReview('${caseId}')">Enviar reseña</button>
                <button class="btn-secondary" onclick="closeModal('reviewModal')">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function submitReview(caseId) {
    const rating = document.getElementById('review-rating').value;
    const comment = document.getElementById('review-comment').value;
    const resumen = document.getElementById('review-resumen').value;
    if (!comment) { alert('Por favor, escribí un comentario'); return; }
    try {
        // Obtener el lawyer_id del caso desde el backend
        const caseData = await getCase(caseId);
        const lawyerId = caseData.data.lawyer_id || 0;
        if (!lawyerId) { alert('No se encontró el abogado asociado a este caso.'); return; }
        await createReview(lawyerId, caseId, rating, comment, resumen);
        alert('✅ Reseña guardada. ¡Gracias por tu opinión!');
        closeModal('reviewModal');
        loadDashboard();
    } catch (e) { alert('Error: ' + e.message); }
}

function showAppointmentModal(lawyerId) {
    if (!isLoggedIn()) { showLoginModal(); return; }
    const role = getRole();
    if (role === 'lawyer') { alert('Los abogados no pueden solicitar turnos.'); return; }
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'appointmentModal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-calendar-plus"></i> Solicitar turno</h2>
            <label>Fecha y hora</label>
            <input type="datetime-local" id="appointment-datetime">
            <label>Modalidad</label>
            <select id="appointment-modalidad">
                <option value="virtual">Virtual</option>
                <option value="presencial">Presencial</option>
            </select>
            <label>Notas adicionales</label>
            <textarea id="appointment-notas" rows="3"></textarea>
            <div class="btn-group">
                <button class="btn-primary" onclick="submitAppointment(${lawyerId})">Solicitar</button>
                <button class="btn-secondary" onclick="closeModal('appointmentModal')">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function submitAppointment(lawyerId) {
    const dateTime = document.getElementById('appointment-datetime').value;
    const modalidad = document.getElementById('appointment-modalidad').value;
    const notas = document.getElementById('appointment-notas').value;
    if (!dateTime) { alert('Seleccioná una fecha y hora'); return; }
    try {
        await createAppointment(lawyerId, dateTime, modalidad, null, notas);
        alert('✅ Turno solicitado correctamente');
        closeModal('appointmentModal');
    } catch (e) { alert('Error: ' + e.message); }
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// ============================================================
// DASHBOARD - CLIENTE
// ============================================================

async function loadDashboard() {
    const role = getRole();
    if (role === 'lawyer') {
        navigateTo('dashboard-lawyer');
        return;
    }
    const container = document.getElementById('my-cases');
    if (!container) return;
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando tus casos...</div>';
    try {
        const data = await getMyCases();
        if (!data.success || !data.data.length) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-folder-open"></i><p>No tenés casos activos.</p><button class="btn-primary" onclick="showCaseModal()">Publicar caso</button></div>`;
            return;
        }
        container.innerHTML = data.data.map(c => `
            <div class="card case-card">
                <div class="card-header">
                    <h3>${c.titulo}</h3>
                    <span class="badge status-${c.estado}">${c.estado}</span>
                </div>
                <div class="card-body">
                    <p>${c.descripcion || 'Sin descripción'}</p>
                    <p><i class="fas fa-tag"></i> ${c.area_legal}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${c.provincia || 'Sin ubicación'}</p>
                    <p><i class="fas fa-clock"></i> Vigencia: ${c.vigencia_dias || 30} días</p>
                    ${c.fecha_cierre ? `<p><i class="fas fa-check-circle"></i> Cerrado: ${new Date(c.fecha_cierre).toLocaleDateString()}</p>` : ''}
                </div>
                <div class="card-footer">
                    ${c.estado === 'abierto' ? `
                        <button class="btn-secondary" onclick="editCase('${c.id}')"><i class="fas fa-edit"></i> Editar</button>
                        <button class="btn-danger" onclick="closeCase('${c.id}')"><i class="fas fa-check"></i> Cerrar caso</button>
                    ` : ''}
                    ${c.estado === 'cerrado' ? `
                        <button class="btn-primary" onclick="showReviewModal('${c.id}')"><i class="fas fa-star"></i> Dejar reseña</button>
                    ` : ''}
                    <button class="btn-outline" onclick="viewProposals('${c.id}')"><i class="fas fa-users"></i> Ver propuestas (${c.proposals_count || 0})</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<p class="text-danger">Error: ' + e.message + '</p>';
    }
}

async function viewProposals(caseId) {
    // Verificar que el caso pertenece al cliente
    try {
        const data = await getProposalsByCase(caseId);
        if (!data.success || !data.data.length) {
            alert('No hay propuestas para este caso.');
            return;
        }
        // Mostrar en un modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'proposalsModal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2><i class="fas fa-users"></i> Propuestas para el caso</h2>
                ${data.data.map(p => `
                    <div class="card" style="margin-bottom:8px;">
                        <p><strong>${p.lawyer_name}</strong> - $${p.presupuesto}</p>
                        <p>${p.mensaje}</p>
                        ${p.estado === 'pendiente' ? `
                            <div class="btn-group">
                                <button class="btn-primary" onclick="acceptProposal(${p.id})">Aceptar</button>
                                <button class="btn-secondary" onclick="rejectProposal(${p.id})">Rechazar</button>
                            </div>
                        ` : `<span class="badge">${p.estado}</span>`}
                    </div>
                `).join('')}
                <button class="btn-secondary" onclick="closeModal('proposalsModal')">Cerrar</button>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function acceptProposal(proposalId) {
    if (!confirm('¿Aceptar esta propuesta?')) return;
    try {
        await updateProposalStatus(proposalId, 'aceptada');
        alert('Propuesta aceptada. El abogado será notificado.');
        closeModal('proposalsModal');
        loadDashboard();
    } catch (e) { alert('Error: ' + e.message); }
}

async function rejectProposal(proposalId) {
    if (!confirm('¿Rechazar esta propuesta?')) return;
    try {
        await updateProposalStatus(proposalId, 'rechazada');
        alert('Propuesta rechazada.');
        closeModal('proposalsModal');
        loadDashboard();
    } catch (e) { alert('Error: ' + e.message); }
}

// ============================================================
// DASHBOARD - ABOGADO
// ============================================================

function switchLawyerTab(tab) {
    currentLawyerTab = tab;
    document.querySelectorAll('.dashboard-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.dashboard-tabs .tab-btn[onclick*="${tab}"]`)?.classList.add('active');
    loadLawyerCases(tab);
}

async function loadLawyerCases(tab = currentLawyerTab) {
    const container = document.getElementById('lawyer-cases-list');
    if (!container) return;
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
    try {
        let data;
        switch (tab) {
            case 'aceptados': data = await getLawyerCases('aceptados'); break;
            case 'ofrecidos': data = await getLawyerCases('ofrecidos'); break;
            case 'cerrados': data = await getLawyerCases('cerrados'); break;
            case 'vigentes': data = await getAvailableCases(); break;
            default: data = await getLawyerCases('aceptados');
        }
        if (!data.success || !data.data.length) {
            container.innerHTML = `<div class="empty-state"><p>No hay casos en esta categoría.</p></div>`;
            return;
        }
        container.innerHTML = data.data.map(c => `
            <div class="card case-card">
                <div class="card-header">
                    <h3>${c.titulo}</h3>
                    <span class="badge status-${c.estado || 'abierto'}">${c.estado || 'abierto'}</span>
                </div>
                <div class="card-body">
                    <p>${c.descripcion || 'Sin descripción'}</p>
                    <p><i class="fas fa-tag"></i> ${c.area_legal}</p>
                    <p><i class="fas fa-user"></i> Cliente: ${c.client_name}</p>
                    ${c.presupuesto ? `<p><i class="fas fa-dollar-sign"></i> Presupuesto: $${c.presupuesto}</p>` : ''}
                </div>
                <div class="card-footer">
                    ${tab === 'vigentes' ? `
                        <button class="btn-primary" onclick="showProposalModal('${c.id}')">
                            <i class="fas fa-paper-plane"></i> Postularme
                        </button>
                    ` : ''}
                    ${c.estado === 'cerrado' ? `
                        <button class="btn-primary" onclick="showReviewModal('${c.id}')">
                            <i class="fas fa-star"></i> Dejar reseña
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<p class="text-danger">Error: ' + e.message + '</p>';
    }
}

function showProposalModal(caseId) {
    if (!isLoggedIn()) { showLoginModal(); return; }
    const role = getRole();
    if (role !== 'lawyer') { alert('Solo abogados pueden postularse.'); return; }
    currentCaseId = caseId;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'proposalModal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-paper-plane"></i> Postularme al caso</h2>
            <label>Presupuesto (ARS) *</label>
            <input type="number" id="proposal-budget" placeholder="Ej: 50000" min="1">
            <label>Mensaje al cliente</label>
            <textarea id="proposal-message" rows="3" placeholder="Explica por qué sos el indicado..."></textarea>
            <div class="btn-group">
                <button class="btn-primary" onclick="submitProposal()">Enviar propuesta</button>
                <button class="btn-secondary" onclick="closeModal('proposalModal')">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function submitProposal() {
    const budget = document.getElementById('proposal-budget').value;
    const message = document.getElementById('proposal-message').value;
    if (!budget || budget <= 0) { alert('Ingresá un presupuesto válido'); return; }
    try {
        await createProposal(currentCaseId, budget, message);
        alert('✅ Propuesta enviada correctamente');
        closeModal('proposalModal');
        loadLawyerCases('vigentes');
    } catch (e) { alert('Error: ' + e.message); }
}

// ============================================================
// AGENDA
// ============================================================

async function loadAgenda() {
    const list = document.getElementById('appointment-list');
    if (!list) return;
    const role = getRole();
    list.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
    try {
        let data;
        if (role === 'lawyer') data = await getLawyerAppointments();
        else data = await getClientAppointments();
        if (!data.success || !data.data.length) {
            list.innerHTML = '<p>No tenés turnos programados.</p>';
            return;
        }
        list.innerHTML = data.data.map(a => `
            <div class="card">
                <h3>${a.modalidad === 'virtual' ? '💻' : '🏢'} ${new Date(a.fecha_hora).toLocaleString()}</h3>
                <p>${role === 'lawyer' ? 'Cliente: ' + a.client_name : 'Abogado: ' + a.lawyer_name}</p>
                <p>Estado: <strong>${a.estado}</strong></p>
                ${a.estado === 'pendiente' ? `
                    <button onclick="changeAppointmentStatus(${a.id}, 'confirmada')">Confirmar</button>
                    <button onclick="changeAppointmentStatus(${a.id}, 'cancelada')">Cancelar</button>
                ` : ''}
                ${a.estado === 'confirmada' ? `<button onclick="changeAppointmentStatus(${a.id}, 'completada')">Marcar completada</button>` : ''}
            </div>
        `).join('');
    } catch (e) {
        list.innerHTML = '<p class="text-danger">Error: ' + e.message + '</p>';
    }
}

async function changeAppointmentStatus(id, status) {
    if (!confirm(`¿Cambiar estado a "${status}"?`)) return;
    try {
        await updateAppointmentStatus(id, status);
        alert('Estado actualizado');
        loadAgenda();
    } catch (e) { alert('Error: ' + e.message); }
}

// ============================================================
// PERFIL (con edición)
// ============================================================

async function loadProfile() {
    const div = document.getElementById('profile-content');
    if (!div) return;
    const role = getRole();
    const userId = localStorage.getItem('bogaya_user_id');
    if (!userId) return;

    try {
        // Obtener datos del usuario
        const userData = await apiFetch('/users/' + userId);
        if (!userData.success) { div.innerHTML = '<p>Error al cargar perfil</p>'; return; }
        const user = userData.data;
        let lawyerData = null;
        if (role === 'lawyer') {
            const lawyerRes = await apiFetch('/lawyers/' + userId);
            if (lawyerRes.success) lawyerData = lawyerRes.data;
        }

        div.innerHTML = `
            <h3>${role === 'lawyer' ? 'Perfil de Abogado' : 'Perfil de Cliente'}</h3>
            <form id="profileForm" class="profile-form">
                <label>Nombre completo</label>
                <input type="text" id="profile-name" value="${user.name || ''}" required>
                <label>Email</label>
                <input type="email" id="profile-email" value="${user.email || ''}" required>
                <label>Teléfono</label>
                <input type="text" id="profile-phone" value="${user.phone || ''}">
                ${role === 'lawyer' ? `
                    <label>Matrícula</label>
                    <input type="text" id="profile-matricula" value="${lawyerData?.matricula || ''}">
                    <label>Especialidad</label>
                    <select id="profile-especialidad">
                        ${['Laboral', 'Civil', 'Penal', 'Familia', 'Comercial', 'Administrativo', 'Inmobiliario', 'Tributario', 'Ambiental', 'Sucesiones'].map(e => `<option value="${e}" ${lawyerData?.especialidad === e ? 'selected' : ''}>${e}</option>`).join('')}
                    </select>
                    <label>Jurisdiccion</label>
                    <select id="profile-provincia">
                        ${['CABA', 'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'].map(p => `<option value="${p}" ${lawyerData?.provincia === p ? 'selected' : ''}>${p}</option>`).join('')}
                    </select>
                    <label>Bio</label>
                    <textarea id="profile-bio" rows="3">${lawyerData?.bio || ''}</textarea>
                    <div class="checkbox-group">
                        <input type="checkbox" id="profile-virtual" ${lawyerData?.virtual ? 'checked' : ''}>
                        <label for="profile-virtual">Atiendo virtual</label>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="profile-presencial" ${lawyerData?.presencial ? 'checked' : ''}>
                        <label for="profile-presencial">Atiendo presencial</label>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="profile-mostrar-telefono" ${lawyerData?.mostrar_telefono ? 'checked' : ''}>
                        <label for="profile-mostrar-telefono">Mostrar teléfono en mi perfil</label>
                    </div>
                ` : ''}
                <button type="submit" class="btn-primary">Guardar cambios</button>
            </form>
        `;

        // Manejar envío del formulario
        document.getElementById('profileForm').addEventListener('submit', async function (e) {
            e.preventDefault();
            const data = {
                name: document.getElementById('profile-name').value,
                email: document.getElementById('profile-email').value,
                phone: document.getElementById('profile-phone').value
            };
            if (role === 'lawyer') {
                data.matricula = document.getElementById('profile-matricula').value;
                data.especialidad = document.getElementById('profile-especialidad').value;
                data.provincia = document.getElementById('profile-provincia').value;
                data.bio = document.getElementById('profile-bio').value;
                data.virtual = document.getElementById('profile-virtual').checked ? 1 : 0;
                data.presencial = document.getElementById('profile-presencial').checked ? 1 : 0;
                data.mostrar_telefono = document.getElementById('profile-mostrar-telefono').checked ? 1 : 0;
            }
            try {
                await updateUserProfile(data);
                alert('✅ Perfil actualizado correctamente');
                loadProfile(); // Recargar
            } catch (e) { alert('Error: ' + e.message); }
        });
    } catch (e) {
        div.innerHTML = '<p class="text-danger">Error al cargar perfil: ' + e.message + '</p>';
    }
}

// ============================================================
// ADMIN
// ============================================================

function switchAdminTab(tab) {
    currentAdminTab = tab;
    document.querySelectorAll('.admin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.admin-tabs .tab-btn[onclick*="${tab}"]`)?.classList.add('active');
    loadAdmin(tab);
}

async function loadAdmin(tab = currentAdminTab) {
    const container = document.getElementById('admin-content');
    if (!container) return;
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
    try {
        let data;
        switch (tab) {
            case 'abogados':
                data = await adminGetLawyers();
                if (!data.success || !data.data.length) { container.innerHTML = '<p>No hay abogados registrados.</p>'; return; }
                container.innerHTML = data.data.map(l => `
                    <div class="admin-card">
                        <h3>${l.name}</h3>
                        <p>Email: ${l.email} - Matrícula: ${l.matricula || 'No registrada'}</p>
                        <p>Especialidad: ${l.especialidad || 'No especificada'} - ${l.provincia || ''}</p>
                        <p>Verificado: ${l.verified ? '✅ Sí' : '⏳ Pendiente'}</p>
                        <div class="admin-actions">
                            ${!l.verified ? `<button class="btn-verify" onclick="verifyLawyer(${l.id})">Verificar</button>` : ''}
                            <button class="btn-reject" onclick="alert('Función de rechazo pendiente')">Bloquear</button>
                        </div>
                    </div>
                `).join('');
                break;
            case 'casos':
                const casesData = await getCases('abierto');
                if (!casesData.success || !casesData.data.length) { container.innerHTML = '<p>No hay casos activos.</p>'; return; }
                container.innerHTML = casesData.data.map(c => `
                    <div class="admin-card">
                        <h3>${c.titulo}</h3>
                        <p>Cliente: ${c.client_name} - Área: ${c.area_legal}</p>
                        <p>Estado: ${c.estado} - Creado: ${new Date(c.created_at).toLocaleDateString()}</p>
                        <div class="admin-actions">
                            <button class="btn-reject" onclick="alert('Cerrar caso?')">Cerrar</button>
                        </div>
                    </div>
                `).join('');
                break;
            case 'reseñas':
                const reviewsData = await adminGetReviews();
                if (!reviewsData.success || !reviewsData.data.length) { container.innerHTML = '<p>No hay reseñas.</p>'; return; }
                container.innerHTML = reviewsData.data.map(r => `
                    <div class="admin-card">
                        <p><strong>${r.client_name}</strong> calificó a <strong>${r.lawyer_name}</strong></p>
                        <p><span class="rating-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span></p>
                        <p>${r.comment}</p>
                        <p>Resumen: ${r.resumen || 'No especificado'}</p>
                        <div class="admin-actions">
                            <button class="btn-reject" onclick="deleteReview(${r.id})">Eliminar</button>
                        </div>
                    </div>
                `).join('');
                break;
            case 'usuarios':
                const usersData = await adminGetUsers();
                if (!usersData.success || !usersData.data.length) { container.innerHTML = '<p>No hay usuarios.</p>'; return; }
                container.innerHTML = usersData.data.map(u => `
                    <div class="admin-card">
                        <h3>${u.name}</h3>
                        <p>Email: ${u.email} - Rol: ${u.role}</p>
                        <p>Registrado: ${new Date(u.created_at).toLocaleDateString()}</p>
                        <div class="admin-actions">
                            <button class="btn-reject" onclick="alert('Bloquear usuario')">Bloquear</button>
                        </div>
                    </div>
                `).join('');
                break;
        }
    } catch (e) {
        container.innerHTML = '<p class="text-danger">Error: ' + e.message + '</p>';
    }
}

async function verifyLawyer(userId) {
    if (!confirm('¿Verificar a este abogado?')) return;
    try {
        await adminVerifyLawyer(userId);
        alert('✅ Abogado verificado correctamente');
        loadAdmin('abogados');
    } catch (e) { alert('Error: ' + e.message); }
}

async function deleteReview(id) {
    if (!confirm('¿Eliminar esta reseña?')) return;
    try {
        await adminDeleteReview(id);
        alert('Reseña eliminada');
        loadAdmin('reseñas');
    } catch (e) { alert('Error: ' + e.message); }
}

// ============================================================
// UTILIDADES
// ============================================================

function isLoggedIn() {
    return !!localStorage.getItem('bogaya_token');
}

function getRole() {
    return localStorage.getItem('bogaya_role') || 'client';
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// ============================================================
// INICIO
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    const logged = await checkAuth();
    if (logged) {
        const role = getRole();
        document.getElementById('nav-dashboard').style.display = 'inline-block';
        const userName = localStorage.getItem('bogaya_name') || 'Usuario';
        document.getElementById('user-name').textContent = '👋 ' + userName;
        // Mostrar admin solo si es admin
        if (role === 'admin') {
            document.getElementById('nav-admin').style.display = 'inline-block';
        }
        if (role === 'lawyer') {
            navigateTo('dashboard-lawyer');
        } else {
            navigateTo('dashboard');
        }
        registerPushToken();
    } else {
        document.getElementById('nav-dashboard').style.display = 'none';
        navigateTo('home');
    }
});