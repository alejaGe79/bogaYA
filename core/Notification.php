<?php
class Notification {

    public static function saveToken($userId, $token, $device = 'web') {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("INSERT INTO push_tokens (user_id, token, device, created_at) VALUES (?, ?, ?, NOW()) 
                              ON DUPLICATE KEY UPDATE token = VALUES(token), device = VALUES(device)");
        return $stmt->execute([$userId, $token, $device]);
    }

    public static function send($userId, $title, $body, $data = []) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT token FROM push_tokens WHERE user_id = ?");
        $stmt->execute([$userId]);
        $tokens = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (empty($tokens)) {
            return false;
        }

        $payload = [
            'registration_ids' => $tokens,
            'notification' => [
                'title' => $title,
                'body' => $body,
                'icon' => BASE_URL . '/public/icons/icon-192.png',
                'click_action' => BASE_URL . '/dashboard'
            ],
            'data' => array_merge($data, ['click_action' => 'FLUTTER_NOTIFICATION_CLICK'])
        ];

        $ch = curl_init('https://fcm.googleapis.com/fcm/send');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: key=' . FCM_SERVER_KEY,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        curl_close($ch);
        return $response;
    }

    public static function saveNotification($userId, $type, $title, $message, $link = null) {
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("INSERT INTO notifications (user_id, type, title, message, link, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
        return $stmt->execute([$userId, $type, $title, $message, $link]);
    }
}
?>