// ============================================================
// SISTEMA DE NOTIFICACIONES
// ============================================================

let notificationInterval = null;

async function checkNotifications() {
    if (!isLoggedIn()) return;
    // Verificar que apiFetch esté definido
    if (typeof apiFetch !== 'function') {
        console.log('apiFetch no disponible aún');
        return;
    }
    try {
        const data = await apiFetch('/notifications');
        if (!data.success || !data.data.length) return;

        data.data.forEach(n => {
            showToast(n.title, n.message, n.link);
            // Marcar como leída
            apiFetch('/notifications/mark-read', {
                method: 'POST',
                body: JSON.stringify({ id: n.id })
            }).catch(e => console.log('Error marcando notificación:', e));
        });
    } catch (e) {
        // Silenciar errores de notificaciones para no romper la app
        console.log('Error checking notifications:', e.message);
    }
}

function showToast(title, message, link) {
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
        <div class="notification-toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    toast.onclick = function (e) {
        if (e.target.tagName !== 'BUTTON' && link) {
            window.location.href = link;
        }
        this.remove();
    };
    document.body.appendChild(toast);

    if ('Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification(title, {
            body: message,
            icon: '/bogaya/public/icons/icon-192.png'
        });
        notif.onclick = function () {
            if (link) window.location.href = link;
        };
    }

    setTimeout(() => {
        if (toast.parentElement) toast.remove();
    }, 10000);
}

function startNotificationPolling() {
    if (notificationInterval) clearInterval(notificationInterval);
    if (isLoggedIn()) {
        setTimeout(checkNotifications, 3000);
        notificationInterval = setInterval(checkNotifications, 30000);
    }
}

function stopNotificationPolling() {
    if (notificationInterval) {
        clearInterval(notificationInterval);
        notificationInterval = null;
    }
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') return;
    if (Notification.permission === 'denied') return;
    await Notification.requestPermission();
}

document.addEventListener('DOMContentLoaded', function () {
    requestNotificationPermission();
});