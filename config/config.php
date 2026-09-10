<?php
// CONFIGURACIÓN DEL ENTORNO
define('DB_HOST', 'localhost');
define('DB_NAME', 'bogaya_db');
define('DB_USER', 'root');
define('DB_PASS', '');

define('BASE_URL', 'http://localhost/bogaya'); // Cambiar por tu dominio

// Seguridad JWT
define('JWT_SECRET', 'B0g4y4_S3cr3t_K3y_2026_!@#$%');

// Mercado Pago
define('MP_ACCESS_TOKEN', 'TEST-xxxxxxxxxxxxxxxxxxxxxxxxxx');
define('MP_WEBHOOK_URL', BASE_URL . '/api/webhooks/mp');

// Firebase Cloud Messaging
define('FCM_SERVER_KEY', 'AAAAxxxxxxxxxxxxxxxxxxx:xxxxxxxxxxxxxxxxxx');

// Configuración de email
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'rysa.site@gmail.com');
define('SMTP_PASS', 'RioSol2025!');
define('SMTP_FROM', 'rysa.site@gmail.com');
define('SMTP_FROM_NAME', 'BogaYA');

// Configuración de la aplicación
define('APP_NAME', 'BogaYA');
define('APP_VERSION', '1.0.0');
?>