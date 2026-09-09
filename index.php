<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/core/Database.php';
require_once __DIR__ . '/core/Response.php';
require_once __DIR__ . '/core/Auth.php';
require_once __DIR__ . '/core/Notification.php';
require_once __DIR__ . '/core/Router.php';

$router = new Router();

// ========== AUTENTICACIÓN ==========
$router->add('POST', '/api/auth/register', 'ApiAuthController@register');
$router->add('POST', '/api/auth/login', 'ApiAuthController@login');
$router->add('POST', '/api/auth/push-token', 'ApiAuthController@registerPushToken');
$router->add('POST', '/api/auth/verify-email', 'ApiAuthController@verifyEmail');
$router->add('POST', '/api/auth/resend-verification', 'ApiAuthController@resendVerification');

// ========== USUARIOS ==========
$router->add('PUT', '/api/users/profile', 'ApiUserController@updateProfile');

// ========== ABOGADOS ==========
$router->add('GET', '/api/lawyers', 'ApiLawyerController@list');
$router->add('GET', '/api/lawyers/{id}', 'ApiLawyerController@get');
$router->add('PUT', '/api/lawyers/profile', 'ApiLawyerController@updateProfile');

// ========== CASOS ==========
$router->add('POST', '/api/cases', 'ApiCaseController@create');
$router->add('GET', '/api/cases', 'ApiCaseController@list');
$router->add('GET', '/api/cases/{id}', 'ApiCaseController@get');
$router->add('PUT', '/api/cases/{id}', 'ApiCaseController@update');
$router->add('PUT', '/api/cases/{id}/close', 'ApiCaseController@close');
$router->add('GET', '/api/cases/lawyer/aceptados', 'ApiCaseController@getAcceptedCases');
$router->add('GET', '/api/cases/lawyer/ofrecidos', 'ApiCaseController@getOfferedCases');
$router->add('GET', '/api/cases/lawyer/cerrados', 'ApiCaseController@getClosedCases');

// ========== TURNOS ==========
$router->add('POST', '/api/appointments', 'ApiAppointmentController@create');
$router->add('GET', '/api/appointments/lawyer', 'ApiAppointmentController@getLawyerAppointments');
$router->add('GET', '/api/appointments/client', 'ApiAppointmentController@getClientAppointments');
$router->add('PUT', '/api/appointments/{id}/status', 'ApiAppointmentController@updateStatus');
$router->add('PUT', '/api/appointments/{id}/reschedule', 'ApiAppointmentController@reschedule');

// ========== RESEÑAS ==========
$router->add('POST', '/api/reviews', 'ApiReviewController@create');
$router->add('GET', '/api/reviews/lawyer/{id}', 'ApiReviewController@getByLawyer');
$router->add('GET', '/api/reviews/stats/{id}', 'ApiReviewController@getStats');

// ========== PROPUESTAS ==========
$router->add('POST', '/api/proposals', 'ApiProposalController@create');
$router->add('GET', '/api/proposals/case/{caseId}', 'ApiProposalController@getByCase');
$router->add('GET', '/api/proposals/lawyer', 'ApiProposalController@getByLawyer');
$router->add('PUT', '/api/proposals/{id}/status', 'ApiProposalController@updateStatus');

// ========== MENSAJES ==========
$router->add('POST', '/api/messages', 'ApiMessageController@send');
$router->add('GET', '/api/messages/{userId}', 'ApiMessageController@getConversation');

// ========== PAGOS ==========
$router->add('POST', '/api/payments/create-preference', 'ApiPaymentController@createPreference');
$router->add('POST', '/api/webhooks/mp', 'ApiPaymentController@webhook');

// ========== NOTIFICACIONES ==========
$router->add('GET', '/api/notifications', 'ApiNotificationController@get');
$router->add('POST', '/api/notifications/mark-read', 'ApiNotificationController@markRead');

// ========== ADMIN ==========
$router->add('GET', '/api/admin/users', 'ApiAdminController@getUsers');
$router->add('DELETE', '/api/admin/users/{id}', 'ApiAdminController@deleteUser');
$router->add('POST', '/api/admin/verify', 'ApiAdminController@verifyLawyer');
$router->add('POST', '/api/admin/role', 'ApiAdminController@changeRole');
$router->add('GET', '/api/admin/cases', 'ApiAdminController@getCases');
$router->add('DELETE', '/api/admin/cases/{id}', 'ApiAdminController@deleteCase');
$router->add('GET', '/api/admin/reviews', 'ApiAdminController@getReviews');
$router->add('DELETE', '/api/admin/reviews/{id}', 'ApiAdminController@deleteReview');
$router->add('GET', '/api/admin/stats', 'ApiAdminController@getStats');
$router->add('GET', '/api/admin/pending', 'ApiAdminController@getPendingVerifications');
$router->add('POST', '/api/admin/verify-matricula', 'ApiAdminController@verifyMatricula');
$router->add('POST', '/api/admin/verify-email', 'ApiAdminController@verifyEmailAdmin');
$router->add('POST', '/api/admin/reset-password', 'ApiAdminController@resetPassword');
$router->add('GET', '/api/admin/estudios', 'ApiAdminController@getEstudios');

// ========== DESPACHADOR ==========
$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$uri = strtok($uri, '?');

// Eliminar el prefijo /bogaya
$basePath = '/bogaya';
if (strpos($uri, $basePath) === 0) {
    $uri = substr($uri, strlen($basePath));
}
if (empty($uri)) $uri = '/';

// Si es una petición API, despachar
if (strpos($uri, '/api/') === 0) {
    $router->dispatch($uri, $method);
    exit;
}

// Si no es API, servir archivos estáticos o el frontend
$file = __DIR__ . '/public' . $uri;
if ($uri !== '/' && file_exists($file) && is_file($file)) {
    $mime = mime_content_type($file);
    header('Content-Type: ' . $mime);
    readfile($file);
    exit;
}

// Si no, servir el index.html del frontend
readfile(__DIR__ . '/public/index.html');
exit;