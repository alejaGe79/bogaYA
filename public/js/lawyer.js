// Funciones específicas para abogados en Bogaya
console.log('Modo abogado activado');

// Función para editar perfil de abogado
function lawyerEditProfile() {
    // Recuperar datos actuales del perfil (usando GET /lawyers/{id})
    const userId = localStorage.getItem('bogaya_user_id');
    if (!userId) {
        alert('No estás autenticado');
        return;
    }

    // Mostrar un formulario simple
    const html = `
        <div class="modal" id="editProfileModal">
            <div class="modal-content">
                <h2>Editar Perfil de Abogado</h2>
                <form id="lawyer-profile-form">
                    <label>Matrícula:</label>
                    <input type="text" id="edit-matricula" placeholder="Número de matrícula">
                    <label>Jurisdiccion:</label>
                    <input type="text" id="edit-provincia" placeholder="Jurisdiccion">
                    <label>Ciudad:</label>
                    <input type="text" id="edit-ciudad" placeholder="Ciudad">
                    <label>Especialidad:</label>
                    <input type="text" id="edit-especialidad" placeholder="Ej: laboral, civil, penal">
                    <label>Biografía:</label>
                    <textarea id="edit-bio" rows="3" placeholder="Tu experiencia y especialización"></textarea>
                    <label>Costo de consulta (ARS):</label>
                    <input type="number" id="edit-costo" step="0.01" placeholder="0">
                    <label>
                        <input type="checkbox" id="edit-virtual" checked> Atención virtual
                    </label>
                    <label>
                        <input type="checkbox" id="edit-presencial"> Atención presencial
                    </label>
                    <div class="btn-group">
                        <button type="submit" class="btn-primary">Guardar</button>
                        <button type="button" class="btn-secondary" onclick="closeModal('editProfileModal')">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    // Cargar datos actuales
    fetch(API_BASE + '/lawyers/' + userId, {
        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('bogaya_token') }
    })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.data) {
                const p = data.data;
                document.getElementById('edit-matricula').value = p.matricula || '';
                document.getElementById('edit-provincia').value = p.provincia || '';
                document.getElementById('edit-ciudad').value = p.ciudad || '';
                document.getElementById('edit-especialidad').value = p.especialidad || '';
                document.getElementById('edit-bio').value = p.bio || '';
                document.getElementById('edit-costo').value = p.costo_consulta || '';
                document.getElementById('edit-virtual').checked = p.virtual == 1;
                document.getElementById('edit-presencial').checked = p.presencial == 1;
            }
        })
        .catch(err => console.error('Error cargando perfil:', err));

    // Manejar envío del formulario
    document.getElementById('lawyer-profile-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const data = {
            matricula: document.getElementById('edit-matricula').value,
            provincia: document.getElementById('edit-provincia').value,
            ciudad: document.getElementById('edit-ciudad').value,
            especialidad: document.getElementById('edit-especialidad').value,
            bio: document.getElementById('edit-bio').value,
            costo_consulta: parseFloat(document.getElementById('edit-costo').value) || 0,
            virtual: document.getElementById('edit-virtual').checked ? 1 : 0,
            presencial: document.getElementById('edit-presencial').checked ? 1 : 0
        };

        updateLawyerProfile(data)
            .then(() => {
                alert('✅ Perfil actualizado correctamente');
                closeModal('editProfileModal');
            })
            .catch(err => {
                alert('❌ Error: ' + err.message);
            });
    });
}

// Función para actualizar el plan (Premium/Pro)
function lawyerUpgradePlan() {
    const plan = confirm('¿Plan Pro? (Aceptar = Pro, Cancelar = Premium)') ? 'pro' : 'premium';
    createPaymentPreference(plan)
        .then(data => {
            if (data.success && data.data.init_point) {
                window.open(data.data.init_point, '_blank');
            } else {
                alert('Error al crear preferencia de pago');
            }
        })
        .catch(err => {
            alert('❌ Error: ' + err.message);
        });
}

// Función para ver mis turnos (ya está en app.js, pero la dejamos aquí)
function lawyerViewAppointments() {
    loadAgenda(); // Ya existe en app.js
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    // Conectar botones específicos de abogado si existen
    const editBtn = document.querySelector('#profile-content .btn-primary');
    if (editBtn && editBtn.textContent.includes('Editar perfil')) {
        // Ya está conectado en app.js
    }
});