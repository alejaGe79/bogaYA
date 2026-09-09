<?php
class ApiNotificationController {

    public function get() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT * FROM notifications WHERE user_id = ? AND read_at IS NULL ORDER BY created_at DESC");
        $stmt->execute([$userId]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        Response::success($data);
    }

    public function markRead() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);

        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? 0;

        $db = Database::getInstance()->getConnection();
        if ($id) {
            $stmt = $db->prepare("UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
        } else {
            $stmt = $db->prepare("UPDATE notifications SET read_at = NOW() WHERE user_id = ?");
            $stmt->execute([$userId]);
        }
        Response::success(['message' => 'Notificaciones marcadas como leídas']);
    }
}
?>