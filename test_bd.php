<?php

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/core/Database.php';

header('Content-Type: application/json');

try {
    $db = Database::getInstance()->getConnection();

    $stmt = $db->query("SELECT 1 AS ok");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'database' => $result,
        'host' => DB_HOST,
        'name' => DB_NAME,
        'user' => DB_USER
    ]);

} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}