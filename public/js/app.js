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

window.navigateTo = function (view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById('view-' + view);
    if (target) target.classList.add('active');
    document.querySelectorAll('#bottom-nav button').forEach(b => b.classList.remove('active'));
    const navBtn = document.querySelector(`#bottom-nav button[data-view="${view}"]`);
    if (navBtn) navBtn.classList.add('active');
    currentView = view;

    const role = window.getRole();

    switch (view) {
        case 'home':
            window.loadEspecialidades();
            break;
        case 'search':
            window.loadSearchFilters();
            break;
        case 'agenda':
            window.loadAgenda();
            break;
        case 'dashboard':
            if (role === 'lawyer') {
                window.navigateTo('dashboard-lawyer');
                return;
            }
            window.loadDashboard();
            break;
        case 'dashboard-lawyer':
            window.loadLawyerDashboard();
            break;
        case 'profile':
            window.loadProfile();
            break;
        case 'admin':
            if (role !== 'admin') {
                alert('No tienes permisos de administrador');
                window.navigateTo('home');
                return;
            }
            window.loadAdminPanel();
            break;
        case 'messages':
            window.loadMessages();
            break;
    }
};

// ============================================================
// HOME - WIZARD (con especialidades estáticas para que cargue rápido)
// ============================================================

window.loadEspecialidades = function () {
    const grid = document.getElementById('especialidadesGrid');
    if (!grid) return;

    const especialidades = [
        'Laboral', 'Civil', 'Penal', 'Familia', 'Comercial',
        'Administrativo', 'Inmobiliario', 'Tributario', 'Ambiental', 'Sucesiones'
    ];

    grid.innerHTML = especialidades.map(esp => `
        <button class="especialidad-chip" onclick="window.searchBySpecialty('${esp}')">
            <i class="fas fa-gavel"></i> ${esp}
        </button>
    `).join('');
};

window.detectSpecialty = function () {
    const texto = document.getElementById('problemaTexto').value;
    const resultado = document.getElementById('wizardResultado');

    if (!texto.trim()) {
        resultado.style.display = 'block';
        resultado.innerHTML = '<p class="text-muted">Escribí una descripción de tu problema.</p>';
        return;
    }

    const keywords = {
        'Laboral': ['despido', 'indemnización', 'sueldo', 'trabajo', 'empleado', 'sindicato', 'accidente laboral'],
        'Familia': ['divorcio', 'alimentos', 'custodia', 'hijos', 'pareja', 'violencia familiar', 'adopción'],
        'Penal': ['denuncia', 'agresión', 'robo', 'hurto', 'lesiones', 'pena', 'cárcel', 'delito'],
        'Civil': ['contrato', 'alquiler', 'daños', 'perjuicios', 'vecino', 'propiedad', 'deuda', 'desalojo'],
        'Comercial': ['sociedad', 'empresa', 'comercio', 'marca', 'patente', 'quiebra'],
        'Administrativo': ['estado', 'municipio', 'permiso', 'habilitación', 'multa', 'recurso', 'amparo'],
        'Inmobiliario': ['compraventa', 'usufructo', 'loteo', 'escritura', 'hipoteca'],
        'Sucesiones': ['herencia', 'testamento', 'fallecimiento', 'sucesión', 'albacea']
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
            detected = esp;
        }
    }

    resultado.style.display = 'block';

    if (detected === 'General' || maxMatches === 0) {
        resultado.innerHTML = `
            <div class="wizard-result-card">
                <h4><i class="fas fa-lightbulb"></i> No pudimos identificar tu área legal</h4>
                <p>Te sugerimos buscar por especialidad manualmente.</p>
                <button class="btn-primary" onclick="window.navigateTo('search')">
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
                    <button class="btn-primary" onclick="window.searchBySpecialty('${detected}')">
                        <i class="fas fa-search"></i> Ver abogados de ${detected}
                    </button>
                    <button class="btn-secondary" onclick="window.navigateTo('search')">
                        <i class="fas fa-sliders-h"></i> Buscar manualmente
                    </button>
                </div>
            </div>
        `;
    }
};

window.searchBySpecialty = function (specialty) {
    const select = document.getElementById('search-especialidad');
    if (select) select.value = specialty;
    window.navigateTo('search');
    setTimeout(window.searchLawyers, 300);
};

// ============================================================
// BUSCADOR
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
    // Usar search-results para la vista de búsqueda, o lawyer-list para home
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

        container.innerHTML = data.data.map(l => renderLawyerCard(l, false)).join('');
        if (container.id === 'search-results') {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } catch (e) {
        container.innerHTML = '<p class="text-danger">Error: ' + e.message + '</p>';
    }
}

window.renderLawyerCard = function (l, showPlan = false) {
    const avgRating = parseFloat(l.avg_rating) || 0;
    const totalRatings = l.total_ratings || 0;
    const stars = window.generateStars(avgRating);

    let recomendaciones = '';
    if (l.recent_reviews && l.recent_reviews.length > 0) {
        recomendaciones = l.recent_reviews.slice(0, 2).map(r => `
            <div class="review-mini">
                <span class="rating">${window.generateStars(r.rating)}</span>
                <p>"${r.comment}"</p>
                <small>— ${r.client_name || 'Cliente'}</small>
            </div>
        `).join('');
    }

    const planBadge = showPlan ? `<span class="badge ${l.plan || 'comun'}">${(l.plan || 'comun').toUpperCase()}</span>` : '';

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
                ${window.getRole() === 'client' ? `
                    <button
                        class="btn-outline"
                        onclick='window.contactLawyer(
                            ${l.id},
                            ${JSON.stringify(l.name || '')},
                            ${JSON.stringify(l.phone || '')},
                            ${JSON.stringify(l.email || '')}
                        )'
                    >
                        <i class="fas fa-comment-dots"></i>
                        Contactar
                    </button>
                ` : ''}
                ${!window.isLoggedIn() || window.getRole() === 'client' ? `
                    <button class="btn-primary" onclick="window.showAppointmentModal(${l.id})">
                        <i class="fas fa-calendar-plus"></i> Solicitar turno
                    </button>
                ` : ''}
            </div>
        </div>
    `;
};

window.generateStars = function (rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
};

// ============================================================
// CONTACTO
// ============================================================

window.openConversation = async function (
    userId,
    userName
) {

    const response =
        await getConversation(userId);

    if (!response.success) {
        alert('No se pudo cargar la conversación');
        return;
    }

    const modal =
        document.createElement('div');

    modal.className = 'modal';
    modal.id = 'conversationModal';

    modal.innerHTML = `
        <div
            class="modal-content"
            style="
                max-width:600px;
                height:80vh;
                display:flex;
                flex-direction:column;
            "
        >

            <h2>
                <i class="fas fa-comments"></i>
                ${userName}
            </h2>

            <div
                id="conversationMessages"
                style="
                    flex:1;
                    overflow-y:auto;
                    padding:10px;
                "
            >

                ${response.data.length
            ? response.data.map(m => {

                const mine =
                    Number(m.sender_id) ===
                    Number(
                        localStorage.getItem(
                            'bogaya_user_id'
                        )
                    );

                return `
                                <div
                                    style="
                                        text-align:${mine ? 'right' : 'left'};
                                        margin-bottom:10px;
                                    "
                                >
                                    <div
                                        style="
                                            display:inline-block;
                                            padding:10px 14px;
                                            border-radius:15px;
                                            max-width:80%;
                                        "
                                    >
                                        ${m.message}
                                    </div>

                                    <small>
                                        ${new Date(
                    m.created_at
                ).toLocaleString()}
                                    </small>
                                </div>
                            `;

            }).join('')
            : `
                            <div class="empty-state">
                                <p>
                                    Iniciá la conversación.
                                </p>
                            </div>
                          `
        }

            </div>

            <textarea
                id="conversationInput"
                rows="2"
                placeholder="Escribí un mensaje..."
            ></textarea>

            <div class="btn-group">

                <button
                    class="btn-primary"
                    onclick="window.sendConversationMessage(${userId})"
                >
                    <i class="fas fa-paper-plane"></i>
                    Enviar
                </button>

                <button
                    class="btn-secondary"
                    onclick="window.closeModal('conversationModal')"
                >
                    Cerrar
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);
};

window.sendConversationMessage = async function (receiverId) {

    const input =
        document.getElementById(
            'conversationInput'
        );

    const message =
        input.value.trim();

    if (!message) {
        return;
    }

    try {

        await sendMessageApi(
            receiverId,
            message
        );

        input.value = '';

        await window.openConversation(
            receiverId,
            ''
        );

    } catch (e) {

        alert(
            'Error: ' +
            e.message
        );
    }
};

window.contactLawyer = function (lawyerId, name, phone, email) {
    if (!window.isLoggedIn()) {
        window.showLoginModal();
        return;
    }
    if (window.getRole() !== 'client') {
        alert('Solo los clientes pueden contactar a abogados.');
        return;
    }
    window.showContactModal(lawyerId, name, phone, email);
};

window.showContactModal = function (lawyerId, name, phone, email) {
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
                <button class="btn-primary" onclick="window.sendMessage(${lawyerId})">Enviar</button>
                <button class="btn-secondary" onclick="window.closeModal('contactModal')">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.sendMessage = async function (receiverId) {
    const message =
        document.getElementById(
            'contact-message'
        ).value.trim();

    if (!message) {
        alert('Escribí un mensaje');
        return;
    }

    try {

        await window.sendMessageApi(
            receiverId,
            message
        );

        alert(
            '✅ Mensaje enviado'
        );

        window.closeModal(
            'contactModal'
        );

        await window.updateMessagesBadge();

    } catch (e) {

        alert(
            'Error: ' +
            e.message
        );
    }
};

// ============================================================
// DASHBOARD CLIENTE
// ============================================================

window.loadDashboard = async function () {
    const container = document.getElementById('my-cases');
    if (!container) return;
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando tus casos...</div>';

    try {
        const data = await window.getMyCases();
        if (!data.success || !data.data.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>No tenés casos activos.</p>
                    <button class="btn-primary" onclick="window.showCaseModal()">Publicar caso</button>
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
                    ${c.estado !== 'cerrado' ? `
                        <button class="btn-secondary" onclick="window.closeCase('${c.id}')">
                            <i class="fas fa-check"></i> Cerrar caso
                        </button>
                    ` : ''}
                    ${c.estado === 'cerrado' ? `
                        <button class="btn-primary" onclick="window.showReviewModal('${c.id}')">
                            <i class="fas fa-star"></i> Dejar reseña
                        </button>
                    ` : ''}
                    <button class="btn-outline" onclick="window.viewProposals('${c.id}')">
                        <i class="fas fa-users"></i> Ver propuestas (${c.proposals_count || 0})
                    </button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<p class="text-danger">Error: ' + e.message + '</p>';
    }
};

window.viewProposals = async function (caseId) {
    try {
        const data = await window.getProposalsByCase(caseId);
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
                                <button class="btn-primary" onclick="window.acceptProposal(${p.id}, '${caseId}')">
                                    <i class="fas fa-check"></i> Aceptar
                                </button>
                                <button class="btn-secondary" onclick="window.rejectProposal(${p.id}, '${caseId}')">
                                    <i class="fas fa-times"></i> Rechazar
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
                <button class="btn-secondary btn-block" onclick="window.closeModal('proposalsModal')">Cerrar</button>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

window.acceptProposal = async function (proposalId, caseId) {
    if (!confirm('¿Aceptar esta propuesta?')) return;
    try {
        await window.updateProposalStatus(proposalId, 'aceptada');
        alert('✅ Propuesta aceptada. El abogado será notificado.');
        window.closeModal('proposalsModal');
        window.loadDashboard();
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

window.rejectProposal = async function (proposalId, caseId) {
    if (!confirm('¿Rechazar esta propuesta?')) return;
    try {
        await window.updateProposalStatus(proposalId, 'rechazada');
        alert('✅ Propuesta rechazada.');
        window.closeModal('proposalsModal');
        window.loadDashboard();
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

window.closeCase = async function (caseId) {

    const role = window.getRole();

    const mensaje = role === 'lawyer'
        ? '¿Confirmás que el trabajo de este caso ya terminó y querés cerrarlo?'
        : '¿Estás seguro que querés cerrar este caso? Una vez cerrado, el Cliente podrá dejar una reseña.';

    if (!confirm(mensaje)) {
        return;
    }

    try {

        await window.closeCaseApi(caseId);

        alert(
            '✅ Caso cerrado correctamente'
        );

        if (role === 'lawyer') {
            await window.loadLawyerDashboard();
        } else {
            await window.loadDashboard();
        }

    } catch (e) {

        alert(
            'Error: ' +
            e.message
        );
    }
};

// ============================================================
// DASHBOARD ABOGADO
// ============================================================

window.switchLawyerTab = function (tab) {
    currentLawyerTab = tab;
    const btns = document.querySelectorAll('#view-dashboard-lawyer .tab-btn');
    btns.forEach(b => b.classList.remove('active'));
    const tabMap = { 'aceptados': 0, 'ofrecidos': 1, 'cerrados': 2, 'vigentes': 3 };
    if (tabMap[tab] !== undefined) btns[tabMap[tab]]?.classList.add('active');
    window.loadLawyerDashboard();
};

window.loadLawyerDashboard = async function () {
    const container = document.getElementById('lawyer-cases-list');
    if (!container) return;
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';

    try {
        let data;
        switch (currentLawyerTab) {
            case 'aceptados': data = await window.getLawyerAcceptedCases(); break;
            case 'ofrecidos': data = await window.getLawyerOfferedCases(); break;
            case 'cerrados': data = await window.getLawyerClosedCases(); break;
            case 'vigentes': data = await window.getAvailableCases(); break;
            default: data = await window.getLawyerAcceptedCases();
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
                        <button
                            class="btn-primary"
                            onclick="window.showProposalModal('${c.id}')"
                        >
                            <i class="fas fa-paper-plane"></i>
                            Postularme
                        </button>
                    ` : ''}

                    ${currentLawyerTab === 'aceptados' &&
                c.estado !== 'cerrado' ? `
                        <button
                            class="btn-secondary"
                            onclick="window.closeCase('${c.id}')"
                        >
                            <i class="fas fa-check-circle"></i>
                            Cerrar caso
                        </button>
                    ` : ''}

                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<p class="text-danger">Error: ' + e.message + '</p>';
    }
};

// ============================================================
// AGENDA
// ============================================================

window.loadAgenda = async function () {
    const list = document.getElementById('appointment-list');
    if (!list) return;
    list.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
    const role = window.getRole();
    try {
        let data;
        if (role === 'lawyer') data = await window.getLawyerAppointments();
        else if (role === 'client') data = await window.getClientAppointments();
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
                    <span class="badge ${a.estado}">${a.estado}</span>
                </div>
                <div class="card-body">
                    <p><i class="fas fa-calendar"></i> ${new Date(a.fecha_hora).toLocaleString()}</p>
                    <p><i class="fas fa-user"></i> ${role === 'lawyer' ? 'Cliente: ' + a.client_name : 'Abogado: ' + a.lawyer_name}</p>
                    ${a.direccion ? `<p><i class="fas fa-map-marker-alt"></i> ${a.direccion}</p>` : ''}
                    ${a.case_id ? `<p><i class="fas fa-folder-open"></i> Caso: ${a.case_titulo || 'ID: ' + a.case_id}</p>` : ''}
                    ${a.notas_cliente ? `<p><i class="fas fa-comment"></i> Cliente: ${a.notas_cliente}</p>` : ''}
                    ${a.notas_abogado ? `<p><i class="fas fa-comment"></i> Abogado: ${a.notas_abogado}</p>` : ''}
                </div>
                ${a.estado === 'pendiente' || a.estado === 'confirmada' ? `
                    <div class="card-footer">
                        ${a.estado === 'pendiente' && role === 'lawyer' ? `
                            <button class="btn-primary" onclick="window.changeAppointmentStatus(${a.id}, 'confirmada')">Confirmar</button>
                        ` : ''}
                        <button class="btn-secondary" onclick="window.showRescheduleModal(${a.id})">
                            <i class="fas fa-clock"></i> Posponer
                        </button>
                        <button class="btn-danger" onclick="window.changeAppointmentStatus(${a.id}, 'cancelada')">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    } catch (e) {
        list.innerHTML = '<p class="text-danger">Error: ' + e.message + '</p>';
    }
};

window.changeAppointmentStatus = async function (id, status) {
    if (!confirm(`¿Cambiar estado a "${status}"?`)) return;
    try {
        await window.updateAppointmentStatus(id, status);
        alert('✅ Estado actualizado');
        window.loadAgenda();
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

window.showRescheduleModal = function (appointmentId) {
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
                <button class="btn-primary" onclick="window.submitReschedule(${appointmentId})">Enviar</button>
                <button class="btn-secondary" onclick="window.closeModal('rescheduleModal')">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.submitReschedule = async function (appointmentId) {
    const dateTime = document.getElementById('reschedule-datetime').value;
    const reason = document.getElementById('reschedule-reason').value;
    if (!dateTime) {
        alert('Seleccioná una nueva fecha y hora');
        return;
    }
    try {
        await window.rescheduleAppointment(appointmentId, dateTime, reason);
        alert('✅ Solicitud de cambio enviada');
        window.closeModal('rescheduleModal');
        window.loadAgenda();
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

// ============================================================
// POSTULACIÓN (abogado a caso)
// ============================================================

window.showProposalModal = function (caseId) {
    if (!window.isLoggedIn()) {
        window.showLoginModal();
        return;
    }
    if (window.getRole() !== 'lawyer') {
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
                <button class="btn-primary" onclick="window.submitProposal()">Enviar propuesta</button>
                <button class="btn-secondary" onclick="window.closeModal('proposalModal')">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.submitProposal = async function () {
    const budget = document.getElementById('proposal-budget').value;
    const message = document.getElementById('proposal-message').value;

    if (!budget || budget <= 0) {
        alert('Ingresá un presupuesto válido');
        return;
    }

    try {
        await window.createProposal(currentCaseId, budget, message);
        alert('✅ Propuesta enviada correctamente');
        window.closeModal('proposalModal');
        window.loadLawyerDashboard();
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

// ============================================================
// MODAL DE TURNO
// ============================================================

window.showAppointmentModal = function (lawyerId) {
    if (!window.isLoggedIn()) {
        window.showLoginModal();
        return;
    }
    if (window.getRole() !== 'client') {
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
                <button class="btn-primary" onclick="window.submitAppointment(${lawyerId})">Solicitar</button>
                <button class="btn-secondary" onclick="window.closeModal('appointmentModal')">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.submitAppointment = async function (lawyerId) {
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
        await window.createAppointment(lawyerId, dateTime, modalidad, null, notas, direccion);
        alert('✅ Turno solicitado correctamente');
        window.closeModal('appointmentModal');
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

// ============================================================
// PUBLICAR CASO
// ============================================================

window.showCaseModal = function () {
    if (!window.isLoggedIn()) {
        window.showLoginModal();
        return;
    }
    if (window.getRole() !== 'client') {
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
                <button class="btn-primary" onclick="window.submitCase()">Publicar</button>
                <button class="btn-secondary" onclick="window.closeModal('caseModal')">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.submitCase = async function () {
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
        await window.createCase(titulo, descripcion, area, provincia, vigencia);
        alert('✅ Caso publicado correctamente');
        window.closeModal('caseModal');
        window.loadDashboard();
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

// ============================================================
// RESEÑAS
// ============================================================

window.showReviewModal = async function (caseId) {
    if (!window.isLoggedIn()) {
        window.showLoginModal();
        return;
    }

    try {
        const caseData = await window.getCase(caseId);
        if (!caseData.success) throw new Error('No se pudo obtener el caso');

        const props = await window.getProposalsByCase(caseId);
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
            alert('No se encontró un abogado asignado a este caso.');
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
                    <button class="btn-primary" onclick="window.submitReview('${caseId}')">Enviar reseña</button>
                    <button class="btn-secondary" onclick="window.closeModal('reviewModal')">Cancelar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

window.submitReview = async function (caseId) {
    const rating = document.getElementById('review-rating').value;
    const comment = document.getElementById('review-comment').value;
    const resumen = document.getElementById('review-resumen').value;

    if (!comment) {
        alert('Por favor, escribí un comentario');
        return;
    }

    try {
        await window.createReview(currentLawyerIdForReview, caseId, rating, comment, resumen);
        alert('✅ Reseña guardada. ¡Gracias por tu opinión!');
        window.closeModal('reviewModal');
        window.loadDashboard();
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

// ============================================================
// PERFIL
// ============================================================

window.getAvatarUrl = function (avatarCode) {
    if (!avatarCode) {
        avatarCode = 'avatar_01';
    }

    return (
        '/bogaya/public/avatars/' +
        encodeURIComponent(avatarCode) +
        '.png'
    );
};

window.loadProfile = async function () {
    const div = document.getElementById('profile-content');
    const role = window.getRole();
    const userName = localStorage.getItem('bogaya_name') || 'Usuario';
    const userId = localStorage.getItem('bogaya_user_id');

    if (!window.isLoggedIn()) {
        div.innerHTML = `
            <div class="profile-card">
                <p>Inicia sesión para ver tu perfil.</p>
                <button class="btn-primary" onclick="window.showLoginModal()">Iniciar sesión</button>
            </div>
        `;
        return;
    }

    if (role === 'lawyer') {
        let profileData = {};
        try {
            const data = await window.getLawyer(userId);
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
                        ${profileData.verified ? '<span class="badge verified">Verificado</span>' : '<span class="badge pending">Pendiente</span>'}
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${profileData.especialidades || 'General'}</span>
                        <span class="stat-label">Especialidad</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${profileData.provincia || 'Sin ubicación'}</span>
                        <span class="stat-label">Jurisdicción</span>
                    </div>
                </div>
                ${profileData.bio ? `<p class="profile-bio">${profileData.bio}</p>` : ''}
                <div class="profile-actions">
                    <button class="btn-primary" onclick="window.showEditProfileModal()">
                        <i class="fas fa-edit"></i> Editar perfil
                    </button>
                    <button class="btn-secondary" onclick="window.upgradePlan()">
                        <i class="fas fa-crown"></i> Mejorar plan
                    </button>
                </div>
            </div>
        `;
    } else if (role === 'client') {
        let clientProfile = {};

        try {

            const response =
                await getUserProfile();

            if (
                response.success
            ) {
                clientProfile =
                    response.data;
            }

        } catch (e) {

            console.warn(
                'No se pudo cargar perfil cliente',
                e
            );
        }

        div.innerHTML = `
                <div class="profile-card">

                    <div class="profile-avatar">

                        <img
                            src="${window.getAvatarUrl(
            clientProfile.avatar
        )}"
                            alt="Avatar"
                            style="
                                width:100%;
                                height:100%;
                                object-fit:cover;
                                border-radius:50%;
                            "
                        >

                    </div>

                    <h2>
                        ${clientProfile.name || userName}
                    </h2>

                    <p class="profile-role">
                        👤 Cliente
                    </p>

                    <div class="profile-actions">

                        <button
                            class="btn-primary"
                            onclick="window.showEditProfileModal()"
                        >
                            <i class="fas fa-edit"></i>
                            Editar perfil
                        </button>

                        <button
                            class="btn-secondary"
                            onclick="window.navigateTo('dashboard')"
                        >
                            <i class="fas fa-folder-open"></i>
                            Mis casos
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
                    <button class="btn-primary" onclick="window.navigateTo('admin')">
                        <i class="fas fa-shield-alt"></i> Panel de control
                    </button>
                </div>
            </div>
        `;
    }
};



// ============================================================
// EDICIÓN DE PERFIL - ABOGADO (con todos los campos)
// ============================================================

async function showEditProfileModal() {
    const role = getRole();

    const userId =
        localStorage.getItem(
            'bogaya_user_id'
        );

    if (!userId) {
        alert('Sesión inválida. Volvé a iniciar sesión.');
        return;
    }

    // ========================================================
    // ABOGADO
    // ========================================================

    if (role === 'lawyer') {
        try {
            const data =
                await getLawyer(userId);

            const p =
                data.success
                    ? data.data
                    : {};

            const especialidades =
                p.especialidades
                    ? p.especialidades
                        .split(',')
                        .map(e => e.trim())
                        .filter(Boolean)
                    : [];

            const modal =
                document.createElement('div');

            modal.className = 'modal';
            modal.id = 'editProfileModal';

            modal.innerHTML = `
                <div class="modal-content"
                     style="max-width:500px; max-height:90vh; overflow-y:auto;">

                    <h2>
                        <i class="fas fa-edit"></i>
                        Editar perfil
                    </h2>

                    <form id="editProfileForm"
                          enctype="multipart/form-data">

                        <label>Nombre completo</label>

                        <input
                            type="text"
                            name="name"
                            value="${p.name || ''}"
                            required
                        >

                        <label>Email</label>

                        <input
                            type="email"
                            name="email"
                            id="edit-email"
                            value="${p.email || ''}"
                            required
                            readonly
                        >

                        <label>Teléfono</label>

                        <input
                            type="text"
                            name="phone"
                            value="${p.phone || ''}"
                        >

                        <label>Matrícula *</label>

                        <input
                            type="text"
                            name="matricula"
                            value="${p.matricula || ''}"
                            required
                        >

                        <label>
                            Especialidades
                        </label>

                        <select
                            name="especialidades[]"
                            multiple
                            size="7"
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

                        <label>Provincia</label>

                        <select name="provincia">

                            <option value="CABA"
                                ${p.provincia === 'CABA' ? 'selected' : ''}>
                                CABA
                            </option>

                            <option value="Buenos Aires"
                                ${p.provincia === 'Buenos Aires' ? 'selected' : ''}>
                                Buenos Aires
                            </option>

                            <option value="Córdoba"
                                ${p.provincia === 'Córdoba' ? 'selected' : ''}>
                                Córdoba
                            </option>

                            <option value="Santa Fe"
                                ${p.provincia === 'Santa Fe' ? 'selected' : ''}>
                                Santa Fe
                            </option>

                            <option value="Mendoza"
                                ${p.provincia === 'Mendoza' ? 'selected' : ''}>
                                Mendoza
                            </option>

                            <option value="Tucumán"
                                ${p.provincia === 'Tucumán' ? 'selected' : ''}>
                                Tucumán
                            </option>

                            <option value="Salta"
                                ${p.provincia === 'Salta' ? 'selected' : ''}>
                                Salta
                            </option>

                            <option value="Jujuy"
                                ${p.provincia === 'Jujuy' ? 'selected' : ''}>
                                Jujuy
                            </option>

                            <option value="La Pampa"
                                ${p.provincia === 'La Pampa' ? 'selected' : ''}>
                                La Pampa
                            </option>

                            <option value="Río Negro"
                                ${p.provincia === 'Río Negro' ? 'selected' : ''}>
                                Río Negro
                            </option>

                            <option value="Neuquén"
                                ${p.provincia === 'Neuquén' ? 'selected' : ''}>
                                Neuquén
                            </option>

                            <option value="Chubut"
                                ${p.provincia === 'Chubut' ? 'selected' : ''}>
                                Chubut
                            </option>

                            <option value="Santa Cruz"
                                ${p.provincia === 'Santa Cruz' ? 'selected' : ''}>
                                Santa Cruz
                            </option>

                            <option value="Tierra del Fuego"
                                ${p.provincia === 'Tierra del Fuego' ? 'selected' : ''}>
                                Tierra del Fuego
                            </option>

                        </select>

                        <label>Biografía</label>

                        <textarea
                            name="bio"
                            rows="3"
                        >${p.bio || ''}</textarea>

                        <label>
                            Costo de consulta (ARS)
                        </label>

                        <input
                            type="number"
                            name="costo_consulta"
                            value="${p.costo_consulta || 0}"
                            step="0.01"
                            min="0"
                        >

                        <label>
                            Modalidades de atención
                        </label>

                        <div
                            style="
                                display:flex;
                                gap:16px;
                                margin:4px 0 8px;
                            "
                        >

                            <label>
                                <input
                                    type="checkbox"
                                    name="virtual"
                                    value="1"
                                    ${p.virtual ? 'checked' : ''}
                                >
                                Virtual
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    name="presencial"
                                    value="1"
                                    ${p.presencial ? 'checked' : ''}
                                >
                                Presencial
                            </label>

                        </div>

                        <label>
                            ¿Mostrar teléfono?
                        </label>

                        <select name="mostrar_telefono">

                            <option
                                value="1"
                                ${p.mostrar_telefono == 1 ? 'selected' : ''}
                            >
                                Sí
                            </option>

                            <option
                                value="0"
                                ${p.mostrar_telefono == 0 ? 'selected' : ''}
                            >
                                No
                            </option>

                        </select>

                        <label>
                            Foto de perfil
                        </label>

                        <input
                            type="file"
                            name="foto"
                            accept="image/jpeg,image/png,image/webp"
                        >

                        ${p.foto
                    ? `
                                    <img
                                        src="${p.foto}"
                                        alt="Foto de perfil actual"
                                        style="
                                            width:80px;
                                            height:80px;
                                            border-radius:50%;
                                            object-fit:cover;
                                            margin-top:8px;
                                        "
                                    >
                                  `
                    : ''
                }

                        <div class="btn-group">

                            <button
                                type="submit"
                                class="btn-primary"
                            >
                                Guardar
                            </button>

                            <button
                                type="button"
                                class="btn-secondary"
                                onclick="closeModal('editProfileModal')"
                            >
                                Cancelar
                            </button>

                        </div>

                    </form>

                </div>
            `;

            document.body.appendChild(modal);

            const form =
                document.getElementById(
                    'editProfileForm'
                );

            form.addEventListener(
                'submit',
                async function (e) {
                    e.preventDefault();

                    const submitButton =
                        form.querySelector(
                            'button[type="submit"]'
                        );

                    const originalText =
                        submitButton.innerHTML;

                    submitButton.disabled = true;
                    submitButton.innerHTML =
                        '<i class="fas fa-spinner fa-spin"></i> Guardando...';

                    try {
                        const formData =
                            new FormData(form);

                        const response =
                            await updateLawyerProfileFormData(
                                formData
                            );

                        // Actualizar nombre del usuario
                        // que usa el frontend en varios lugares.
                        const name =
                            formData.get('name');

                        if (name) {
                            localStorage.setItem(
                                'bogaya_name',
                                name
                            );
                        }

                        alert(
                            '✅ Perfil actualizado correctamente'
                        );

                        closeModal(
                            'editProfileModal'
                        );

                        await loadProfile();

                    } catch (err) {
                        alert(
                            'Error: ' +
                            err.message
                        );

                        submitButton.disabled = false;
                        submitButton.innerHTML =
                            originalText;
                    }
                }
            );

        } catch (e) {
            alert(
                'No se pudo cargar el perfil: ' +
                e.message
            );
        }

        return;
    }

    // ========================================================
    // CLIENTE
    // ========================================================

    if (role === 'client') {

        // ==========================================
        // CLIENTE
        // ==========================================

        try {

            const response =
                await getUserProfile();

            const p =
                response.success
                    ? response.data
                    : {};

            const avatarsResponse =
                await getAvatars();

            const avatars =
                avatarsResponse.success &&
                    Array.isArray(
                        avatarsResponse.data
                    )
                    ? avatarsResponse.data
                    : [];

            const modal =
                document.createElement('div');

            modal.className = 'modal';
            modal.id = 'editProfileModal';

            modal.innerHTML = `<div class="modal-content" style="max-width:520px; max-height:90vh; overflow-y:auto;">
                <h2><i class="fas fa-user-edit"></i>Editar perfil</h2>
                <label>Nombre completo</label>
                <input type="text" id="edit-name" value="${p.name || ''}" required>
                <label>Email</label>
                <input type="email" value="${p.email || ''}"  id="edit-email" readonly>
                <small style="display:block; margin:4px 0 12px; color:#64748b;">
                    🔒 El email es tu identificador de cuenta
                    y no puede modificarse.
                </small>
                <label>Teléfono</label>
                <input type="text" id="edit-phone" value="${p.phone || ''}">
                <label>Elegí tu avatar</label>
                <div id="avatar-selector" style="display:grid; grid-template-columns: repeat(5, 1fr); gap:10px; margin-top:10px; margin-bottom:15px;">
                ${avatars.map(a => `<button type="button"
                        class="avatar-option"
                        data-avatar="${a.codigo}"
                        title="${a.nombre}"
                        onclick="window.selectAvatar('${a.codigo}')"  style="border:2px solid ${a.codigo === (p.avatar || 'avatar_01') ? '#2563eb' : '#e5e7eb'};
                            background:#fff;
                            border-radius:14px;
                            padding:6px;
                            cursor:pointer;
                        "
                    >
                    <img
                        src="${window.getAvatarUrl(a.codigo)}"
                        alt="${a.nombre}"
                        style="
                            width:100%;
                                aspect-ratio:1;
                                object-fit:cover;
                                border-radius:10px;
                            "
                    >
                    <small>${a.nombre}</small>
                    </button>
                `).join('')
                }
        <input
            type="hidden"
            id="edit-avatar"
            value="${p.avatar || 'avatar_01'}"
        >
</div>
        <div class="btn-group">

            <button
                class="btn-primary"
                onclick="saveClientProfile()"
            >
                <i class="fas fa-save"></i>
                Guardar
            </button>

            <button
                class="btn-secondary"
                onclick="closeModal('editProfileModal')"
            >
                Cancelar
            </button>

        </div>

    </div>
`;
            document.body.appendChild(modal);

        } catch (e) {

            alert(
                'No se pudo cargar el perfil: ' +
                e.message
            );
        }

    }
}

async function saveClientProfile() {
    const name =
        document.getElementById(
            'edit-name'
        ).value.trim();

    const email =
        document.getElementById(
            'edit-email'
        ).value.trim();

    const phone =
        document.getElementById(
            'edit-phone'
        ).value.trim();

    const avatar =
        document.getElementById(
            'edit-avatar'
        ).value || 'avatar_01';

    if (!name) {
        alert(
            'El nombre es obligatorio.'
        );
        return;
    }

    if (!email) {
        alert(
            'El email es obligatorio.'
        );
        return;
    }

    const data = {
        name,
        email,
        phone,
        avatar
    };

    try {
        await updateUserProfile(data);

        // El frontend usa este valor en
        // el encabezado/perfil.
        localStorage.setItem(
            'bogaya_name',
            name
        );

        alert(
            '✅ Perfil actualizado'
        );

        closeModal(
            'editProfileModal'
        );

        await loadProfile();

    } catch (e) {
        alert(
            'Error: ' +
            e.message
        );
    }
}

window.upgradePlan = async function () {
    const plan = confirm('¿Plan Pro? (Aceptar = Pro, Cancelar = Premium)') ? 'pro' : 'premium';
    try {
        const data = await window.createPaymentPreference(plan);
        if (data.success && data.data.init_point) {
            window.open(data.data.init_point, '_blank');
        } else {
            alert('Error al crear preferencia de pago');
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

// ============================================================
// ADMIN PANEL
// ============================================================

window.switchAdminTab = function (tab) {
    currentAdminTab = tab;
    const btns = document.querySelectorAll('#view-admin .tab-btn');
    btns.forEach(b => b.classList.remove('active'));
    const tabMap = { 'abogados': 0, 'casos': 1, 'reseñas': 2, 'usuarios': 3, 'estadisticas': 4, 'pendientes': 5 };
    if (tabMap[tab] !== undefined) btns[tabMap[tab]]?.classList.add('active');
    window.loadAdminPanel();
};

window.loadAdminPanel = async function () {
    const container = document.getElementById('admin-content');
    if (!container) return;
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';

    try {
        switch (currentAdminTab) {
            case 'abogados': await window.loadAdminLawyers(container); break;
            case 'casos': await window.loadAdminCases(container); break;
            case 'reseñas': await window.loadAdminReviews(container); break;
            case 'usuarios': await window.loadAdminUsers(container); break;
            case 'estadisticas': await window.loadAdminStats(container); break;
            case 'pendientes': await window.loadAdminPending(container); break;
        }
    } catch (e) {
        container.innerHTML = '<p class="text-danger">Error: ' + e.message + '</p>';
    }
};

window.loadAdminLawyers = async function (container) {
    const data = await window.getLawyers('');
    if (!data.success || !data.data.length) {
        container.innerHTML = '<p>No hay abogados registrados.</p>';
        return;
    }

    container.innerHTML = data.data.map(l => `
        <div class="card admin-card">
            <div class="card-header">
                <h3>${l.name}</h3>
                <div>
                    <span class="badge ${l.verified ? 'verified' : 'pending'}">${l.verified ? '✅ Matrícula verificada' : '⏳ Matrícula pendiente'}</span>
                    <span class="badge ${l.email_verified ? 'email_verified' : 'email_pending'}">${l.email_verified ? '✅ Email verificado' : '⏳ Email pendiente'}</span>
                </div>
            </div>
            <div class="card-body">
                <p><i class="fas fa-id-card"></i> Matrícula: ${l.matricula || 'No registrada'}</p>
                <p><i class="fas fa-envelope"></i> ${l.email}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${l.provincia || 'Sin jurisdicción'}</p>
                <p><i class="fas fa-tag"></i> ${l.especialidades || 'General'}</p>
            </div>
            <div class="card-footer">
                ${!l.verified ? `
                    <button class="btn-primary" onclick="window.verifyMatricula(${l.id}, 1)">
                        <i class="fas fa-check"></i> Verificar matrícula
                    </button>
                ` : `
                    <button class="btn-secondary" onclick="window.verifyMatricula(${l.id}, 0)">
                        <i class="fas fa-times"></i> Desverificar
                    </button>
                `}
                ${!l.email_verified ? `
                    <button
                        class="btn-primary"
                        onclick="window.verifyEmailAdmin(${l.id})"
                    >
                        <i class="fas fa-envelope"></i>
                        Verificar email
                    </button>
                ` : ''}
                
                <button class="btn-secondary" onclick="window.showResetPasswordModal(${l.id})">
                    <i class="fas fa-key"></i> Resetear password
                </button>
                <button class="btn-danger" onclick="window.deleteUser(${l.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');
};

window.loadAdminPending = async function (container) {
    try {
        const pending = await window.getPendingVerifications();
        if (!pending.success) {
            container.innerHTML = '<p>Error al cargar pendientes.</p>';
            return;
        }

        let html = '';

        if (pending.data.pending_email && pending.data.pending_email.length) {
            html += `<h3>📧 Emails pendientes de verificar</h3>`;
            html += pending.data.pending_email.map(u => `
                <div class="card admin-card">
                    <div class="card-header">
                        <h3>${u.name}</h3>
                        <span class="badge pending">⏳ Pendiente</span>
                    </div>
                    <div class="card-body">
                        <p><i class="fas fa-envelope"></i> ${u.email}</p>
                        <p><i class="fas fa-tag"></i> ${u.role}</p>
                    </div>
                    <div class="card-footer">
                        <button class="btn-primary" onclick="window.verifyEmailAdmin(${u.id})">
                            <i class="fas fa-check"></i> Verificar email
                        </button>
                    </div>
                </div>
            `).join('');
        }

        if (pending.data.pending_matricula && pending.data.pending_matricula.length) {
            html += `<h3>🪪 Matrículas pendientes de verificar</h3>`;
            html += pending.data.pending_matricula.map(u => `
                <div class="card admin-card">
                    <div class="card-header">
                        <h3>${u.name}</h3>
                        <span class="badge pending">⏳ Pendiente</span>
                    </div>
                    <div class="card-body">
                        <p><i class="fas fa-id-card"></i> Matrícula: ${u.matricula}</p>
                        <p><i class="fas fa-envelope"></i> ${u.email}</p>
                    </div>
                    <div class="card-footer">
                        <button class="btn-primary" onclick="window.verifyMatricula(${u.id}, 1)">
                            <i class="fas fa-check"></i> Verificar matrícula
                        </button>
                    </div>
                </div>
            `).join('');
        }

        if (!html) {
            html = '<p>✅ No hay pendientes de verificación.</p>';
        }
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '<p class="text-danger">Error: ' + e.message + '</p>';
    }
};

window.loadAdminCases = async function (container) {
    const data = await window.getAllCases();
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
                <p><i class="fas fa-users"></i> Propuestas: ${c.proposals_count || 0}</p>
            </div>
            <div class="card-footer">
                <button class="btn-danger" onclick="window.deleteCase('${c.id}')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');
};

window.loadAdminReviews = async function (container) {
    const data = await window.getAllReviews();
    if (!data.success || !data.data.length) {
        container.innerHTML = '<p>No hay reseñas registradas.</p>';
        return;
    }

    container.innerHTML = data.data.map(r => `
        <div class="card admin-card">
            <div class="card-header">
                <h3>${r.lawyer_name || 'Abogado'}</h3>
                <span class="rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
            </div>
            <div class="card-body">
                <p><i class="fas fa-user"></i> Cliente: ${r.client_name || 'Anónimo'}</p>
                <p><i class="fas fa-comment"></i> ${r.comment || 'Sin comentario'}</p>
                ${r.resumen ? `<p><i class="fas fa-file-alt"></i> Resumen: ${r.resumen}</p>` : ''}
                <p><small>${new Date(r.created_at).toLocaleString()}</small></p>
            </div>
            <div class="card-footer">
                <button class="btn-danger" onclick="window.deleteReview(${r.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');
};

window.loadAdminUsers = async function (container) {
    const data = await window.getUsers();
    if (!data.success || !data.data.length) {
        container.innerHTML = '<p>No hay usuarios registrados.</p>';
        return;
    }

    container.innerHTML = data.data.map(u => `
        <div class="card admin-card">
            <div class="card-header">
                <h3>${u.name}</h3>
                <span class="badge ${u.role}">${u.role}</span>
                ${u.email_verified ? '<span class="badge verified">✅ Email verificado</span>' : '<span class="badge pending">⏳ Email pendiente</span>'}
            </div>
            <div class="card-body">
                <p><i class="fas fa-envelope"></i> ${u.email}</p>
                ${u.phone ? `<p><i class="fas fa-phone"></i> ${u.phone}</p>` : ''}
                <p><small>Registrado: ${new Date(u.created_at).toLocaleDateString()}</small></p>
            </div>
            <div class="card-footer">
                ${u.role !== 'admin' ? `
                    <button class="btn-primary" onclick="window.changeUserRole(${u.id}, 'admin')">Hacer admin</button>
                ` : ''}
                ${!u.email_verified ? `
                    <button class="btn-primary" onclick="window.verifyEmailAdmin(${u.id})">
                        <i class="fas fa-envelope"></i> Verificar email
                    </button>
                ` : ''}
                <button class="btn-secondary" onclick="window.showResetPasswordModal(${u.id})">
                    <i class="fas fa-key"></i> Resetear password
                </button>
                <button class="btn-danger" onclick="window.deleteUser(${u.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');
};

window.loadAdminStats = async function (container) {
    try {
        const stats = await window.getStats();
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
};

// ============================================================
// ADMIN ACCIONES
// ============================================================

window.verifyMatricula = async function (userId, verified) {

    const pregunta = verified
        ? '¿Verificar la matrícula de este abogado?'
        : '¿Quitar la verificación de matrícula?';

    if (!confirm(pregunta)) {
        return;
    }

    try {

        await window.adminVerifyMatricula(
            userId,
            verified
        );

        alert(
            verified
                ? '✅ Matrícula verificada'
                : '✅ Verificación de matrícula eliminada'
        );

        await window.loadAdminPanel();

    } catch (e) {

        alert(
            'Error: ' +
            e.message
        );

    }
};

window.verifyEmailAdmin = async function (userId) {

    if (!confirm(
        '¿Verificar el email de este usuario?'
    )) {
        return;
    }

    try {

        await window.adminVerifyEmail(
            userId
        );

        alert(
            '✅ Email verificado'
        );

        await window.loadAdminPanel();

    } catch (e) {

        alert(
            'Error: ' +
            e.message
        );

    }
};

window.showResetPasswordModal = function (userId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'resetPasswordModal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2><i class="fas fa-key"></i> Resetear contraseña</h2>
            <label>Nueva contraseña (mínimo 6 caracteres)</label>
            <input type="password" id="reset-password" placeholder="Nueva contraseña">
            <div class="btn-group">
                <button class="btn-primary" onclick="window.resetPassword(${userId})">Guardar</button>
                <button class="btn-secondary" onclick="window.closeModal('resetPasswordModal')">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.resetPassword = async function (userId) {
    const password = document.getElementById('reset-password').value;
    if (!password || password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    try {
        await window.resetPasswordAdmin(userId, password);
        alert('✅ Contraseña actualizada');
        window.closeModal('resetPasswordModal');
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

window.changeUserRole = async function (userId, role) {
    if (!confirm(`¿Cambiar rol a "${role}"?`)) return;
    try {
        await window.updateUserRole(userId, role);
        alert('✅ Rol actualizado');
        window.loadAdminPanel();
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

window.deleteUser = async function (userId) {
    if (!confirm('¿Eliminar este usuario permanentemente?')) return;
    try {
        await window.deleteUserApi(userId);
        alert('✅ Usuario eliminado');
        window.loadAdminPanel();
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

window.deleteCase = async function (caseId) {
    if (!confirm('¿Eliminar este caso permanentemente?')) return;
    try {
        await window.deleteCaseApi(caseId);
        alert('✅ Caso eliminado');
        window.loadAdminPanel();
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

window.deleteReview = async function (reviewId) {
    if (!confirm('¿Eliminar esta reseña permanentemente?')) return;
    try {
        await window.deleteReviewApi(reviewId);
        alert('✅ Reseña eliminada');
        window.loadAdminPanel();
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

// ============================================================
// MENSAJES
// ============================================================

// ============================================================
// MENSAJES
// ============================================================

let currentConversationUserId = null;
let currentConversationUserName = '';


// ------------------------------------------------------------
// BADGE DE MENSAJES
// ------------------------------------------------------------

window.updateMessagesBadge = async function () {

    const badge =
        document.getElementById(
            'messages-badge'
        );

    if (!badge) {
        return;
    }

    if (!window.isLoggedIn()) {
        badge.style.display = 'none';
        return;
    }

    try {

        const response =
            await getConversations();

        if (
            !response.success ||
            !Array.isArray(response.data)
        ) {
            badge.style.display = 'none';
            return;
        }

        const total =
            response.data.reduce(
                (sum, conversation) =>
                    sum +
                    Number(
                        conversation.unread_count || 0
                    ),
                0
            );

        if (total > 0) {

            badge.textContent =
                total > 99
                    ? '99+'
                    : total;

            badge.style.display =
                'inline-block';

        } else {

            badge.style.display =
                'none';
        }

    } catch (e) {

        console.warn(
            'No se pudo actualizar badge de mensajes:',
            e
        );
    }
};


// ------------------------------------------------------------
// LISTA DE CONVERSACIONES
// ------------------------------------------------------------

window.loadMessages = async function () {

    const container =
        document.getElementById(
            'messages-list'
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            Cargando mensajes...
        </div>
    `;

    try {

        const response =
            await getConversations();

        if (
            !response.success ||
            !Array.isArray(response.data) ||
            response.data.length === 0
        ) {

            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>

                    <p>
                        Todavía no tenés conversaciones.
                    </p>

                    <small>
                        Podés contactar a un abogado
                        desde el buscador.
                    </small>
                </div>
            `;

            await window.updateMessagesBadge();

            return;
        }

        container.innerHTML =
            response.data.map(c => {

                const unread =
                    Number(
                        c.unread_count || 0
                    );

                const safeName =
                    String(
                        c.name || 'Usuario'
                    )
                        .replace(/\\/g, '\\\\')
                        .replace(/'/g, "\\'");

                return `
                    <div
                        class="card"
                        style="
                            cursor:pointer;
                            margin-bottom:12px;
                        "
                        onclick="window.openConversation(
                            ${Number(c.id)},
                            '${safeName}'
                        )"
                    >

                        <div
                            style="
                                display:flex;
                                align-items:center;
                                gap:12px;
                            "
                        >

                            <div
                                style="
                                    width:52px;
                                    height:52px;
                                    min-width:52px;
                                    border-radius:50%;
                                    overflow:hidden;
                                    display:flex;
                                    align-items:center;
                                    justify-content:center;
                                    background:#e5e7eb;
                                "
                            >

                                ${c.foto
                        ? `
                                        <img
                                            src="${c.foto}"
                                            alt="${c.name || 'Usuario'}"
                                            style="
                                                width:100%;
                                                height:100%;
                                                object-fit:cover;
                                            "
                                        >
                                      `
                        : `
                                        <i
                                            class="fas fa-user"
                                            style="
                                                font-size:22px;
                                                color:#64748b;
                                            "
                                        ></i>
                                      `
                    }

                            </div>


                            <div
                                style="
                                    flex:1;
                                    min-width:0;
                                "
                            >

                                <div
                                    style="
                                        display:flex;
                                        justify-content:space-between;
                                        align-items:center;
                                        gap:10px;
                                    "
                                >

                                    <strong>
                                        ${c.name || 'Usuario'}
                                    </strong>

                                    ${unread > 0
                        ? `
                                                <span
                                                    style="
                                                        min-width:21px;
                                                        height:21px;
                                                        padding:0 6px;
                                                        display:inline-flex;
                                                        align-items:center;
                                                        justify-content:center;
                                                        background:#ef4444;
                                                        color:#fff;
                                                        border-radius:999px;
                                                        font-size:12px;
                                                        font-weight:700;
                                                    "
                                                >
                                                    ${unread > 99
                            ? '99+'
                            : unread
                        }
                                                </span>
                                              `
                        : ''
                    }

                                </div>


                                <div
                                    style="
                                        color:#64748b;
                                        margin-top:4px;
                                        white-space:nowrap;
                                        overflow:hidden;
                                        text-overflow:ellipsis;
                                    "
                                >
                                    ${c.last_message
                    || 'Nueva conversación'
                    }
                                </div>


                                ${c.last_message_at
                        ? `
                                            <small
                                                style="
                                                    color:#94a3b8;
                                                "
                                            >
                                                ${new Date(
                            c.last_message_at
                        ).toLocaleString()}
                                            </small>
                                          `
                        : ''
                    }

                            </div>

                        </div>

                    </div>
                `;

            }).join('');

        await window.updateMessagesBadge();

    } catch (e) {

        container.innerHTML = `
            <div class="empty-state">

                <i class="fas fa-triangle-exclamation"></i>

                <p>
                    No se pudieron cargar los mensajes.
                </p>

                <small>
                    ${e.message}
                </small>

            </div>
        `;
    }
};


// ------------------------------------------------------------
// ABRIR CONVERSACIÓN
// ------------------------------------------------------------

window.openConversation = async function (
    userId,
    userName = ''
) {

    try {

        const response = await getConversation(userId);

        if (!response || !response.success) {
            alert('No se pudo cargar la conversación');
            return;
        }

        const conversationUser =
            response.user || {};

        const messages =
            Array.isArray(response.messages)
                ? response.messages
                : [];

        const displayName =
            userName ||
            conversationUser.name ||
            'Conversación';

        const modal =
            document.createElement('div');

        modal.className = 'modal';
        modal.id = 'conversationModal';

        modal.innerHTML = `
            <div
                class="modal-content"
                style="
                    max-width:600px;
                    height:80vh;
                    display:flex;
                    flex-direction:column;
                "
            >

                <h2>
                    <i class="fas fa-comments"></i>
                    ${displayName}
                </h2>

                <div
                    id="conversationMessages"
                    style="
                        flex:1;
                        overflow-y:auto;
                        padding:10px;
                    "
                >

                    ${messages.length
                ? messages.map(m => {

                    const mine =
                        Number(m.sender_id) ===
                        Number(
                            localStorage.getItem(
                                'bogaya_user_id'
                            )
                        );

                    return `
                                    <div
                                        style="
                                            text-align:${mine ? 'right' : 'left'};
                                            margin-bottom:10px;
                                        "
                                    >

                                        <div
                                            style="
                                                display:inline-block;
                                                padding:10px 14px;
                                                border-radius:15px;
                                                max-width:80%;
                                            "
                                        >
                                            ${m.message}
                                        </div>

                                        <small>
                                            ${new Date(
                        m.created_at
                    ).toLocaleString()}
                                        </small>

                                    </div>
                                `;

                }).join('')

                : `
                                <div class="empty-state">
                                    <p>
                                        Iniciá la conversación.
                                    </p>
                                </div>
                            `
            }

                </div>

                <textarea
                    id="conversationInput"
                    rows="2"
                    placeholder="Escribí un mensaje..."
                ></textarea>

                <div class="btn-group">

                    <button
                        class="btn-primary"
                        onclick="window.sendConversationMessage(${userId})"
                    >
                        <i class="fas fa-paper-plane"></i>
                        Enviar
                    </button>

                    <button
                        class="btn-secondary"
                        onclick="window.closeModal('conversationModal')"
                    >
                        Cerrar
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(modal);

        const container =
            document.getElementById(
                'conversationMessages'
            );

        if (container) {
            container.scrollTop =
                container.scrollHeight;
        }

    } catch (e) {

        console.error(
            'Error al abrir conversación:',
            e
        );

        alert(
            'No se pudo cargar la conversación: ' +
            e.message
        );
    }
};


// ------------------------------------------------------------
// ENVIAR MENSAJE DESDE UNA CONVERSACIÓN
// ------------------------------------------------------------

window.sendConversationMessage =
    async function (receiverId) {

        const input =
            document.getElementById(
                'conversationInput'
            );

        if (!input) {
            return;
        }

        const message =
            input.value.trim();

        if (!message) {
            return;
        }

        const button =
            document.querySelector(
                '#conversationModal .btn-primary'
            );

        if (button) {
            button.disabled = true;
        }

        try {

            await sendMessageApi(
                Number(receiverId),
                message
            );

            input.value = '';

            const response =
                await getConversation(
                    Number(receiverId)
                );

            if (response.success) {

                const messagesContainer =
                    document.getElementById(
                        'conversationMessages'
                    );

                if (messagesContainer) {

                    const messages =
                        response.messages ||
                        response.data ||
                        [];

                    const myId =
                        Number(
                            localStorage.getItem(
                                'bogaya_user_id'
                            )
                        );

                    messagesContainer.innerHTML =
                        messages
                            .map(m => {

                                const mine =
                                    Number(
                                        m.sender_id
                                    ) === myId;

                                return `
                                    <div
                                        style="
                                            display:flex;
                                            justify-content:${mine ? 'flex-end' : 'flex-start'};
                                            margin-bottom:10px;
                                        "
                                    >

                                        <div
                                            style="
                                                max-width:78%;
                                                padding:10px 13px;
                                                border-radius:16px;
                                                background:${mine ? '#dbeafe' : '#f1f5f9'};
                                            "
                                        >

                                            <div>
                                                ${String(
                                    m.message || ''
                                )
                                        .replace(
                                            /</g,
                                            '&lt;'
                                        )
                                        .replace(
                                            />/g,
                                            '&gt;'
                                        )
                                    }
                                            </div>

                                            <small
                                                style="
                                                    display:block;
                                                    margin-top:5px;
                                                    opacity:.6;
                                                    font-size:10px;
                                                "
                                            >
                                                ${m.created_at
                                        ? new Date(
                                            m.created_at
                                        ).toLocaleString()
                                        : ''
                                    }
                                                ${mine
                                        ? ' ✓'
                                        : ''
                                    }
                                            </small>

                                        </div>

                                    </div>
                                `;

                            })
                            .join('');

                    messagesContainer.scrollTop =
                        messagesContainer.scrollHeight;
                }
            }

            await window.updateMessagesBadge();

        } catch (e) {

            alert(
                'Error: ' +
                e.message
            );

        } finally {

            if (button) {
                button.disabled = false;
            }

            input.focus();
        }
    };

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

// ============================================================
// INICIO
// ============================================================

document.addEventListener('DOMContentLoaded', async function () {
    const logged = await window.checkAuth();
    const role = window.getRole();
    const navAgenda = document.getElementById('nav-agenda');
    const navDashboard = document.getElementById('nav-dashboard');
    const navSearch = document.getElementById('nav-search');

    if (logged) {
        window.updateMessagesBadge();
    }
    if (role === 'admin') {
        navAgenda.style.display = 'none';
        navSearch.style.display = 'none';
        navDashboard.style.display = 'inline-block';
        navDashboard.innerHTML = '<i class="fas fa-shield-alt"></i> Admin';
        navDashboard.dataset.view = 'admin';
        navDashboard.onclick = () => window.navigateTo('admin');
    } else if (role === 'lawyer') {
        navAgenda.style.display = 'inline-block';
        navSearch.style.display = 'inline-block';
        navDashboard.style.display = 'inline-block';
        navDashboard.innerHTML = '<i class="fas fa-gavel"></i> Dashboard';
        navDashboard.dataset.view = 'dashboard-lawyer';
        navDashboard.onclick = () => window.navigateTo('dashboard-lawyer');
    } else if (role === 'client') {
        navAgenda.style.display = 'inline-block';
        navSearch.style.display = 'inline-block';
        navDashboard.style.display = 'inline-block';
        navDashboard.innerHTML = '<i class="fas fa-folder-open"></i> Casos';
        navDashboard.dataset.view = 'dashboard';
        navDashboard.onclick = () => window.navigateTo('dashboard');
    } else {
        navAgenda.style.display = 'none';
        navDashboard.style.display = 'none';
        navSearch.style.display = 'inline-block';
    }

    if (logged) {
        const userName = localStorage.getItem('bogaya_name') || 'Usuario';
        document.getElementById('user-name').textContent = '👋 ' + userName;
        if (role === 'lawyer') {
            window.navigateTo('dashboard-lawyer');
        } else if (role === 'client') {
            window.navigateTo('dashboard');
        } else if (role === 'admin') {
            window.navigateTo('admin');
        } else {
            window.navigateTo('home');
        }
    } else {
        window.navigateTo('home');
    }
});