<?php
class ApiRatingController {

    public function create() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);
        if (Auth::getUserRole() !== 'client') Response::error('Solo clientes', 403);

        $input = json_decode(file_get_contents('php://input'), true);
        $lawyerId = $input['lawyer_id'] ?? 0;
        $rating = $input['rating'] ?? 0;
        $comment = $input['comment'] ?? '';
        $appointmentId = $input['appointment_id'] ?? null;

        if (!$lawyerId || $rating < 1 || $rating > 5) {
            Response::error('Datos inválidos');
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT id FROM users WHERE id = ? AND role = 'lawyer'");
        $stmt->execute([$lawyerId]);
        if (!$stmt->fetch()) Response::error('Abogado no válido', 404);

        $stmt = $db->prepare("INSERT INTO reviews (lawyer_id, client_id, appointment_id, rating, comment, created_at) 
                              VALUES (?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$lawyerId, $userId, $appointmentId, $rating, $comment]);
        Response::success(['message' => 'Calificación guardada']);
    }

    public function getByLawyer($lawyerId) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT r.*, u.name as client_name 
                              FROM reviews r 
                              JOIN users u ON r.client_id = u.id 
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