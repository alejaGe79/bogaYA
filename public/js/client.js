// Funciones específicas para clientes en Bogaya
console.log('Modo cliente activado');

// Función para publicar un caso (ya está en app.js pero la dejamos aquí también)
function clientPublishCase() {
    const titulo = prompt('Título del caso:');
    if (!titulo) return;
    const desc = prompt('Descripción breve:');
    const area = prompt('Área legal (ej: laboral, civil, penal):');
    const provincia = prompt('Jurisdiccion:');

    if (!titulo || !area) {
        alert('Título y área legal son obligatorios');
        return;
    }

    createCase(titulo, desc, area, provincia)
        .then(() => {
            alert('✅ Caso publicado correctamente');
            loadMyCases();
        })
        .catch(err => {
            alert('❌ Error al publicar: ' + err.message);
        });
}

// Función para ver mis casos
function clientViewMyCases() {
    const div = document.getElementById('my-cases');
    if (!div) return;
    div.innerHTML = '<p>Cargando tus casos...</p>';
    getCases('abierto')
        .then(data => {
            if (!data.success || !data.data.length) {
                div.innerHTML = '<p>No tenés casos activos.</p>';
                return;
            }
            div.innerHTML = data.data.map(c => `
                <div class="card">
                    <h4>📋 ${c.titulo}</h4>
                    <p>${c.descripcion || 'Sin descripción'}</p>
                    <p><strong>Área:</strong> ${c.area_legal} | <strong>Estado:</strong> ${c.estado}</p>
                    <p><small>Publicado: ${new Date(c.created_at).toLocaleDateString()}</small></p>
                </div>
            `).join('');
        })
        .catch(err => {
            div.innerHTML = '<p>❌ Error: ' + err.message + '</p>';
        });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    // Si hay un botón "Publicar caso" en el perfil, lo conectamos
    const publishBtn = document.querySelector('#profile-content .btn-primary');
    if (publishBtn && publishBtn.textContent.includes('Publicar caso')) {
        // Ya está conectado en app.js
    }
});