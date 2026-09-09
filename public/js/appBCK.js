// ============================================================
// BOGAYA - APP PRINCIPAL
// ============================================================

let currentView = 'home';
let currentLawyerTab = 'aceptados';
let currentAdminTab = 'abogados';
let currentCaseId = null;
let currentLawyerIdForReview = null;

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

    const role = getRole();

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
            if (role === 'lawyer') {
                navigateTo('dashboard-lawyer');
                return;
            }
            loadDashboard();
            break;
        case 'dashboard-lawyer':
            loadLawyerDashboard();
            break;
        case 'profile':
            loadProfile();
            break;
        case 'admin':
            if (role !== 'admin') {
                alert('No tienes permisos de administrador');
                navigateTo('home');
                return;
            }
            loadAdminPanel();
            break;
    }
}

// ============================================================
// HOME - LEXMATCH WIZARD
// ============================================================

function loadEspecialidades() {
    const grid = document.getElementById('especialidadesGrid');
    if (!grid) return;

    const especialidades = [
        'Laboral', 'Civil', 'Penal', 'Familia', 'Comercial',
        'Administrativo', 'Inmobiliario', 'Tributario', 'Ambiental', 'Sucesiones'
    ];

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
        'Laboral': ['despido', 'indemnización', 'sueldo', 'trabajo', 'empleado', 'sindicato', 'accidente laboral', 'horas extra', 'contrato laboral', 'renuncia'],
        'Familia': ['divorcio', 'alimentos', 'custodia', 'hijos', 'pareja', 'violencia familiar', 'adopción', 'tenencia', 'régimen de visitas'],
        'Penal': ['denuncia', 'agresión', 'robo', 'hurto', 'lesiones', 'pena', 'cárcel', 'delito', 'violencia', 'amenazas'],
        'Civil': ['contrato', 'alquiler', 'daños', 'perjuicios', 'vecino', 'propiedad', 'deuda', 'desalojo'],
        'Comercial': ['sociedad', 'empresa', 'comercio', 'marca', 'patente', 'quiebra', 'contrato comercial', 'cheque'],
        'Administrativo': ['estado', 'municipio', 'permiso', 'habilitación', 'multa', 'recurso', 'amparo'],
        'Inmobiliario': ['compraventa', 'usufructo', 'loteo', 'escritura', 'hipoteca', 'alquiler'],
        'Sucesiones': ['herencia', 'testamento', 'fallecimiento', 'sucesión', 'albacea']
    };

    let detected = 'General';
    let maxMatches = 0;
    const lowerText = texto.toLowerCase();
    let matchedWords = [];

    for (const [esp, words] of Object.entries(keywords)) {
        let matches = 0;
        let found = [];
        for (const word of words) {
            if (lowerText.includes(word)) {
                matches++;
                found.push(word);
            }
        }
        if (matches > maxMatches) {
            maxMatches = matches;
            detected = esp;
            matchedWords = found;
        }
    }

    resultado.style.display = 'block';

    if (detected === 'General' || maxMatches === 0) {
        resultado.innerHTML = `
            <div class="wizard-result-card">
                <h4><i class="fas fa-lightbulb"></i> No pudimos identificar tu área legal</h4>
                <p>Te sugerimos buscar por especialidad manualmente.</p>
                <button class="btn-primary" onclick="navigateTo('search')">
                    <i class="fas fa-search"></i> Ir al buscador
                </button>
            </div>
        `;
    } else {
        resultado.innerHTML = `
            <div class="wizard-result-card">
                <h4><i class="fas fa-check-circle" style="color:#22c55e;"></i> Detectamos tu caso como <strong>${detected}</strong></h4>
                <p>Encontramos ${maxMatches} coincidencia${maxMatches > 1 ? 's' : ''} con esta especialidad.</p>
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
                    <button class="btn-primary" onclick="searchBySpecialty('${detected}')">
                        <i class="fas fa-search"></i> Ver abogados de ${detected}
                    </button>
                    <button class="btn-secondary" onclick="navigateTo('search')">
                        <i class="fas fa-sliders-h"></i> Buscar manualmente
                    </button>
                </div>
            </div>
        `;
    }
}

function searchBySpecialty(specialty) {
    const select = document.getElementById('search-especialidad');
    if (select) select.value = specialty;
    navigateTo('search');
    setTimeout(searchLawyers, 300);
}

// ============================================================
// BUSCADOR DE ABOGADOS
// ============================================================

function loadSearchFilters() {
    const provincias = [
        'CABA', 'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
        'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
        'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
        'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego',
        'Tucumán'
    ];

    const selectProv = document.getElementById('search-provincia');
    if (selectProv) {
        selectProv.innerHTML = '<option value="">Todas las provincias</option>' +
            provincias.map(p => `<option value="${p}">${p}</option>`).join('');
    }

    const especialidades = [
        'Laboral', 'Civil', 'Penal', 'Familia', 'Comercial',
        'Administrativo', 'Inmobiliario', 'Tributario', 'Ambiental', 'Sucesiones'
    ];
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
    const container = document.getElementById('search-results');

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

        // OCULTAR PLAN - Solo mostramos información básica
        container.innerHTML = data.data.map(l => renderLawyerCard(l, false)).join('');
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
        container.innerHTML = '<p class="text-danger">Error: ' + e.message + '</p>';
    }
}

// ============================================================
// RENDERIZADO DE TARJETA DE ABOGADO (sin plan visible)
// ============================================================

function renderLawyerCard(l, showPlan = false) {
    const avgRating = parseFloat(l.avg_rating) || 0;
    const totalRatings = l.total_ratings || 0;
    const stars = generateStars(avgRating);

    let recomendaciones = '';
    if (l.recent_reviews && l.recent_reviews.length > 0) {
        recomendaciones = l.recent_reviews.slice(0, 2).map(r => `
            <div class="review-mini">
                <span class="rating">${generateStars(r.rating)}</span>
                <p>"${r.comment}"</p>
                <small>— ${r.client_name || 'Cliente'}</small>
            </div>
        `).join('');
    }

    // NO mostrar el plan en la tarjeta (oculto)
    const planBadge = showPlan ? `<span class="badge ${l.plan || 'gratis'}">${(l.plan || 'gratis').toUpperCase()}</span>` : '';

    return `
        <div class="card lawyer-card">
            <div class="card-header">
                <div>
                    <h3>${l.name}</h3>
                    ${l.verified ? '<span class="badge verified">✅ Verificado</span>' : ''}
                </div>
                ${planBadge}
            </div>
            <div class="card-body">
                <p><i class="fas fa-id-card"></i> Matrícula: ${l.matricula || 'No registrada'}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${l.provincia || 'Sin jurisdicción'}</p>
                <p>
                    <span class="rating">${stars}</span>
                    (${totalRatings} valoraciones)
                </p>
                <p>
                    ${l.virtual ? '<span class="badge-mode"><i class="fas fa-video"></i> Virtual</span>' : ''}
                    ${l.presencial ? '<span class="badge-mode"><i class="fas fa-building"></i> Presencial</span>' : ''}
                </p>
            </div>
            ${recomendaciones ? `<div class="card-reviews"><p><strong>Recomendaciones:</strong></p>${recomendaciones}</div>` : ''}
            <div class="card-footer">
                ${l.phone ? `<button class="btn-outline" onclick="contactLawyer(${l.id}, '${l.name}', '${l.phone}', '${l.email}')">
                    <i class="fas fa-phone"></i> Contactar
                </button>` : ''}
                ${!isLoggedIn() || getRole() === 'client' ? `
                    <button class="btn-primary" onclick="showAppointmentModal(${l.id})">
                        <i class="fas fa-calendar-plus"></i> Solicitar turno
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function generateStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

// ============================================================
// CONTACTO
// ============================================================

function contactLawyer(lawyerId, name, phone, email) {
    if (!isLoggedIn()) {
        showLoginModal();
        return;
    }
    if (getRole() !== 'client') {
        alert('Solo los clientes pueden contactar a abogados.');
        return;
    }
    showContactModal(lawyerId, name, phone, email);
}

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
                <button class="btn-secondary" onclick="closeModal('contactModal')">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function sendMessage(receiverId) {
    const message = document.getElementById('contact-message').value;
    if (!message.trim()) {
        alert('Escribí un mensaje');
        return;
    }
    try {
        await sendMessageApi(receiverId, message);
        alert('✅ Mensaje enviado');
        closeModal('contactModal');
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

// ============================================================
// DASHBOARD CLIENTE
// ============================================================

async function loadDashboard() {
    const container = document.getElementById('my-cases');
    if (!container) return;
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando tus casos...</div>';

    try {
        const data = await getMyCases();
        if (!data.success || !data.data.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No tenés casos activos.</p>
                    <button class="btn-primary" onclick="showCaseModal()">Publicar caso</button>
                </div>
            `;
            return;
        }

        container.innerHTML = data.data.map(c => `
            <div class="card case-card">
                <div class="card-header">
                    <h3>${c.titulo}</h3>
                    <span class="badge status-${c.estado}">${c.estado.replace('_', ' ')}</span>
                </div>
                <div class="card-body">
                    <p>${c.descripcion || 'Sin descripción'}</p>
                    <p><i class="fas fa-tag"></i> ${c.area_legal}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${c.provincia || 'Sin ubicación'}</p>
                    <p><i class="fas fa-clock"></i> Vigencia: ${c.vigencia_dias || 30} días</p>
                    <p><i class="fas fa-users"></i> Propuestas: ${c.proposals_count || 0}</p>
                    ${c.fecha_cierre ? `<p><i class="fas fa-check-circle"></i> Cerrado: ${new Date(c.fecha_cierre).toLocaleDateString()}</p>` : ''}
                </div>
                <div class="card-footer">
                    ${c.estado === 'abierto' ? `
                        <button class="btn-secondary" onclick="closeCase('${c.id}')">
                            <i class="fas fa-check"></i> Cerrar caso
                        </button>
                    ` : ''}
                    ${c.estado === 'cerrado' ? `
                        <button class="btn-primary" onclick="showReviewModal('${c.id}')">
                            <i class="fas fa-star"></i> Dejar reseña
                        </button>
                    ` : ''}
                    <button class="btn-outline" onclick="viewProposals('${c.id}')">
                        <i class="fas fa-users"></i> Ver propuestas (${c.proposals_count || 0})
                    </button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<p class="text-danger">Error: ' + e.message + '</p>';
    }
}

async function viewProposals(caseId) {
    try {
        const data = await getProposalsByCase(caseId);
        if (!data.success || !data.data.length) {
            alert('No hay propuestas para este caso.');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'proposalsModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:500px;">
                <h2><i class="fas fa-users"></i> Propuestas para este caso</h2>
                ${data.data.map(p => `
                    <div class="card" style="margin-bottom:12px;">
                        <div class="card-header">
                            <h4>${p.lawyer_name}</h4>
                            <span class="badge ${p.estado}">${p.estado}</span>
                        </div>
                        <div class="card-body">
                            <p><i class="fas fa-dollar-sign"></i> Presupuesto: $${p.presupuesto}</p>
                            <p><i class="fas fa-comment"></i> ${p.mensaje}</p>
                        </div>
                        ${p.estado === 'pendiente' ? `
                            <div class="card-footer">
                                <button class="btn-primary" onclick="acceptProposal(${p.id}, '${caseId}')">
                                    <i class="fas fa-check"></i> Aceptar
                                </button>
                                <button class="btn-secondary" onclick="rejectProposal(${p.id}, '${caseId}')">
                                    <i class="fas fa-times"></i> Rechazar
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
                <button class="btn-secondary btn-block" onclick="closeModal('proposalsModal')">Cerrar</button>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function acceptProposal(proposalId, caseId) {
    if (!confirm('¿Aceptar esta propuesta?')) return;
    try {
        await updateProposalStatus(proposalId, 'aceptada');
        alert('✅ Propuesta aceptada. El abogado será notificado.');
        closeModal('proposalsModal');
        loadDashboard();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function rejectProposal(proposalId, caseId) {
    if (!confirm('¿Rechazar esta propuesta?')) return;
    try {
        await updateProposalStatus(proposalId, 'rechazada');
        alert('✅ Propuesta rechazada.');
        closeModal('proposalsModal');
        loadDashboard();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function closeCase(caseId) {
    if (!confirm('¿Estás seguro que quieres cerrar este caso? Una vez cerrado, podrás dejar una reseña.')) return;
    try {
        await closeCaseApi(caseId);
        alert('✅ Caso cerrado correctamente');
        loadDashboard();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

// ============================================================
// DASHBOARD ABOGADO
// ============================================================

function switchLawyerTab(tab) {
    currentLawyerTab = tab;
    document.querySelectorAll('#view-dashboard-lawyer .tab-btn').forEach(b => b.classList.remove('active'));
    const btns = document.querySelectorAll('#view-dashboard-lawyer .tab-btn');
    const tabMap = {
        'aceptados': 0,
        'ofrecidos': 1,
        'cerrados': 2,
        'vigentes': 3
    };
    if (tabMap[tab] !== undefined) {
        btns[tabMap[tab]]?.classList.add('active');
    }
    loadLawyerDashboard();
}

async function loadLawyerDashboard() {
    const container = document.getElementById('lawyer-cases-list');
    if (!container) return;
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';

    try {
        let data;
        switch (currentLawyerTab) {
            case 'aceptados':
                data = await getLawyerAcceptedCases();
                break;
            case 'ofrecidos':
                data = await getLawyerOfferedCases();
                break;
            case 'cerrados':
                data = await getLawyerClosedCases();
                break;
            case 'vigentes':
                data = await getAvailableCases();
                break;
            default:
                data = await getLawyerAcceptedCases();
        }

        if (!data.success || !data.data.length) {
            const msgs = {
                'aceptados': 'No tienes casos aceptados aún.',
                'ofrecidos': 'No te has postulado a ningún caso.',
                'cerrados': 'No tienes casos cerrados.',
                'vigentes': 'No hay casos vigentes disponibles.'
            };
            container.innerHTML = `<div class="empty-state"><p>${msgs[currentLawyerTab] || 'No hay casos.'}</p></div>`;
            return;
        }

        container.innerHTML = data.data.map(c => `
            <div class="card case-card">
                <div class="card-header">
                    <h3>${c.titulo}</h3>
                    <span class="badge status-${c.estado || 'abierto'}">${(c.estado || 'abierto').replace('_', ' ')}</span>
                </div>
                <div class="card-body">
                    <p>${c.descripcion || 'Sin descripción'}</p>
                    <p><i class="fas fa-tag"></i> ${c.area_legal}</p>
                    <p><i class="fas fa-user"></i> Cliente: ${c.client_name}</p>
                    ${c.presupuesto ? `<p><i class="fas fa-dollar-sign"></i> Presupuesto: $${c.presupuesto}</p>` : ''}
                    ${c.mensaje ? `<p><i class="fas fa-comment"></i> ${c.mensaje}</p>` : ''}
                </div>
                <div class="card-footer">
                    ${currentLawyerTab === 'vigentes' ? `
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

// ============================================================
// AGENDA (con detalles mejorados)
// ============================================================

async function loadAgenda() {
    const list = document.getElementById('appointment-list');
    if (!list) return;
    list.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
    const role = getRole();
    try {
        let data;
        if (role === 'lawyer') data = await getLawyerAppointments();
        else if (role === 'client') data = await getClientAppointments();
        else {
            list.innerHTML = '<p>Inicia sesión para ver tu agenda.</p>';
            return;
        }

        if (!data.success || !data.data.length) {
            list.innerHTML = '<div class="empty-state"><p>No tenés turnos programados.</p></div>';
            return;
        }

        list.innerHTML = data.data.map(a => `
            <div class="card appointment-card">
                <div class="card-header">
                    <h3>${a.modalidad === 'virtual' ? '💻 Virtual' : '🏢 Presencial'}</h3>
                    <span class="badge status-${a.estado}">${a.estado}</span>
                </div>
                <div class="card-body">
                    <p><i class="fas fa-calendar"></i> ${new Date(a.fecha_hora).toLocaleString()}</p>
                    <p><i class="fas fa-user"></i> ${role === 'lawyer' ? 'Cliente: ' + a.client_name : 'Abogado: ' + a.lawyer_name}</p>
                    ${a.modalidad === 'presencial' && a.direccion ? `<p><i class="fas fa-map-marker-alt"></i> ${a.direccion}</p>` : ''}
                    ${a.case_id ? `<p><i class="fas fa-folder-open"></i> Caso: ${a.case_titulo || 'ID: ' + a.case_id}</p>` : ''}
                    ${a.notas_cliente ? `<p><i class="fas fa-comment"></i> Cliente: ${a.notas_cliente}</p>` : ''}
                    ${a.notas_abogado ? `<p><i class="fas fa-comment"></i> Abogado: ${a.notas_abogado}</p>` : ''}
                    ${a.messages && a.messages.length ? `
                        <div class="appointment-messages">
                            <p><strong>Mensajes:</strong></p>
                            ${a.messages.slice(0, 3).map(m => `
                                <div class="message-mini">
                                    <small>${m.sender_name}: ${m.message}</small>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                ${a.estado === 'pendiente' || a.estado === 'confirmada' ? `
                    <div class="card-footer">
                        ${a.estado === 'pendiente' ? `
                            <button class="btn-primary" onclick="changeAppointmentStatus(${a.id}, 'confirmada')">Confirmar</button>
                        ` : ''}
                        <button class="btn-secondary" onclick="showRescheduleModal(${a.id})">
                            <i class="fas fa-clock"></i> Posponer
                        </button>
                        <button class="btn-danger" onclick="changeAppointmentStatus(${a.id}, 'cancelada')">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                ` : ''}
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
        alert('✅ Estado actualizado');
        loadAgenda();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

function showRescheduleModal(appointmentId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'rescheduleModal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-clock"></i> Posponer turno</h2>
            <label>Nueva fecha y hora</label>
            <input type="datetime-local" id="reschedule-datetime">
            <label>Motivo</label>
            <textarea id="reschedule-reason" rows="2" placeholder="Ej: Necesito cambiar por un imprevisto..."></textarea>
            <div class="btn-group">
                <button class="btn-primary" onclick="submitReschedule(${appointmentId})">Enviar</button>
                <button class="btn-secondary" onclick="closeModal('rescheduleModal')">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function submitReschedule(appointmentId) {
    const dateTime = document.getElementById('reschedule-datetime').value;
    const reason = document.getElementById('reschedule-reason').value;
    if (!dateTime) {
        alert('Seleccioná una nueva fecha y hora');
        return;
    }
    try {
        await rescheduleAppointment(appointmentId, dateTime, reason);
        alert('✅ Solicitud de cambio enviada');
        closeModal('rescheduleModal');
        loadAgenda();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

// ============================================================
// POSTULACIÓN (abogado a caso)
// ============================================================

function showProposalModal(caseId) {
    if (!isLoggedIn()) {
        showLoginModal();
        return;
    }
    if (getRole() !== 'lawyer') {
        alert('Solo los abogados pueden postularse a casos.');
        return;
    }

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

    if (!budget || budget <= 0) {
        alert('Ingresá un presupuesto válido');
        return;
    }

    try {
        await createProposal(currentCaseId, budget, message);
        alert('✅ Propuesta enviada correctamente');
        closeModal('proposalModal');
        loadLawyerDashboard();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

// ============================================================
// MODAL DE TURNO
// ============================================================

function showAppointmentModal(lawyerId) {
    if (!isLoggedIn()) {
        showLoginModal();
        return;
    }
    if (getRole() !== 'client') {
        alert('Solo los clientes pueden solicitar turnos.');
        return;
    }

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
            <label>Dirección (si es presencial)</label>
            <input type="text" id="appointment-direccion" placeholder="Calle y número...">
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
    const direccion = document.getElementById('appointment-direccion').value;
    const notas = document.getElementById('appointment-notas').value;

    if (!dateTime) {
        alert('Seleccioná una fecha y hora');
        return;
    }
    if (modalidad === 'presencial' && !direccion) {
        alert('Ingresá una dirección para el turno presencial');
        return;
    }

    try {
        await createAppointment(lawyerId, dateTime, modalidad, null, notas, direccion);
        alert('✅ Turno solicitado correctamente');
        closeModal('appointmentModal');
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

// ============================================================
// RESEÑAS
// ============================================================

async function showReviewModal(caseId) {
    if (!isLoggedIn()) {
        showLoginModal();
        return;
    }

    // Obtener el abogado del caso
    try {
        const caseData = await getCase(caseId);
        if (!caseData.success) throw new Error('No se pudo obtener el caso');

        // Buscar el abogado asignado (propuesta aceptada)
        const props = await getProposalsByCase(caseId);
        let lawyerId = null;
        let lawyerName = 'No asignado';
        if (props.success && props.data.length) {
            const accepted = props.data.find(p => p.estado === 'aceptada');
            if (accepted) {
                lawyerId = accepted.lawyer_id;
                lawyerName = accepted.lawyer_name;
            }
        }

        if (!lawyerId) {
            alert('No se encontró un abogado asignado a este caso. Solo se pueden calificar casos cerrados con abogado asignado.');
            return;
        }

        currentLawyerIdForReview = lawyerId;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'reviewModal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2><i class="fas fa-star"></i> Dejar reseña</h2>
                <p>Calificando a <strong>${lawyerName}</strong></p>
                <label>Puntuación (1-5)</label>
                <select id="review-rating">
                    <option value="5">5 ⭐ - Excelente</option>
                    <option value="4">4 ⭐ - Muy bueno</option>
                    <option value="3">3 ⭐ - Bueno</option>
                    <option value="2">2 ⭐ - Regular</option>
                    <option value="1">1 ⭐ - Malo</option>
                </select>
                <label>Comentario</label>
                <textarea id="review-comment" rows="3" placeholder="¿Cómo fue tu experiencia con el abogado?"></textarea>
                <label>Resumen del caso</label>
                <textarea id="review-resumen" rows="2" placeholder="Breve resumen de lo que se hizo..."></textarea>
                <div class="btn-group">
                    <button class="btn-primary" onclick="submitReview('${caseId}')">Enviar reseña</button>
                    <button class="btn-secondary" onclick="closeModal('reviewModal')">Cancelar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function submitReview(caseId) {
    const rating = document.getElementById('review-rating').value;
    const comment = document.getElementById('review-comment').value;
    const resumen = document.getElementById('review-resumen').value;

    if (!comment) {
        alert('Por favor, escribí un comentario');
        return;
    }

    try {
        await createReview(currentLawyerIdForReview, caseId, rating, comment, resumen);
        alert('✅ Reseña guardada. ¡Gracias por tu opinión!');
        closeModal('reviewModal');
        loadDashboard();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

// ============================================================
// PUBLICAR CASO
// ============================================================

function showCaseModal() {
    if (!isLoggedIn()) {
        showLoginModal();
        return;
    }
    if (getRole() !== 'client') {
        alert('Solo los clientes pueden publicar casos.');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'caseModal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-file-alt"></i> Publicar caso</h2>
            <label>Título *</label>
            <input type="text" id="case-titulo" placeholder="Ej: Despido injustificado">
            <label>Descripción</label>
            <textarea id="case-descripcion" rows="3" placeholder="Detalla tu situación..."></textarea>
            <label>Área legal *</label>
            <select id="case-area">
                <option value="">Seleccionar...</option>
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
            <label>Provincia</label>
            <select id="case-provincia">
                <option value="">Seleccionar...</option>
                <option value="CABA">CABA</option>
                <option value="Buenos Aires">Buenos Aires</option>
                <option value="Catamarca">Catamarca</option>
                <option value="Chaco">Chaco</option>
                <option value="Chubut">Chubut</option>
                <option value="Córdoba">Córdoba</option>
                <option value="Corrientes">Corrientes</option>
                <option value="Entre Ríos">Entre Ríos</option>
                <option value="Formosa">Formosa</option>
                <option value="Jujuy">Jujuy</option>
                <option value="La Pampa">La Pampa</option>
                <option value="La Rioja">La Rioja</option>
                <option value="Mendoza">Mendoza</option>
                <option value="Misiones">Misiones</option>
                <option value="Neuquén">Neuquén</option>
                <option value="Río Negro">Río Negro</option>
                <option value="Salta">Salta</option>
                <option value="San Juan">San Juan</option>
                <option value="San Luis">San Luis</option>
                <option value="Santa Cruz">Santa Cruz</option>
                <option value="Santa Fe">Santa Fe</option>
                <option value="Santiago del Estero">Santiago del Estero</option>
                <option value="Tierra del Fuego">Tierra del Fuego</option>
                <option value="Tucumán">Tucumán</option>
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

    if (!titulo || !area) {
        alert('Título y área legal son obligatorios');
        return;
    }

    try {
        await createCase(titulo, descripcion, area, provincia, vigencia);
        alert('✅ Caso publicado correctamente');
        closeModal('caseModal');
        loadDashboard();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

// ============================================================
// PERFIL (con edición completa)
// ============================================================

async function loadProfile() {
    const div = document.getElementById('profile-content');
    const role = getRole();
    const userName = localStorage.getItem('bogaya_name') || 'Usuario';
    const userId = localStorage.getItem('bogaya_user_id');

    if (!isLoggedIn()) {
        div.innerHTML = `
            <div class="profile-card">
                <p>Inicia sesión para ver tu perfil.</p>
                <button class="btn-primary" onclick="showLoginModal()">Iniciar sesión</button>
            </div>
        `;
        return;
    }

    if (role === 'lawyer') {
        let profileData = {};
        try {
            const data = await getLawyer(userId);
            if (data.success) profileData = data.data;
        } catch (e) { }

        div.innerHTML = `
            <div class="profile-card">
                <div class="profile-avatar">
                    ${profileData.foto ? `<img src="${profileData.foto}" alt="Foto">` : '<i class="fas fa-user-circle"></i>'}
                </div>
                <h2>${userName}</h2>
                <p class="profile-role">👨‍⚖️ Abogado</p>
                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-value">${profileData.matricula || 'No registrada'}</span>
                        <span class="stat-label">Matrícula</span>
                        ${profileData.verified ? '<span class="badge verified">Verificado</span>' : '<span class="badge">Pendiente</span>'}
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${profileData.especialidad || 'General'}</span>
                        <span class="stat-label">Especialidad</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${profileData.provincia || 'Sin ubicación'}</span>
                        <span class="stat-label">Jurisdicción</span>
                    </div>
                </div>
                ${profileData.bio ? `<p class="profile-bio">${profileData.bio}</p>` : ''}
                <div class="profile-actions">
                    <button class="btn-primary" onclick="showEditProfileModal()">
                        <i class="fas fa-edit"></i> Editar perfil
                    </button>
                    <button class="btn-secondary" onclick="upgradePlan()">
                        <i class="fas fa-crown"></i> Mejorar plan
                    </button>
                </div>
            </div>
        `;
    } else if (role === 'client') {
        div.innerHTML = `
            <div class="profile-card">
                <div class="profile-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <h2>${userName}</h2>
                <p class="profile-role">👤 Cliente</p>
                <div class="profile-actions">
                    <button class="btn-primary" onclick="showEditProfileModal()">
                        <i class="fas fa-edit"></i> Editar perfil
                    </button>
                    <button class="btn-secondary" onclick="navigateTo('dashboard')">
                        <i class="fas fa-folder-open"></i> Mis casos
                    </button>
                </div>
            </div>
        `;
    } else if (role === 'admin') {
        div.innerHTML = `
            <div class="profile-card">
                <div class="profile-avatar">
                    <i class="fas fa-user-shield"></i>
                </div>
                <h2>${userName}</h2>
                <p class="profile-role">🛡️ Administrador</p>
                <div class="profile-actions">
                    <button class="btn-primary" onclick="navigateTo('admin')">
                        <i class="fas fa-shield-alt"></i> Panel de control
                    </button>
                </div>
            </div>
        `;
    }
}

function showEditProfileModal() {
    const role = getRole();
    const userId = localStorage.getItem('bogaya_user_id');

    if (role === 'lawyer') {
        getLawyer(userId).then(data => {
            const p = data.success ? data.data : {};
            const especialidades = p.especialidades ? p.especialidades.split(', ') : [];
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'editProfileModal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width:500px; max-height:90vh; overflow-y:auto;">
                    <h2><i class="fas fa-edit"></i> Editar perfil</h2>
                    <form id="editProfileForm" enctype="multipart/form-data">
                        <label>Nombre completo</label>
                        <input type="text" name="name" value="${p.name || ''}">
                        <label>Email</label>
                        <input type="email" name="email" value="${p.email || ''}">
                        <label>Teléfono</label>
                        <input type="text" name="phone" value="${p.phone || ''}">
                        <label>Matrícula *</label>
                        <input type="text" name="matricula" value="${p.matricula || ''}" required>
                        <label>Especialidades (separadas por coma)</label>
                        <input type="text" name="especialidades" value="${especialidades.join(', ')}" placeholder="Laboral, Civil, Penal">
                        <label>Provincia</label>
                        <select name="provincia">
                            <option value="CABA" ${p.provincia === 'CABA' ? 'selected' : ''}>CABA</option>
                            <option value="Buenos Aires" ${p.provincia === 'Buenos Aires' ? 'selected' : ''}>Buenos Aires</option>
                            <option value="Córdoba" ${p.provincia === 'Córdoba' ? 'selected' : ''}>Córdoba</option>
                            <option value="Santa Fe" ${p.provincia === 'Santa Fe' ? 'selected' : ''}>Santa Fe</option>
                            <option value="Mendoza" ${p.provincia === 'Mendoza' ? 'selected' : ''}>Mendoza</option>
                        </select>
                        <label>Biografía</label>
                        <textarea name="bio" rows="3">${p.bio || ''}</textarea>
                        <label>¿Mostrar teléfono?</label>
                        <select name="mostrar_telefono">
                            <option value="1" ${p.mostrar_telefono == 1 ? 'selected' : ''}>Sí</option>
                            <option value="0" ${p.mostrar_telefono == 0 ? 'selected' : ''}>No</option>
                        </select>
                        <label>Foto de perfil (obligatoria)</label>
                        <input type="file" name="foto" accept="image/*">
                        ${p.foto ? `<img src="${p.foto}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin-top:8px;">` : ''}
                        <div class="btn-group">
                            <button type="submit" class="btn-primary">Guardar</button>
                            <button type="button" class="btn-secondary" onclick="closeModal('editProfileModal')">Cancelar</button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            // Manejar envío del formulario con foto
            document.getElementById('editProfileForm').addEventListener('submit', async function (e) {
                e.preventDefault();
                const formData = new FormData(this);
                try {
                    await updateLawyerProfileFormData(formData);
                    alert('✅ Perfil actualizado');
                    closeModal('editProfileModal');
                    loadProfile();
                } catch (err) {
                    alert('Error: ' + err.message);
                }
            });
        });
    } else {
        // Cliente
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'editProfileModal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:500px;">
                <h2><i class="fas fa-edit"></i> Editar perfil</h2>
                <label>Nombre completo</label>
                <input type="text" id="edit-name" value="${localStorage.getItem('bogaya_name') || ''}">
                <label>Email</label>
                <input type="email" id="edit-email" value="">
                <label>Teléfono</label>
                <input type="text" id="edit-phone" value="">
                <div class="btn-group">
                    <button class="btn-primary" onclick="saveProfile()">Guardar</button>
                    <button class="btn-secondary" onclick="closeModal('editProfileModal')">Cancelar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

async function saveProfile() {
    const role = getRole();
    const userId = localStorage.getItem('bogaya_user_id');

    try {
        if (role === 'lawyer') {
            const data = {
                name: document.getElementById('edit-name').value,
                email: document.getElementById('edit-email').value,
                phone: document.getElementById('edit-phone').value,
                matricula: document.getElementById('edit-matricula').value,
                especialidad: document.getElementById('edit-especialidad').value,
                provincia: document.getElementById('edit-provincia').value,
                bio: document.getElementById('edit-bio').value,
                mostrar_telefono: document.getElementById('edit-mostrar-telefono').value,
                foto: document.getElementById('edit-foto').value
            };

            if (!data.matricula) {
                alert('La matrícula es obligatoria para abogados');
                return;
            }

            await updateLawyerProfile(data);
            // Actualizar nombre en localStorage
            localStorage.setItem('bogaya_name', data.name);
            alert('✅ Perfil actualizado correctamente');
        } else {
            const data = {
                name: document.getElementById('edit-name').value,
                email: document.getElementById('edit-email').value,
                phone: document.getElementById('edit-phone').value
            };
            await updateUserProfile(data);
            localStorage.setItem('bogaya_name', data.name);
            alert('✅ Perfil actualizado correctamente');
        }
        closeModal('editProfileModal');
        loadProfile();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function upgradePlan() {
    const plan = confirm('¿Plan Pro? (Aceptar = Pro, Cancelar = Premium)') ? 'pro' : 'premium';
    try {
        const data = await createPaymentPreference(plan);
        if (data.success && data.data.init_point) {
            window.open(data.data.init_point, '_blank');
        } else {
            alert('Error al crear preferencia de pago');
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

// ============================================================
// PANEL DE ADMINISTRACIÓN
// ============================================================

function switchAdminTab(tab) {
    currentAdminTab = tab;
    document.querySelectorAll('#view-admin .tab-btn').forEach(b => b.classList.remove('active'));
    const btns = document.querySelectorAll('#view-admin .tab-btn');
    const tabMap = {
        'abogados': 0,
        'casos': 1,
        'reseñas': 2,
        'usuarios': 3,
        'estadisticas': 4
    };
    if (tabMap[tab] !== undefined) {
        btns[tabMap[tab]]?.classList.add('active');
    }
    loadAdminPanel();
}

async function loadAdminPanel() {
    const container = document.getElementById('admin-content');
    if (!container) return;
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';

    try {
        switch (currentAdminTab) {
            case 'abogados':
                await loadAdminLawyers(container);
                break;
            case 'casos':
                await loadAdminCases(container);
                break;
            case 'reseñas':
                await loadAdminReviews(container);
                break;
            case 'usuarios':
                await loadAdminUsers(container);
                break;
            case 'estadisticas':
                await loadAdminStats(container);
                break;
        }
    } catch (e) {
        container.innerHTML = '<p class="text-danger">Error: ' + e.message + '</p>';
    }
}

async function loadAdminLawyers(container) {
    const data = await getLawyers('');
    if (!data.success || !data.data.length) {
        container.innerHTML = '<p>No hay abogados registrados.</p>';
        return;
    }

    container.innerHTML = data.data.map(l => `
        <div class="card admin-card">
            <div class="card-header">
                <h3>${l.name}</h3>
                <span class="badge ${l.verified ? 'verified' : ''}">${l.verified ? '✅ Verificado' : '⏳ Pendiente'}</span>
            </div>
            <div class="card-body">
                <p><i class="fas fa-id-card"></i> Matrícula: ${l.matricula || 'No registrada'}</p>
                <p><i class="fas fa-envelope"></i> ${l.email}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${l.provincia || 'Sin jurisdicción'}</p>
                <p><i class="fas fa-tag"></i> ${l.especialidad || 'General'}</p>
            </div>
            <div class="card-footer">
                ${!l.verified ? `
                    <button class="btn-primary" onclick="verifyLawyer(${l.id})">
                        <i class="fas fa-check"></i> Verificar
                    </button>
                ` : `
                    <button class="btn-secondary" onclick="unverifyLawyer(${l.id})">
                        <i class="fas fa-times"></i> Desverificar
                    </button>
                `}
                <button class="btn-danger" onclick="deleteUser(${l.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

async function loadAdminCases(container) {
    const data = await getAllCases();
    if (!data.success || !data.data.length) {
        container.innerHTML = '<p>No hay casos registrados.</p>';
        return;
    }

    container.innerHTML = data.data.map(c => `
        <div class="card admin-card">
            <div class="card-header">
                <h3>${c.titulo}</h3>
                <span class="badge status-${c.estado}">${c.estado}</span>
            </div>
            <div class="card-body">
                <p><i class="fas fa-user"></i> Cliente: ${c.client_name}</p>
                <p><i class="fas fa-tag"></i> ${c.area_legal}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${c.provincia || 'Sin ubicación'}</p>
                <p><i class="fas fa-calendar"></i> ${new Date(c.created_at).toLocaleString()}</p>
                <p><i class="fas fa-users"></i> Propuestas: ${c.proposals_count || 0}</p>
            </div>
            <div class="card-footer">
                <button class="btn-danger" onclick="deleteCase('${c.id}')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

async function loadAdminReviews(container) {
    const data = await getAllReviews();
    if (!data.success || !data.data.length) {
        container.innerHTML = '<p>No hay reseñas registradas.</p>';
        return;
    }

    container.innerHTML = data.data.map(r => `
        <div class="card admin-card">
            <div class="card-header">
                <h3>${r.lawyer_name || 'Abogado ID: ' + r.lawyer_id}</h3>
                <span class="rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
            </div>
            <div class="card-body">
                <p><i class="fas fa-user"></i> Cliente: ${r.client_name || 'Anónimo'}</p>
                <p><i class="fas fa-comment"></i> ${r.comment || 'Sin comentario'}</p>
                ${r.resumen ? `<p><i class="fas fa-file-alt"></i> Resumen: ${r.resumen}</p>` : ''}
                <p><small>${new Date(r.created_at).toLocaleString()}</small></p>
            </div>
            <div class="card-footer">
                <button class="btn-danger" onclick="deleteReview(${r.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

async function loadAdminUsers(container) {
    const data = await getUsers();
    if (!data.success || !data.data.length) {
        container.innerHTML = '<p>No hay usuarios registrados.</p>';
        return;
    }

    container.innerHTML = data.data.map(u => `
        <div class="card admin-card">
            <div class="card-header">
                <h3>${u.name}</h3>
                <span class="badge ${u.role}">${u.role}</span>
            </div>
            <div class="card-body">
                <p><i class="fas fa-envelope"></i> ${u.email}</p>
                ${u.phone ? `<p><i class="fas fa-phone"></i> ${u.phone}</p>` : ''}
                <p><small>Registrado: ${new Date(u.created_at).toLocaleDateString()}</small></p>
            </div>
            <div class="card-footer">
                ${u.role !== 'admin' ? `
                    <button class="btn-primary" onclick="changeUserRole(${u.id}, 'admin')">Hacer admin</button>
                ` : ''}
                <button class="btn-danger" onclick="deleteUser(${u.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

async function loadAdminStats(container) {
    try {
        const stats = await getStats();
        if (!stats.success) {
            container.innerHTML = '<p>Error al cargar estadísticas.</p>';
            return;
        }

        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-number">${stats.data.total_usuarios || 0}</span>
                    <span class="stat-label">Total Usuarios</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${stats.data.total_abogados || 0}</span>
                    <span class="stat-label">Abogados</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${stats.data.total_clientes || 0}</span>
                    <span class="stat-label">Clientes</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${stats.data.total_casos || 0}</span>
                    <span class="stat-label">Casos</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${stats.data.total_reseñas || 0}</span>
                    <span class="stat-label">Reseñas</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${stats.data.total_propuestas || 0}</span>
                    <span class="stat-label">Propuestas</span>
                </div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = '<p class="text-danger">Error: ' + e.message + '</p>';
    }
}

// ============================================================
// ADMIN ACCIONES
// ============================================================

async function verifyLawyer(userId) {
    if (!confirm('¿Verificar este abogado?')) return;
    try {
        await updateLawyerVerification(userId, 1);
        alert('✅ Abogado verificado');
        loadAdminPanel();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function unverifyLawyer(userId) {
    if (!confirm('¿Quitar verificación a este abogado?')) return;
    try {
        await updateLawyerVerification(userId, 0);
        alert('Verificación eliminada');
        loadAdminPanel();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function changeUserRole(userId, role) {
    if (!confirm(`¿Cambiar rol a "${role}"?`)) return;
    try {
        await updateUserRole(userId, role);
        alert('✅ Rol actualizado');
        loadAdminPanel();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function deleteUser(userId) {
    if (!confirm('¿Eliminar este usuario permanentemente?')) return;
    try {
        await deleteUserApi(userId);
        alert('✅ Usuario eliminado');
        loadAdminPanel();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function deleteCase(caseId) {
    if (!confirm('¿Eliminar este caso permanentemente?')) return;
    try {
        await deleteCaseApi(caseId);
        alert('✅ Caso eliminado');
        loadAdminPanel();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function deleteReview(reviewId) {
    if (!confirm('¿Eliminar esta reseña permanentemente?')) return;
    try {
        await deleteReviewApi(reviewId);
        alert('✅ Reseña eliminada');
        loadAdminPanel();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

// ============================================================
// UTILIDADES
// ============================================================

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function isLoggedIn() {
    return !!localStorage.getItem('bogaya_token');
}

function getRole() {
    return localStorage.getItem('bogaya_role') || 'client';
}

// ============================================================
// INICIO
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    const logged = await checkAuth();
    const role = getRole();

    // Ocultar/mostrar navegación según rol
    const navAgenda = document.getElementById('nav-agenda');
    const navDashboard = document.getElementById('nav-dashboard');
    const navSearch = document.getElementById('nav-search');

    if (role === 'admin') {
        navAgenda.style.display = 'none';
        navSearch.style.display = 'none';
        navDashboard.style.display = 'inline-block';
        navDashboard.innerHTML = '<i class="fas fa-shield-alt"></i> Admin';
        navDashboard.dataset.view = 'admin';
        navDashboard.onclick = () => navigateTo('admin');
    } else if (role === 'lawyer') {
        navAgenda.style.display = 'inline-block';
        navSearch.style.display = 'inline-block';
        navDashboard.style.display = 'inline-block';
        navDashboard.innerHTML = '<i class="fas fa-gavel"></i> Dashboard';
        navDashboard.dataset.view = 'dashboard-lawyer';
        navDashboard.onclick = () => navigateTo('dashboard-lawyer');
    } else if (role === 'client') {
        navAgenda.style.display = 'inline-block';
        navSearch.style.display = 'inline-block';
        navDashboard.style.display = 'inline-block';
        navDashboard.innerHTML = '<i class="fas fa-folder-open"></i> Casos';
        navDashboard.dataset.view = 'dashboard';
        navDashboard.onclick = () => navigateTo('dashboard');
    } else {
        // Invitado
        navAgenda.style.display = 'none';
        navDashboard.style.display = 'none';
        navSearch.style.display = 'inline-block';
    }

    if (logged) {
        const userName = localStorage.getItem('bogaya_name') || 'Usuario';
        document.getElementById('user-name').textContent = '👋 ' + userName;
        if (role === 'lawyer') {
            navigateTo('dashboard-lawyer');
        } else if (role === 'client') {
            navigateTo('dashboard');
        } else if (role === 'admin') {
            navigateTo('admin');
        } else {
            navigateTo('home');
        }
        registerPushToken();
    } else {
        navigateTo('home');
    }
});

// ============================================================
// EVENTOS DE CHIPS
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.wizard-chip').forEach(chip => {
        chip.addEventListener('click', function () {
            const texto = this.dataset.texto || this.textContent;
            document.getElementById('problemaTexto').value = texto;
        });
    });
});