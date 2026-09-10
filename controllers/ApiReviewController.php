<?php
class ApiReviewController {

    public function create() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);

        $input = json_decode(file_get_contents('php://input'), true);
        $lawyerId = $input['lawyer_id'] ?? 0;
        $caseId = $input['case_id'] ?? '';
        $rating = $input['rating'] ?? 0;
        $comment = $input['comment'] ?? '';
        $resumen = $input['resumen'] ?? '';

        if (!$lawyerId || $rating < 1 || $rating > 5 || !$caseId) {
            Response::error('Datos inválidos');
        }

        $db = Database::getInstance()->getConnection();

        //$stmt = $db->prepare("SELECT estado, client_id FROM cases WHERE id = ?");
        $stmt = $db->prepare("SELECT  c.estado, c.client_id, u.name AS client_name FROM cases c JOIN users u ON c.client_id = u.id WHERE c.id = ?");
        $stmt->execute([$caseId]);
        $case = $stmt->fetch();
        if (!$case || $case['estado'] !== 'cerrado') {
            Response::error('El caso debe estar cerrado para calificar', 400);
        }

        $role = Auth::getUserRole();
        if ($role === 'client' && $case['client_id'] != $userId) {
            Response::error('No eres el dueño de este caso', 403);
        }

        if ($role === 'lawyer') {
            $stmt = $db->prepare("SELECT id FROM proposals WHERE case_id = ? AND lawyer_id = ? AND estado = 'aceptada'");
            $stmt->execute([$caseId, $userId]);
            if (!$stmt->fetch()) {
                Response::error('No estás asignado a este caso', 403);
            }
        }

        if ($role === 'client') {

            $stmt = $db->prepare("
                SELECT id
                FROM proposals
                WHERE case_id = ?
                AND lawyer_id = ?
                AND estado = 'aceptada'
                LIMIT 1
            ");

            $stmt->execute([
                $caseId,
                $lawyerId
            ]);

            if (!$stmt->fetch()) {
                Response::error(
                    'Ese abogado no está asignado a este caso',
                    403
                );
            }
        }

        // Verificar si ya existe una reseña para este caso y usuario
        $stmt = $db->prepare("SELECT id FROM reviews WHERE case_id = ? AND client_id = ?");
        $stmt->execute([$caseId, $userId]);
        if ($stmt->fetch()) {
            Response::error('Ya dejaste una reseña para este caso', 409);
        }

        $stmt = $db->prepare("INSERT INTO reviews (lawyer_id, client_id, case_id, rating, comment, resumen, created_at) 
                              VALUES (?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$lawyerId, $userId, $caseId, $rating, $comment, $resumen]);

        Notification::send($lawyerId, '⭐ Nueva reseña', "El cliente {$case['client_name']} te ha calificado con {$rating} estrellas.");
        Notification::saveNotification($lawyerId, 'new_review', '⭐ Nueva reseña', "El cliente te ha calificado con {$rating} estrellas.", '/profile');

        Response::success(['message' => 'Reseña guardada correctamente']);
    }

    public function getByLawyer($lawyerId) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT r.*, u.name as client_name, c.titulo as case_title
                              FROM reviews r 
                              JOIN users u ON r.client_id = u.id 
                              LEFT JOIN cases c ON r.case_id = c.id
                              WHERE r.lawyer_id = ? 
                              ORDER BY r.created_at DESC");
        $stmt->execute([$lawyerId]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($data);
    }

    public function getStats($lawyerId) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT AVG(rating) as avg, COUNT(*) as total FROM reviews WHERE lawyer_id = ?");
        $stmt->execute([$lawyerId]);
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        Response::success($stats);
    }
}
?>