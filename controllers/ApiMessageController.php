<?php
class ApiMessageController {

    public function send() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);

        $input = json_decode(file_get_contents('php://input'), true);
        $receiverId = $input['receiver_id'] ?? 0;
        $caseId = $input['case_id'] ?? null;
        $message = $input['message'] ?? '';

        if (!$receiverId || !$message) {
            Response::error('Datos inválidos');
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("INSERT INTO messages (sender_id, receiver_id, case_id, message, created_at) 
                              VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([$userId, $receiverId, $caseId, $message]);

        Notification::send($receiverId, '💬 Nuevo mensaje', 'Has recibido un nuevo mensaje en BogaYA.');
        Notification::saveNotification($receiverId, 'new_message', '💬 Nuevo mensaje', 'Has recibido un nuevo mensaje en BogaYA.', '/messages');

        Response::success(['message' => 'Mensaje enviado']);
    }

    public function getConversation($userId) {
        $currentUser = Auth::getUserId();
        if (!$currentUser) Response::error('No autenticado', 401);

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT m.*, u.name as sender_name 
                              FROM messages m 
                              JOIN users u ON m.sender_id = u.id 
                              WHERE (m.sender_id = ? AND m.receiver_id = ?) 
                                 OR (m.sender_id = ? AND m.receiver_id = ?)
                              ORDER BY m.created_at ASC");
        $stmt->execute([$currentUser, $userId, $userId, $currentUser]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($data);
    }
}
?>