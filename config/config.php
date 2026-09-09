<?php
// CONFIGURACIÓN DEL ENTORNO
define('DB_HOST', 'localhost');
define('DB_NAME', 'bogaya_db');
define('DB_USER', 'root');
define('DB_PASS', '');

define('BASE_URL', 'http://localhost/bogaya'); // Cambiar por tu dominio

// Seguridad JWT
define('JWT_SECRET', 'nnonoonoo');

// Mercado Pago
define('MP_ACCESS_TOKEN', 'nonononnnno');
define('MP_WEBHOOK_URL', BASE_URL . '/api/webhooks/mp');

// Firebase Cloud Messaging
define('FCM_SERVER_KEY', 'nonononoononono');

// Configuración de email
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'rysa.site@gmail.com');
define('SMTP_PASS', 'nononnonono');
define('SMTP_FROM', 'rysa.site@gmail.com');
define('SMTP_FROM_NAME', 'BogaYA');

// Configuración de la aplicación
define('APP_NAME', 'BogaYA');
define('APP_VERSION', '1.0.0');
?>
