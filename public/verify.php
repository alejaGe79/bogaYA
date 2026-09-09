<?php
// public/verify.php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../core/Database.php';
require_once __DIR__ . '/../core/Response.php';

$token = $_GET['token'] ?? '';

if (!$token) {
    die('Token inválido');
}

$db = Database::getInstance()->getConnection();
$stmt = $db->prepare("SELECT id FROM users WHERE verification_token = ? AND verification_expires > NOW()");
$stmt->execute([$token]);
$user = $stmt->fetch();

if ($user) {
    $stmt = $db->prepare("UPDATE users SET email_verified = 1, verification_token = NULL, verification_expires = NULL WHERE id = ?");
    $stmt->execute([$user['id']]);
    ?>
    <!DOCTYPE html>
    <html>
    <head><title>Email verificado - BogaYA</title></head>
    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #22c55e;">✅ Email verificado correctamente</h1>
        <p>Ya puedes <a href="/bogaya/" style="color: #3b82f6;">iniciar sesión</a> en BogaYA.</p>
    </body>
    </html>
    <?php
} else {
    ?>
    <!DOCTYPE html>
    <html>
    <head><title>Error - BogaYA</title></head>
    <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #ef4444;">❌ Token inválido o expirado</h1>
        <p>Por favor, solicita un nuevo enlace de verificación desde la aplicación.</p>
    </body>
    </html>
    <?php
}